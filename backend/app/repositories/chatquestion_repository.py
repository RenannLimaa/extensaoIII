from sqlalchemy.orm import Session
from app.models.chatquestion_model import ChatQuestionModel

class ChatQuestionRepository:
    def __init__(self, session: Session):
        self.session = session

    def add_question_to_chat(self, id_chat: int, id_question: int):
        """Vincula uma questão a um chat específico."""
        new_relation = ChatQuestionModel(
            id_chat=id_chat,
            id_question=id_question
        )
        self.session.add(new_relation)
        self.session.commit()
        self.session.refresh(new_relation)
        return new_relation

    def get_questions_by_chat(self, id_chat: int):
        """Retorna todas as relações de questões de um chat."""
        return self.session.query(ChatQuestionModel).filter(
            ChatQuestionModel.id_chat == id_chat
        ).all()

    def get_by_id(self, id: int):
        """Busca uma relação específica pelo ID."""
        return self.session.query(ChatQuestionModel).filter(
            ChatQuestionModel.id == id
        ).first()