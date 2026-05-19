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
import type { SubjectId } from '../types';

/* =========================================================================
   MOCK client — versão simplificada 2026
   Apenas os métodos essenciais para protótipo funcional.
   ========================================================================= */

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sid(prefix = 's') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Greetings & flavor ---------- */

const GREETINGS: Record<string, string[]> = {
  estrategista: [
    'Modo **Estrategista** ativado. Cada questão tem cronômetro de 2 minutos. Vamos marcar ritmo.',
    'Estrategista no ar. A meta é `tempo por questão < 2min`. Bora afiar.',
  ],
  teorico: [
    'Modo **Teórico**. A gente vai com calma — entender > acertar no chute.',
    'Modo Teórico ativo. A cada questão eu destaco o conceito-chave **antes** e explico com calma no fim.',
  ],
  sniper: [
    'Modo **Sniper** — só questões de alto nível cairão aqui. Errar aqui é onde se aprende.',
    'Sniper travado nas difíceis. Mira firme.',
  ],
};

function subjectGreeting(subjectId: SubjectId): string {
  const subject = findSubject(subjectId);
  const hook: Record<SubjectId, string> = {
    matematica: 'No ENEM, 70% das questões de matemática são de interpretação. Desenhar o problema é seu atalho.',
    linguagens: 'Ler alternativas **antes** do enunciado costuma acelerar 30% o tempo. Teste.',
    natureza: 'ENEM ama contexto: meio ambiente, saúde e tecnologia. Sempre conecte conceito a cenário.',
    humanas: 'Cronologia importa. Causa → consequência é a lente mental para quase toda questão.',
    redacao: 'Repertório precisa ser **legítimo e pertinente**: dados, leis, obras. Decorar frase solta não cola.',
  };
  return `Oi, sou seu tutor de **${subject?.title ?? 'ENEM'}**. ${hook[subjectId]}`;
}

/* ---------- Smart suggestions (simplified) ---------- */

function suggestionsAfterWrong(): SmartSuggestion[] {
  return [
    { id: sid(), action: 'easier', label: 'Quero uma mais fácil' },
    { id: sid(), action: 'hint', label: 'Me dá uma dica' },
    { id: sid(), action: 'next', label: 'Próxima questão' },
  ];
}

function suggestionsAfterCorrect(): SmartSuggestion[] {
  return [
    { id: sid(), action: 'harder', label: 'Aumenta a dificuldade' },
    { id: sid(), action: 'next', label: 'Próxima questão' },
  ];
}

/* ---------- Mock client ---------- */

