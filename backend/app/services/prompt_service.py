from app.repositories.prompt_repository import PromptRepository
from app.schemas.prompt import PromptSchema

class PromptService:
    def __init__(self, prompt_repository: PromptRepository):
        self.repo = prompt_repository

    def create_prompt(self, prompt_data: dict):
            prompt_data['id'] = 0

            # 1. Validação de ENTRADA (O Pydantic trava aqui se os dados estiverem ruins)
            try:
                # Aqui ele checa o max_length=1000 e os tipos de dados
                validated_input = PromptSchema.model_validate(prompt_data)
            except Exception as e:
                raise ValueError(f"Dados do prompt inválidos: {str(e)}")
            
            # 2. Salva no Banco usando os dados que já sabemos que estão OK
            new_model = self.repo.create(
                text=validated_input.text,
                id_chatquestion=validated_input.id_chatquestion
            )

            # 3. Conversão de SAÍDA (Apenas para transformar o Model em Object)
            return PromptSchema.model_validate(new_model)

    def get_prompt_by_relation(self, id_chatquestion: int):
        model = self.repo.get_by_chat_question(id_chatquestion)
        if not model:
            return None
        return PromptSchema.model_validate(model)