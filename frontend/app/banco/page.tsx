'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BancoQuestionCard } from '../components/questions/BancoQuestionCard';
import { BancoSidebar, type Area } from '../components/questions/BancoSidebar';
import { BancoToolbar, type SortKey } from '../components/questions/BancoToolbar';
import { retrieveQuestionsByHabilidade } from '../lib/backendApi';
import type { QuestionSchema } from '../lib/backendTypes';

const AREAS: readonly Area[] = [
  { id: 4, nome: 'Ciências da Natureza', icon: '🧪' },
  { id: 3, nome: 'Matemática', icon: '📐' },
  { id: 1, nome: 'Linguagens', icon: '📖' },
  { id: 2, nome: 'Ciências Humanas', icon: '🌍' },
];

/** minúsculas + sem acento, p/ busca tolerante ("matematica" casa "matemática"). */
function normalize(s: string): string {
  // remove marcas de acento (combining diacritics, faixa U+0300–U+036F)
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function BancoPage() {
  const [byArea, setByArea] = useState<Record<number, QuestionSchema[]>>({});
  const [erroredAreas, setErroredAreas] = useState<Record<number, boolean>>({});
  const [area, setArea] = useState<number>(AREAS[0].id);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('padrao');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      AREAS.map((a) =>
        retrieveQuestionsByHabilidade(a.id)
          .then((qs) => ({ id: a.id, qs, error: false }))
          .catch(() => ({ id: a.id, qs: [] as QuestionSchema[], error: true })),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        setByArea(Object.fromEntries(results.map((r) => [r.id, r.qs])));
        setErroredAreas(Object.fromEntries(results.map((r) => [r.id, r.error])));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // trocar de área limpa a busca (o filtro da área anterior não faz sentido na nova)
  const selectArea = useCallback((id: number) => {
    setArea(id);
    setQuery('');
  }, []);

  const counts = useMemo(
    () => Object.fromEntries(AREAS.map((a) => [a.id, (byArea[a.id] ?? []).length])),
    [byArea],
  );

  const activeArea = AREAS.find((a) => a.id === area) ?? AREAS[0];
  const all = byArea[area] ?? [];
  const areaError = erroredAreas[area] === true;

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const base = q
      ? all.filter((x) => normalize(x.enunciado).includes(q) || String(x.id) === query.trim())
      : all;
    const sorted = [...base];
    switch (sort) {
      case 'id-desc':
        sorted.sort((a, b) => b.id - a.id);
        break;
      case 'dificuldade-asc':
        sorted.sort((a, b) => a.dificuldade - b.dificuldade || a.id - b.id);
        break;
      case 'dificuldade-desc':
        sorted.sort((a, b) => b.dificuldade - a.dificuldade || a.id - b.id);
        break;
      default:
        sorted.sort((a, b) => a.id - b.id);
    }
    return sorted;
  }, [all, query, sort]);

  return (
    <div className="workspace">
      <BancoSidebar areas={AREAS} activeArea={area} onSelectArea={selectArea} counts={counts} />

      <section className="ws-main">
        <div className="ws-topbar">
          <div className="ws-breadcrumb">
            <span aria-hidden>📚</span>
            <span className="cur">Banco de questões</span>
            <span className="sep">/</span>
            <span>{activeArea.nome}</span>
          </div>
        </div>

        <div className="ws-scroll">
          <div className="banco-main-inner">
            <BancoToolbar
              query={query}
              onQueryChange={setQuery}
              areas={AREAS}
              area={area}
              onAreaChange={selectArea}
              sort={sort}
              onSortChange={setSort}
            />

            <div className="banco-status" role="status" aria-live="polite">
              {loading
                ? 'Carregando…'
                : areaError
                ? `Não foi possível carregar as questões de ${activeArea.nome}.`
                : query.trim()
                ? `${filtered.length} de ${all.length} questões em ${activeArea.nome}`
                : `${all.length} ${all.length === 1 ? 'questão' : 'questões'} em ${activeArea.nome}`}
            </div>

            {!loading && !areaError && filtered.length === 0 && (
              <p className="banco-empty">
                {query.trim()
                  ? 'Nenhuma questão encontrada para essa busca.'
                  : 'Nenhuma questão cadastrada nesta área ainda.'}
              </p>
            )}

            <div className="banco-grid">
              {filtered.map((q) => (
                <BancoQuestionCard key={q.id} question={q} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
