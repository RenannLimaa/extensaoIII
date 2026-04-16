import { findBuild, findSubject } from '../catalog';
import { pickQuestion } from '../questionBank';
import type {
  AnswerInput,
  AnswerOutput,
  FreeReplyInput,
  FreeReplyOutput,
  LlmClient,
  NextQuestionInput,
  NextQuestionOutput,
  StartSessionInput,
  StartSessionOutput,
} from './llmClient';

/**
 * Implementacao MOCK do LlmClient.
 * Retorna respostas plausiveis com um pequeno delay para simular latencia.
 *
 * Trocar por OpenAI: criar openAiLlmClient.ts implementando LlmClient e
 * atualizar o export default de ./index.ts.
 */

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const GREETINGS: Record<string, string[]> = {
  estrategista: [
    'Modo Estrategista ativado. Vamos cronometrar.',
    'Aperte o passo. Sua meta: 2 minutos por questao.',
  ],
  teorico: [
    'Vamos com calma. Entender > acertar chute.',
    'Modo Teorico. A cada questao eu te mostro o conceito por tras.',
  ],
  sniper: [
    'Alvo travado nas questoes dificeis. Mira firme.',
    'Modo Sniper. So cairao questoes de alto nivel.',
  ],
};

const NEXT_INTROS = [
  'Proxima questao:',
  'Bora pra proxima:',
  'Mais uma - leia com calma.',
  'Vamos testar outro conceito.',
];

const CORRECT_LINES = [
  'Excelente! Resposta correta.',
  'Mandou bem! Essa estava certa.',
  'Isso! Voce acertou.',
];

const WRONG_LINES = [
  'Quase la. Essa nao e a certa.',
  'Nao foi dessa vez.',
  'Errou, mas sem stress - vamos entender.',
];

function enemFacts(subjectId: string): string {
  const facts: Record<string, string> = {
    matematica: 'Dica: em questoes do ENEM, desenhe o problema sempre que puder. Interpretar o grafico vale mais que decorar formula.',
    linguagens: 'Dica: leia o enunciado por ultimo. As alternativas revelam o foco da pergunta.',
    natureza: 'Dica: ENEM cobra contexto (meio ambiente, saude, tecnologia). Sempre conecte o conceito a um cenario real.',
    humanas: 'Dica: atencao a cronologia. O ENEM adora questoes que pedem relacao causa-consequencia.',
    redacao: 'Dica: o repertorio sociocultural precisa ser legitimo (dados, leis, obras) e pertinente ao tema.',
  };
  return facts[subjectId] ?? 'Dica: pratica deliberada > volume. Revise seus erros.';
}

export const mockLlmClient: LlmClient = {
  async startSession({ subjectId, build }: StartSessionInput): Promise<StartSessionOutput> {
    await delay(350);
    const subject = findSubject(subjectId);
    const buildMeta = build ? findBuild(build) : undefined;

    const firstQuestion = pickQuestion({
      subjectId,
      build,
      alreadyAskedIds: [],
    });

    if (!firstQuestion) {
      throw new Error(`Nao ha questoes mockadas para a disciplina ${subjectId}`);
    }

    const greeting = [
      `Oi! Sou seu tutor de ${subject?.title ?? 'ENEM'}.`,
      buildMeta ? pickOne(GREETINGS[buildMeta.id] ?? []) : '',
      buildMeta?.systemPitch ?? '',
      enemFacts(subjectId),
      'Comece respondendo:',
    ]
      .filter(Boolean)
      .join(' ');

    return { greeting, firstQuestion };
  },

  async answerQuestion({ question, chosen, build }: AnswerInput): Promise<AnswerOutput> {
    await delay(450);
    const alt = question.alternativas.find((a) => a.letra === chosen);
    const correta = Boolean(alt?.correta);
    const line = correta ? pickOne(CORRECT_LINES) : pickOne(WRONG_LINES);
    const altFeedback = alt?.feedback ? ` ${alt.feedback}` : '';
    const closing = build === 'teorico'
      ? ` ${question.explicacao}`
      : correta
        ? ' Vamos manter o ritmo.'
        : ' Da uma lida na explicacao abaixo e seguimos.';
    return {
      correta,
      feedback: `${line}${altFeedback}${closing}`,
      explicacao: question.explicacao,
    };
  },

  async nextQuestion({ subjectId, build, alreadyAskedIds }: NextQuestionInput): Promise<NextQuestionOutput> {
    await delay(300);
    const q = pickQuestion({ subjectId, build, alreadyAskedIds });
    if (!q) {
      return {
        intro:
          'Voce ja respondeu todas as questoes disponiveis desta materia no prototipo. Quando a IA estiver plugada vou gerar novas na hora.',
        question: null,
      };
    }
    return {
      intro: pickOne(NEXT_INTROS),
      question: q,
    };
  },

  async freeReply({ userMessage, subjectId, build, lastQuestion }: FreeReplyInput): Promise<FreeReplyOutput> {
    await delay(400);
    const lower = userMessage.toLowerCase();

    if (/(dica|ajuda|nao entendi|como|porque|por que)/.test(lower) && lastQuestion) {
      return {
        reply: `Olha so - o ponto-chave dessa questao e: ${lastQuestion.explicacao} Se quiser, digite "proxima" para continuar.`,
      };
    }

    if (/(proxim|seguir|vamos|next)/.test(lower)) {
      return { reply: 'Beleza, vou te mandar a proxima.' };
    }

    if (/(parar|pausa|depois)/.test(lower)) {
      return { reply: 'Sem problema. Volte quando quiser - seu progresso fica salvo.' };
    }

    const buildMeta = build ? findBuild(build) : undefined;
    return {
      reply: `Entendi. ${enemFacts(subjectId)} ${buildMeta ? `(Modo ${buildMeta.title})` : ''} Quando quiser seguir, diga "proxima".`,
    };
  },
};
