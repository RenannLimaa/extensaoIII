import type { Question } from '../types';

function basePrompt(question: Question, subjectTitle: string, outcome: 'correct' | 'wrong') {
  const outcomeLabel = outcome === 'correct' ? 'acerto' : 'erro';
  const focus =
    outcome === 'correct'
      ? 'fixação, transferência e reflexão'
      : 'revisão do raciocínio, recuperação do conceito e reflexão sobre a armadilha';

  return [
    'Gere perguntas adicionais para estudo e fixação em português do Brasil.',
    `Tema: ${subjectTitle}`,
    `Assunto da questão: ${question.assunto}`,
    `Enunciado: ${question.enunciado}`,
    `Explicação da questão: ${question.explicacao}`,
    `Situação: ${outcomeLabel}`,
    `Objetivo: ${focus}`,
    'Regras de saída:',
    '- responda somente com 3 perguntas curtas e diretas',
    '- use markdown com uma lista numerada',
    '- não responda as perguntas',
    '- não repita o enunciado da questão',
    '- a terceira pergunta deve ser de reflexão/aplicação',
    'Se for útil, inclua um tom de estudo leve e encorajador.',
  ].join('\n');
}

export function buildFixationPrompt(question: Question, subjectTitle: string, correct: boolean) {
  return basePrompt(question, subjectTitle, correct ? 'correct' : 'wrong');
}

export function buildQuizPrompt(question: Question, subjectTitle: string) {
  return [
    'Gere um mini-quiz de fixação em português do Brasil.',
    `Tema: ${subjectTitle}`,
    `Assunto da questão: ${question.assunto}`,
    'Regras de saída:',
    '- responda somente com 3 perguntas curtas e diretas',
    '- use markdown com uma lista numerada',
    '- não responda as perguntas',
    '- a terceira pergunta deve exigir reflexão ou aplicação',
  ].join('\n');
}

export function buildFixationQuestions(question: Question, correct: boolean): string[] {
  const first = correct
    ? 'O que, no enunciado, te ajudou a chegar na alternativa certa?'
    : 'Qual pista do enunciado ou da explicação você deixou passar?';
  const second = correct
    ? `Como você explicaria a ideia central de ${question.assunto} sem usar o texto da questão?`
    : `Qual passo do raciocínio em ${question.assunto} precisa ser retomado antes de tentar de novo?`;
  const third = correct
    ? `Se a banca trocasse o contexto dessa questão, o que continuaria valendo na explicação?`
    : `Onde essa mesma armadilha poderia aparecer em outra questão da disciplina?`;

  return [first, second, third];
}