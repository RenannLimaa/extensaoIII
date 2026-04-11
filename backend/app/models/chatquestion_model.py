from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ChatQuestionModel(Base):
    __tablename__ = "chatquestion"

    id = Column(Integer, primary_key=True, index=True)
    
    # Define a FK apontando para a tabela 'chat' e a coluna 'id'
    id_chat = Column(Integer, ForeignKey("chat.id"), nullable=False)

    # Define a FK apontando para a tabela 'question' e a coluna 'id'
    id_question = Column(Integer, ForeignKey("question.id"), nullable=False)

    # Opcional: Cria uma relação para acessar o objeto do estudante direto pelo chat
    # Isso permite fazer: meu_chat.student.name
    chat = relationship("ChatModel", back_populates="chatquestions")
    question = relationship("QuestionModel", back_populates="chatquestions")