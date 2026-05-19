/**
 * API Route para chat com LLM (OpenAI)
 * Baseado na arquitetura do Iracema (PHC) - chatbot.php
 *
 * POST /api/chat
 * Body: { action, payload }
 *
 * Actions:
 * - startSession: inicia sessao com saudacao + primeira questao
 * - answerQuestion: avalia resposta e gera feedback
 * - nextQuestion: pede proxima questao
 * - freeReply: resposta livre a mensagem do usuario
 * - highlight: acao sobre texto selecionado
 * - studyPlan: gera plano de estudos
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const MODEL_FALLBACK = process.env.OPENAI_MODEL_FALLBACK || 'gpt-5-nano';

// System prompt do ENEMBot - tutor de ENEM gamificado
const SYSTEM_PROMPT = `[IDENTIDADE]
Voce e o ENEMBot, tutor virtual de preparacao para o ENEM. Seu objetivo e ajudar estudantes a dominar o conteudo de forma engajante e eficiente.

[VOZ E TOM]
- Direto, motivador, sem ser condescendente
- Use **negrito** para destacar conceitos-chave, numeros, formulas
- Seja conciso: explique o necessario, nao mais
- Quando errar, nao desmotive: "Quase! O pulo do gato e..."
- Use analogias do cotidiano quando apropriado
- NUNCA use emojis em excesso (max 1-2 por mensagem se relevante)

[CALIBRACAO POR BUILD]
- **estrategista**: Foco em velocidade. Feedback rapido. "2 minutos por questao. Go."
- **teorico**: Explica conceito ANTES e DEPOIS. Detalha raciocinio completo.
- **sniper**: So questoes dificeis. Feedback cirurgico. "Essa era pegadinha classica."

[FORMATO DE RESPOSTA]
Sempre responda como JSON valido:
{
  "reply": "texto markdown da resposta",
  "suggestions": [
    {"id": "unique", "action": "next|easier|harder|similar|summary|explain-simple|flashcards|hint", "label": "Texto do botao", "icon": "emoji opcional"}
  ]
}

[SUGESTOES]
Gere SEMPRE 3-4 sugestoes contextuais:
- Apos acerto: "Aumentar dificuldade", "Proxima", "Questao parecida"
- Apos erro: "Questao mais facil", "Resumo do topico", "Explicar simples"
- Em duvida: "Dica sem entregar", "Explicar passo a passo"

[REGRAS INVIOLAVEIS]
1. NUNCA invente questoes - use apenas as fornecidas
2. NUNCA diga a resposta antes do aluno tentar
3. NUNCA seja prolixo - estudante tem tempo limitado
4. NUNCA use linguagem academica rebuscada
5. SEMPRE termine com acao clara (botoes ou pergunta)

[DISCIPLINAS ENEM]
- matematica: Interpretacao + calculo. 70% e ler direito.
- linguagens: Texto e contexto. Alternativas antes do enunciado.
- natureza: Fisica/Quimica/Bio. Formulas + aplicacao pratica.
- humanas: Historia/Geo/Socio/Filo. Cronologia e causa-consequencia.
- redacao: Estrutura + repertorio + proposta de intervencao.`;

type ChatAction =
  | 'startSession'
  | 'answerQuestion'
  | 'nextQuestion'
  | 'freeReply'
  | 'highlight'
  | 'studyPlan'
  | 'sessionInsights'
  | 'runCommand';

interface ChatRequest {
  action: ChatAction;
  payload: Record<string, unknown>;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Rate limiting simples (em producao usar Redis/KV)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests por hora
const RATE_WINDOW = 3600000; // 1 hora em ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

async function callOpenAIWithModel(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string,
  maxTokens = 2000
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`OpenAI API error (${model}):`, error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? '{}';
}

async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 2000
): Promise<string> {
  if (!OPENAI_API_KEY) {
    // Fallback para mock quando nao tem API key
    return JSON.stringify({
      reply: "**API key nao configurada.** O chatbot esta em modo de demonstracao. Configure `OPENAI_API_KEY` no `.env.local` para ativar a IA real.",
      suggestions: [
        { id: 's1', action: 'next', label: 'Continuar demo', icon: '→' }
      ]
    });
  }

  // Tenta modelo principal (gpt-5-mini), fallback para gpt-5-nano
  try {
    return await callOpenAIWithModel(messages, MODEL, maxTokens);
  } catch (error) {
    console.warn(`Modelo ${MODEL} falhou, tentando fallback ${MODEL_FALLBACK}...`);
    try {
      return await callOpenAIWithModel(messages, MODEL_FALLBACK, maxTokens);
    } catch (fallbackError) {
      console.error('Ambos modelos falharam:', fallbackError);
      throw fallbackError;
    }
  }
}

function buildPromptForAction(action: ChatAction, payload: Record<string, unknown>): string {
  switch (action) {
    case 'startSession': {
      const { subjectId, build } = payload;
      return `Inicie uma sessao de estudos de ${subjectId} no modo ${build || 'teorico'}.

Retorne JSON:
{
  "greeting": "saudacao curta e motivadora (max 2 paragrafos)",
  "buildTip": "dica especifica do modo de estudo escolhido"
}

Inclua:
1. Saudacao personalizada para a disciplina
2. Uma dica pratica de estudo para essa materia no ENEM
3. Mencionando o modo de estudo se informado`;
    }

    case 'answerQuestion': {
      const { question, chosen, build } = payload;
      const q = question as { enunciado: string; alternativas: Array<{ letra: string; texto: string; correta: boolean }>; explicacao: string; assunto: string };
      const correct = q.alternativas.find(a => a.correta);
      const isCorrect = q.alternativas.find(a => a.letra === chosen)?.correta;

      return `O aluno respondeu uma questao no modo ${build || 'teorico'}.

QUESTAO:
${q.enunciado}

ALTERNATIVAS:
${q.alternativas.map(a => `${a.letra}) ${a.texto}`).join('\n')}

RESPOSTA DO ALUNO: ${chosen}
RESPOSTA CORRETA: ${correct?.letra}
ACERTOU: ${isCorrect ? 'SIM' : 'NAO'}
ASSUNTO: ${q.assunto}

Retorne JSON:
{
  "reply": "feedback completo em markdown (negrito nos pontos-chave)",
  "correta": ${isCorrect},
  "explicacao": "${q.explicacao}",
  "suggestions": [array de 3-4 sugestoes contextuais]
}

${isCorrect
  ? 'Parabenize brevemente e reforce o conceito. Sugira aumentar dificuldade ou proxima questao.'
  : `Explique por que ${chosen} esta errada e por que ${correct?.letra} esta certa. Modo ${build}: ${build === 'teorico' ? 'detalhe o raciocinio completo' : 'seja direto e pratico'}.`
}`;
    }

    case 'nextQuestion': {
      const { subjectId, build, adaptiveHint } = payload;
      return `Prepare uma introducao para a proxima questao de ${subjectId}.

Modo: ${build || 'teorico'}
Dificuldade sugerida: ${adaptiveHint || 'auto'}

Retorne JSON:
{
  "reply": "frase curta de transicao (max 1-2 linhas)",
  "suggestions": []
}

Exemplos bons:
- "Proxima questao. Leia com atencao os dados numericos."
- "Bora pra mais uma. Essa exige interpretacao de grafico."
- "Seguinte:"`;
    }

    case 'freeReply': {
      const { userMessage, subjectId, build, lastQuestion } = payload;
      const q = lastQuestion as { enunciado?: string; assunto?: string; explicacao?: string } | undefined;

      return `O aluno enviou uma mensagem livre durante a sessao de ${subjectId} (modo ${build || 'teorico'}).

MENSAGEM DO ALUNO: "${userMessage}"

${q ? `QUESTAO ATUAL:
${q.enunciado}
Assunto: ${q.assunto}
` : 'Nenhuma questao ativa no momento.'}

Retorne JSON:
{
  "reply": "resposta util em markdown",
  "suggestions": [array de 2-3 sugestoes de proximos passos]
}

Se pedir dica: de uma dica SEM revelar a resposta.
Se pedir explicacao: explique o conceito de forma clara.
Se for saudacao/despedida: responda brevemente e sugira proximo passo.
Se nao entender: peca clarificacao de forma amigavel.`;
    }

    case 'highlight': {
      const { selectedText, action: highlightAction, subjectId } = payload;
      return `O aluno selecionou um trecho de texto e pediu: ${highlightAction}

TEXTO SELECIONADO: "${selectedText}"
DISCIPLINA: ${subjectId}

Retorne JSON:
{
  "title": "titulo curto da explicacao",
  "body": "explicacao em markdown"
}

Acoes:
- explicar: explique o trecho de forma clara
- aprofundar: va alem, conecte com outros conceitos
- gerar-questao: descreva como seria uma questao sobre isso
- traduzir: reescreva em linguagem mais simples`;
    }

    case 'studyPlan': {
      const { goal, minutesPerDay, days } = payload;
      return `Crie um plano de estudos para ENEM.

OBJETIVO DO ALUNO: "${goal}"
TEMPO DISPONIVEL: ${minutesPerDay || 60} minutos por dia
DIAS: ${days || 7}

Retorne JSON:
{
  "title": "titulo do plano",
  "overview": "resumo do plano em 2-3 frases",
  "week": [
    {
      "day": "Seg/Ter/Qua/Qui/Sex/Sab/Dom",
      "subjectId": "matematica|linguagens|natureza|humanas|redacao",
      "topic": "topico especifico",
      "minutes": numero,
      "goal": "objetivo do dia"
    }
  ]
}

Distribua as materias de forma equilibrada. Deixe domingo para revisao/redacao.`;
    }

    case 'sessionInsights': {
      const { subjectId, stats } = payload;
      const s = stats as { answered: number; correct: number; streak?: number };
      const accuracy = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;

      return `Analise a sessao de estudos de ${subjectId}.

ESTATISTICAS:
- Questoes respondidas: ${s.answered}
- Acertos: ${s.correct}
- Taxa de acerto: ${accuracy}%
- Sequencia atual: ${s.streak || 0}

Retorne JSON:
{
  "accuracy": ${accuracy},
  "streak": ${s.streak || 0},
  "timeMinutes": ${Math.max(5, s.answered * 2)},
  "strongTopics": [{"topic": "nome", "accuracy": numero}],
  "weakTopics": [{"topic": "nome", "accuracy": numero}],
  "nextAction": {
    "type": "review|new-topic|challenge",
    "label": "texto do botao",
    "detail": "explicacao curta"
  }
}

Baseie a recomendacao na taxa de acerto:
- >70%: sugira aumentar dificuldade
- 40-70%: sugira revisar pontos fracos
- <40%: sugira mudar abordagem (modo teorico)`;
    }

    case 'runCommand': {
      const { actionId, context } = payload;
      const ctx = context as { subjectId?: string; question?: { assunto?: string; explicacao?: string } } | undefined;

      return `Execute o comando: ${actionId}

Contexto:
- Disciplina: ${ctx?.subjectId || 'nao especificada'}
- Questao ativa: ${ctx?.question ? 'sim' : 'nao'}
${ctx?.question ? `- Assunto: ${ctx.question.assunto}` : ''}

Retorne JSON apropriado para o comando:
{
  "reply": "resposta se aplicavel",
  "openModal": "study-plan|flashcards|exam-sim se aplicavel",
  "sideEffect": {"type": "theme|build", "value": "..."} se aplicavel
}`;
    }

    default:
      return 'Acao nao reconhecida. Retorne {"reply": "Comando invalido", "suggestions": []}';
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body: ChatRequest = await request.json();
    const { action, payload, history = [] } = body;

    // Montar mensagens para OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Adicionar historico (limitado a ultimas 10 mensagens)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Adicionar prompt especifico da acao
    const prompt = buildPromptForAction(action, payload);
    messages.push({ role: 'user', content: prompt });

    // Chamar OpenAI
    const responseText = await callOpenAI(messages);

    // Parse JSON da resposta
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse OpenAI response:', responseText);
      result = { reply: responseText, suggestions: [] };
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        reply: 'Ops, algo deu errado. Tente novamente.',
        suggestions: [{ id: 'retry', action: 'next', label: 'Tentar novamente', icon: '🔄' }]
      },
      { status: 500 }
    );
  }
}
