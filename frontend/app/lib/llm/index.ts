/**
 * Facade do cliente LLM usado por toda a app.
 * Exporta o cliente conectado ao backend da aplicação.
 */
import { backendLlmClient } from './backendLlmClient';
import type { LlmClient } from './llmClient';

export const llm: LlmClient = backendLlmClient;

export type { LlmClient } from './llmClient';
