'use client';

import { useState } from 'react';
import { QuestionCard } from '../chat/QuestionCard';
import { habilidadeNome } from '../../lib/subjectHabilidade';
import type { QuestionSchema } from '../../lib/backendTypes';
import type { AlternativeLetter, Difficulty, Question, SubjectId } from '../../lib/types';

const HABILIDADE_SUBJECT: Record<number, SubjectId> = {
  1: 'linguagens',
  2: 'humanas',
  3: 'matematica',
  4: 'natureza',
};

function numToDificuldade(n: number): Difficulty {
  if (n <= 1) return 'facil';
  if (n === 2) return 'media';
  return 'dificil';
}

/** Adapta o QuestionSchema (backend) para o tipo Question da UI do chat. */
function toUiQuestion(q: QuestionSchema): Question {
  return {
    id: String(q.id),
    subjectId: HABILIDADE_SUBJECT[q.habilidade] ?? 'natureza',
    assunto: habilidadeNome(q.habilidade),
    dificuldade: numToDificuldade(q.dificuldade),
    enunciado: q.enunciado,
    alternativas: q.alternativas.map((a) => ({
      letra: a.letra as AlternativeLetter,
      texto: a.texto,
      correta: a.letra === q.resposta_correta,
    })),
    explicacao: '',
  };
}

export function BancoQuestionCard({ question }: { question: QuestionSchema }) {
  // marked = alternativa selecionada (ainda não confirmada); confirmed = travou e revelou
  const [marked, setMarked] = useState<AlternativeLetter | undefined>();
  const [confirmed, setConfirmed] = useState(false);

  const uiQuestion = toUiQuestion(question);
  const acertou = marked === question.resposta_correta;

  const feedback = confirmed
    ? {
        correta: acertou,
        explicacao: acertou
          ? 'Você marcou a alternativa correta.'
          : `A alternativa correta é a ${question.resposta_correta}.`,
      }
    : undefined;

  return (
    <div className="banco-card">
      <QuestionCard
        question={uiQuestion}
        chosen={marked}
        locked={confirmed}
        feedback={feedback}
        onChoose={(letter) => {
          if (!confirmed) setMarked(letter);
        }}
      />

      <div className="banco-card-actions">
        {!confirmed ? (
          <button
            className="btn btn-primary btn-sm"
            disabled={marked === undefined}
            onClick={() => setConfirmed(true)}
          >
            {marked ? `Confirmar alternativa ${marked}` : 'Marque uma alternativa'}
          </button>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setConfirmed(false);
              setMarked(undefined);
            }}
          >
            Refazer
          </button>
        )}
      </div>
    </div>
  );
}
