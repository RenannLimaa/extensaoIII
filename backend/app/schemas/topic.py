from pydantic import BaseModel, Field

class TopicSchema(BaseModel):
    id: int
    name: str = Field(max_length=255)
    id_subject: int