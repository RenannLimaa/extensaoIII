from fastapi import APIRouter, HTTPException
from app.schemas.question import QuestionSchema

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/")
def retrieveQuestionByID(id: int):
    """
        Retorna um QuestionSchema da questão correspondente a um id.
    """
    #pode chamar getQuestionByID em QuestionDB_routes
    questions = {"questions": [QuestionSchema(id=1, text="Quanto é 1+1?", id_subject=1)]} #placeholder
    return questions

#fazer função de puxar questão aleatória, retorna a lista atualizada de ChatMessageSchemas desse chat