'use client';

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
    facil: { label: 'Facil', cls: 'accent' },
    media: { label: 'Media', cls: 'warning' },
    dificil: { label: 'Dificil', cls: 'danger' },
  } as const;
  return map[d];
}

export function QuestionCard({ question, chosen, feedback, locked, onChoose }: Props) {
  const diff = difficultyChip(question.dificuldade);

  return (
    <div className="question-card">
      <div className="question-meta">
        <span className="meta-chip accent">{question.assunto}</span>
        {question.ano && <span className="meta-chip">ENEM {question.ano}</span>}
        <span className={`meta-chip ${diff.cls}`}>{diff.label}</span>
      </div>

      <p className="question-enunciado">{question.enunciado}</p>

      <ul className="alt-list">
        {question.alternativas.map((alt) => {
          const isChosen = chosen === alt.letra;
          let cls = 'alt-item';
          if (locked) {
            if (alt.correta) cls += ' is-correct';
            else if (isChosen && !alt.correta) cls += ' is-wrong';
          } else if (isChosen) {
            cls += ' is-chosen';
          }

          return (
            <li key={alt.letra}>
              <button
                type="button"
                className={cls}
                disabled={locked}
                onClick={() => onChoose(alt.letra)}
                aria-pressed={isChosen}
              >
                <span className="alt-letter">{alt.letra}</span>
                <span>
                  {alt.texto}
                  {locked && alt.correta && alt.feedback && (
                    <span className="alt-feedback">{alt.feedback}</span>
                  )}
                  {locked && isChosen && !alt.correta && alt.feedback && (
                    <span className="alt-feedback">{alt.feedback}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {feedback && (
        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10,
                      background: feedback.correta ? 'var(--accent-soft)' : 'var(--danger-soft)',
                      color: feedback.correta ? 'var(--accent-strong)' : 'var(--danger)',
                      fontSize: '0.9rem', lineHeight: 1.5 }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>
            {feedback.correta ? 'Resposta correta' : 'Resposta incorreta'}
          </strong>
          {feedback.explicacao}
        </div>
      )}
    </div>
  );
}
