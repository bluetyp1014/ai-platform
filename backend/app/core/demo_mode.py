from pathlib import Path

from app.core.config import DEMO_CLOSED_FLAG_PATH


def _flag_path() -> Path:
    return Path(DEMO_CLOSED_FLAG_PATH)


def is_demo_closed() -> bool:
    return _flag_path().exists()


def close_demo() -> None:
    path = _flag_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("closed\n", encoding="utf-8")


def open_demo() -> None:
    path = _flag_path()
    if path.exists():
        path.unlink()
