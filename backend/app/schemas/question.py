from pydantic import BaseModel, Field
from app.schemas.alternativa import AlternativaSchema
from typing import Optional

class QuestionSchema(BaseModel):
    id: int
    habilidade: int
    competencia: int
    enunciado: str = Field(max_length=2000)
    image: Optional[str] = None
    alternativas: list[AlternativaSchema]
    dificuldade: int