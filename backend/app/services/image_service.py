class ImageService:
    def __init__(self, repository):
        self.repository = repository

    def create_image(self, image_data: dict):
        # Regra de negócio: evitar cadastro duplicado por ID.
        existing_image = self.repository.get_by_id(image_data["id"])
        if existing_image:
            raise ValueError("Esta imagem já está cadastrada.")

        return self.repository.save(image_data)

    def get_images_by_question(self, question_id: int):
        images = self.repository.get_by_question_id(question_id)

        if images is None:
            raise ValueError("Não existem imagens para esta questão.")

        return images
