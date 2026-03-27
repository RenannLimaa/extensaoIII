from pydantic import BaseModel

class StudentSchema(BaseModel):
    email: str
    name: str