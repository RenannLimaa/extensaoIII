from fastapi import FastAPI, APIRouter
from app.routes_front.user_routes import router as user_router
from app.routes_front.chat_routes import router as chat_router
from app.routes_front.question_routes import router as question_router


app = FastAPI()
router = APIRouter()

@router.get("/")
def get_root():
    return {"message": "Hello World"}

app.include_router(router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(question_router)