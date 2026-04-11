# app/repositories/subject_repository.py
from app.models.subject_model import SubjectModel # A classe da tabela
from sqlalchemy.orm import Session

class SubjectRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, subject_id: int):
        return self.session.query(SubjectModel).filter(SubjectModel.id == subject_id).first()
