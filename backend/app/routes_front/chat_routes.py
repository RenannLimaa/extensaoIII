from fastapi import APIRouter, HTTPException
from app.schemas.student import StudentSchema
from app.schemas.chat import ChatSchema
from app.schemas.prompt import PromptSchema
from app.schemas.question import QuestionSchema

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/}")
def retrieveAllChats():
    # [chama função que retorna a lista de chat_id's do user ativo]
    chats = {"chats": [{"id": 1}]}  # placeholder
    return chats
@router.get("/{chat_id}")
def retrieveChat(chat_id: int):
    #[chama função que verifica se o chat com esse id existe para o usuário]
    chats = {"chats": [{"id":chat_id}]} #placeholder
    if not chats:
        raise HTTPException(status_code=404, detail="O usuário não possui chat com esse id")
    return chats
@router.post("/}")
def createChat(item: ChatSchema):
    #[chama função que registra chat]
    return item
@router.delete("/{chat_id}")
def deleteChat(chat_id: int):
    #[chama função que remove o chat do banco de dados, retorna True se ele foi encontrado e apagado]
    apagado = True #placeholder
    if not apagado:
        raise HTTPException(status_code=404, detail="Nenhum chat com esse id foi achado")
    return {"message":f"Chat {chat_id} apagado com sucesso"}

@router.put("/prompt/{chat_id}")
def promptAI(item: PromptSchema, chat_id: int):
    #[chama função que faz prompt de ia no chat com chat_id e user_id do usuário ativo, retornando a resposta]
    resposta = {"text":"Olá!"} #placeholder (como vai ser o formato das respostas?)
    if not resposta:
        raise HTTPException(status_code=500, detail="Algum problema ocorreu ao processar o prompt")
    return resposta