from pydantic import BaseModel, Field
from typing import List
from app.schemas.alternativa import AlternativaSchema
from typing import Optional

class QuestionSchema(BaseModel):
    id: int
    habilidade: int
    competencia: int
    enunciado: str = Field(max_length=2000)
    image: str = Optional[str]
    alternativas: List[AlternativaSchema]
    dificuldade: int