from dotenv import load_dotenv
from supabase import create_client, Client
import os
from app.schemas.question import QuestionSchema
from app.schemas.alternativa import AlternativaSchema

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
        image = rows[0].get('image')
        if image is None:
            image = ""

        alternativas = (rows[0].get('alternativas'))
        alternativas_em_schemas = [
            AlternativaSchema(letra="A", text=str(alternativas["A"])),
            AlternativaSchema(letra="B", text=str(alternativas["B"])),
            AlternativaSchema(letra="C", text=str(alternativas["C"])),
            AlternativaSchema(letra="D", text=str(alternativas["D"])),
            AlternativaSchema(letra="E", text=str(alternativas["E"]))
        ]

        question = QuestionSchema(
            id=rows[0].get('id'),
            habilidade=rows[0].get('habilidade'),
            competencia=rows[0].get('competencia'),
            enunciado=rows[0].get('enunciado'),
            image=image,
            alternativas=alternativas_em_schemas,
            dificuldade=rows[0].get('dificuldade')
        )
        return question
    else:
        return None