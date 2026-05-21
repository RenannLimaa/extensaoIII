from fastapi import APIRouter, HTTPException
from app.schemas.question import QuestionSchema
from app.schemas.alternativa import AlternativaSchema
from app.schemas.chatmessage import ChatMessageSchema
from app.routes_back.questionDB_routes import getQuestionByID
import random
from app.routes_back.chatmessageDB_routes import createChatMessage
from app.routes_back.chatmessageDB_routes import getChatsMessagesByChat

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/{id}")
def retrieveQuestionByID(id: int):
    """
        Retorna um QuestionSchema da questão correspondente a um id.

        Ex de uso: GET http://127.0.0.1:8000/chat/questions/3
    """
    questions = getQuestionByID(id)
    if not questions:
        raise HTTPException(status_code=500, detail="Não existe questão com esse id")
    return questions

@router.get("/random/{chat_id}")
def randomQuestion(chat_id: int):
    """
        Faz o bot "mandar uma mensagem" contendo uma questão nova aleatória, dado o id do chat. Retorna uma lista de ChatMessagesSchemas da conversa inteira.

        Ex de uso: GET http://127.0.0.1:8000/questions/random/5

        Retorno: {"mensagens": [ChatMessageSchema1, ChatMessageSchema2, ...]}
    """
    id_aleatorio = random.randint(1, 7)
    question = getQuestionByID(id_aleatorio)
    if not question:
        raise HTTPException(status_code=500, detail="Algum problema ocorreu ao escolher a questão")
    question_text = question.enunciado + "\n"
    for alt in question.alternativas:
        question_text += "\n" + str(alt.letra) + ") " + str(alt.texto)
    createChatMessage(chat_id, "llm", question_text, id_aleatorio)
    chat_messages = getChatsMessagesByChat(chat_id)
    return chat_messages