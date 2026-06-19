'use client';

import { useState } from 'react';
import type { QuestionSchema } from '../../lib/backendTypes';

type Props = {
  question: QuestionSchema;
  /** Começa com a resposta visível (ex.: modo professor). Default: oculta. */
  defaultRevealed?: boolean;
};

export function dificuldadeLabel(n: number): string {
  if (n <= 1) return 'Fácil';
  if (n === 2) return 'Média';
  return 'Difícil';
}

export function QuestionPreviewCard({ question, defaultRevealed = false }: Props) {
  const [revealed, setRevealed] = useState(defaultRevealed);

  return (
    <div className="q-preview">
      <div className="q-preview-head">
        <span className="q-preview-id">Questão #{question.id}</span>
        <span className="q-badge">{dificuldadeLabel(question.dificuldade)}</span>
      </div>
      <p className="q-preview-enun">{question.enunciado}</p>
      <ul className="q-preview-alts">
        {question.alternativas.map((alt) => {
          const correct = revealed && alt.letra === question.resposta_correta;
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
  );
}
