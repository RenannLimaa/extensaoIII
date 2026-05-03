from pydantic import BaseModel, ConfigDict

class ChatSchema(BaseModel):
    id: int
    id_student: int

    # ESTA É A LINHA QUE FALTA:
    model_config = ConfigDict(from_attributes=True)