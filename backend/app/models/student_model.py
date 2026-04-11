from sqlalchemy import Column, Integer, String
from app.database import Base

class StudentModel(Base):
    __tablename__ = "student"

    # id: Chave primária autoincrementada (padrão para usuários)
    id = Column(Integer, primary_key=True, index=True)
    
    # name: Conforme seu Schema (max_length=254)
    name = Column(String(254), nullable=False)
    
    # email: EmailStr no Pydantic, String única e indexada no banco
    email = Column(String(254), unique=True, index=True, nullable=False)
    
    # password: Campo para armazenar o hash da senha
    password = Column(String(254), nullable=False)