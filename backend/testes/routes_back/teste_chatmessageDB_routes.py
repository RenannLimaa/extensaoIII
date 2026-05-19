from app.routes_back.chatmessageDB_routes import createChatMessage, getChatsMessagesByChat, updateChatMessage, deleteChatMessage
from app.schemas.chatmessage import ChatMessageSchema
from testes.routes_back.teste_chatDB_routes import chat_id

def teste_getChatMessagesByChat(chat_id):
    print(f"Mensagens do chat {chat_id}\n")
    print(getChatsMessagesByChat(chat_id))

    return getChatsMessagesByChat(chat_id)

def teste_createChatMessage(chat_message: dict):

    # chat_message = {
    #     "chat_id": 4,
    #     "author": 'llm',
    #     "texto": 'mensagem3',
    #     "question_id": 1,
    # }

    return createChatMessage(**chat_message)

def teste_updateChatMessage(chat_id):
    chat_message_schema = teste_getChatMessagesByChat(chat_id)[-1]
    chat_message_schema.texto = 'mensagem3_atualizada'
    updated_schema = updateChatMessage(chat_message_schema)

    teste_getChatMessagesByChat(chat_id)

    return updated_schema

def teste_deleteChatMessage(chat_id):
    print(deleteChatMessage(chat_id))
    teste_getChatMessagesByChat(chat_id)



if __name__ == "__main__":
    chat_id = 4

    getChatsMessagesByChat(chat_id)
    
    # chat_message_schema.texto = 'mensagem3_atualizada'