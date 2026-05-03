# app/repositories/subject_repository.py
from app.models.subject_model import SubjectModel # A classe da tabela
from sqlalchemy.orm import Session, selectinload

class SubjectRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, subject_id: int):
        return self.session.query(SubjectModel).filter(SubjectModel.id == subject_id).first()

    def get_topics_by_subject_id(self, subject_id: int):
        subject = (
            self.session.query(SubjectModel)
            .options(selectinload(SubjectModel.topics))
            .filter(SubjectModel.id == subject_id)
            .first()
        )
        
        if not subject:
            return None

        return subject.topics