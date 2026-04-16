import type { AlternativeLetter, BuildId, Question, SubjectId } from '../types';

/**
 * CONTRATO do cliente LLM. Toda a UI depende APENAS desta interface.
 *
 * Ponto de troca: para integrar OpenAI de verdade, criar um arquivo irmao
 * `openAiLlmClient.ts` que implemente LlmClient, e trocar o import em
 * `frontend/app/lib/llm/index.ts`. Nada mais no app precisa mudar.
 */

export type StartSessionInput = {
  subjectId: SubjectId;
  build?: BuildId;
};

export type StartSessionOutput = {
  /** Primeira fala do bot (greeting + pitch da build) */
  greeting: string;
  /** Primeira questao ja carregada */
  firstQuestion: Question;
};

export type AnswerInput = {
  question: Question;
  chosen: AlternativeLetter;
  build?: BuildId;
};

export type AnswerOutput = {
  /** Texto do bot comentando a resposta */
  feedback: string;
  correta: boolean;
  /** Explicacao tecnica (sempre enviada, exiba ou nao) */
  explicacao: string;
};

export type NextQuestionInput = {
  subjectId: SubjectId;
  build?: BuildId;
  alreadyAskedIds: string[];
};

export type NextQuestionOutput = {
  /** Texto curto do bot introduzindo a proxima questao */
  intro: string;
  question: Question | null;
};

export type FreeReplyInput = {
  userMessage: string;
  subjectId: SubjectId;
  build?: BuildId;
  lastQuestion?: Question;
};

export type FreeReplyOutput = {
  reply: string;
};

export interface LlmClient {
  startSession(input: StartSessionInput): Promise<StartSessionOutput>;
  answerQuestion(input: AnswerInput): Promise<AnswerOutput>;
  nextQuestion(input: NextQuestionInput): Promise<NextQuestionOutput>;
  freeReply(input: FreeReplyInput): Promise<FreeReplyOutput>;
}
