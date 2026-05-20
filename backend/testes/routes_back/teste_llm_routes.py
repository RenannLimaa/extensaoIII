from app.routes_back.llm_routes import getAnswertheQuery
from app.routes_back.chatmessageDB_routes import createChatMessage

if __name__ == "__main__":
    
    query = input("Digite sua consulta: ") 

    createChatMessage(5, 'user', query, 2)

    answ = getAnswertheQuery(
        chat_id=5,
        question_id=2,
        knowledge_area="Matemática e suas tecnologias",
        query=query
    )

    createChatMessage(5, 'llm', answ, 2)


    print(answ)     
