from app.services.chatquestion_service import ChatQuestionService
from app.repositories.chatquestion_repository import ChatQuestionRepository
from app.repositories.chat_repository import ChatRepository

from app.essential_imports import *
session = SessionLocal()

cqs = ChatQuestionService(ChatQuestionRepository(session), ChatRepository(session))

questions = cqs.get_all_questions_from_chat(1)
questions_str = json.dumps(questions, indent=4, ensure_ascii=False)

print(questions)
