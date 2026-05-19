import type { CommandActionId } from './llm/llmClient';

/**
 * Comandos simplificados - apenas os essenciais
 *
 * Filosofia 2026: "narrow scope beats vague ambition"
 * 72% das interações em chatbots educacionais são simples
 */

export type CommandActionDef = {
  id: CommandActionId;
  label: string;
  description: string;
  icon: string;
};

// Apenas 3 ações essenciais
export const COMMAND_ACTIONS: CommandActionDef[] = [
  {
    id: 'next-question',
    label: 'Próxima questão',
    description: 'Avança para a próxima',
    icon: '→',
  },
  {
    id: 'give-hint',
    label: 'Dica',
    description: 'Uma dica sem entregar a resposta',
    icon: '💡',
  },
];

// Apenas 3 slash commands
export const SLASH_COMMANDS = [
  { token: '/proxima', action: 'next-question' as CommandActionId, description: 'Próxima questão', icon: '→' },
  { token: '/dica', action: 'give-hint' as CommandActionId, description: 'Dica', icon: '💡' },
  { token: '/pular', action: 'next-question' as CommandActionId, description: 'Pular questão', icon: '⏭' },
];
