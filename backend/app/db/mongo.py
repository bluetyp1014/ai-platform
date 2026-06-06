from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.config import MONGODB_DB, MONGODB_URL

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URL)
    return _client


def get_database() -> Database:
    return get_client()[MONGODB_DB]


def get_messages_collection() -> Collection:
    return get_database()["messages"]


def init_mongo() -> None:
    collection = get_messages_collection()
    collection.create_index([("conversation_id", ASCENDING), ("created_at", ASCENDING)])
