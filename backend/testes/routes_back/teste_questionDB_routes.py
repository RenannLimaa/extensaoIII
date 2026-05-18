from app.routes_back.questionDB_routes import getQuestionByID


def teste_getQuestionByID(id = 1):
    questao = getQuestionByID(id)
    print(questao)


# Testar

if __name__ == "__main__":
    teste_getQuestionByID()

