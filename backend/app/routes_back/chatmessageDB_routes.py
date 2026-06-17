from dotenv import load_dotenv
from supabase import create_client, Client
import os
from app.schemas.chatmessage import ChatMessageSchema

MAX_CHATMESSAGE_TEXTO_LEN = 3000


def _normalize_message_text(texto: str | None) -> str:
    if texto is None:
        return ""
    text = str(texto)
    if len(text) <= MAX_CHATMESSAGE_TEXTO_LEN:
        return text
    return text[:MAX_CHATMESSAGE_TEXTO_LEN]

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def getChatsMessagesByChat(chat_id: int):
    """
    Retorna todas as mensagens de um chat em formato ChatMessageSchema, dado o chat_id.
    """
    response = (
        supabase.table("ChatMessage")
        .select("*")
        .eq("chat_id", chat_id)
        .execute()
    )
    rows = response.data
    if rows:
        messages = []
        for row in rows:
            message = ChatMessageSchema(
                id=row.get('id'),
                chat_id=row.get('chat_id'),
                author=row.get('author'),
                texto=_normalize_message_text(row.get('texto')),
                timestamp=str(row.get('timestamp')),
                question_id=row.get('question_id')
            )
            messages.append(message)
        return messages
    else:
        return None

def createChatMessage(chat_id: int, author: str, texto: str, question_id: int=0):
    """
    Registra uma nova mensagem dado o id de chat, autor (system/user/llm) e id de questão, caso tenha uma questão associada.

    Retorna o ChatMessageSchema se obteve sucesso.
    """
    texto_normalizado = _normalize_message_text(texto)

    if question_id != 0:
        response = (
            supabase.table("ChatMessage")
            .insert({"chat_id": chat_id, "author": author, "texto": texto_normalizado, "question_id": question_id})
            .execute()
        )
    else:
        response = (
            supabase.table("ChatMessage")
            .insert({"chat_id": chat_id, "author": author, "texto": texto_normalizado})
            .execute()
        )
    rows = response.data
    if rows:
        message = ChatMessageSchema(
            id=rows[0].get('id'),
            chat_id=rows[0].get('chat_id'),
            author=rows[0].get('author'),
            texto=_normalize_message_text(rows[0].get('texto')),
            timestamp=str(rows[0].get('timestamp')),
            question_id=rows[0].get('question_id')
        )
        return message
    else:
        return None

def updateChatMessage(message: ChatMessageSchema):
    """
    Atualiza uma mensagem no banco de dados dado um ChatMessageSchema da mensagem modificada.

    Retorna o mesmo ChatMessageSchema caso tenha sido modificada com sucesso.
    """
    response = (
        supabase.table("ChatMessage")
        .update({"id":message.id, "chat_id": message.chat_id, "author": message.author, "texto": message.texto, "timestamp": message.timestamp, "question_id": message.question_id})
        .eq("id", message.id)
        .execute()
    )
    rows = response.data
    if rows:
        return message
    else:
        return None

def deleteChatMessage(id: int):
    """
    Recebe um id de mensagem e apaga a mensagem, retornando True ou False dependendo do sucesso.
    """
    response = (
        supabase.table("ChatMessage")
        .delete()
        .eq("id", id)
        .execute()
    )
    rows = response.data
    if rows:
        return True
    else:
        return False

def getMessagesRelatedToQuestion(chat_id: int, question_id: int) -> tuple[ChatMessageSchema, list[ChatMessageSchema]]:
    """
        Retorna os chat_messages de um chat considerando apenas o id de uma questão
    """
    response = supabase.table("ChatMessage") \
        .select("*") \
        .eq("chat_id", chat_id) \
        .eq("question_id", question_id) \
        .order("timestamp", desc=True) \
        .execute()

    rows = response.data
    if not rows:
        return None, []

    messages = []
    for row in rows:
        message = ChatMessageSchema(
            id=row.get('id'),
            chat_id=row.get('chat_id'),
            author=row.get('author'),
            texto=_normalize_message_text(row.get('texto')),
            timestamp=str(row.get('timestamp')),
            question_id=row.get('question_id')
        )
        messages.append(message)

    messages = list(reversed(messages))  # ordem cronológica

    question_message = messages[0]       # primeiro = texto da questão
    history_messages = messages[1:]      # restante = histórico normal

    return question_message, history_messages