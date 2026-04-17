from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class TopicModel(Base):
    __tablename__ = "topic"

    # id: int -> Chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # name: str -> Campo de texto com limite de 255 caracteres
    name = Column(String(255), nullable=False)

    # 1. Definimos a ForeignKey apontando para: nome_da_tabela.coluna
    id_subject = Column(Integer, ForeignKey("subject.id"), nullable=False, index=True)


    # Relação: Permite acessar as questões ligadas a este tópico
    # topic.questions -> retornará uma lista de QuestionModel
    
    questions = relationship("QuestionModel", back_populates="topic")
    subject = relationship("SubjectModel", back_populates="topics")