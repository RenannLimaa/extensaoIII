from testes.backups.llm_service import LLMService
from testes.llm_service.prompts import prompt1, prompt2, prompt3
from app.routes_back.chatmessageDB_routes import getMessagesRelatedToQuestion


def getAnswertheQuery(chat_id: int, question_id: int, knowledge_area, query, chat_status = 0):
    """
        Dado um chat, uma questão, uma área de conhecimento e uma query, retorna a resposta da LLM
        considerando a questão, o histórico de mensagens relacionados à questão e a consulta do usuário.

        Observação: O prompt a ser utilizado deverá depender se o usuário já respondeu ou não a questão.
        prompt1 se sim, prompt2 se não
    """

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
        return "".join(parts) if parts else "Não foi possível gerar uma resposta no momento."


    if chat_status == 0: 
        prompt = prompt1
    elif chat_status == 1:
        prompt = prompt2

    llm_service = LLMService(
        'google',
        0,
        prompt=prompt,
        history=history
    )

    call_dict = {
        'knowledge_area': knowledge_area,
        'question': question_text,
        'query': query
    }

    return llm_service.call_agent(**call_dict)
