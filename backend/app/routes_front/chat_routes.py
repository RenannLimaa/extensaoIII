from fastapi import APIRouter, HTTPException, Body
from app.schemas.user import UserSchema
from app.schemas.chat import ChatSchema
from app.schemas.chat import ChatMessageSchema

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/}")
def retrieveAllChats():
    """
        Chama função que retorna a lista de todos os ChatSchemas do user ativo no formato {"chats": [ChatSchema1, ChatSchema2, ...]}.
    """
    #chama getChatsByUser em chatDB_routes, usando o user_id ativo como argumento
    chats = {"chats": [ChatSchema(id=1, user_id=1, habilidade=1, chat_name="revisão1", criado_em="12-01-2026", atualizado_em="12-01-2026")]}  # placeholder
    return chats

@router.post("/{habilidade_id}}")
def createChat(habilidade_id: int, item: str = Body()):
    f"""
        Chama função que registra chat, dado habilidade e nome do chat. Retorna ChatSchema completo caso tenha sucesso.

        Ex: POST http://127.0.0.1:8000/chat/2 (o nome é passada em json, como {"nome do chat"}
        
        Retorno: {ChatSchema}
    """
    #usa user_id ativo e pode chamar a função createChat em chatDB_routes diretamente eu acho, nem precisa de service
    return {ChatSchema(id=1, user_id=1, habilidade=1, chat_name="revisão1")} #placeholder

@router.post("/{chat_id}")
def updateChatName(chat_id: int, chat_name: str = Body()):
    """
        Chama função que atualiza nome do chat, dado o id dele e o nome novo. Retorna ChatSchema completo caso tenha sucesso.

        Ex: POST http://127.0.0.1:8000/chat/4 (o nome é passada em json, como {"nome novo!"}

        Retorno: {ChatSchema}
    """
    #usa user_id ativo para conseguir seus chats, procura aquele com o chat_id certo, recupera o ChatSchema completo dele, muda o nome e atualiza no db
    return {ChatSchema(id=1, user_id=1, habilidade=1, chat_name="revisão2")} #placeholder

@router.delete("/{chat_id}")
def deleteChat(chat_id: int):
    """
        Chama função que remove o chat do banco de dados, retorna mensagem de sucesso caso tenha sido apagado.

        Ex: DELETE http://127.0.0.1:8000/chat/5

        Retorno: {"message":"Chat 2 apagado com sucesso"}
    """
    apagado = True #placeholder
    if not apagado:
        raise HTTPException(status_code=404, detail="Nenhum chat com esse id foi achado")
    return {"message":f"Chat {chat_id} apagado com sucesso"}

@router.put("/prompt/{chat_id}")
def promptAI( chat_id: int, item: str = Body()):
    """
        Chama função que manda prompt no chat, requer texto da mensagem e o id do chat. Retorna a lista atualizada de ChatMessageSchemas desse chat caso tenha sucesso.

        Ex: PUT http://127.0.0.1:8000/chat/prompt/4 (a mensagem é passada em json, como {"olá isso é um texto!"}

        Retorno: {"mensagens": [ChatMessageSchema1, ChatMessageSchema2, ...]}
    """
    chat_messages = {"mensagens": [ChatMessageSchema(id=1, chat_id=1, author="llm", texto="Resolva isso:", timestamp="tempo", question_id=1), ChatMessageSchema(id=2, chat_id=1, author="user", texto="O que significa monocotiledônea?", timestamp="tempo2")]} #placeholder
    if not chat_messages:
        raise HTTPException(status_code=500, detail="Algum problema ocorreu ao processar o prompt")
    return chat_messages