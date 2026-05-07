from app.services.prompt_service import PromptService
from app.repositories.prompt_repository import PromptRepository

from app.essential_imports import *

session = SessionLocal()

ps = PromptService(PromptRepository(session))


# Adicionar Prompt

"""
created = ps.create_prompt({
    "text": "Qual o adjetivo?",
    "id_chatquestion": 1
})

print(created.text)
"""

# Buscar Prompt por relação
found = ps.get_questions_with_prompts(3)
if found:
    pprint(found)