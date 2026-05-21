from testes.backups.llm_service import LLMService
from testes.llm_service.prompts import prompt2 as prompt
from app.routes_back.chatmessageDB_routes import getMessagesRelatedToQuestion


def getAnswertheQuery(chat_id: int, question_id: int, knowledge_area, query):
    """
        Dado um chat, uma questão, uma área de conhecimento e uma query, retorna a resposta da LLM
        considerando a questão, o histórico de mensagens relacionados à questão e a consulta do usuário.
    """

    question_message, history_messages = getMessagesRelatedToQuestion(chat_id, question_id)

    question_text = question_message.texto

    history = [
        ("user" if msg.author == "user" else "assistant", msg.texto)
        for msg in history_messages[-6:]  # últimas 6
    ]

    llm_service = LLMService(
        'google',
        0,
#     prompt=prompt,
        history=history
    )

    call_dict = {
        'knowledge_area': knowledge_area,
        'question': question_text,
        'query': query
    }

    return llm_service.call_agent(**call_dict)