import type { BuildId, Question, SubjectId } from '../types';
import type {
  AnswerInput,
  AnswerOutput,
  CommandActionInput,
  CommandActionOutput,
  FreeReplyInput,
  FreeReplyOutput,
  HighlightInput,
  HighlightOutput,
  LlmClient,
  NextQuestionInput,
  NextQuestionOutput,
  ReviewQueueInput,
  ReviewQueueOutput,
  SessionInsightsInput,
  SessionInsightsOutput,
  StartSessionInput,
  StartSessionOutput,
  StudyPlanInput,
  StudyPlanOutput,
} from './llmClient';

type BackendAlternative = {
  letra: string;
  texto: string;
  correta?: boolean;
  feedback?: string;
};

type BackendQuestion = {
  id: number;
  enunciado: string;
  dificuldade: number;
  habilidade?: number;
  competencia?: number;
  alternativas: BackendAlternative[];
};

type BackendChatMessage = {
  id: number;
  author: string;
  texto: string;
  question_id?: number | null;
};

const DEFAULT_CHAT_ID = 1;
const VALID_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
const PROMPTS = {
  answer: (questionId: string, chosen: string) =>
    `Resposta da questão ${questionId}: alternativa ${chosen}. Explique se está correta.`,
  command: (actionId: string, questionId?: string) =>
    `Comando ${actionId}${questionId ? ` para questão ${questionId}` : ''}.`,
};
const PLAN_SUBJECTS: SubjectId[] = ['matematica', 'linguagens', 'natureza', 'humanas', 'redacao'];

const fallbackBySkill: Record<number, SubjectId> = {
  1: 'matematica',
  2: 'linguagens',
  3: 'natureza',
  4: 'humanas',
  5: 'redacao',
};

function difficultyToUi(value: number): Question['dificuldade'] {
  if (value <= 1) return 'facil';
  if (value >= 3) return 'dificil';
  return 'media';
}

function subjectBySkill(skill: number | undefined, fallback: SubjectId): SubjectId {
  if (!skill) return fallback;
  return fallbackBySkill[skill] ?? fallback;
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Erro inesperado ao processar resposta do backend.';
}

