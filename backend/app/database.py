#from sqlalchemy import create_client_static
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
load_dotenv()

# 1. Defina a URL do banco de dados
# Para desenvolvimento fácil, usaremos Postgresql (gera um arquivo .db local)

# A variável de ambiente tem como valor "postgresql://user:pass@localhost:5432/dbname"
# Substituir pelas suas credenciais e nome do banco
SQLALCHEMY_DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL")

# 2. Crie o motor do banco de dados
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Crie uma fábrica de sessões (o que o Repository vai usar)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. A classe Base que todos os seus Models vão herdar
Base = declarative_base()

# 5. Função utilitária para obter a sessão nas rotas (Dependency Injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()