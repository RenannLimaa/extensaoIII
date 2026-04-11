import bcrypt
from app.schemas.student import StudentSchema # Importe seu schema aqui
from app.schemas.login import LoginSchema

class StudentService:
    def __init__(self, repository):
        self.repository = repository

    def hash_password(self, password: str) -> str:
        # Transforma a string em bytes, gera o salt e faz o hash
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        # Retorna como string para salvar no banco de dados
        return hashed.decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        # Transforma ambos em bytes para comparar
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    
    def login(self, login_data: dict):
            # 1. Valida se o formato do e-mail e senha estão ok
            try:
                validated_data = LoginSchema.model_validate(login_data)
            except Exception as e:
                raise ValueError(f"Formato de dados inválido: {str(e)}")

            # 2. Busca o estudante no banco pelo e-mail
            student = self.repository.get_by_email(validated_data.email)
            
            # 3. Verifica se o estudante existe E se a senha bate
            if not student or not self.verify_password(validated_data.password, student.password):
                # Dica de segurança: use uma mensagem genérica para não revelar 
                # se o que está errado é o e-mail ou a senha.
                raise ValueError("E-mail ou senha incorretos.")

            # 4. Retorna o estudante (sucesso)
            return student

    def create_student(self, student_data: dict):
            # 1. Validação do Schema
            # Isso checa max_length, EmailStr e se todos os campos obrigatórios existem
            try:
                validated_data = StudentSchema.model_validate(student_data)
            except Exception as e:
                # Relevante para capturar erros de formato de e-mail ou tamanho de campos
                raise ValueError(f"Dados inválidos: {str(e)}")

            # 2. Regra de Negócio: Verificar se usuário já existe
            # Usamos o email que já passou pela validação do Pydantic
            if self.repository.get_by_email(validated_data.email):
                raise ValueError("Este e-mail já está cadastrado.")

            # 3. Preparar os dados para o Repository
            # Convertemos o objeto validado de volta para dicionário para aplicar o hash
            user_dict = validated_data.model_dump()
            user_dict["password"] = self.hash_password(user_dict["password"])

            # 4. Salvar via Repository
            return self.repository.save(user_dict)
    
    def get_all_students(self):
        return self.repository.get_all()