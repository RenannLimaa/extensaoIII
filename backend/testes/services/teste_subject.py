from app.essential_imports import *
from app.services.subject_service import SubjectService
from app.repositories.subject_repository import SubjectRepository

session = SessionLocal()

ise = SubjectService(SubjectRepository(session))


# Buscar Prompt por relação
topics = ise.get_topics_of_subject(1)

if topics:
    topics_str = json.dumps(topics, indent=4, ensure_ascii=False)
    print(topics_str)