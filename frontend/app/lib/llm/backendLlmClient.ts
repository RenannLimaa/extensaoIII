import { findBuild, findSubject } from '../catalog';
import type { AlternativeLetter, Difficulty, SubjectId } from '../types';
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
  ReviewQueueOutput,
  SessionInsightsInput,
  SessionInsightsOutput,
  StartSessionInput,
  StartSessionOutput,
  StudyPlanInput,
  StudyPlanOutput,
} from './llmClient';

type BackendQuestion = {
  id: number | string;
  habilidade?: number;
  competencia?: number;
  enunciado: string;
  alternativas: Array<{ letra: string; texto: string; correta?: boolean; feedback?: string }>;
  dificuldade?: number;
};

type BackendChatMessage = {
  author?: string;
  texto?: string;
  question_id?: number;
};

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '');
const ESTIMATED_MINUTES_PER_QUESTION = 2;
const MAX_DUPLICATE_QUESTION_RETRY_ATTEMPTS = 3;
const DEFAULT_SUBJECT_ID: SubjectId = 'matematica';
const SUBJECT_SKILL_MAP: Record<SubjectId, number> = {
  matematica: 1,
  linguagens: 2,
  natureza: 3,
  humanas: 4,
  redacao: 5,
};

if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  BACKEND_BASE_URL.startsWith('http://') &&
  !BACKEND_BASE_URL.includes('localhost') &&
  !BACKEND_BASE_URL.includes('127.0.0.1')
) {
  console.warn(`NEXT_PUBLIC_BACKEND_URL should use HTTPS in production: ${BACKEND_BASE_URL}`);
}

let activeChatId: number | null = null;

function encodeRawStringBody(value: string): string {
  /**
   * O backend atual usa Body() tipado como string em algumas rotas.
   * Por isso enviamos um JSON string literal (e não objeto).
   */
  return JSON.stringify(value);
}

function subjectToSkillId(subjectId: SubjectId): number {
  return SUBJECT_SKILL_MAP[subjectId];
}

function toAlternativeLetter(value: string): AlternativeLetter {
  const upper = value.toUpperCase();
  if (upper === 'A' || upper === 'B' || upper === 'C' || upper === 'D' || upper === 'E') return upper;
  return 'A';
}

function toDifficulty(value?: number): Difficulty {
  if (value === 3) return 'dificil';
  if (value === 2) return 'media';
  return 'facil';
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: init?.cache ?? (method === 'GET' ? 'default' : 'no-store'),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.detail ? `: ${String(body.detail)}` : '';
    } catch {
      detail = '';
    }
    throw new Error(`Erro na API [${method} ${path}] (${res.status})${detail}`);
  }

  return (await res.json()) as T;
}

function getMessages(payload: unknown): BackendChatMessage[] {
  if (!payload || typeof payload !== 'object') return [];
  const maybe = (payload as { mensagens?: unknown }).mensagens;
  if (!Array.isArray(maybe)) return [];
  return maybe as BackendChatMessage[];
}

function getLastAssistantText(messages: BackendChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const item = messages[i];
    if (item.author === 'llm' && item.texto) return item.texto;
  }
  return null;
}

function extractQuestion(payload: unknown): BackendQuestion | null {
  if (!payload || typeof payload !== 'object') return null;

  const fromList = (payload as { questions?: unknown }).questions;
  if (Array.isArray(fromList) && fromList.length > 0 && typeof fromList[0] === 'object') {
    return fromList[0] as BackendQuestion;
  }

  const single = (payload as { question?: unknown }).question;
  if (single && typeof single === 'object') return single as BackendQuestion;

  return null;
}

async function ensureChat(subjectId: SubjectId): Promise<number> {
  if (activeChatId) return activeChatId;

  const chat = await requestJson<{ id?: number }>(`/chat/${subjectToSkillId(subjectId)}`, {
    method: 'POST',
    body: encodeRawStringBody(`Sessão ${findSubject(subjectId)?.title ?? subjectId}`),
  });
  if (!chat.id) throw new Error('Não foi possível iniciar o chat no backend.');
  activeChatId = chat.id;
  return activeChatId;
}

async function loadQuestionFromBackend(): Promise<{ intro: string; question: BackendQuestion | null }> {
  const payload = await requestJson<unknown>('/questions/');
  const messages = getMessages(payload);
  const intro = getLastAssistantText(messages) ?? 'Nova questão recebida do backend.';

  const questionId = messages
    .map((message) => message.question_id)
    .filter((id): id is number => typeof id === 'number')
    .at(-1);

  if (!questionId) return { intro, question: extractQuestion(payload) };

  const questionPayload = await requestJson<unknown>(`/questions/${questionId}`);
  return { intro, question: extractQuestion(questionPayload) };
}

function mapQuestion(question: BackendQuestion, subjectId: SubjectId) {
  return {
    id: String(question.id),
    subjectId,
    assunto: `Habilidade ${question.habilidade ?? 'N/A'}`,
    dificuldade: toDifficulty(question.dificuldade),
    enunciado: question.enunciado,
    alternativas: question.alternativas.map((alternative) => ({
      letra: toAlternativeLetter(alternative.letra),
      texto: alternative.texto,
      correta: Boolean(alternative.correta),
      feedback: alternative.feedback,
    })),
    explicacao: '',
  };
}

