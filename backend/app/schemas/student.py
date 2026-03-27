from pydantic import BaseModel, EmailStr, Field

class StudentSchema(BaseModel):
    email: EmailStr = Field(max_length=50)
    name: str = Field(max_length=50)