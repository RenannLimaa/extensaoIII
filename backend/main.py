from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.routes_back.habilcompDB_routes import getCompetenciaByID

app = FastAPI()

origins = [
    '*'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

@router.get("/")
def get_root():
    return {"message": str(getCompetenciaByID(1, 1))}

app.include_router(router)
#adicionar os routers do front de novo depois