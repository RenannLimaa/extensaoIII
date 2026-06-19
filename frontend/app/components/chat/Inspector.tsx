'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  randomQuestionByHabilidade,
  retrieveQuestionsByHabilidade,
} from '../../lib/backendApi';
import type { QuestionSchema } from '../../lib/backendTypes';

type Props = {
  onOpenStudyPlan: () => void;
  habilidadeId: number;
  subjectTitle: string;
};

function dificuldadeLabel(n: number): string {
  if (n <= 1) return 'Fácil';
  if (n === 2) return 'Média';
  return 'Difícil';
}

export function Inspector({ onOpenStudyPlan, habilidadeId, subjectTitle }: Props) {
  const [total, setTotal] = useState<number | null>(null);
  const [preview, setPreview] = useState<QuestionSchema | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET /questions/habilidade/{id} — quantas questões a matéria tem
  useEffect(() => {
    let cancelled = false;
    setTotal(null);
    setPreview(null);
    setRevealed(false);
    setError(null);
    retrieveQuestionsByHabilidade(habilidadeId)
      .then((qs) => {
        if (!cancelled) setTotal(qs.length);
      })
      .catch(() => {
        if (!cancelled) setTotal(0);
      });
    return () => {
      cancelled = true;
    };
  }, [habilidadeId]);

  // GET /questions/random/habilidade/{id} — sorteia uma questão da matéria (sem chat)
  const drawRandom = useCallback(async () => {
    setLoadingPreview(true);
    setRevealed(false);
    setError(null);
    try {
      const q = await randomQuestionByHabilidade(habilidadeId);
      setPreview(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível sortear uma questão.');
    } finally {
      setLoadingPreview(false);
    }
  }, [habilidadeId]);

  return (
    <aside className="ws-inspector" aria-label="Painel lateral do chat">
      <div className="insp-block">
        <button className="insp-cta" onClick={onOpenStudyPlan}>
          <span aria-hidden>📅</span>
          Pedir plano à IA (no chat)
        </button>
      </div>

      <div className="insp-block">
        <h4>
          <span aria-hidden>📚</span> Banco de questões
        </h4>
        <div className="stat-row">
          <span className="stat-val">{total ?? '—'}</span>
          <span className="stat-label">
            {total === 1 ? 'questão' : 'questões'} em {subjectTitle}
          </span>
        </div>

        <button className="insp-cta" onClick={drawRandom} disabled={loadingPreview || !total}>
          <span aria-hidden>🎲</span>
          {loadingPreview ? 'Sorteando…' : 'Sortear questão'}
        </button>

        {error && <p className="insp-error">{error}</p>}

        {preview && (
          <div className="q-preview">
            <div className="q-preview-head">
              <span className="q-preview-id">Questão #{preview.id}</span>
              <span className="q-badge">{dificuldadeLabel(preview.dificuldade)}</span>
            </div>
            <p className="q-preview-enun">{preview.enunciado}</p>
            <ul className="q-preview-alts">
              {preview.alternativas.map((alt) => {
                const correct = revealed && alt.letra === preview.resposta_correta;
                return (
                  <li key={alt.letra} className={correct ? 'correct' : undefined}>
                    <span className="alt-letra">{alt.letra}</span>
                    <span>{alt.texto}</span>
                  </li>
                );
              })}
            </ul>
            <button className="q-reveal" onClick={() => setRevealed((r) => !r)}>
              {revealed ? 'Ocultar resposta' : 'Ver resposta'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
