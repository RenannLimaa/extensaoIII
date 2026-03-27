from pydantic import BaseModel, Field

class QuestionSchema(BaseModel):
    id: int
    text: str = Field(max_length=1000)
    id_subject: int