from app.services.chat_service import ChatService
from app.repositories.chat_repository import ChatRepository
from app.repositories.student_repository import StudentRepository

from app.essential_imports import *
session = SessionLocal()

# question = QuestionSchema(id=1, text="What is the capital of France?", id_topic=1)
# student = StudentSchema(email="banana@email.com", name="carlos")

# qs = QuestionService(QuestionRepository(session))
# questions = qs.get_questions_by_topic("Probabilidade")


# ts = TopicService(TopicRepository(session))

# topics = ts.get_topics_by_subject("Matemática")
# names = [topic.name for topic in topics]

cs = ChatService(ChatRepository(session), StudentRepository(session))

questions = cs.get_questions_with_prompts(1)
questions_str = json.dumps(questions, indent=4, ensure_ascii=False)

print(questions_str)
#print(ss.login(login1).name)

