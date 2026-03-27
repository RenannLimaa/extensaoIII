from pydantic import BaseModel

class QuestionSchema(BaseModel):
    id: int
    text: str
    id_subject: int