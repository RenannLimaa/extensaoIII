from app.routes_back.interactionDB_routes import getInteractionsByUser

def teste_getInteractionsByUser(user_id = 1):
    return getInteractionsByUser(user_id)

if __name__ == "__main__":
    print(teste_getInteractionsByUser())