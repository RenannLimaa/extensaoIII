from testes.updates.image_service import ImageService
from testes.updates.image_repository import ImageRepository

from app.essential_imports import *
session = SessionLocal()

ise = ImageService(ImageRepository(session))


# Adicionar Prompt

"""
created = ps.create_prompt({
    "text": "Qual o adjetivo?",
    "id_chatquestion": 1
})

print(created.text)
"""

# Buscar Prompt por relação
found = ise.get_images_by_question(1)
if found:
    pprint(found.text)