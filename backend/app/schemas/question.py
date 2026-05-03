from pydantic import BaseModel, Field, List
from backend.app.schemas.alternativa import AlternativaSchema

class QuestionSchema(BaseModel):
    id: int
    habilidade: int
    competencia: int
    enunciado: str = Field(max_length=2000)
    image: str = Field(max_length=200)
    alternativas: List[AlternativaSchema]
    dificuldade: int