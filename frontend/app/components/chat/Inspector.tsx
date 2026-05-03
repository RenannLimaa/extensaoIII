'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { llm } from '../../lib/llm';
import type {
  ReviewQueueOutput,
  SessionInsightsOutput,
} from '../../lib/llm/llmClient';
import type { SubjectId } from '../../lib/types';

type Props = {
  subjectId: SubjectId;
  stats: { answered: number; correct: number };
  onOpenStudyPlan: () => void;
  onOpenCommand: () => void;
};

export function Inspector({ subjectId, stats, onOpenStudyPlan, onOpenCommand }: Props) {
  const [insights, setInsights] = useState<SessionInsightsOutput | null>(null);
  const [queue, setQueue] = useState<ReviewQueueOutput | null>(null);

  useEffect(() => {
    llm.sessionInsights({ subjectId, stats }).then(setInsights);
  }, [subjectId, stats]);

  useEffect(() => {
    llm.reviewQueue({ subjectId }).then(setQueue);
  }, [subjectId]);

  const accuracy = insights?.accuracy ?? 0;

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
          {insights && insights.streak > 0 && <span className="stat-delta">🔥 {insights.streak} seguidas</span>}
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
          {stats.correct} acertos em {stats.answered} questões · ~{insights?.timeMinutes ?? 0} min de estudo
        </div>
      </div>

      {insights && insights.strongTopics.length > 0 && (
        <div className="insp-block">
          <h4>Pontos fortes</h4>
          {insights.strongTopics.map((t) => (
            <div key={t.topic} className="topic-row">
              <span className="name">{t.topic}</span>
              <div className="bar" aria-hidden>
                <motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${t.accuracy}%` }} transition={{ duration: 0.6 }} />
              </div>
              <span className="pct">{t.accuracy}%</span>
            </div>
          ))}
        </div>
      )}

      {insights && insights.weakTopics.length > 0 && (
        <div className="insp-block">
          <h4>Pontos fracos</h4>
          {insights.weakTopics.map((t) => (
            <div key={t.topic} className="topic-row weak">
              <span className="name">{t.topic}</span>
              <div className="bar" aria-hidden>
                <motion.div className="bar-fill" initial={{ width: 0 }} animate={{ width: `${t.accuracy}%` }} transition={{ duration: 0.6 }} />
              </div>
              <span className="pct">{t.accuracy}%</span>
            </div>
          ))}
        </div>
      )}

      {insights && (
        <div className="insp-block">
          <h4>Próximo passo sugerido</h4>
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
            <strong style={{ display: 'block', marginBottom: 4 }}>{insights.nextAction.label}</strong>
            {insights.nextAction.detail}
          </div>
        </div>
      )}

      {queue && (
        <div className="insp-block">
          <h4>Revisão para hoje ({queue.dueToday.length})</h4>
          {queue.dueToday.map((item) => (
            <div key={item.id} className="queue-item">
              <span className="date">{item.dueLabel}</span>
              <span className="subj">{item.topic}</span>
              {item.overdue && <span className="badge-mini">Atrasada</span>}
            </div>
          ))}
          {queue.upcoming.slice(0, 2).map((item) => (
            <div key={item.id} className="queue-item" style={{ opacity: 0.7 }}>
              <span className="date">{item.dueLabel}</span>
              <span className="subj">{item.topic}</span>
            </div>
          ))}
        </div>
      )}

      <div className="insp-block">
        <button className="insp-cta" onClick={onOpenStudyPlan}>
          <span aria-hidden>📅</span>
          Gerar plano de estudos
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
