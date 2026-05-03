from pydantic import BaseModel, ConfigDict

class ImageSchema(BaseModel):
    id: int
    id_question: int
    description: str = Field(max_length=1000)
    path: str = Field(max_length=255)
    order: int

    # Esta configuração permite que o Pydantic leia modelos do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)