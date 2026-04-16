'use client';

import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BuildSwitch } from '../../components/chat/BuildSwitch';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { Composer } from '../../components/chat/Composer';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { findBuild, findSubject } from '../../lib/catalog';
import { llm } from '../../lib/llm';
import type {
  AlternativeLetter,
  BuildId,
  ChatMessage,
  Question,
  SubjectId,
} from '../../lib/types';

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

  const subject = findSubject(rawSubjectId);
  if (!subject) notFound();

  const initialBuild = (searchParams.get('build') as BuildId | null) ?? 'teorico';
  const [buildId, setBuildId] = useState<BuildId>(
    findBuild(initialBuild) ? initialBuild : 'teorico',
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

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

  // Kick off session
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

  const onChoose = useCallback(
    async (messageId: string, question: Question, letter: AlternativeLetter) => {
      // lock answer imediatamente com feedback visual
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

  const askNext = useCallback(async () => {
    setTyping(true);
    try {
      const nxt = await llm.nextQuestion({ subjectId, build: buildId, alreadyAskedIds: askedIds });
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
        { id: mid(), role: 'assistant', content: '', question: nxt.question!, createdAt: Date.now() },
      ]);
      setCurrentQuestion(nxt.question);
      setAskedIds((ids) => [...ids, nxt.question!.id]);
    } finally {
      setTyping(false);
    }
  }, [subjectId, buildId, askedIds]);

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
          { id: mid(), role: 'assistant', content: res.reply, createdAt: Date.now() },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [askNext, subjectId, buildId, currentQuestion],
  );

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

  const activeQuestionMessageId = useMemo(() => {
    // ultima msg do assistant com question sem feedback
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.question && !m.feedback) return m.id;
    }
    return null;
  }, [messages]);

  return (
    <div className="chat-shell">
      <ChatSidebar activeSubjectId={subjectId} buildId={buildId} sessionStats={stats} />

      <section className="chat-main">
        <div className="chat-topbar">
          <div className="chat-topbar-title">
            <strong>
              {subject.icon} {subject.title}
            </strong>
            <small>Sessao ENEM · {findBuild(buildId)?.title}</small>
          </div>
          <BuildSwitch value={buildId} onChange={handleBuildChange} />
        </div>

        <div className="chat-scroll" ref={scrollerRef}>
          <div className="chat-stream">
            {messages.map((m) => {
              if (m.role === 'system') {
                return (
                  <div key={m.id} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
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
                />
              );
            })}
            {typing && <TypingIndicator />}
          </div>
        </div>

        <Composer onSend={onSend} disabled={typing} />
      </section>
    </div>
  );
}
