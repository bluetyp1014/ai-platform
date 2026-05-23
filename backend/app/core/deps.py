import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlmodel import Session

from app.core.config import JWT_ALGORITHM, JWT_SECRET
from app.core.security import TOKEN_TYPE_ACCESS
from app.db.engine import get_session
from app.models import Conversation, User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if user_id is None or token_type != TOKEN_TYPE_ACCESS:
            raise credentials_exception
    except JWTError:
        raise credentials_exception from None

    user = session.get(User, uuid.UUID(user_id))
    if user is None:
        raise credentials_exception
    return user


def get_owned_conversation(
    conversation_id: uuid.UUID,
    session: Session,
    current_user: User,
) -> Conversation:
    conversation = session.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation
