from pydantic import BaseModel
from typing import List
from app.schemas.alternativa import AlternativaSchema
from typing import Optional

class QuestionSchema(BaseModel):
    id: int
    habilidade: int
    competencia: int
    # Sem teto de tamanho: enunciados estilo ENEM (com textos de apoio) passam de 2000 chars.
    enunciado: str
    alternativas: List[AlternativaSchema]
    resposta_correta: str
    image: Optional[str] = None
    dificuldade: int