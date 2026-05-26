'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SUBJECTS } from '../../lib/catalog';
import { retrieveAllChats } from '../../lib/backendApi';
import type { ChatSchema } from '../../lib/backendTypes';
import { useBackendUser } from '../../lib/useBackendUser';
import type { SubjectId } from '../../lib/types';
import { habilidadeNome, subjectToHabilidadeId } from '../../lib/subjectHabilidade';
import { useTheme } from '../providers/ThemeProvider';
import { AuthModal } from '../user/AuthModal';

type Props = {
  activeSubjectId: SubjectId;
  onOpenCommand: () => void;
  collapsed?: boolean;
};

export function WorkspaceSidebar({ activeSubjectId, onOpenCommand, collapsed = false }: Props) {
  const { theme, toggle } = useTheme();
  const { user, logout, loading: userLoading } = useBackendUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [chats, setChats] = useState<ChatSchema[]>([]);
  const activeHabilidade = subjectToHabilidadeId(activeSubjectId);

  useEffect(() => {
    retrieveAllChats()
      .then((all) => all.filter((c) => c.habilidade === activeHabilidade))
      .then(setChats)
      .catch(() => setChats([]));
  }, [activeSubjectId, activeHabilidade]);

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
            href={`/chat/${s.id}`}
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

      <div className="ws-nav-label" style={{ padding: '14px 14px 4px' }}>
        Chats · {habilidadeNome(activeHabilidade)}
      </div>
      <div className="ws-sessions">
        {chats.length === 0 && (
          <div className="ws-session" style={{ opacity: 0.8 }}>
            <div className="title">Nenhum chat ainda</div>
            <div className="meta">
              <span>Abra uma matéria para criar um chat</span>
            </div>
          </div>
        )}
        {chats.map((c) => (
          <div key={c.id} className="ws-session">
            <div className="title">{c.chat_name}</div>
            <div className="meta">
              <span>ID {c.id}</span>
              <span className="dot" />
              <span>{habilidadeNome(c.habilidade)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ws-sidebar-footer">
        <span className="av" aria-hidden>
          {(user?.username ?? '?').slice(0, 1).toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.84rem' }}>
            {user?.username ?? 'Visitante'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {user ? user.email : 'Não logado'}
          </div>
        </div>
        {user ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Sair
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setAuthOpen(true)}
            disabled={userLoading}
          >
            Entrar
          </button>
        )}
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
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </aside>
  );
}
