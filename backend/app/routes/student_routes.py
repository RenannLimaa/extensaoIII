from fastapi import APIRouter, HTTPException
from app.schemas.student import StudentSchema
from app.schemas.chat import ChatSchema
from app.schemas.prompt import PromptSchema
from app.schemas.question import QuestionSchema

router = APIRouter()

#funções de user --------------------------------------------------------
@router.get("/login/")
def login(item: StudentSchema):
    #[chama função de verificar se dados estão corretos e retornar estudante se sim]
    estudante = StudentSchema(name= "fulano", email= "fulano@mail.com")#placeholder
    if not estudante:
        raise HTTPException(status_code=404, detail="Username ou senha incorretos")
    #[função de setar dependency com esse usuário atual]
    return estudante
@router.get("/student/")
def userinfo():
    #[retornar objeto usuário usando dependency]
    estudante = StudentSchema(name= "fulano", email= "fulano@gmail.com")#retorno placeholder:
    return estudante
@router.post("/student/")
def register(item: StudentSchema):
    #[chama função de adicionar no banco de dados, retorna True se o username não existe e a senha é válida]
    valido = True #placeholder
    if not valido:
        raise HTTPException(status_code=400, detail="Username já existe ou senha é inválida")
    return
@router.put("/student/")
def updateUserInfo(item: StudentSchema):
    #[chama função para trocar os dados do usuário com mesmo username que o de entrada, retorna se o username existe]
    existe = True #placeholder
    if not existe:
        raise HTTPException(status_code=404, detail="Não existe usuário com esse username")
    return

#funções de chat -------------------------------------------------------
@router.get("/chat/}")
def retrieveAllChats():
    # [chama função que retorna a lista de chat_id's do user ativo]
    chats = {"chats": [{"id": 1}]}  # placeholder
    return chats
@router.get("/chat/{chat_id}")
def retrieveChat(chat_id: int):
    #[chama função que verifica se o chat com esse id existe para o usuário]
    chats = {"chats": [{"id":chat_id}]} #placeholder
    if not chats:
        raise HTTPException(status_code=404, detail="O usuário não possui chat com esse id")
    return chats
@router.post("/chat/}")
def createChat(item: ChatSchema):
    #[chama função que registra chat]
    return item
@router.delete("/chat/{chat_id}")
def deleteChat(chat_id: int):
    #[chama função que remove o chat do banco de dados, retorna True se ele foi encontrado e apagado]
    apagado = True #placeholder
    if not apagado:
        raise HTTPException(status_code=404, detail="Nenhum chat com esse id foi achado")
    return

#funções de prompt -------------------------------------------------
@router.put("/chat/{chat_id}")
def promptAI(item: PromptSchema, chat_id: int):
    #[chama função que faz prompt de ia no chat com chat_id e user_id do usuário ativo, retornando a resposta]
    resposta = {"text":"Olá!"} #placeholder (como vai ser o formato das respostas?)
    if not resposta:
        raise HTTPException(status_code=500, detail="Algum problema ocorreu ao processar o prompt")
    return resposta

#funções de questão -----------------------------------------------
@router.get("/questions/")
def retrieveAllQuestions():
    #[chama função que retorna a lista total de questões]
    questions = {"questions": [QuestionSchema(id=1, text="Quanto é 1+1?", id_subject=1)]} #placeholder
    return questions