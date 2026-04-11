from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base 

class QuestionModel(Base):
    __tablename__ = "question"

    # id: int -> Mapeado como chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # text: str -> Mapeado como String (ou Text se for muito longo)
    text = Column(String(1000), nullable=False)
    
    # 1. Definimos a ForeignKey apontando para: nome_da_tabela.coluna
    id_topic = Column(Integer, ForeignKey("topic.id"), nullable=False, index=True)

    # 2. Criamos uma relação para facilitar a busca no Python
    # Isso permite fazer: question.topic.name
    topic = relationship("TopicModel", back_populates="questions")