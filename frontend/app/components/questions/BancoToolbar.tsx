'use client';

import type { Area } from './BancoSidebar';

export type SortKey = 'padrao' | 'dificuldade-asc' | 'dificuldade-desc' | 'id-desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'padrao', label: 'Padrão (nº da questão)' },
  { value: 'id-desc', label: 'Mais recentes (nº ↓)' },
  { value: 'dificuldade-asc', label: 'Dificuldade: fácil → difícil' },
  { value: 'dificuldade-desc', label: 'Dificuldade: difícil → fácil' },
];

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  areas: readonly Area[];
  area: number;
  onAreaChange: (id: number) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
};

export function BancoToolbar({
  query,
  onQueryChange,
  areas,
  area,
  onAreaChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <div className="banco-toolbar">
      <div className="banco-toolbar-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          className="banco-toolbar-input"
          type="search"
          placeholder="Pesquisar pelo texto da questão…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Pesquisar questões pelo texto do enunciado"
        />
        {query && (
          <button className="banco-toolbar-clear" onClick={() => onQueryChange('')} aria-label="Limpar busca">
            ✕
          </button>
        )}
      </div>

      <div className="banco-toolbar-filters">
        <label className="banco-field">
          <span>Área</span>
          <select
            className="input"
            value={String(area)}
            onChange={(e) => onAreaChange(Number(e.target.value))}
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="banco-field">
          <span>Ordenar</span>
          <select
            className="input"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
