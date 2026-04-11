from sqlalchemy.orm import Session
from app.models.student_model import StudentModel

class StudentRepository:
    def __init__(self, session: Session):
        # A sessão é injetada para que o repo possa executar comandos SQL
        self.session = session

    def get_by_email(self, email: str):
        """Busca um estudante pelo e-mail para validar duplicidade ou login."""
        return self.session.query(StudentModel).filter(StudentModel.email == email).first()

    def save(self, student_data: dict):
        """Converte o dicionário em Model, salva no banco e retorna o objeto."""
        # 1. Cria a instância do Model com os dados (incluindo o hash da senha)
        new_student = StudentModel(
            name=student_data["name"],
            email=student_data["email"],
            password=student_data["password"]
        )
        
        # 2. Adiciona à sessão e confirma (commit)
        self.session.add(new_student)
        self.session.commit()
        
        # 3. Atualiza o objeto com os dados do banco (como o ID gerado)
        self.session.refresh(new_student)
        
        return new_student

    def get_all(self):
        """Retorna todos os estudantes cadastrados."""
        return self.session.query(StudentModel).all()