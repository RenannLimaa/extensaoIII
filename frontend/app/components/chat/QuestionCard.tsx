'use client';

import { motion } from 'framer-motion';
import type { AlternativeLetter, Question } from '../../lib/types';

type Props = {
  question: Question;
  chosen?: AlternativeLetter;
  feedback?: { correta: boolean; explicacao: string };
  locked: boolean;
  onChoose: (letter: AlternativeLetter) => void;
};

function difficultyChip(d: Question['dificuldade']) {
  const map = {
    facil: { label: 'Fácil', cls: 'accent' },
    media: { label: 'Média', cls: 'warn' },
    dificil: { label: 'Difícil', cls: 'danger' },
  } as const;
  return map[d];
}

export function QuestionCard({ question, chosen, feedback, locked, onChoose }: Props) {
  const diff = difficultyChip(question.dificuldade);

  return (
    <motion.div
      className="q-card"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="q-meta">
        <span className="q-chip accent">{question.assunto}</span>
        {question.ano && <span className="q-chip">ENEM {question.ano}</span>}
        <span className={`q-chip ${diff.cls}`}>{diff.label}</span>
      </div>

      <p className="q-statement">{question.enunciado}</p>

      <ul className="q-alts">
        {question.alternativas.map((alt, idx) => {
          const isChosen = chosen === alt.letra;
          let cls = 'q-alt';
          if (locked) {
            if (alt.correta) cls += ' is-correct';
            else if (isChosen && !alt.correta) cls += ' is-wrong';
          } else if (isChosen) {
            cls += ' is-chosen';
          }
          return (
            <motion.li
              key={alt.letra}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <button
                type="button"
                className={cls}
                disabled={locked}
                onClick={() => onChoose(alt.letra)}
                aria-pressed={isChosen}
              >
                <span className="letter">{alt.letra}</span>
                <span>
                  {alt.texto}
                  {locked && alt.correta && alt.feedback && <span className="alt-note">{alt.feedback}</span>}
                  {locked && isChosen && !alt.correta && alt.feedback && (
                    <span className="alt-note">{alt.feedback}</span>
                  )}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      {feedback && (
        <motion.div
          className={`q-verdict ${feedback.correta ? 'correct' : 'wrong'}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.1 }}
        >
          <span className="v-icon" aria-hidden>
            {feedback.correta ? '✓' : '✕'}
          </span>
          <div>
            <strong>{feedback.correta ? 'Resposta correta' : 'Resposta incorreta'}</strong>
            {feedback.explicacao}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
