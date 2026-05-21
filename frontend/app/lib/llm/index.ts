import { backendLlmClient } from './backendLlmClient';
import type { LlmClient } from './llmClient';

export const llm: LlmClient = backendLlmClient;

export type { LlmClient } from './llmClient';
