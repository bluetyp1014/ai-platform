import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from jose import JWTError
from sqlmodel import Session, select

from app.core.cookies import (
    clear_refresh_cookie,
    get_refresh_token_from_cookie,
    set_refresh_cookie,
)
from app.core.security import (
    TOKEN_TYPE_REFRESH,
    create_token_pair,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.engine import get_session
from app.models import User
from app.schemas.auth import AccessTokenResponse, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_tokens(user: User, response: Response) -> AccessTokenResponse:
    access_token, refresh_token = create_token_pair(str(user.id))
    set_refresh_cookie(response, refresh_token)
    return AccessTokenResponse(access_token=access_token)


@router.post("/register", response_model=AccessTokenResponse)
def register(
    data: RegisterRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(User).where(User.username == data.username)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return _issue_tokens(user, response)


@router.post("/login", response_model=AccessTokenResponse)
def login(
    data: LoginRequest,
    response: Response,
    session: Session = Depends(get_session),
):
    user = session.exec(
        select(User).where(User.username == data.username)
    ).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    return _issue_tokens(user, response)


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
):
    refresh_token = get_refresh_token_from_cookie(request)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    try:
        user_id = decode_token(refresh_token, TOKEN_TYPE_REFRESH)
    except JWTError:
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        ) from None

    user = session.get(User, uuid.UUID(user_id))
    if user is None:
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return _issue_tokens(user, response)


@router.post("/logout")
def logout(response: Response):
    clear_refresh_cookie(response)
    return {"ok": True}
