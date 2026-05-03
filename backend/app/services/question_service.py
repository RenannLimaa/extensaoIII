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

    def get_question_with_images(self, question_id: int):
        question_model = self.repository.get_by_id_with_images(question_id)

        if not question_model:
            return None

        question = {
            "id": question_model.id,
            "text": question_model.text,
            "topic": question_model.topic.name,
            "imgs": [
                {
                    "id": image.id,
                    "description": image.description,
                    "path": image.path,
                } for image in question_model.images 
            ]
        }

        return question

    def get_all_topic_questions(self, topic_id: int):
        return self.repository.get_ids_by_topic_id(topic_id)