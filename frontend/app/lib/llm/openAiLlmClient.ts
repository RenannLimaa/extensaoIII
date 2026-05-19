/**
 * OpenAI LLM Client - Implementacao real do LlmClient
 * Baseado na arquitetura do Iracema (PHC)
 *
 * Usa a API route /api/chat para nao expor a API key no frontend.
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
  HighlightInput,
  HighlightOutput,
  LlmClient,
  NextQuestionInput,
  NextQuestionOutput,
  ReviewQueueInput,
  ReviewQueueOutput,
  SessionInsightsInput,
  SessionInsightsOutput,
  SmartSuggestion,
  StartSessionInput,
  StartSessionOutput,
  StudyPlanInput,
  StudyPlanOutput,
} from './llmClient';

// Historico de mensagens para contexto
let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

function resetHistory() {
  conversationHistory = [];
}

function addToHistory(role: 'user' | 'assistant', content: string) {
  conversationHistory.push({ role, content });
  // Manter apenas ultimas 20 mensagens
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }
}

async function callChatAPI<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      payload,
      history: conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Chat API error:', error);
    throw new Error(`Chat API error: ${response.status}`);
  }

  const data = await response.json();
  return data as T;
}

function sid(prefix = 's') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Fallback suggestions quando API nao retorna
function defaultSuggestionsAfterCorrect(): SmartSuggestion[] {
  return [
    { id: sid(), action: 'harder', label: 'Aumenta a dificuldade', icon: '🔥' },
    { id: sid(), action: 'similar', label: 'Outra do mesmo tipo', icon: '🔁' },
    { id: sid(), action: 'next', label: 'Proxima questao', icon: '→' },
  ];
}

function defaultSuggestionsAfterWrong(): SmartSuggestion[] {
  return [
    { id: sid(), action: 'easier', label: 'Quero uma mais facil', icon: '🪶' },
    { id: sid(), action: 'summary', label: 'Resumo do topico', icon: '📝' },
    { id: sid(), action: 'explain-simple', label: 'Explicar mais simples', icon: '🧒' },
  ];
}

export const openAiLlmClient: LlmClient = {
  async startSession({ subjectId, build }: StartSessionInput): Promise<StartSessionOutput> {
    // Reset historico para nova sessao
    resetHistory();

    // Pegar primeira questao do banco local
    const firstQuestion = pickQuestion({ subjectId, build, alreadyAskedIds: [] });
    if (!firstQuestion) {
      throw new Error(`Nao ha questoes para a disciplina ${subjectId}`);
    }

    try {
      const response = await callChatAPI<{
        greeting?: string;
        buildTip?: string;
        reply?: string;
      }>('startSession', { subjectId, build });

      const subject = findSubject(subjectId);
      const buildMeta = build ? findBuild(build) : undefined;

      // Montar greeting combinando resposta da IA com metadata local
      const greeting = [
        response.greeting || `Oi! Sou seu tutor de **${subject?.title ?? 'ENEM'}**.`,
        response.buildTip || buildMeta?.systemPitch || '',
        '',
        'Quando estiver pronto, escolha uma alternativa abaixo.',
      ]
        .filter(Boolean)
        .join('\n\n');

      addToHistory('assistant', greeting);

      return { greeting, firstQuestion };
    } catch (error) {
      console.error('startSession error:', error);
      // Fallback local
      const subject = findSubject(subjectId);
      const buildMeta = build ? findBuild(build) : undefined;
      const greeting = `Oi! Sou seu tutor de **${subject?.title ?? 'ENEM'}**.\n\n${buildMeta?.systemPitch || ''}\n\nBora comecar!`;
      return { greeting, firstQuestion };
    }
  },

  async answerQuestion({ question, chosen, build }: AnswerInput): Promise<AnswerOutput> {
    const alt = question.alternativas.find((a) => a.letra === chosen);
    const correta = Boolean(alt?.correta);

    addToHistory('user', `Respondi ${chosen}`);

    try {
      const response = await callChatAPI<{
        reply?: string;
        correta?: boolean;
        explicacao?: string;
        suggestions?: SmartSuggestion[];
      }>('answerQuestion', { question, chosen, build });

      const feedback = response.reply || (correta
        ? `**Correto!** A resposta e ${chosen}.`
        : `**Quase!** A resposta correta era ${question.alternativas.find(a => a.correta)?.letra}.`);

      addToHistory('assistant', feedback);

      return {
        correta,
        feedback,
        explicacao: response.explicacao || question.explicacao,
        suggestions: response.suggestions?.length
          ? response.suggestions.map(s => ({ ...s, id: s.id || sid() }))
          : (correta ? defaultSuggestionsAfterCorrect() : defaultSuggestionsAfterWrong()),
      };
    } catch (error) {
      console.error('answerQuestion error:', error);
      // Fallback local
      const correctLetter = question.alternativas.find((a) => a.correta)?.letra ?? '?';
      const feedback = correta
        ? `**Correto!** A resposta ${chosen} esta certa.\n\n${question.explicacao}`
        : `**Quase!** A resposta correta era **${correctLetter}**.\n\n${question.explicacao}`;

      return {
        correta,
        feedback,
        explicacao: question.explicacao,
        suggestions: correta ? defaultSuggestionsAfterCorrect() : defaultSuggestionsAfterWrong(),
      };
    }
  },

  async nextQuestion({ subjectId, build, alreadyAskedIds, adaptiveHint }: NextQuestionInput): Promise<NextQuestionOutput> {
    // Pegar questao do banco local
    const effectiveBuild = adaptiveHint === 'facil' ? 'estrategista' : adaptiveHint === 'dificil' ? 'sniper' : build;
    const q = pickQuestion({ subjectId, build: effectiveBuild, alreadyAskedIds });

    if (!q) {
      return {
        intro: 'Voce ja respondeu todas as questoes disponiveis desta materia no prototipo. Logo teremos mais!',
        question: null,
      };
    }

    try {
      const response = await callChatAPI<{ reply?: string }>('nextQuestion', {
        subjectId,
        build,
        adaptiveHint,
      });

      const intro = response.reply || 'Proxima questao:';
      addToHistory('assistant', intro);

      return { intro, question: q };
    } catch {
      return { intro: 'Proxima questao:', question: q };
    }
  },

  async freeReply({ userMessage, subjectId, build, lastQuestion }: FreeReplyInput): Promise<FreeReplyOutput> {
    addToHistory('user', userMessage);

    try {
      const response = await callChatAPI<{
        reply?: string;
        suggestions?: SmartSuggestion[];
      }>('freeReply', { userMessage, subjectId, build, lastQuestion });

      const reply = response.reply || 'Entendi! Como posso ajudar?';
      addToHistory('assistant', reply);

      return {
        reply,
        suggestions: response.suggestions?.map(s => ({ ...s, id: s.id || sid() })),
      };
    } catch (error) {
      console.error('freeReply error:', error);
      // Fallback local
      const subject = findSubject(subjectId);
      return {
        reply: `Em **${subject?.title ?? 'ENEM'}**, posso te ajudar com:\n\n- \`/proxima\` — nova questao\n- \`/dica\` — dica para a questao atual\n- \`/simplificar\` — explicacao simples\n\nO que precisa?`,
      };
    }
  },

  async highlight({ selectedText, action, subjectId, build }: HighlightInput): Promise<HighlightOutput> {
    try {
      const response = await callChatAPI<{
        title?: string;
        body?: string;
      }>('highlight', { selectedText, action, subjectId, build });

      return {
        title: response.title || 'Explicacao',
        body: response.body || `Sobre "${selectedText.slice(0, 50)}...": esse conceito e fundamental para entender o tema.`,
      };
    } catch {
      return {
        title: 'Explicacao',
        body: `> "${selectedText.slice(0, 100)}${selectedText.length > 100 ? '...' : ''}"\n\nEsse trecho destaca um conceito importante. No ENEM, entender essas conexoes e essencial.`,
      };
    }
  },

  async buildStudyPlan({ goal, minutesPerDay = 60, days = 7 }: StudyPlanInput): Promise<StudyPlanOutput> {
    try {
      const response = await callChatAPI<StudyPlanOutput>('studyPlan', {
        goal,
        minutesPerDay,
        days,
      });

      if (response.title && response.week) {
        return response;
      }
      throw new Error('Invalid response');
    } catch {
      // Fallback local
      const labelDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
      const subjects = ['matematica', 'linguagens', 'natureza', 'humanas', 'redacao'] as const;

      return {
        title: `Plano semanal - ${minutesPerDay} min/dia`,
        overview: `Plano personalizado: _${goal || 'equilibrio geral'}_. Mistura aprendizado novo com revisao.`,
        week: Array.from({ length: Math.min(days, 7) }).map((_, i) => ({
          day: labelDays[i % 7],
          subjectId: subjects[i % 5],
          topic: i === 6 ? 'Revisao geral' : `Topico ${i + 1}`,
          minutes: minutesPerDay,
          goal: i === 6 ? 'Consolidar a semana' : 'Fixar conceitos',
        })),
      };
    }
  },

  async sessionInsights({ stats, subjectId }: SessionInsightsInput): Promise<SessionInsightsOutput> {
    const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;

    try {
      const response = await callChatAPI<SessionInsightsOutput>('sessionInsights', {
        subjectId,
        stats,
      });

      if (response.accuracy !== undefined) {
        return response;
      }
      throw new Error('Invalid response');
    } catch {
      // Fallback local
      return {
        accuracy,
        streak: stats.streak ?? 0,
        timeMinutes: Math.max(5, stats.answered * 2),
        strongTopics: [{ topic: 'Base conceitual', accuracy: Math.min(100, accuracy + 10) }],
        weakTopics: accuracy < 70 ? [{ topic: 'Pratica', accuracy: Math.max(0, accuracy - 20) }] : [],
        nextAction:
          accuracy >= 70
            ? { type: 'challenge', label: 'Subir dificuldade', detail: 'Voce esta mandando bem!' }
            : accuracy >= 40
              ? { type: 'review', label: 'Revisar', detail: 'Foque nos pontos fracos.' }
              : { type: 'new-topic', label: 'Mudar abordagem', detail: 'Tente o modo Teorico.' },
      };
    }
  },

  async reviewQueue({ subjectId }: ReviewQueueInput): Promise<ReviewQueueOutput> {
    // Sempre local (spaced repetition seria feature futura com persistencia)
    const focus = subjectId ?? 'matematica';
    return {
      dueToday: [
        { id: sid('r'), subjectId: focus, topic: 'Regra de tres', dueLabel: 'Hoje', overdue: false, interval: '3 dias' },
        { id: sid('r'), subjectId: 'linguagens', topic: 'Interpretacao', dueLabel: 'Hoje', overdue: false, interval: '1 dia' },
      ],
      upcoming: [
        { id: sid('r'), subjectId: 'humanas', topic: 'Historia', dueLabel: 'Amanha', overdue: false, interval: '5 dias' },
      ],
      summary: 'Voce tem **2 itens** para revisar hoje.',
    };
  },

  async runCommand({ actionId, context }: CommandActionInput): Promise<CommandActionOutput> {
    try {
      const response = await callChatAPI<CommandActionOutput>('runCommand', {
        actionId,
        context,
      });

      return response;
    } catch {
      // Fallback local
      switch (actionId) {
        case 'next-question':
          return { reply: '__next__' };
        case 'give-hint':
          return {
            reply: context?.question
              ? `**Dica:** Foque em identificar o que esta sendo pedido antes de olhar as alternativas.`
              : 'Sem questao ativa.',
          };
        case 'open-study-plan':
          return { openModal: 'study-plan' };
        case 'toggle-theme':
          return { sideEffect: { type: 'theme', value: 'dark' } };
        default:
          return { reply: 'Comando executado.' };
      }
    }
  },
};
