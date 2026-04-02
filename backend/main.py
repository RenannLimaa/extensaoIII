from fastapi import FastAPI, APIRouter
from app.routes.student_routes import router as student_router
from app.routes.chat_routes import router as chat_router
from app.routes.question_routes import router as question_router


app = FastAPI()
router = APIRouter()

@router.get("/")
def get_root():
    return {"message": "Hello World"}

app.include_router(router)
app.include_router(student_router)
app.include_router(chat_router)
app.include_router(question_router)