'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SUBJECTS } from '../../lib/catalog';
import { formatRecentLabel, listRecentSessions, totalAnsweredInRecentSessions } from '../../lib/sessionStore';
import type { SubjectId } from '../../lib/types';
import { useTheme } from '../providers/ThemeProvider';

type SessionEntry = {
  id: string;
  subjectId: SubjectId;
  title: string;
  whenLabel: string;
  accuracy: number;
};

type Props = {
  activeSubjectId: SubjectId;
  buildId?: string;
  onOpenCommand: () => void;
  collapsed?: boolean;
};

export function WorkspaceSidebar({ activeSubjectId, buildId, onOpenCommand, collapsed = false }: Props) {
  const { theme, toggle } = useTheme();
  const qs = buildId ? `?build=${encodeURIComponent(buildId)}` : '';
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [flashcardsCount, setFlashcardsCount] = useState(0);

  useEffect(() => {
    const recent = listRecentSessions(6).map((session) => ({
      id: session.id,
      subjectId: session.subjectId,
      title: session.title,
      whenLabel: formatRecentLabel(session.updatedAt),
      accuracy: session.accuracy,
    }));
    setSessions(recent);
    setFlashcardsCount(totalAnsweredInRecentSessions());
  }, [activeSubjectId, buildId]);

  return (
    <aside className={`ws-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Navegação da workspace">
      <div className="ws-sidebar-header">
        <Link href="/" className="brand-lockup" aria-label="ENEMBot home">
          <span className="brand-mark" aria-hidden>
            E
          </span>
          <span className="brand-name">ENEMBot</span>
        </Link>
      </div>

      <button className="ws-sidebar-search" onClick={onOpenCommand} aria-label="Abrir paleta de comandos">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span>Buscar ou digitar comando</span>
        <span className="hint">
          <span className="kbd">⌘</span>
          <span className="kbd">K</span>
        </span>
      </button>

      <nav className="ws-nav">
        <div className="ws-nav-label">Matérias</div>
        {SUBJECTS.map((s) => (
          <Link
            key={s.id}
            href={`/chat/${s.id}${qs}`}
            className={`ws-nav-item ${s.id === activeSubjectId ? 'is-active' : ''}`}
            title={collapsed ? s.title : undefined}
          >
            <span className="emoji" aria-hidden>
              {s.icon}
            </span>
            <span>{s.title}</span>
          </Link>
        ))}
      </nav>

      <nav className="ws-nav" style={{ marginTop: 8 }}>
        <div className="ws-nav-label">Recursos IA</div>
        <div className="ws-nav-item" onClick={onOpenCommand} title={collapsed ? 'Paleta de comandos' : undefined}>
          <span className="emoji" aria-hidden>
            ✨
          </span>
          <span>Paleta de comandos</span>
        </div>
        <Link href={`/chat/${activeSubjectId}${qs}`} className="ws-nav-item" title={collapsed ? 'Flashcards' : undefined}>
          <span className="emoji" aria-hidden>
            🗂️
          </span>
          <span>Flashcards</span>
          <span className="count">{flashcardsCount}</span>
        </Link>
        <div className="ws-nav-item" title={collapsed ? 'Plano semanal' : undefined}>
          <span className="emoji" aria-hidden>
            📅
          </span>
          <span>Plano semanal</span>
        </div>
      </nav>

      <div className="ws-nav-label" style={{ padding: '14px 14px 4px' }}>
        Sessões recentes
      </div>
      <div className="ws-sessions">
        {sessions.length === 0 && (
          <div className="ws-session" style={{ opacity: 0.8 }}>
            <div className="title">Nenhuma sessão concluída ainda</div>
            <div className="meta">
              <span>Resolva questões para preencher seu histórico</span>
            </div>
          </div>
        )}
        {sessions.map((s) => (
          <div key={s.id} className={`ws-session ${s.subjectId === activeSubjectId ? 'is-active' : ''}`}>
            <div className="title">
              <span aria-hidden>{SUBJECTS.find((x) => x.id === s.subjectId)?.icon}</span>
              {s.title}
            </div>
            <div className="meta">
              <span>{s.whenLabel}</span>
              <span className="dot" />
              <span>{s.accuracy}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ws-sidebar-footer">
        <span className="av" aria-hidden>
          T
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.84rem' }}>Estudante ENEM</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Protótipo v0.2</div>
        </div>
        <button className="icon-btn" onClick={toggle} aria-label="Alternar tema" title="Alternar tema (⌘⇧L)">
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
