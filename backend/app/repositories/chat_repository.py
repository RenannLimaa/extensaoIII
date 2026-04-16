from sqlalchemy.orm import Session
from app.models.chat_model import ChatModel

class ChatRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, id_student: int):
        """Cria um novo chat para um estudante."""
        new_chat = ChatModel(id_student=id_student)
        self.session.add(new_chat)
        self.session.commit()
        self.session.refresh(new_chat)
        return new_chat

    def get_by_id(self, chat_id: int):
        """Busca um chat específico pelo ID."""
        return self.session.query(ChatModel).filter(ChatModel.id == chat_id).first()

    def get_chats_by_student(self, student_id: int):
        """
        Retorna todos os chats vinculados a um estudante específico.
        É aqui que usamos a Foreign Key que você definiu.
        """
        return self.session.query(ChatModel).filter(ChatModel.id_student == student_id).all()