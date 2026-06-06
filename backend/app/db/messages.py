import uuid

from app.db.mongo import get_messages_collection
from app.models.message import Message


def insert_message(message: Message) -> Message:
    get_messages_collection().insert_one(message.to_document())
    return message


def list_messages_by_conversation(conversation_id: uuid.UUID) -> list[Message]:
    cursor = (
        get_messages_collection()
        .find({"conversation_id": str(conversation_id)})
        .sort("created_at", 1)
    )
    return [Message.from_document(doc) for doc in cursor]


def delete_messages_by_conversation(conversation_id: uuid.UUID) -> None:
    get_messages_collection().delete_many({"conversation_id": str(conversation_id)})
