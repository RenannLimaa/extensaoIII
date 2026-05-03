from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ChatModel(Base):
    __tablename__ = "chat"

    id = Column(Integer, primary_key=True, index=True)
    
    # Define a FK apontando para a tabela 'student' e a coluna 'id'
    id_student = Column(Integer, ForeignKey("student.id"), nullable=False)

    # Opcional: Cria uma relação para acessar o objeto do estudante direto pelo chat
    # Isso permite fazer: meu_chat.student.name
    student = relationship("StudentModel", back_populates="chats")

    chatquestions = relationship("ChatQuestionModel", back_populates="chat")