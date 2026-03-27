from pydantic import BaseModel

class PromptSchema(BaseModel):
    id: int
    text: str
    id_chatquestion: int