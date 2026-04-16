'use client';

import Link from 'next/link';
import { SUBJECTS } from '../../lib/catalog';
import type { SubjectId } from '../../lib/types';

type Props = {
  activeSubjectId: SubjectId;
  buildId?: string;
  sessionStats: {
    answered: number;
    correct: number;
  };
};

export function ChatSidebar({ activeSubjectId, buildId, sessionStats }: Props) {
  const params = buildId ? `?build=${encodeURIComponent(buildId)}` : '';
  const acc = sessionStats.answered
    ? Math.round((sessionStats.correct / sessionStats.answered) * 100)
    : 0;

  return (
    <aside className="chat-sidebar">
      <Link href="/" className="chat-sidebar-brand" aria-label="Voltar para home">
        <span className="brand-badge" aria-hidden>
          <span className="brand-dot" />
        </span>
        <span>
          <span className="brand-main">ENEM</span>
          <span className="brand-suffix" style={{ color: 'var(--accent)' }}>Bot</span>
        </span>
      </Link>

      <div>
        <h4>Materias</h4>
        {SUBJECTS.map((s) => (
          <Link
            key={s.id}
            href={`/chat/${s.id}${params}`}
            className={`chat-sidebar-item ${s.id === activeSubjectId ? 'is-active' : ''}`}
          >
            <span aria-hidden>{s.icon}</span>
            <span>{s.title}</span>
          </Link>
        ))}
      </div>

      <div>
        <h4>Sessao atual</h4>
        <div className="chat-sidebar-item" style={{ cursor: 'default' }}>
          <span aria-hidden>✅</span>
          <span>
            {sessionStats.correct} / {sessionStats.answered} acertos
            {sessionStats.answered > 0 && ` (${acc}%)`}
          </span>
        </div>
      </div>

      <div className="chat-sidebar-footer">
        Prototipo v0.1 · respostas geradas localmente (mock).
      </div>
    </aside>
  );
}
