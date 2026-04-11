from app.database import engine, Base
from app.models import question_model, topic_model, subject_model  # Importante importar os models para o Base conhecê-los

# Cria todas as tabelas definidas que herdam de Base
Base.metadata.create_all(bind=engine)