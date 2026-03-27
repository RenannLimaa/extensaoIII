from pydantic import BaseModel, EmailStr, Field

class StudentSchema(BaseModel):
    email: EmailStr = Field(max_length=254)
    name: str = Field(max_length=254)