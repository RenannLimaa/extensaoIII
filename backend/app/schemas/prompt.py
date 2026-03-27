from pydantic import BaseModel, Field

class PromptSchema(BaseModel):
    id: int
    text: str = Field(max_length=1000)
    id_chatquestion: int