from pydantic import BaseModel, EmailStr, Field

class StudentSchema(BaseModel):
    name: str = Field(max_length=255)
    email: EmailStr = Field(max_length=254)
    
    # Mínimo de 8 para segurança, máximo de 72 para o bcrypt
    password: str = Field(min_length=8, max_length=72)