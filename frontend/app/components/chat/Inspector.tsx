'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { SubjectId } from '../../lib/types';

type Props = {
  subjectId: SubjectId;
  stats: { answered: number; correct: number };
  onOpenStudyPlan: () => void;
  onOpenCommand: () => void;
};

export function Inspector({ stats, onOpenStudyPlan, onOpenCommand }: Props) {
  const accuracy = useMemo(() => {
    if (stats.answered <= 0) return 0;
    return Math.round((stats.correct / stats.answered) * 100);
  }, [stats.answered, stats.correct]);

  return (
    <aside className="ws-inspector" aria-label="Painel de insights da sessão">
      <div className="insp-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 3v18h18" />
          <path d="M7 16V8" />
          <path d="M12 16v-5" />
          <path d="M17 16v-3" />
        </svg>
        <span>Insights da sessão</span>
      </div>

      <div className="insp-block">
        <h4>Acurácia</h4>
        <div className="stat-row">
          <span className="stat-val">{accuracy}%</span>
        </div>
        <div className="progress-track" aria-hidden>
          <AnimatePresence mode="wait">
            <motion.div
              key={accuracy}
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
        </div>
        <div className="stat-label">
          {stats.correct} acertos em {stats.answered} questões nesta sessão
        </div>
      </div>

      <div className="insp-block">
        <h4>Próximo passo</h4>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--accent-soft)',
            color: 'var(--accent-strong)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
          }}
        >
          Use o campo abaixo ou <strong>próxima questão</strong> para continuar.
        </div>
      </div>

      <div className="insp-block">
        <button className="insp-cta" onClick={onOpenStudyPlan}>
          <span aria-hidden>📅</span>
          Pedir plano à IA (no chat)
        </button>
        <div style={{ height: 8 }} />
        <button className="insp-cta" onClick={onOpenCommand}>
          <span aria-hidden>⌘</span>
          Abrir paleta de comandos
        </button>
      </div>
    </aside>
  );
}
