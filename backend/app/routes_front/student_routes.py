from fastapi import APIRouter, HTTPException
from app.schemas.student import StudentSchema
from app.schemas.chat import ChatSchema
from app.schemas.prompt import PromptSchema
from app.schemas.question import QuestionSchema

router = APIRouter(prefix="/student", tags=["student"])

#funções de user --------------------------------------------------------
@router.get("/login/")
def login(item: StudentSchema):
    #[chama função de verificar se dados estão corretos e retornar estudante se sim]
    estudante = StudentSchema(name= "fulano", email= "fulano@mail.com")#placeholder
    if not estudante:
        raise HTTPException(status_code=404, detail="Username ou senha incorretos")
    #[função de setar dependency com esse usuário atual]
    return estudante
@router.get("/")
def userinfo():
    #[retornar objeto usuário usando dependency]
    estudante = StudentSchema(name= "fulano", email= "fulano@gmail.com")#retorno placeholder:
    return estudante
@router.post("/")
def register(item: StudentSchema):
    #[chama função de adicionar no banco de dados, retorna True se o username não existe e a senha é válida]
    valido = True #placeholder
    if not valido:
        raise HTTPException(status_code=400, detail="Username já existe ou senha é inválida")
    return {"message": "Usuário registrado com sucesso!"}
@router.put("/")
def updateUserInfo(item: StudentSchema):
    #[chama função para trocar os dados do usuário com mesmo username que o de entrada, retorna se o username existe]
    existe = True #placeholder
    if not existe:
        raise HTTPException(status_code=404, detail="Não existe usuário com esse username")
    return {"message": "Usuário atualizado com sucesso!"}