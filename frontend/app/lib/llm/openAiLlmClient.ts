/**
 * OpenAI LLM Client - Versão simplificada 2026
 *
 * Usa a API route /api/chat para não expor a API key.
 * Fallback local quando API falha ou não está configurada.
 */

import { findBuild, findSubject } from '../catalog';
import { pickQuestion } from '../questionBank';
import type {
  AnswerInput,
  AnswerOutput,
  CommandActionInput,
  CommandActionOutput,
  FreeReplyInput,
  FreeReplyOutput,
  LlmClient,
  NextQuestionInput,
  NextQuestionOutput,
  SmartSuggestion,
  StartSessionInput,
  StartSessionOutput,
} from './llmClient';

// Histórico de conversa
let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

function resetHistory() {
  conversationHistory = [];
}

function addToHistory(role: 'user' | 'assistant', content: string) {
  conversationHistory.push({ role, content });
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }
}

async function callChatAPI<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload, history: conversationHistory }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function sid() {
  return `s_${Math.random().toString(36).slice(2, 7)}`;
}

// Sugestões padrão
function suggestionsCorrect(): SmartSuggestion[] {
  return [
    { id: sid(), action: 'harder', label: 'Mais difícil' },
    { id: sid(), action: 'next', label: 'Próxima' },
  ];
}

function suggestionsWrong(): SmartSuggestion[] {
  return [
    { id: sid(), action: 'easier', label: 'Mais fácil' },
    { id: sid(), action: 'hint', label: 'Dica' },
    { id: sid(), action: 'next', label: 'Próxima' },
  ];
}

export const openAiLlmClient: LlmClient = {
  async startSession({ subjectId, build }: StartSessionInput): Promise<StartSessionOutput> {
    resetHistory();

    const firstQuestion = pickQuestion({ subjectId, build, alreadyAskedIds: [] });
    if (!firstQuestion) {
      throw new Error(`Sem questões para ${subjectId}`);
    }

    try {
      const response = await callChatAPI<{ greeting?: string }>('startSession', { subjectId, build });
      const subject = findSubject(subjectId);
      const greeting = response.greeting || `Vamos estudar **${subject?.title}**! Responda a questão abaixo.`;
      addToHistory('assistant', greeting);
      return { greeting, firstQuestion };
    } catch {
      const subject = findSubject(subjectId);
      return {
        greeting: `Vamos estudar **${subject?.title}**! Responda a questão abaixo.`,
        firstQuestion,
      };
    }
  },

  async answerQuestion({ question, chosen, build }: AnswerInput): Promise<AnswerOutput> {
    const alt = question.alternativas.find((a) => a.letra === chosen);
    const correta = Boolean(alt?.correta);
    const correctLetter = question.alternativas.find((a) => a.correta)?.letra ?? '?';

    addToHistory('user', `Respondi ${chosen}`);

    try {
      const response = await callChatAPI<{
        reply?: string;
        suggestions?: SmartSuggestion[];
      }>('answerQuestion', { question, chosen, build });

      const feedback = response.reply || (correta
        ? `**Certo!** Era ${chosen} mesmo.`
        : `**Ops!** Era **${correctLetter}**.`);

      addToHistory('assistant', feedback);

      return {
        correta,
        feedback,
        explicacao: question.explicacao,
        suggestions: response.suggestions?.length
          ? response.suggestions.map(s => ({ ...s, id: s.id || sid() }))
          : (correta ? suggestionsCorrect() : suggestionsWrong()),
      };
    } catch {
      const feedback = correta
        ? `**Certo!** Era ${chosen} mesmo.\n\n${question.explicacao}`
        : `**Ops!** Era **${correctLetter}**.\n\n${question.explicacao}`;

      return {
        correta,
        feedback,
        explicacao: question.explicacao,
        suggestions: correta ? suggestionsCorrect() : suggestionsWrong(),
      };
    }
  },

  async nextQuestion({ subjectId, build, alreadyAskedIds, adaptiveHint }: NextQuestionInput): Promise<NextQuestionOutput> {
    const effectiveBuild = adaptiveHint === 'facil' ? 'estrategista' : adaptiveHint === 'dificil' ? 'sniper' : build;
    const q = pickQuestion({ subjectId, build: effectiveBuild, alreadyAskedIds });

    if (!q) {
      return {
        intro: 'Acabaram as questões disponíveis! Volte depois para mais.',
        question: null,
      };
    }

    return { intro: 'Próxima:', question: q };
  },

  async freeReply({ userMessage, subjectId, build, lastQuestion }: FreeReplyInput): Promise<FreeReplyOutput> {
    addToHistory('user', userMessage);

    try {
      const response = await callChatAPI<{
        reply?: string;
        suggestions?: SmartSuggestion[];
      }>('freeReply', { userMessage, subjectId, build, lastQuestion });

      const reply = response.reply || 'Entendi! Quer continuar com a próxima questão?';
      addToHistory('assistant', reply);

      return { reply, suggestions: response.suggestions };
    } catch {
      const subject = findSubject(subjectId);
      return {
        reply: `Estou aqui para ajudar com **${subject?.title}**. Digite sua dúvida ou use \`/proxima\` para avançar.`,
      };
    }
  },

  async runCommand({ actionId, context }: CommandActionInput): Promise<CommandActionOutput> {
    switch (actionId) {
      case 'next-question':
        return { reply: '__next__' };
      case 'give-hint':
        return {
          reply: context?.question
            ? `**Dica:** Releia o enunciado com atenção. O conceito-chave está em "${context.question.assunto}".`
            : 'Sem questão ativa.',
        };
      default:
        return { reply: 'OK' };
    }
  },
};
