'use client';

import Link from 'next/link';
import { SUBJECTS } from '../../lib/catalog';
import { useTheme } from '../providers/ThemeProvider';

export type Area = { id: number; nome: string; icon: string };

type Props = {
  areas: readonly Area[];
  activeArea: number;
  onSelectArea: (id: number) => void;
  counts?: Record<number, number>;
};

export function BancoSidebar({ areas, activeArea, onSelectArea, counts }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="ws-sidebar" aria-label="Navegação do banco de questões">
      <div className="ws-sidebar-header">
        <Link href="/" className="brand-lockup" aria-label="ENEMBot home">
          <span className="brand-mark" aria-hidden>
            E
          </span>
          <span className="brand-name">ENEMBot</span>
        </Link>
      </div>

      <nav className="ws-nav">
        <div className="ws-nav-label">Banco · Áreas</div>
        {areas.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`ws-nav-item ${a.id === activeArea ? 'is-active' : ''}`}
            onClick={() => onSelectArea(a.id)}
            aria-pressed={a.id === activeArea}
          >
            <span className="emoji" aria-hidden>
              {a.icon}
            </span>
            <span>{a.nome}</span>
            {counts && counts[a.id] != null && <span className="count">{counts[a.id]}</span>}
          </button>
        ))}
      </nav>

      <nav className="ws-nav" style={{ marginTop: 8 }}>
        <div className="ws-nav-label">Ir para o chat</div>
        {SUBJECTS.map((s) => (
          <Link key={s.id} href={`/chat/${s.id}`} className="ws-nav-item">
            <span className="emoji" aria-hidden>
              {s.icon}
            </span>
            <span>{s.title}</span>
          </Link>
        ))}
      </nav>

      <div className="ws-sidebar-footer">
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.84rem' }}>
            Banco de questões
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Navegue por área</div>
        </div>
        <button className="icon-btn" onClick={toggle} aria-label="Alternar tema" title="Alternar tema">
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
