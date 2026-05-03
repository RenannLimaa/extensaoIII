from app.database import SessionLocal

# Caregando modelos para ter-se a relação entre eles (importante para o SQLAlchemy entender as relações)
from app.models.chat_model import ChatModel
from app.models.student_model import StudentModel
from app.models.topic_model import TopicModel
from app.models.question_model import QuestionModel
from app.models.subject_model import SubjectModel
from app.models.chatquestion_model import ChatQuestionModel
from app.models.prompt_model import PromptModel
from app.models.image_model import ImageModel

import json
