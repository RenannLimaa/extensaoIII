'use client';

import { notFound } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommandPalette } from '../../components/chat/CommandPalette';
import { Composer } from '../../components/chat/Composer';
import { HighlightPopover } from '../../components/chat/HighlightPopover';
import { Inspector } from '../../components/chat/Inspector';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { StudyPlanModal } from '../../components/chat/StudyPlanModal';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { WorkspaceSidebar } from '../../components/chat/WorkspaceSidebar';
import { useTheme } from '../../components/providers/ThemeProvider';
import {
  createChat,
  promptAI,
  randomQuestion,
  retrieveAllChats,
  retrieveMessagesByChat,
} from '../../lib/backendApi';
import {
  clearQuestionCache,
  currentQuestionIdFromMessages,
  mapBackendMessages,
  NO_QUESTIONS_AVAILABLE,
} from '../../lib/backendChat';
import { findSubject } from '../../lib/catalog';
import { subjectToHabilidadeId } from '../../lib/subjectHabilidade';
import type {
  AlternativeLetter,
  ChatMessage,
  Question,
  SmartSuggestion,
  SubjectId,
} from '../../lib/types';
import type { CommandActionId, HighlightAction } from '../../lib/llm/llmClient';

type PageProps = {
  params: Promise<{ subjectId: string }>;
};

