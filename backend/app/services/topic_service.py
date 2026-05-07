# app/services/topic_service.py

class TopicService:
    def __init__(self, repository):
        self.repository = repository

    def create_topic(self, topic_data: dict):
        # 1. Regra de negócio: Verificar se o tópico existe
        existing_topic = self.repository.get_by_id(topic_data["id"])
        if existing_topic:
            raise ValueError("Este tópico já está cadastrado.")

        return self.repository.save(topic_data)

    def get_topics_by_subject(self, subject: str):
        topics = self.repository.get_by_subject(subject)

        if topics is None:  # Em Python, prefira 'is None' a '== None'
            raise ValueError("Não existem tópicos desse assunto.")

        return topics