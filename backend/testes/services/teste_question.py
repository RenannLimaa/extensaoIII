from app.services.question_service import QuestionService


from app.repositories.question_repository import QuestionRepository
from app.essential_imports import *

from sqlalchemy.inspection import inspect

session = SessionLocal()

ise = QuestionService(QuestionRepository(session))


# Adicionar Prompt

"""
created = ps.create_prompt({
    "text": "Qual o adjetivo?",
    "id_chatquestion": 1
})

print(created.text)
"""

# Buscar Prompt por relação
results = ise.get_all_topic_questions(1)

if results:
    full_question = ise.get_question_with_images(results[0])
    
    print(model_to_dict(full_question))
    """
    if full_question:
        full_question_str = json.dumps(full_question, indent=4, ensure_ascii=False)
        print(full_question_str)
    """