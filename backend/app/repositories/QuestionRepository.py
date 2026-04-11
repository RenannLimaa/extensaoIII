# app/repositories/question_repository.py
from app.models.QuestionModel import QuestionModel # A classe da tabela
from sqlalchemy.orm import Session

class QuestionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, question_id: int):
        """Busca uma questão específica pelo ID no banco."""
        return self.session.query(QuestionModel).filter(QuestionModel.id == question_id).first()

    def save(self, question_data: dict):
        """Converte o dicionário em um Model e salva no banco."""
        new_question = QuestionModel(**question_data)
        self.session.add(new_question)
        self.session.commit()
        self.session.refresh(new_question)
        return new_question

    def get_by_subject(self, subject: str):
        """Busca todas as questões de um assunto específico."""
        questions = self.session.query(QuestionModel).filter(QuestionModel.subject == subject).all()
        # Se a lista estiver vazia, retornamos None para o Service disparar o erro
        return questions if questions else None
