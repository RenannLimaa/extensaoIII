from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class SubjectModel(Base):
    __tablename__ = "subject"

    # id: int -> Chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # name: str -> Campo de texto com limite de 254 caracteres
    name = Column(String(254), nullable=False)

    # Relação: Permite acessar as questões ligadas a este tópico
    # topic.questions -> retornará uma lista de QuestionModel
    topics = relationship("TopicModel", back_populates="subject")