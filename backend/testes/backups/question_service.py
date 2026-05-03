# app/services/question_service.py

class QuestionService:
    def __init__(self, repository):
        self.repository = repository

    def create_question(self, question_data: dict):
        # 1. Regra de negócio: Verificar se a questão existe
        existing_question = self.repository.get_by_id(question_data["id"])
        if existing_question:
            raise ValueError("Esta questão já está cadastrada.")

        return self.repository.save(question_data)

    def get_questions_by_topic(self, topic: str):
        questions = self.repository.get_by_topic(topic)

        if questions is None:  # Em Python, prefira 'is None' a '== None'
            raise ValueError("Não existem questões desse tópico.")

        return questions