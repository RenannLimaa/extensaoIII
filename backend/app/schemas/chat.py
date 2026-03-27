from pydantic import BaseModel

class ChatSchema(BaseModel):
    id: int
    id_student: int