from dotenv import load_dotenv
from supabase import create_client, Client
import os
from app.schemas.question import QuestionSchema
import json

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def getQuestionByID(id: int):
    """
    Retorna uma questão como QuestionSchema dado o seu id.
    """
    response = (
        supabase.table("Question")
        .select("*")
        .eq("id", id)
        .execute()
    )
    rows = response.data
    if rows:
        alternativas_json = rows[0].get('alternativas')
        alternativas = json.load(alternativas_json)["alternativas"]
        question = QuestionSchema(
            id=rows[0].get('id'),
            habilidade=rows[0].get('habilidade'),
            competencia=rows[0].get('competencia'),
            enunciado=rows[0].get('enunciado'),
            image=rows[0].get('image'),
            alternativas=alternativas,
            dificuldade=rows[0].get('dificuldade')
        )
        return question
    else:
        return None