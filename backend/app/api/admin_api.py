from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import DEMO_ADMIN_USERNAME
from app.core.demo_mode import close_demo, is_demo_closed, open_demo
from app.core.deps import get_current_user, get_optional_current_user
from app.models import User

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_demo_admin(current_user: User = Depends(get_current_user)) -> User:
    if not DEMO_ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Demo admin is not configured",
        )

    if current_user.username != DEMO_ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    return current_user


@router.get("/demo-status")
def demo_status(current_user: User | None = Depends(get_optional_current_user)):
    can_close = bool(
        DEMO_ADMIN_USERNAME
        and current_user
        and current_user.username == DEMO_ADMIN_USERNAME
    )
    return {
        "closed": is_demo_closed(),
        "can_close": can_close,
        "admin_configured": bool(DEMO_ADMIN_USERNAME),
    }


@router.post("/demo-close")
def demo_close(_: User = Depends(_require_demo_admin)):
    close_demo()
    return {"ok": True, "closed": True}


@router.post("/demo-open")
def demo_open(_: User = Depends(_require_demo_admin)):
    open_demo()
    return {"ok": True, "closed": False}