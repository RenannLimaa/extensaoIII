from app.repositories.chatquestion_repository import ChatQuestionRepository
from app.schemas.chatquestion import ChatQuestionSchema

# Apagar? entidade não existe no bd

class ChatQuestionService:
    def __init__(self, chat_question_repo: ChatQuestionRepository, chat_repo=None, question_repo=None):
        self.repo = chat_question_repo
        self.chat_repo = chat_repo
        self.question_repo = question_repo

    """
    def add_question_to_chat(self, id_chat: int, id_question: int):
        """
        Vincula uma questão ao chat após validar se ambos existem.
        """
        # 1. Validação de Existência (Opcional, mas recomendado)
        if self.chat_repo and not self.chat_repo.get_by_id(id_chat):
            raise ValueError(f"Chat com ID {id_chat} não encontrado.")
            
        if self.question_repo and not self.question_repo.get_by_id(id_question):
            raise ValueError(f"Questão com ID {id_question} não encontrada.")

        # 2. Persistência no Banco
        new_relation_model = self.repo.add_question_to_chat(id_chat, id_question)

        # 3. Conversão para Schema (Pydantic)
        # IMPORTANTE: Garanta que o ChatQuestionSchema tenha 'from_attributes = True'
        return ChatQuestionSchema.model_validate(new_relation_model)

    
    def get_all_questions_from_chat(self, id_chat: int):
        """
        Retorna a lista de todas as questões vinculadas a um chat.
        """
        relations = self.repo.get_questions_by_chat(id_chat)
        
        chat_questions = [
            {
                "id": chatquestion.id,
                "id_chat": chatquestion.id_chat,
                "id_question": chatquestion.id_question,
            } for chatquestion in relations
        ]

        # Converte a lista de models para uma lista de objetos do Schema
        return chat_questions
    """