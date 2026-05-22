import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.ai.chat import stream_ai
from app.db.engine import engine, get_session
from app.models import Conversation, Message
from app.models.conversation import utc_now
from app.schemas.chat import ChatRequest

router = APIRouter()

TITLE_MAX_LEN = 48


def _title_from_message(text: str) -> str:
    one_line = " ".join(text.split())
    if len(one_line) <= TITLE_MAX_LEN:
        return one_line or "New Chat"
    return one_line[: TITLE_MAX_LEN - 1] + "…"


def _ollama_messages(history: list[Message], user_text: str) -> list[dict]:
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": user_text})
    return messages


@router.post("/chat")
def chat(data: ChatRequest, session: Session = Depends(get_session)):
    """Stream AI reply and persist user/assistant messages."""

    if data.conversation_id:
        conversation = session.get(Conversation, data.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(title=_title_from_message(data.message))
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    history = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    ).all()

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=data.message,
    )
    session.add(user_message)

    if conversation.title == "New Chat":
        conversation.title = _title_from_message(data.message)

    conversation.updated_at = utc_now()
    session.add(conversation)
    session.commit()

    conversation_id = conversation.id
    ollama_messages = _ollama_messages(history, data.message)

    def generator():
        parts: list[str] = []
        try:
            for chunk in stream_ai(ollama_messages):
                parts.append(chunk)
                yield chunk
        finally:
            assistant_content = "".join(parts)
            if not assistant_content:
                return

            with Session(engine) as save_session:
                assistant_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=assistant_content,
                )
                save_session.add(assistant_message)

                conv = save_session.get(Conversation, conversation_id)
                if conv:
                    conv.updated_at = utc_now()
                    save_session.add(conv)

                save_session.commit()

    headers = {"X-Conversation-Id": str(conversation_id)}
    return StreamingResponse(
        generator(),
        media_type="text/plain; charset=utf-8",
        headers=headers,
    )
