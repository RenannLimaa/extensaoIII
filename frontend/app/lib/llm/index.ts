/**
 * Facade do cliente LLM usado por toda a app.
 *
 * O cliente OpenAI usa a API route /api/chat para nao expor a API key.
 * Se OPENAI_API_KEY nao estiver configurada, funciona em modo fallback local.
 *
 * Para usar mock puro (sem chamadas de rede), troque a linha abaixo:
 * import { mockLlmClient } from './mockLlmClient';
 * export const llm: LlmClient = mockLlmClient;
 */
import { openAiLlmClient } from './openAiLlmClient';
import type { LlmClient } from './llmClient';

export const llm: LlmClient = openAiLlmClient;

export type { LlmClient } from './llmClient';
