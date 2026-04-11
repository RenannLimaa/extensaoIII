from pydantic import BaseModel, Field

class TopicSchema(BaseModel):
    id: int
    name: str = Field(max_length=254)
    id_subject: int