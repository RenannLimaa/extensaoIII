'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { llm } from '../../lib/llm';
import type { StudyPlanOutput } from '../../lib/llm/llmClient';
import { findSubject } from '../../lib/catalog';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function StudyPlanModal({ open, onOpenChange }: Props) {
  const [goal, setGoal] = useState('Faltam 60 dias para o ENEM, quero focar em exatas.');
  const [minutes, setMinutes] = useState(60);
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState<StudyPlanOutput | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await llm.buildStudyPlan({ goal, minutesPerDay: minutes, days });
      setPlan(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Gerador de plano de estudos"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="modal-header">
              <h3>📅 Gerar plano de estudos</h3>
              <button className="icon-btn" onClick={() => onOpenChange(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="modal-body">
              {!plan ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    Qual seu objetivo?
                    <textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="input textarea"
                      style={{ marginTop: 6 }}
                      placeholder="Ex: faltam 60 dias, preciso melhorar matemática e redação"
                    />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <label style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      Minutos por dia
                      <input
                        type="number"
                        className="input"
                        value={minutes}
                        min={15}
                        max={240}
                        step={15}
                        onChange={(e) => setMinutes(Number(e.target.value) || 60)}
                        style={{ marginTop: 6 }}
                      />
                    </label>
                    <label style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      Dias do plano
                      <input
                        type="number"
                        className="input"
                        value={days}
                        min={3}
                        max={7}
                        onChange={(e) => setDays(Number(e.target.value) || 7)}
                        style={{ marginTop: 6 }}
                      />
                    </label>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    O plano é gerado pela integração atual com o backend da aplicação.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400 }}>
                    {plan.title}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: 0 }}>{plan.overview}</p>
                  <div style={{ marginTop: 12 }}>
                    {plan.week.map((d, i) => (
                      <motion.div
                        key={i}
                        className="plan-day"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <span className="day">
                          {d.day} · {findSubject(d.subjectId)?.icon}
                        </span>
                        <span className="task">
                          <strong style={{ color: 'var(--text-primary)' }}>{findSubject(d.subjectId)?.title}</strong> — {d.topic}
                          <br />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{d.goal}</span>
                        </span>
                        <span className="min">{d.minutes}min</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {plan ? (
                <>
                  <button className="btn btn-ghost" onClick={() => setPlan(null)}>
                    Novo plano
                  </button>
                  <button className="btn btn-accent" onClick={() => onOpenChange(false)}>
                    Começar agora
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-accent" onClick={generate} disabled={loading}>
                    {loading ? 'Gerando…' : 'Gerar plano'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
