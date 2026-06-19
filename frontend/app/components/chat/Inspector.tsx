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

export function Inspector({ onOpenStudyPlan, habilidadeId, subjectTitle }: Props) {
  const [total, setTotal] = useState<number | null>(null);
  const [preview, setPreview] = useState<QuestionSchema | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET /questions/habilidade/{id} — quantas questões a matéria tem
  useEffect(() => {
    let cancelled = false;
    setTotal(null);
    setPreview(null);
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
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          📚 Banco de {subjectTitle}
          {total !== null && (
            <strong style={{ color: 'var(--text)' }}> — {total} questões</strong>
          )}
        </div>
        <button className="insp-cta" onClick={drawRandom} disabled={loadingPreview || total === 0}>
          <span aria-hidden>🎲</span>
          {loadingPreview ? 'Sorteando…' : 'Sortear questão'}
        </button>

        {error && (
          <p style={{ color: 'var(--danger, #e11)', fontSize: '0.78rem', marginTop: 8 }}>{error}</p>
        )}

        {preview && (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 8,
              background: 'var(--surface-2, rgba(127,127,127,0.08))',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Questão #{preview.id}</div>
            <p style={{ margin: 0 }}>{preview.enunciado}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
