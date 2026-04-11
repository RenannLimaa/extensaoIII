from sqlalchemy import Column, Integer, String
from app.database import Base 

class QuestionModel(Base):
    __tablename__ = "questions"

    # id: int -> Mapeado como chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=False)
    
    # text: str -> Mapeado como String (ou Text se for muito longo)
    text = Column(String(1000), nullable=False)
    
    # id_subject: int -> Mapeado como inteiro (geralmente uma chave estrangeira)
    id_subject = Column(Integer, nullable=False, index=True)