export const mockLlmClient: LlmClient = {
  async startSession({ subjectId, build }): Promise<StartSessionOutput> {
    await delay(380);
    const buildMeta = build ? findBuild(build) : undefined;

    const firstQuestion = pickQuestion({ subjectId, build, alreadyAskedIds: [] });
    if (!firstQuestion) {
      throw new Error(`Nao ha questoes mockadas para a disciplina ${subjectId}`);
    }

    const greeting = [
      subjectGreeting(subjectId),
      buildMeta ? pickOne(GREETINGS[buildMeta.id] ?? []) : '',
      buildMeta?.systemPitch ?? '',
      '',
      'Quando estiver pronto, escolha uma alternativa abaixo.',
    ]
      .filter(Boolean)
      .join('\n\n');

    return { greeting, firstQuestion };
  },

  async answerQuestion({ question, chosen, build }: AnswerInput): Promise<AnswerOutput> {
    await delay(520);
    const alt = question.alternativas.find((a) => a.letra === chosen);
    const correta = Boolean(alt?.correta);
    const correctLetter = question.alternativas.find((a) => a.correta)?.letra ?? '?';

    if (correta) {
      const body = [
        `**Correto.** Resposta ${chosen} é a certa.`,
        alt?.feedback ? `\n> ${alt.feedback}` : '',
        build === 'teorico' ? `\n\n**Por quê funciona:** ${question.explicacao}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return {
        correta: true,
        feedback: body,
        explicacao: question.explicacao,
        suggestions: suggestionsAfterCorrect(),
      };
    }

    const body = [
      `**Não foi dessa vez.** A resposta correta era **${correctLetter}**.`,
      alt?.feedback ? `\n> ${alt.feedback}` : '',
      `\n**Raciocínio:** ${question.explicacao}`,
    ]
      .filter(Boolean)
      .join('\n');
    return {
      correta: false,
      feedback: body,
      explicacao: question.explicacao,
      suggestions: suggestionsAfterWrong(),
    };
  },

  async nextQuestion({ subjectId, build, alreadyAskedIds, adaptiveHint }: NextQuestionInput): Promise<NextQuestionOutput> {
    await delay(300);
    const effectiveBuild = adaptiveHint === 'facil' ? 'estrategista' : adaptiveHint === 'dificil' ? 'sniper' : build;
    const q = pickQuestion({ subjectId, build: effectiveBuild, alreadyAskedIds });
    if (!q) {
      return {
        intro:
          'Você já respondeu todas as questões disponíveis desta matéria no protótipo. Quando a IA estiver plugada, vou gerar novas na hora.',
        question: null,
      };
    }
    const intros = [
      'Próxima — leia com calma.',
      'Bora pra próxima:',
      'Mais uma, vamos:',
      'Próximo desafio:',
    ];
    return { intro: pickOne(intros), question: q };
  },

  async freeReply({ userMessage, subjectId, build, lastQuestion }: FreeReplyInput): Promise<FreeReplyOutput> {
    await delay(420);
    const lower = userMessage.toLowerCase().trim();
    const buildMeta = build ? findBuild(build) : undefined;

    if (/(dica|hint|ajuda|como resolver|nao entendi)/.test(lower) && lastQuestion) {
      return {
        reply: [
          `**Dica rápida** para esta questão:`,
          ``,
          `- Identifique o que está sendo perguntado antes de olhar as alternativas.`,
          `- Grife os dados numéricos ou palavras-chave.`,
          `- Se tiver fórmula, escreva antes de substituir valores.`,
          ``,
          `> ${lastQuestion.explicacao.split('.')[0]}.`,
        ].join('\n'),
        suggestions: [
          { id: sid(), action: 'next', label: 'Próxima questão' },
        ],
      };
    }

    if (/(explique|explica|aprofund|detalh)/.test(lower) && lastQuestion) {
      return {
        reply: `**Explicação completa:**\n\n${lastQuestion.explicacao}`,
        suggestions: [
          { id: sid(), action: 'next', label: 'Próxima questão' },
        ],
      };
    }

    if (/(parar|pausa|depois|sair)/.test(lower)) {
      return { reply: 'Sem problema. Seu progresso fica salvo. Volte quando quiser.' };
    }

    if (/(oi|ola|hello|e ai)/.test(lower)) {
      return {
        reply: 'Oi! Tô aqui para te ajudar. Quer continuar de onde paramos?',
        suggestions: [
          { id: sid(), action: 'next', label: 'Próxima questão' },
        ],
      };
    }

    return {
      reply: [
        `Em **${findSubject(subjectId)?.title ?? 'ENEM'}**${buildMeta ? ` (modo ${buildMeta.title})` : ''}, posso te ajudar com:`,
        ``,
        `- Dica para a questão atual`,
        `- Explicar o conceito`,
        `- Próxima questão`,
        ``,
        `Ou diga o que está te travando.`,
      ].join('\n'),
      suggestions: [
        { id: sid(), action: 'hint', label: 'Dica' },
        { id: sid(), action: 'next', label: 'Próxima' },
      ],
    };
  },

  async runCommand({ actionId, context }: CommandActionInput): Promise<CommandActionOutput> {
    await delay(260);
    switch (actionId) {
      case 'next-question':
        return { reply: '__next__' };
      case 'give-hint':
        return {
          reply:
            context?.question
              ? [
                  '**Dica sem entregar a resposta:**',
                  '',
                  `Foca em identificar **o que está sendo pedido**. Em "${context.question.assunto}" o erro mais comum é ler a alternativa antes do enunciado.`,
                ].join('\n')
              : 'Sem questão ativa.',
        };
      default:
        return { reply: 'Ação não reconhecida.' };
    }
  },
};
