# app/repositories/topic_repository.py
from app.models.topic_model import TopicModel # A classe da tabela
from sqlalchemy.orm import Session

class TopicRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_subject(self, subject_name: str):
        """Busca assuntos pelo nome."""
        topics = (
            self.session.query(TopicModel)
            .filter(TopicModel.subject.has(name=subject_name))
            .all()
        )
        return topics if topics else None
