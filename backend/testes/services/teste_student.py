from app.services.student_service import StudentService
from app.repositories.student_repository import StudentRepository

from app.essential_imports import *

session = SessionLocal()

ss = StudentService(StudentRepository(session))
found = ss.get_all_chats_from_student(1)

found_str = json.dumps(found, indent=4, ensure_ascii=False)

if found:
    print(found_str)