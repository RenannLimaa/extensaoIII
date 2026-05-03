# app/repositories/question_repository.py
from app.models.question_model import QuestionModel # A classe da tabela
from sqlalchemy.orm import Session, selectinload

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

    def get_by_topic(self, topic_name: str):
        """Busca questões onde o objeto topic relacionado tem o nome X."""
        questions = (
            self.session.query(QuestionModel)
            .filter(QuestionModel.topic.has(name=topic_name))
            .all()
        )
        return questions if questions else None

    def get_by_id_with_images(self, question_id: int):
        """Busca uma questão com todas as suas imagens."""
        return (
            self.session.query(QuestionModel)
            .options(selectinload(QuestionModel.images))
            .filter(QuestionModel.id == question_id)
            .first()
        )

    def get_ids_by_topic_id(self, topic_id: int):
        """Retorna todos os IDs das questões de um tópico."""
        result = (
            self.session.query(QuestionModel.id)
            .filter(QuestionModel.id_topic == topic_id)
            .all()
        )

        # result vem como [(1,), (2,), (3,)]
        return [row[0] for row in result]

