from fastapi import APIRouter, HTTPException
from app.schemas.question import QuestionSchema
from app.schemas.alternativa import AlternativaSchema
from app.schemas.chatmessage import ChatMessageSchema
from app.routes_back.questionDB_routes import getQuestionByID

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

@router.get("/")
def randomQuestion():
    """
        Faz o bot "mandar uma mensagem" contendo uma questão nova aleatória. Retorna uma lista de ChatMessagesSchemas da conversa inteira.

        Ex de uso: GET http://127.0.0.1:8000/questions/

        Retorno: {"mensagens": [ChatMessageSchema1, ChatMessageSchema2, ...]}
    """
    #chama o service para isso
    chat_messages = {"mensagens": [ChatMessageSchema(id=1, chat_id=1, author="llm", texto="Resolva isso:", timestamp="tempo", question_id=1), ChatMessageSchema(id=2, chat_id=1, author="user", texto="O que significa monocotiledônea?", timestamp="tempo2")]} #placeholder
    if not chat_messages:
        raise HTTPException(status_code=500, detail="Algum problema ocorreu ao processar o prompt")
    return chat_messages