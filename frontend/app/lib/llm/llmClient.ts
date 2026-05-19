import type { AlternativeLetter, BuildId, Question, SubjectId } from '../types';

/**
 * CONTRATO do cliente LLM - Versão simplificada 2026
 *
 * Apenas 4 métodos essenciais:
 * - startSession: inicia estudo
 * - answerQuestion: responde e recebe feedback
 * - nextQuestion: próxima questão
 * - freeReply: conversa livre/dúvidas
 */

export type StartSessionInput = {
  subjectId: SubjectId;
  build?: BuildId;
};

export type StartSessionOutput = {
  greeting: string;
  firstQuestion: Question;
};

export type AnswerInput = {
  question: Question;
  chosen: AlternativeLetter;
  build?: BuildId;
};

export type SmartSuggestion = {
  id: string;
  action: 'easier' | 'harder' | 'next' | 'hint';
  label: string;
};

export type AnswerOutput = {
  feedback: string;
  correta: boolean;
  explicacao: string;
  suggestions: SmartSuggestion[];
};

export type NextQuestionInput = {
  subjectId: SubjectId;
  build?: BuildId;
  alreadyAskedIds: string[];
  adaptiveHint?: 'facil' | 'media' | 'dificil' | 'auto';
};

export type NextQuestionOutput = {
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
  suggestions?: SmartSuggestion[];
};

// Comandos simplificados
export type CommandActionId = 'next-question' | 'give-hint';

export type CommandActionInput = {
  actionId: CommandActionId;
  context?: {
    subjectId?: SubjectId;
    question?: Question;
    build?: BuildId;
  };
};

export type CommandActionOutput = {
  reply?: string;
};

export interface LlmClient {
  startSession(input: StartSessionInput): Promise<StartSessionOutput>;
  answerQuestion(input: AnswerInput): Promise<AnswerOutput>;
  nextQuestion(input: NextQuestionInput): Promise<NextQuestionOutput>;
  freeReply(input: FreeReplyInput): Promise<FreeReplyOutput>;
  runCommand(input: CommandActionInput): Promise<CommandActionOutput>;
}