export default function ChatPage({ params }: PageProps) {
  const { subjectId: rawSubjectId } = use(params);
  const { setTheme, theme } = useTheme();

  const subject = findSubject(rawSubjectId);
  if (!subject) notFound();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

  const [cmdOpen, setCmdOpen] = useState(false);
  const [studyPlanOpen, setStudyPlanOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const rawMessagesRef = useRef<Awaited<ReturnType<typeof retrieveMessagesByChat>>>([]);

  const subjectId = subject.id as SubjectId;
  const habilidadeId = subjectToHabilidadeId(subjectId);
  const chatName = subject.title;

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

  const syncMessages = useCallback(
    async (raw: Awaited<ReturnType<typeof retrieveMessagesByChat>>) => {
      rawMessagesRef.current = raw;
      const mapped = await mapBackendMessages(raw, subjectId);
      if (mapped.length === 0) {
        setMessages([
          {
            id: 'no-questions',
            role: 'assistant',
            content: NO_QUESTIONS_AVAILABLE,
            createdAt: Date.now(),
          },
        ]);
        setCurrentQuestion(null);
        return;
      }
      setMessages(mapped);
      const lastQ = [...mapped].reverse().find((m) => m.question)?.question ?? null;
      setCurrentQuestion(lastQ);
    },
    [subjectId],
  );

  useEffect(() => {
    let cancelled = false;

    setMessages([]);
    setChatId(null);
    setCurrentQuestion(null);
    setInitError(null);
    rawMessagesRef.current = [];
    clearQuestionCache();

    (async () => {
      setTyping(true);
      try {
        const chats = await retrieveAllChats();
        let chat = chats.find(
          (c) => c.habilidade === habilidadeId && c.chat_name === chatName,
        );
        if (!chat) {
          chat = await createChat(habilidadeId, chatName);
        }
        if (cancelled) return;
        setChatId(chat.id);

        let raw = await retrieveMessagesByChat(chat.id);
        if (cancelled) return;
        if (raw.length === 0) {
          try {
            raw = await randomQuestion(chat.id);
          } catch {
            raw = [];
          }
        }
        if (cancelled) return;
        await syncMessages(raw);
      } catch (err) {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : 'Falha ao conectar ao backend');
        }
      } finally {
        if (!cancelled) setTyping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subjectId, habilidadeId, chatName, syncMessages]);

  function patchMessage(id: string, patch: Partial<ChatMessage>) {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  const questionIdForPrompt = useCallback(() => {
    return currentQuestionIdFromMessages(rawMessagesRef.current, subjectId);
  }, [subjectId]);

  const onChoose = useCallback(
    async (messageId: string, question: Question, letter: AlternativeLetter) => {
      if (!chatId) return;
      patchMessage(messageId, { chosen: letter });
      setTyping(true);
      try {
        const qid = Number(question.id) || questionIdForPrompt();
        const raw = await promptAI(chatId, qid, `Alternativa ${letter}`);
        await syncMessages(raw);
        const alt = question.alternativas.find((a) => a.letra === letter);
        const correta = Boolean(alt?.correta);
        patchMessage(messageId, {
          chosen: letter,
          feedback: {
            correta,
            explicacao: correta ? 'Resposta correta.' : 'Resposta incorreta.',
          },
        });
        setStats((s) => ({
          answered: s.answered + 1,
          correct: s.correct + (correta ? 1 : 0),
        }));
      } finally {
        setTyping(false);
      }
    },
    [chatId, syncMessages, questionIdForPrompt],
  );

  const askNext = useCallback(async () => {
    if (!chatId) return;
    setTyping(true);
    try {
      const raw = await randomQuestion(chatId);
      await syncMessages(raw);
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      const msg = detail.includes('Nenhuma questão') || detail.includes('matéria')
        ? NO_QUESTIONS_AVAILABLE
        : detail || 'Não foi possível carregar uma nova questão.';
      setMessages((ms) => [
        ...ms,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          content: msg,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }, [chatId, syncMessages]);

  const onSend = useCallback(
    async (text: string) => {
      if (!chatId) return;
      if (/^(proxim|next|seguir|vamos)/i.test(text.trim())) {
        await askNext();
        return;
      }
      setTyping(true);
      try {
        const raw = await promptAI(chatId, questionIdForPrompt(), text);
        await syncMessages(raw);
      } finally {
        setTyping(false);
      }
    },
    [chatId, askNext, questionIdForPrompt, syncMessages],
  );

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
      if (chatId && currentQuestion) {
        setTyping(true);
        try {
          const qid = Number(currentQuestion.id) || questionIdForPrompt();
          const raw = await promptAI(chatId, qid, `Comando: ${actionId}`);
          await syncMessages(raw);
        } finally {
          setTyping(false);
        }
      }
    },
    [askNext, chatId, currentQuestion, questionIdForPrompt, syncMessages, setTheme, theme],
  );

  const onSuggestion = useCallback(
    async (s: SmartSuggestion) => {
      if (s.action === 'next' || s.action === 'easier' || s.action === 'harder') {
        await askNext();
        return;
      }
      if (chatId && currentQuestion) {
        setTyping(true);
        try {
          const qid = Number(currentQuestion.id) || questionIdForPrompt();
          const raw = await promptAI(chatId, qid, s.label);
          await syncMessages(raw);
        } finally {
          setTyping(false);
        }
      }
    },
    [askNext, chatId, currentQuestion, questionIdForPrompt, syncMessages],
  );

  const onHighlight = useCallback(
    async (selectedText: string, action: HighlightAction) => {
      if (!chatId) return;
      setTyping(true);
      try {
        const raw = await promptAI(chatId, questionIdForPrompt(), `[${action}] ${selectedText}`);
        await syncMessages(raw);
      } finally {
        setTyping(false);
      }
    },
    [chatId, questionIdForPrompt, syncMessages],
  );

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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setStudyPlanOpen(true);
        return;
      }
      if (typingInField) return;
      if (e.key === 'j' || e.key === 'J') askNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [askNext, setTheme, theme]);

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
        onOpenCommand={() => setCmdOpen(true)}
        collapsed={sidebarCollapsed}
      />

      <section className="ws-main">
        <div className="ws-topbar">
          <button
            className="icon-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expandir sidebar (Cmd/Ctrl+B)' : 'Recolher sidebar (Cmd/Ctrl+B)'}
            title={sidebarCollapsed ? 'Expandir (Cmd/Ctrl+B)' : 'Recolher (Cmd/Ctrl+B)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
          <div className="ws-breadcrumb">
            <span>{subject.icon}</span>
            <span className="cur">{subject.title}</span>
          </div>
          <div className="ws-topbar-actions">
            <button className="icon-btn" onClick={() => setCmdOpen(true)} aria-label="Paleta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <button className="icon-btn" onClick={() => setStudyPlanOpen(true)} aria-label="Plano">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </button>
          </div>
        </div>

        {initError && (
          <div style={{ padding: '12px 16px', color: 'var(--danger, #e11)', fontSize: '0.9rem' }}>
            {initError}
          </div>
        )}

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

        <Composer onSend={onSend} onCommand={runCommand} disabled={typing || !chatId} />
      </section>

      <Inspector
        subjectId={subjectId}
        stats={stats}
        onOpenStudyPlan={() => setStudyPlanOpen(true)}
        onOpenCommand={() => setCmdOpen(true)}
      />

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onRun={runCommand} scope="chat" />
      <StudyPlanModal
        open={studyPlanOpen}
        onOpenChange={setStudyPlanOpen}
        chatId={chatId}
        questionId={questionIdForPrompt()}
        subjectId={subjectId}
        habilidadeId={habilidadeId}
      />
      <HighlightPopover containerRef={scrollerRef} onAction={onHighlight} />
    </div>
  );
}