function toLetter(value: string): Question['alternativas'][number]['letra'] {
  const upper = value.toUpperCase();
  if (VALID_LETTERS.includes(upper as (typeof VALID_LETTERS)[number])) {
    return upper as Question['alternativas'][number]['letra'];
  }
  return 'A';
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ${res.status} em ${path}: ${text || 'sem detalhes'}`);
  }

  return (await res.json()) as T;
}

async function fetchQuestionById(questionId: number, subjectId: SubjectId): Promise<Question> {
  const payload = await apiRequest<{ questions: BackendQuestion[] }>(`/questions/${questionId}`);
  const raw = payload.questions?.[0];
  if (!raw) {
    throw new Error(`Questão ${questionId} não encontrada no backend.`);
  }
  return {
    id: String(raw.id),
    subjectId: subjectBySkill(raw.habilidade, subjectId),
    assunto: raw.competencia ? `Competência ${raw.competencia}` : 'Questão ENEM',
    dificuldade: difficultyToUi(raw.dificuldade),
    enunciado: raw.enunciado,
    alternativas: raw.alternativas.map((a) => ({
      letra: toLetter(a.letra),
      texto: a.texto,
      correta: Boolean(a.correta),
      feedback: a.feedback,
    })),
    explicacao: 'Explicação será enviada pelo backend após sua resposta.',
  };
}

async function fetchLatestPromptQuestion(subjectId: SubjectId): Promise<{ intro: string; question: Question | null }> {
  const payload = await apiRequest<{ mensagens: BackendChatMessage[] }>('/questions/');
  const messages = payload.mensagens ?? [];
  const intro = messages
    .filter((m) => m.author.toLowerCase() === 'llm')
    .map((m) => m.texto)
    .filter(Boolean)
    .at(-1) ?? 'Recebi uma nova questão para você.';

  const questionId = messages.findLast((m) => typeof m.question_id === 'number')?.question_id ?? null;
  if (!questionId) {
    return { intro, question: null };
  }

  return { intro, question: await fetchQuestionById(questionId, subjectId) };
}

async function sendPrompt(chatId: number, text: string): Promise<BackendChatMessage[]> {
  const payload = await apiRequest<{ mensagens: BackendChatMessage[] }>(`/chat/prompt/${chatId}`, {
    method: 'PUT',
    body: JSON.stringify(text),
  });
  return payload.mensagens ?? [];
}

async function getPromptReply(userMessage: string): Promise<string> {
  try {
    const messages = await sendPrompt(DEFAULT_CHAT_ID, userMessage);
    return (
      messages
        .filter((m) => m.author.toLowerCase() === 'llm')
        .map((m) => m.texto)
        .filter(Boolean)
        .at(-1) ?? 'Não recebi resposta do assistente.'
    );
  } catch (error) {
    return parseErrorMessage(error);
  }
}

export const backendLlmClient: LlmClient = {
  async startSession({ subjectId }: StartSessionInput): Promise<StartSessionOutput> {
    const { intro, question } = await fetchLatestPromptQuestion(subjectId);
    if (!question) {
      throw new Error('Backend não retornou questão inicial.');
    }
    return { greeting: intro, firstQuestion: question };
  },

  async answerQuestion({ question, chosen }: AnswerInput): Promise<AnswerOutput> {
    try {
      const messages = await sendPrompt(
        DEFAULT_CHAT_ID,
        PROMPTS.answer(question.id, chosen),
      );
      const reply =
        messages
          .filter((m) => m.author.toLowerCase() === 'llm')
          .map((m) => m.texto)
          .filter(Boolean)
          .at(-1) ?? 'Resposta registrada. Pedir explicação detalhada ao backend.';
      const picked = question.alternativas.find((a) => a.letra === chosen);
      const isCorrect = Boolean(picked?.correta);
      return {
        feedback: reply,
        correta: isCorrect,
        explicacao: reply,
        suggestions: [
          { id: 'next', action: 'next', label: 'Próxima questão' },
          { id: 'summary', action: 'summary', label: 'Resumo do tópico' },
        ],
      };
    } catch (error) {
      const message = parseErrorMessage(error);
      return {
        feedback: message,
        correta: false,
        explicacao: message,
        suggestions: [{ id: 'next', action: 'next', label: 'Tentar próxima' }],
      };
    }
  },

  async nextQuestion({ subjectId }: NextQuestionInput): Promise<NextQuestionOutput> {
    return fetchLatestPromptQuestion(subjectId);
  },

  async freeReply({ userMessage }: FreeReplyInput): Promise<FreeReplyOutput> {
    return { reply: await getPromptReply(userMessage) };
  },

  async highlight({ selectedText, action }: HighlightInput): Promise<HighlightOutput> {
    return {
      title: 'Análise de trecho',
      body: await getPromptReply(`${action}: ${selectedText}`),
    };
  },

  async buildStudyPlan({ goal, minutesPerDay = 60 }: StudyPlanInput): Promise<StudyPlanOutput> {
    const week = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((day, index) => ({
      day,
      subjectId: PLAN_SUBJECTS[index % PLAN_SUBJECTS.length],
      topic: goal || 'Revisão geral',
      minutes: minutesPerDay,
      goal: 'Praticar questões e revisar erros.',
    }));
    return {
      title: 'Plano semanal',
      overview: 'Plano base gerado no frontend enquanto o endpoint dedicado não está disponível.',
      week,
    };
  },

  async sessionInsights({ stats }: SessionInsightsInput): Promise<SessionInsightsOutput> {
    const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
    return {
      accuracy,
      streak: stats.streak ?? 0,
      timeMinutes: Math.max(5, stats.answered * 2),
      strongTopics: [],
      weakTopics: [],
      nextAction: {
        type: 'new-topic',
        label: 'Continuar praticando',
        detail: 'Envie mais um prompt para receber nova questão do backend.',
      },
    };
  },

  async reviewQueue(_: ReviewQueueInput): Promise<ReviewQueueOutput> {
    return {
      dueToday: [],
      upcoming: [],
      summary: 'Sem fila de revisão disponível no backend atual.',
    };
  },

  async runCommand({ actionId, context }: CommandActionInput): Promise<CommandActionOutput> {
    if (actionId === 'next-question') return { reply: '__next__' };
    if (actionId === 'open-study-plan') return { openModal: 'study-plan' };
    if (actionId === 'toggle-theme') return { sideEffect: { type: 'theme', value: 'dark' } };

    const userText = PROMPTS.command(actionId, context?.question?.id);
    return { reply: await getPromptReply(userText) };
  },
};
