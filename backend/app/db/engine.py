from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=False)


def init_db() -> None:
    from app.models import Conversation, Message  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
