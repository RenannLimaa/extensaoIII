import asyncio

from app.routes_back.essayDB_routes import getEssayByID
from app.routes_back.themeDB_routes import getThemeById
from app.services.llm_service import LLMService
from app.routes_back.chatmessageDB_routes import getMessagesRelatedToEssay, getMessagesRelatedToQuestion
from app.routes_back.chatDB_routes import getChatByID
from app.routes_back.habilcompDB_routes import getHabilidadeByID
from app.routes_back.questionDB_routes import getQuestionByID
from testes.llm_service.prompts import prompt4 as prompt1, prompt5 as prompt2, prompt6


def getAnswertheQuery(chat_id: int, question_id: int, query: str, chat_status=0) -> str:
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
        question = getQuestionByID(question_id)
        if question:

            # Gerando o enunciado da questão + Alternativas + Resposta correta
            question_text = question.enunciado + "\n" + "\n".join([alternativa.letra + ") " + alternativa.texto for alternativa in question.alternativas])
            question_text = question_text + "\nAlternativa correta: " + str(question.resposta_correta)

            _, history_messages = getMessagesRelatedToQuestion(chat_id, question_id)

            history = [
                ("user" if msg.author == "user" else "assistant", msg.texto)
                for msg in history_messages[-6:]
            ]

        else:
            question_text = "Questão não encontrada"
    else:
        question_text = "Sessão de estudos ENEM — o aluno ainda não abriu uma questão específica."

    if chat_status == 0:
        prompt = prompt1
    elif chat_status == 1:
        prompt = prompt2

    llm_service = LLMService("google", 0, prompt=prompt, history=history)

    async def collect() -> str:
        parts: list[str] = []
        async for token in llm_service.call_agent(
            knowledge_area=knowledge_area,
            question=question_text,
            query=query,
        ):
            if token:
                parts.append(str(token))
        return "".join(parts) if parts else "Não foi possível gerar uma resposta no momento."

    return asyncio.run(collect())

def getAnswertheQueryEssay(chat_id: int, essay_id: int, query: str) -> str:
    """
    Chama a LLM (Gemini via LangChain) e retorna o texto completo da resposta.
    Usado por PUT /chat/prompt/redacao/{chat_id}/{essay_id}/{texto}.
    """
    chat = getChatByID(chat_id)
    if not chat:
        return "Não foi possível encontrar este chat."

    history: list[tuple[str, str]] = []
    theme = "Sessão de redação ENEM — o aluno ainda não abriu um tema específico."
    essay_text = "Sessão de estudos ENEM — o aluno ainda não inseriu uma redação."
    if essay_id:
        essay = getEssayByID(essay_id)
        if essay:
            theme_data = getThemeById(essay.theme)
            theme = theme_data.name if theme_data else "Tema não encontrado"
            essay_text = essay.text

            _, history_messages = getMessagesRelatedToEssay(chat_id, essay_id)

            history = [
                ("user" if msg.author == "user" else "assistant", msg.texto)
                for msg in history_messages[-6:]
            ]

        else:
            theme = "Redação não encontrada"
            essay_text = "Redação não encontrada"

    llm_service = LLMService("google", 0, prompt=prompt6, history=history)

    async def collect() -> str:
        parts: list[str] = []
        async for token in llm_service.call_agent_red(
            theme=theme,
            essay=essay_text,
            query=query,
        ):
            if token:
                parts.append(str(token))
        return "".join(parts) if parts else "Não foi possível gerar uma resposta no momento."

    return asyncio.run(collect())