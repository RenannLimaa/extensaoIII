'use client';

import { notFound } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Composer } from '../../components/chat/Composer';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { findSubject } from '../../lib/catalog';
import { llm } from '../../lib/llm';
import type {
  AlternativeLetter,
  BuildId,
  ChatMessage,
  Question,
  SmartSuggestion,
  SubjectId,
} from '../../lib/types';
import type { CommandActionId } from '../../lib/llm/llmClient';

function mid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type PageProps = {
  params: Promise<{ subjectId: string }>;
};

/**
 * Chat Page - Versão simplificada 2026
 *
 * Apenas o essencial:
 * - Stream de mensagens
 * - Composer com voz
 * - Quick-reply buttons
 */
export default function ChatPage({ params }: PageProps) {
  const { subjectId: rawSubjectId } = use(params);
  const subject = findSubject(rawSubjectId);
  if (!subject) notFound();

  const subjectId = subject.id as SubjectId;
  const buildId: BuildId = 'teorico';

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

  // Session kickoff
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
  }, [subjectId]);

  function patchMessage(id: string, patch: Partial<ChatMessage>) {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  // Responder questão
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
    [],
  );

  // Próxima questão
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
    [subjectId, askedIds],
  );

  // Executar comando
  const runCommand = useCallback(
    async (actionId: CommandActionId) => {
      if (actionId === 'next-question') {
        await askNext();
        return;
      }
      if (actionId === 'give-hint') {
        setTyping(true);
        try {
          const res = await llm.runCommand({
            actionId,
            context: { subjectId, question: currentQuestion ?? undefined, build: buildId },
          });
          if (res.reply && res.reply !== '__next__') {
            setMessages((ms) => [
              ...ms,
              { id: mid(), role: 'assistant', content: res.reply!, createdAt: Date.now() },
            ]);
          }
        } finally {
          setTyping(false);
        }
      }
    },
    [askNext, currentQuestion, subjectId],
  );

  // Sugestões
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
        case 'hint':
          await runCommand('give-hint');
          return;
      }
    },
    [askNext, runCommand],
  );

  // Envio de texto livre
  const onSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { id: mid(), role: 'user', content: text, createdAt: Date.now() };
      setMessages((ms) => [...ms, userMsg]);

      const intent = text.trim().toLowerCase();
      if (/^(proxim|next|seguir|vamos|pular)/.test(intent)) {
        await askNext();
        return;
      }
      if (/^(dica|hint|ajuda)/.test(intent)) {
        await runCommand('give-hint');
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
    [askNext, runCommand, subjectId, currentQuestion],
  );

  const activeQuestionMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.question && !m.feedback) return m.id;
    }
    return null;
  }, [messages]);

  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

  return (
    <div className="chat-container">
      {/* Header simples */}
      <header className="chat-header">
        <a href="/" className="chat-back" aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="chat-title">
          <span className="chat-icon">{subject.icon}</span>
          <span>{subject.title}</span>
        </div>
        {stats.answered > 0 && (
          <div className="chat-stats">
            <span className={accuracy >= 70 ? 'good' : accuracy >= 40 ? 'ok' : 'low'}>
              {accuracy}%
            </span>
            <span className="sep">·</span>
            <span>{stats.correct}/{stats.answered}</span>
          </div>
        )}
      </header>

      {/* Stream de mensagens */}
      <div className="chat-scroll" ref={scrollerRef}>
        <div className="chat-stream">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              locked={m.id !== activeQuestionMessageId}
              onChoose={(l) => m.question && onChoose(m.id, m.question, l)}
              onSuggestion={onSuggestion}
            />
          ))}
          {typing && <TypingIndicator />}
        </div>
      </div>

      {/* Composer */}
      <div className="chat-composer-wrap">
        <Composer onSend={onSend} onCommand={runCommand} disabled={typing} />
      </div>
    </div>
  );
}
