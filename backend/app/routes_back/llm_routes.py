import asyncio
import re

from app.services.llm_service import LLMService
from app.routes_back.chatmessageDB_routes import getMessagesRelatedToQuestion
from app.routes_back.chatDB_routes import getChatByID
from app.routes_back.habilcompDB_routes import getHabilidadeByID


def _is_hint_request(query: str) -> bool:
    normalized = query.strip().lower()
    return normalized in {'comando: give-hint', 'give-hint', '/dica', 'gerar dica discreta'} or normalized.startswith('comando: give-hint')


def _trim_hint_response(text: str) -> str:
    compact = ' '.join(text.replace('\n', ' ').split())
    sentences = re.split(r'(?<=[.!?])\s+', compact)
    short_text = ' '.join(sentences[:2]).strip()
    return short_text[:260].rstrip(' ,;:-')


def getAnswertheQuery(chat_id: int, question_id: int, query: str) -> str:
    """
    Chama a LLM (Gemini via LangChain) e retorna o texto completo da resposta.
    Usado por PUT /chat/prompt/{chat_id}/{question_id}/{texto}.
    """
    chat = getChatByID(chat_id)
    if not chat:
        return "Não foi possível encontrar este chat."

    knowledge_area = getHabilidadeByID(chat.habilidade) or "ENEM"

    history: list[tuple[str, str]] = []
    if question_id:
        question_message, history_messages = getMessagesRelatedToQuestion(chat_id, question_id)
        if question_message:
            question_text = question_message.texto
            history = [
                ("user" if msg.author == "user" else "assistant", msg.texto)
                for msg in history_messages[-6:]
            ]
        else:
            question_text = "Questão em andamento."
    else:
        question_text = "Sessão de estudos ENEM — o aluno ainda não abriu uma questão específica."

    if _is_hint_request(query):
        hint_prompt = """
    ## # Papel

    Você é um Mentor Socrático que precisa dar apenas uma dica curta e discreta sobre {knowledge_area}.

    ---

    ## # Contexto da Questão

    {question}

    ---

    ## # Regras da Dica

    - Responda em no máximo 2 frases curtas.
    - Não revele gabarito, alternativa correta, resultado final ou passo a passo completo.
    - Não faça perguntas no final.
    - Foque em um único ponto de partida para o raciocínio.
    - Use linguagem simples e direta.
    - Seja realmente discreto: uma pista, não uma explicação.
    """
        llm_service = LLMService("google", 0, prompt=hint_prompt, history=history[-4:])
    else:
        llm_service = LLMService("google", 0, history=history)

    async def collect() -> str:
        parts: list[str] = []
        async for token in llm_service.call_agent(
            knowledge_area=knowledge_area,
            question=question_text,
            query=query,
        ):
            if token:
                parts.append(str(token))
        answer = "".join(parts) if parts else "Não foi possível gerar uma resposta no momento."
        if _is_hint_request(query):
            return _trim_hint_response(answer)
        return answer

    return asyncio.run(collect())
