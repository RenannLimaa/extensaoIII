from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PromptModel(Base):
    __tablename__ = "prompt"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False) # Usamos Text para suportar os 1000 caracteres
    id_chatquestion = Column(Integer, ForeignKey("chatquestion.id"), nullable=False)

    # Relação opcional para facilitar buscas
    chat_question = relationship("ChatQuestionModel")