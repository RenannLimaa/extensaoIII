from fastapi import APIRouter, HTTPException
from app.schemas.student import StudentSchema
from app.schemas.chat import ChatSchema
from app.schemas.prompt import PromptSchema
from app.schemas.question import QuestionSchema

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/")
def retrieveAllQuestions():
    #[chama função que retorna a lista total de questões]
    questions = {"questions": [QuestionSchema(id=1, text="Quanto é 1+1?", id_subject=1)]} #placeholder
    return questions