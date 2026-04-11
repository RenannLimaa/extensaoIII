from sqlalchemy.orm import Session
from app.models.prompt_model import PromptModel

class PromptRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, text: str, id_chatquestion: int):
        new_prompt = PromptModel(text=text, id_chatquestion=id_chatquestion)
        self.session.add(new_prompt)
        self.session.commit()
        self.session.refresh(new_prompt)
        return new_prompt

    def get_by_chat_question(self, id_chatquestion: int):
        return self.session.query(PromptModel).filter(
            PromptModel.id_chatquestion == id_chatquestion
        ).first()