export const backendLlmClient: LlmClient = {
  async startSession({ subjectId, build }: StartSessionInput): Promise<StartSessionOutput> {
    await ensureChat(subjectId);
    const next = await this.nextQuestion({ subjectId, build, alreadyAskedIds: [] });
    if (!next.question) throw new Error('Não foi possível carregar a primeira questão.');

    const greeting =
      `Conectado ao backend para ${findSubject(subjectId)?.title ?? subjectId}.` +
      (build ? ` Build: ${findBuild(build)?.title ?? build}.` : '');

    return {
      greeting,
      firstQuestion: next.question,
    };
  },

  async answerQuestion({ question, chosen }: AnswerInput): Promise<AnswerOutput> {
    if (!activeChatId) throw new Error('Sessão de chat não iniciada.');

    const prompt = [
      'Avalie a resposta do aluno e explique de forma objetiva.',
      `Enunciado: ${question.enunciado}`,
      ...question.alternativas.map((a) => `${a.letra}) ${a.texto}`),
      `Resposta escolhida: ${chosen}`,
    ].join('\n');

    const payload = await requestJson<unknown>(`/chat/prompt/${activeChatId}`, {
      method: 'PUT',
      body: encodeRawStringBody(prompt),
    });
    const messages = getMessages(payload);
    const reply = getLastAssistantText(messages) ?? 'Resposta enviada ao backend com sucesso.';
    const expected = question.alternativas.find((alternative) => alternative.correta)?.letra;
    const correta = expected ? expected === chosen : false;

    return {
      feedback: reply,
      correta,
      explicacao: reply,
      suggestions: [],
    };
  },

  async nextQuestion({ subjectId, alreadyAskedIds }: NextQuestionInput): Promise<NextQuestionOutput> {
    let lastAttemptedQuestion: ReturnType<typeof mapQuestion> | null = null;
    for (let attempt = 0; attempt < MAX_DUPLICATE_QUESTION_RETRY_ATTEMPTS; attempt++) {
      const { intro, question } = await loadQuestionFromBackend();
      if (!question) return { intro, question: null };
      const mapped = mapQuestion(question, subjectId);
      if (!alreadyAskedIds.includes(mapped.id)) {
        return { intro, question: mapped };
      }
      lastAttemptedQuestion = mapped;
    }
    return {
      intro: lastAttemptedQuestion
        ? 'O backend retornou apenas questões já exibidas nesta sessão.'
        : 'Não foi possível obter uma nova questão.',
      question: null,
    };
  },

  async freeReply({ userMessage, subjectId }: FreeReplyInput): Promise<FreeReplyOutput> {
    const chatId = await ensureChat(subjectId);
    const payload = await requestJson<unknown>(`/chat/prompt/${chatId}`, {
      method: 'PUT',
      body: encodeRawStringBody(userMessage),
    });
    const messages = getMessages(payload);
    return {
      reply: getLastAssistantText(messages) ?? 'Mensagem enviada, mas a IA não retornou conteúdo.',
    };
  },

  async highlight({ selectedText, action, subjectId }: HighlightInput): Promise<HighlightOutput> {
    const response = await this.freeReply({
      userMessage: `Ação: ${action}. Texto selecionado: "${selectedText}".`,
      subjectId,
    });
    return {
      title: 'Resposta da IA',
      body: response.reply,
    };
  },

  async buildStudyPlan({ goal, minutesPerDay = 60, days = 7 }: StudyPlanInput): Promise<StudyPlanOutput> {
    const response = await this.freeReply({
      userMessage: `Monte um plano de estudos para ${days} dias, ${minutesPerDay} minutos por dia. Objetivo: ${goal}`,
      subjectId: DEFAULT_SUBJECT_ID,
    });
    return {
      title: 'Plano de estudos',
      overview: response.reply,
      week: [],
    };
  },

  async sessionInsights({ stats }: SessionInsightsInput): Promise<SessionInsightsOutput> {
    const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
    return {
      accuracy,
      streak: stats.streak ?? 0,
      timeMinutes: Math.max(1, stats.answered * ESTIMATED_MINUTES_PER_QUESTION),
      strongTopics: [],
      weakTopics: [],
      nextAction:
        accuracy >= 70
          ? { type: 'challenge', label: 'Subir dificuldade', detail: 'Continue no ritmo e tente questões mais difíceis.' }
          : { type: 'review', label: 'Revisar base', detail: 'Revise os últimos tópicos antes da próxima rodada.' },
    };
  },

  async reviewQueue(): Promise<ReviewQueueOutput> {
    return {
      dueToday: [],
      upcoming: [],
      summary: 'Sem revisões pendentes no backend para o momento.',
    };
  },

  async runCommand({ actionId, context }: CommandActionInput): Promise<CommandActionOutput> {
    if (actionId === 'open-study-plan') return { openModal: 'study-plan' };
    if (actionId === 'flashcards') return { openModal: 'flashcards' };
    if (actionId === 'simulate-exam') return { openModal: 'exam-sim' };
    if (actionId === 'switch-build' && context?.build) return { sideEffect: { type: 'build', value: context.build } };
    if (actionId === 'toggle-theme') return { sideEffect: { type: 'theme', value: 'dark' } };
    if (actionId === 'next-question') return { reply: '__next__' };

    const response = await this.freeReply({
      userMessage: `Execute o comando ${actionId}.`,
      subjectId: context?.subjectId ?? DEFAULT_SUBJECT_ID,
      lastQuestion: context?.question,
      build: context?.build,
    });
    return { reply: response.reply };
  },
};
