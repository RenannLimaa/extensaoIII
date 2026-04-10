# app/services/user_service.py

class StudentService:
    def __init__(self, repository):
        # O service recebe um "repository" para lidar com o banco de dados
        self.repository = repository

    def create_student(self, student_data: dict):
        # 1. Regra de negócio: Verificar se usuário existe
        existing_student = self.repository.get_by_email(student_data["email"])
        if existing_student:
            raise ValueError("Este e-mail já está cadastrado.")

        # 2. Lógica de processamento (ex: hash de senha)
        student_data["password"] = self.hash_password(student_data["password"])

        # 3. Salvar
        return self.repository.save(student_data)

    def hash_password(self, password: str):
        # Simulação de hash
        return f"hashed_{password}"
