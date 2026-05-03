from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class ImageModel(Base):
    __tablename__ = "image"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_question = Column(Integer, ForeignKey("question.id"), nullable=False, index=True)
    description = Column(String(1000), nullable=False)
    path = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False)

    question = relationship("QuestionModel", back_populates="images")
