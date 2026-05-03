/**
 * Facade do cliente LLM usado por toda a app.
 * Por padrao exporta o mock; trocar pelo adapter real (OpenAI, Gemini, etc.)
 * implementando LlmClient e alterando apenas esta linha.
 */
import { mockLlmClient } from './mockLlmClient';
import type { LlmClient } from './llmClient';

export const llm: LlmClient = mockLlmClient;

export type { LlmClient } from './llmClient';
