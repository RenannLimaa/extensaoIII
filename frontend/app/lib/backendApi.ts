import type {
  ChatMessageSchema,
  ChatSchema,
  ChatsResponse,
  MessageResponse,
  QuestionSchema,
} from './backendTypes';

/** Proxy same-origin via next.config rewrites — evita CORS e "Failed to fetch" se o back estiver no ar. */
const API_BASE =
  typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000');

function asList<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: 'include',
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = (await res.json()) as { detail?: string };
      if (err.detail) detail = err.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ---------- Chat ---------- */

/** GET /chat/ */
export async function retrieveAllChats(): Promise<ChatSchema[]> {
  const data = await request<ChatSchema[] | ChatsResponse | null>('/chat', { method: 'GET' });
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  return asList(data.chats);
}

/** GET /chat/{chat_id} */
export async function retrieveMessagesByChat(chatId: number) {
  const data = await request<ChatMessageSchema[] | null>(`/chat/${chatId}`, { method: 'GET' });
  return asList(data);
}

/** POST /chat/{habilidade_id} — nome do chat no corpo (string JSON) */
export function createChat(habilidadeId: number, chatName: string) {
  return request<ChatSchema>(`/chat/${habilidadeId}`, {
    method: 'POST',
    body: JSON.stringify(chatName),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** POST /chat/update/{chat_id} — nome novo no corpo (string JSON) */
export function updateChatName(chatId: number, chatName: string) {
  return request<MessageResponse>(`/chat/update/${chatId}`, {
    method: 'POST',
    body: JSON.stringify(chatName),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** DELETE /chat/{chat_id} */
export function deleteChat(chatId: number) {
  return request<MessageResponse>(`/chat/${chatId}`, { method: 'DELETE' });
}

/** PUT /chat/prompt/{chat_id}/{question_id}/{texto} */
export async function promptAI(chatId: number, questionId: number, texto: string) {
  const encoded = encodeURIComponent(texto);
  const data = await request<ChatMessageSchema[] | null>(
    `/chat/prompt/${chatId}/${questionId}/${encoded}`,
    { method: 'PUT' },
  );
  return asList(data);
}

/* ---------- Questions ---------- */

/** GET /chat/questions/{id} */
export function retrieveQuestionById(id: number) {
  return request<QuestionSchema>(`/chat/questions/${id}`, { method: 'GET' });
}

/** GET /questions/random/{chat_id} */
export async function randomQuestion(chatId: number) {
  const data = await request<ChatMessageSchema[] | null>(`/questions/random/${chatId}`, {
    method: 'GET',
  });
  return asList(data);
}

/** GET /questions/habilidade/{habilidade_id} — lista todas as questões da matéria (sem chat) */
export async function retrieveQuestionsByHabilidade(habilidadeId: number) {
  const data = await request<QuestionSchema[] | null>(`/questions/habilidade/${habilidadeId}`, {
    method: 'GET',
  });
  return asList(data);
}

/** GET /questions/random/habilidade/{habilidade_id} — uma questão aleatória da matéria (sem chat) */
export function randomQuestionByHabilidade(habilidadeId: number) {
  return request<QuestionSchema>(`/questions/random/habilidade/${habilidadeId}`, {
    method: 'GET',
  });
}
