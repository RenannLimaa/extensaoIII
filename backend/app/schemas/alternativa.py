from pydantic import BaseModel, Field

class AlternativaSchema(BaseModel):
    letra: str = Field(max_length=1)
    text: str = Field(max_length=500)