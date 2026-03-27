from pydantic import BaseModel, Field

class SubjectSchema(BaseModel):
    id: int
    name: str = Field(max_length=254)