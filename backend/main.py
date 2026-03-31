from fastapi import FastAPI, APIRouter
from app.routes.student_routes import router as students_router

app = FastAPI()
router = APIRouter()

@router.get("/")
def get_root():
    return {"message": "Hello World"}

app.include_router(router)
app.include_router(students_router)