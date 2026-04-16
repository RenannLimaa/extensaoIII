from app.repositories.chat_repository import ChatRepository
from app.schemas.chat import ChatSchema

class ChatService:
    def __init__(self, chat_repository: ChatRepository, student_repository=None):
        self.repository = chat_repository
        # Opcional: injetamos o repo de estudante para validar se ele existe
        self.student_repo = student_repository

    def start_new_chat(self, id_student: int):
        """Inicia um novo chat garantindo que o estudante é válido."""
        
        # 1. Validação de existência (Regra de Negócio)
        if self.student_repo:
            student = self.student_repo.get_by_id(id_student)
            if not student:
                raise ValueError("Não é possível criar um chat para um estudante inexistente.")

        # 2. Criação via repositório
        new_chat = self.repository.create(id_student)
        
        print(new_chat)
        # 3. Retorna o schema validado
        return ChatSchema.model_validate(new_chat)

    def get_student_history(self, id_student: int):
        """Busca o histórico de chats e formata para o Schema."""
        chats = self.repository.get_chats_by_student(id_student)
        
        # Converte a lista de Modelos para lista de Schemas (Pydantic)
        return [ChatSchema.model_validate(c) for c in chats]

    def get_chat_details(self, chat_id: int):
        """Busca um chat específico."""
        chat = self.repository.get_by_id(chat_id)
        if not chat:
            return None
        return ChatSchema.model_validate(chat)

    def get_questions(self, chat_id: int):
        questions = self.repository.get_questions(chat_id)

        if questions is None:
            raise ValueError("Não há questões para esse chat")
        
        questions_dicts = [
            {
                "id": question.id,
                "text": question.text,
                "topic": question.topic.name
            } for question in questions
        ]

        return questions_dicts

    def get_questions_with_prompts(self, chat_id: int):
        questions_and_prompts = self.repository.get_questions_with_prompts(chat_id)

        if questions_and_prompts is None:
            raise ValueError("Não há questões e prompts para esse chat")
        
        questions_and_prompts_dict = [
            {
                "id": question.id,
                "text": question.text,
                "topic": question.topic.name,
                **(
                    {
                        "prompt_id": prompt.id,
                        "prompt_text": prompt.text
                    }
                    if prompt is not None
                    else {}
                )
            }
            for (question, prompt) in questions_and_prompts
        ]

        return questions_and_prompts_dict