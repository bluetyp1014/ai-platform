import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Message(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    conversation_id: uuid.UUID
    role: str
    content: str = ""
    created_at: datetime = Field(default_factory=utc_now)

    def to_document(self) -> dict:
        return {
            "_id": str(self.id),
            "conversation_id": str(self.conversation_id),
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at,
        }

    @classmethod
    def from_document(cls, doc: dict) -> "Message":
        return cls(
            id=uuid.UUID(doc["_id"]),
            conversation_id=uuid.UUID(doc["conversation_id"]),
            role=doc["role"],
            content=doc.get("content", ""),
            created_at=doc["created_at"],
        )
