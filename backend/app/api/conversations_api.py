import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.engine import get_session
from app.models import Conversation, Message
from app.models.conversation import utc_now
from app.schemas.conversation import (
    ConversationCreateResponse,
    ConversationRead,
    MessageRead,
)

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(session: Session = Depends(get_session)):
    statement = select(Conversation).order_by(Conversation.updated_at.desc())
    return session.exec(statement).all()


@router.post("/conversations", response_model=ConversationCreateResponse)
def create_conversation(session: Session = Depends(get_session)):
    conversation = Conversation()
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageRead],
)
def get_messages(
    conversation_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return session.exec(statement).all()


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = session.exec(
        select(Message).where(Message.conversation_id == conversation_id)
    ).all()
    for message in messages:
        session.delete(message)

    session.delete(conversation)
    session.commit()
    return {"ok": True}
