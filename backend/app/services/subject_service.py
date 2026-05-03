# app/services/subject_service.py

class SubjectService:
    def __init__(self, repository):
        self.repository = repository

    def get_topics_of_subject(self, subject_id: int):
        topics = self.repository.get_topics_by_subject_id(subject_id)

        if topics is None:  # Em Python, prefira 'is None' a '== None'
            raise ValueError("Não existem tópicos desse assunto.")

        topics_dict_list = [
            {
                "id": topic.id,
                "name": topic.name
            }

            for topic in topics
        ]

        return topics_dict_list