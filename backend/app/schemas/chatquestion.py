from pydantic import BaseModel

class ChatQuestionSchema(BaseModel):
    id: int
    id_chat: int
    id_question: int