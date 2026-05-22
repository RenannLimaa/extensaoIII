'use client';

import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BuildSwitch } from '../../components/chat/BuildSwitch';
import { CommandPalette } from '../../components/chat/CommandPalette';
import { Composer } from '../../components/chat/Composer';
import { HighlightPopover } from '../../components/chat/HighlightPopover';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { StudyPlanModal } from '../../components/chat/StudyPlanModal';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { WorkspaceSidebar } from '../../components/chat/WorkspaceSidebar';
import { useTheme } from '../../components/providers/ThemeProvider';
import { findBuild, findSubject } from '../../lib/catalog';
import { llm } from '../../lib/llm';
import { upsertRecentSession } from '../../lib/sessionStore';
import type {
  AlternativeLetter,
  BuildId,
  ChatMessage,
  Question,
  SmartSuggestion,
  SubjectId,
} from '../../lib/types';
import type {
  CommandActionId,
  HighlightAction,
} from '../../lib/llm/llmClient';

function mid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type PageProps = {
  params: Promise<{ subjectId: string }>;
};

export default function ChatPage({ params }: PageProps) {
  const { subjectId: rawSubjectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTheme, theme } = useTheme();

  const subject = findSubject(rawSubjectId);
  if (!subject) notFound();

  const initialBuild = (searchParams.get('build') as BuildId | null) ?? 'teorico';
  const [buildId, setBuildId] = useState<BuildId>(findBuild(initialBuild) ? initialBuild : 'teorico');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

  const [cmdOpen, setCmdOpen] = useState(false);
  const [studyPlanOpen, setStudyPlanOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  const subjectId = subject.id as SubjectId;

  useEffect(() => {
    if (stats.answered <= 0) return;
    const lastQuestion = [...messages].reverse().find((m) => Boolean(m.question))?.question;
    const title = lastQuestion?.assunto ?? `${subject.title} · ${findBuild(buildId)?.title ?? 'Sessão'}`;

    upsertRecentSession({
      id: `${subjectId}:${buildId}`,
      subjectId,
      buildId,
      title,
      answered: stats.answered,
      correct: stats.correct,
    });
  }, [buildId, messages, stats.answered, stats.correct, subject.title, subjectId]);

  /* ---------- Session kickoff ---------- */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      setTyping(true);
      try {
        const res = await llm.startSession({ subjectId, build: buildId });
        const greeting: ChatMessage = {
          id: mid(),
          role: 'assistant',
          content: res.greeting,
          createdAt: Date.now(),
        };
        const questionMsg: ChatMessage = {
          id: mid(),
          role: 'assistant',
          content: '',
          question: res.firstQuestion,
          createdAt: Date.now(),
        };
        setMessages([greeting, questionMsg]);
        setCurrentQuestion(res.firstQuestion);
        setAskedIds([res.firstQuestion.id]);
      } finally {
        setTyping(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patchMessage(id: string, patch: Partial<ChatMessage>) {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  /* ---------- Pergunta e resposta ---------- */
  const onChoose = useCallback(
    async (messageId: string, question: Question, letter: AlternativeLetter) => {
      patchMessage(messageId, { chosen: letter });
      setTyping(true);
      try {
        const ans = await llm.answerQuestion({ question, chosen: letter, build: buildId });
        patchMessage(messageId, {
          chosen: letter,
          feedback: { correta: ans.correta, explicacao: ans.explicacao },
        });
        setMessages((ms) => [
          ...ms,
          {
            id: mid(),
            role: 'assistant',
            content: ans.feedback,
            suggestions: ans.suggestions,
            createdAt: Date.now(),
          },
        ]);
        setStats((s) => ({
          answered: s.answered + 1,
          correct: s.correct + (ans.correta ? 1 : 0),
        }));
      } finally {
        setTyping(false);
      }
    },
    [buildId],
  );

  const askNext = useCallback(
    async (difficultyHint?: 'facil' | 'media' | 'dificil') => {
      setTyping(true);
      try {
        const nxt = await llm.nextQuestion({
          subjectId,
          build: buildId,
          alreadyAskedIds: askedIds,
          adaptiveHint: difficultyHint ?? 'auto',
        });
        if (!nxt.question) {
          setMessages((ms) => [
            ...ms,
            { id: mid(), role: 'assistant', content: nxt.intro, createdAt: Date.now() },
          ]);
          setCurrentQuestion(null);
          return;
        }
        setMessages((ms) => [
          ...ms,
          { id: mid(), role: 'assistant', content: nxt.intro, createdAt: Date.now() },
          {
            id: mid(),
            role: 'assistant',
            content: '',
            question: nxt.question!,
            createdAt: Date.now(),
          },
        ]);
        setCurrentQuestion(nxt.question);
        setAskedIds((ids) => [...ids, nxt.question!.id]);
      } finally {
        setTyping(false);
      }
    },
    [subjectId, buildId, askedIds],
  );

  /* ---------- Execucao de comandos (paleta + slashes + suggestions) ---------- */
  const runCommand = useCallback(
    async (actionId: CommandActionId) => {
      if (actionId === 'next-question') {
        await askNext();
        return;
      }
      if (actionId === 'open-study-plan') {
        setStudyPlanOpen(true);
        return;
      }
      if (actionId === 'toggle-theme') {
        setTheme(theme === 'light' ? 'dark' : 'light');
        return;
      }

      setTyping(true);
      try {
        const res = await llm.runCommand({
          actionId,
          context: { subjectId, question: currentQuestion ?? undefined, build: buildId },
        });
        if (res.openModal === 'study-plan') {
          setStudyPlanOpen(true);
        }
        if (res.sideEffect?.type === 'theme') {
          setTheme(res.sideEffect.value);
        }
        if (res.sideEffect?.type === 'build') {
          setBuildId(res.sideEffect.value);
        }
        if (res.reply) {
          if (res.reply === '__next__') {
            await askNext();
          } else {
            setMessages((ms) => [
              ...ms,
              { id: mid(), role: 'assistant', content: res.reply!, createdAt: Date.now() },
            ]);
          }
        }
      } finally {
        setTyping(false);
      }
    },
    [askNext, buildId, currentQuestion, setTheme, subjectId, theme],
  );

  const onSuggestion = useCallback(
    async (s: SmartSuggestion) => {
      switch (s.action) {
        case 'next':
          await askNext();
          return;
        case 'easier':
          await askNext('facil');
          return;
        case 'harder':
          await askNext('dificil');
          return;
        case 'similar':
          await runCommand('generate-similar');
          return;
        case 'summary':
          await runCommand('summarize-topic');
          return;
        case 'explain-simple':
          await runCommand('explain-eli5');
          return;
        case 'flashcards':
          await runCommand('flashcards');
          return;
        case 'hint':
          await runCommand('give-hint');
          return;
        case 'quiz-topic':
          await runCommand('quiz-topic');
          return;
      }
    },
    [askNext, runCommand],
  );

  /* ---------- Envio de texto livre ---------- */
  const onSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { id: mid(), role: 'user', content: text, createdAt: Date.now() };
      setMessages((ms) => [...ms, userMsg]);

      const intent = text.trim().toLowerCase();
      if (/^(proxim|next|seguir|vamos)/.test(intent)) {
        await askNext();
        return;
      }

      setTyping(true);
      try {
        const res = await llm.freeReply({
          userMessage: text,
          subjectId,
          build: buildId,
          lastQuestion: currentQuestion ?? undefined,
        });
        setMessages((ms) => [
          ...ms,
          {
            id: mid(),
            role: 'assistant',
            content: res.reply,
            suggestions: res.suggestions,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [askNext, subjectId, buildId, currentQuestion],
  );

  /* ---------- Highlight (selecao de texto) ---------- */
  const onHighlight = useCallback(
    async (selectedText: string, action: HighlightAction) => {
      setTyping(true);
      try {
        const res = await llm.highlight({ selectedText, action, subjectId, build: buildId });
        setMessages((ms) => [
          ...ms,
          {
            id: mid(),
            role: 'assistant',
            content: `**${res.title}**\n\n${res.body}`,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [buildId, subjectId],
  );

  /* ---------- Build change ---------- */
  function handleBuildChange(b: BuildId) {
    setBuildId(b);
    const qs = new URLSearchParams(Array.from(searchParams.entries()));
    qs.set('build', b);
    router.replace(`/chat/${subjectId}?${qs.toString()}`);
    setMessages((ms) => [
      ...ms,
      {
        id: mid(),
        role: 'system',
        content: `Build alterada para ${findBuild(b)?.title}.`,
        createdAt: Date.now(),
      },
    ]);
  }

  /* ---------- Keyboard shortcuts globais ---------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typingInField =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Cmd+B → toggle sidebar
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setSidebarCollapsed((c) => !c);
        return;
      }
      // Cmd+Shift+L → toggle theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setTheme(theme === 'light' ? 'dark' : 'light');
        return;
      }
      // Cmd+Shift+P → study plan
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setStudyPlanOpen(true);
        return;
      }
      if (typingInField) return;
      if (e.key === 'j' || e.key === 'J') {
        askNext();
      }
      if (e.key === '.') {
        void runCommand('give-hint');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [askNext, runCommand, setTheme, theme]);

  const activeQuestionMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.question && !m.feedback) return m.id;
    }
    return null;
  }, [messages]);

  return (
    <div className={`workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <WorkspaceSidebar
        activeSubjectId={subjectId}
        buildId={buildId}
        onOpenCommand={() => setCmdOpen(true)}
        collapsed={sidebarCollapsed}
      />

      <section className="ws-main">
        <div className="ws-topbar">
          <button
            className="icon-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expandir sidebar (⌘B)' : 'Recolher sidebar (⌘B)'}
            title={sidebarCollapsed ? 'Expandir (⌘B)' : 'Recolher (⌘B)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
          <div className="ws-breadcrumb">
            <span>{subject.icon}</span>
            <span>{subject.title}</span>
            <span className="sep">›</span>
            <span className="cur">Sessão · {findBuild(buildId)?.title}</span>
          </div>
          <BuildSwitch value={buildId} onChange={handleBuildChange} />
          <div className="ws-topbar-actions">
            <button
              className="icon-btn"
              onClick={() => setCmdOpen(true)}
              aria-label="Abrir paleta (Cmd+K)"
              title="Paleta de comandos (⌘K)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <button
              className="icon-btn"
              onClick={() => setStudyPlanOpen(true)}
              aria-label="Plano de estudos (Cmd+Shift+P)"
              title="Gerar plano de estudos (⌘⇧P)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="ws-scroll" ref={scrollerRef}>
          <div className="ws-stream">
            {messages.map((m) => {
              if (m.role === 'system') {
                return (
                  <div
                    key={m.id}
                    style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '6px 0' }}
                  >
                    — {m.content} —
                  </div>
                );
              }
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  locked={m.id !== activeQuestionMessageId}
                  onChoose={(l) => m.question && onChoose(m.id, m.question, l)}
                  onSuggestion={onSuggestion}
                />
              );
            })}
            {typing && <TypingIndicator />}
          </div>
        </div>

        <Composer onSend={onSend} onCommand={runCommand} disabled={typing} />
      </section>


      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onRun={runCommand} scope="chat" />
      <StudyPlanModal open={studyPlanOpen} onOpenChange={setStudyPlanOpen} />
      <HighlightPopover containerRef={scrollerRef} onAction={onHighlight} />
    </div>
  );
}
