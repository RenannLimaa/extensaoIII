from sqlalchemy.orm import Session
from app.models.chat_model import ChatModel
from app.models.chatquestion_model import ChatQuestionModel
from app.models.question_model import QuestionModel
from app.models.prompt_model import PromptModel

class ChatRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, id_student: int):
        """Cria um novo chat para um estudante."""
        new_chat = ChatModel(id_student=id_student)
        self.session.add(new_chat)
        self.session.commit()
        self.session.refresh(new_chat)
        return new_chat

    def get_by_id(self, chat_id: int):
        """Busca um chat específico pelo ID."""
        return self.session.query(ChatModel).filter(ChatModel.id == chat_id).first()

    def get_chats_by_student(self, student_id: int):
        """
        Retorna todos os chats vinculados a um estudante específico.
        É aqui que usamos a Foreign Key que você definiu.
        """
        return self.session.query(ChatModel).filter(ChatModel.id_student == student_id).all()


    """
    def get_questions(self, chat_id: int):
        Retorna todas as questões associadas a um chat
        return (
            self.session.query(QuestionModel)
            .join(ChatQuestionModel, ChatQuestionModel.id_question == QuestionModel.id)
            .filter(ChatQuestionModel.id_chat == chat_id)
            .all()
        )
    """

    def get_questions_with_prompts(self, chat_id: int):
        return (
            self.session.query(QuestionModel, PromptModel)
            .join(ChatQuestionModel, ChatQuestionModel.id_question == QuestionModel.id)
            .outerjoin(PromptModel, PromptModel.id_chatquestion == ChatQuestionModel.id)
            .filter(ChatQuestionModel.id_chat == chat_id)
            .all()
        )