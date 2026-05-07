from sqlalchemy.orm import Session
from app.models.image_model import ImageModel


class ImageRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, image_id: int):
        """Busca uma imagem específica pelo ID no banco."""
        return self.session.query(ImageModel).filter(ImageModel.id == image_id).first()

    def save(self, image_data: dict):
        """Converte o dicionário em Model e salva no banco."""
        new_image = ImageModel(**image_data)
        self.session.add(new_image)
        self.session.commit()
        self.session.refresh(new_image)
        return new_image

    def get_by_question_id(self, question_id: int):
        """Busca imagens vinculadas ao ID de questão informado."""
        images = (
            self.session.query(ImageModel)
            .filter(ImageModel.id_question == question_id)
            .order_by(ImageModel.order.asc())
            .all()
        )
        return images if images else None
