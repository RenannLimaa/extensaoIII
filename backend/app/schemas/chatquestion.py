from pydantic import BaseModel, ConfigDict

class ChatQuestionSchema(BaseModel):
    id: int
    id_chat: int
    id_question: int

    # Esta configuração permite que o Pydantic leia modelos do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)