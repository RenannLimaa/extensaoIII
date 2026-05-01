import datetime
from pydantic import BaseModel, Field, Optional

class ChatMessageSchema(BaseModel):
    id: int
    chat_id: int
    author: str = Field(max_length=15)
    texto: str = Field(max_length=2500)
    timestamp: str
    question_id: Optional[str]