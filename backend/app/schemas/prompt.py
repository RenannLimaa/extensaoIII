from pydantic import BaseModel, ConfigDict, Field

class PromptSchema(BaseModel):
    id: int
    text: str = Field(max_length=1000)
    id_chatquestion: int

    model_config = ConfigDict(from_attributes=True)