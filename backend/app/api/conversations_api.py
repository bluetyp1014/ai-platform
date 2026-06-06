import uuid

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.deps import get_current_user, get_owned_conversation
from app.db.engine import get_session
from app.db.messages import (
    delete_messages_by_conversation,
    list_messages_by_conversation,
)
from app.models import Conversation, User
from app.schemas.conversation import (
    ConversationCreateResponse,
    ConversationRead,
    MessageRead,
)

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return session.exec(statement).all()


@router.post("/conversations", response_model=ConversationCreateResponse)
def create_conversation(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conversation = Conversation(user_id=current_user.id)
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
    current_user: User = Depends(get_current_user),
):
    get_owned_conversation(conversation_id, session, current_user)
    return list_messages_by_conversation(conversation_id)


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    conversation = get_owned_conversation(conversation_id, session, current_user)

    delete_messages_by_conversation(conversation_id)

    session.delete(conversation)
    session.commit()
    return {"ok": True}
