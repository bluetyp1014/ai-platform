from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin_api, auth_api, chat_api, conversations_api
from app.core.demo_mode import is_demo_closed
from app.db.engine import init_db
from app.db.mongo import init_mongo


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_mongo()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3003",
        "http://127.0.0.1:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)


@app.middleware("http")
async def demo_closed_middleware(request: Request, call_next):
    path = request.url.path
    allowed_paths = {
        "/",
        "/admin/demo-status",
        "/admin/demo-open",
        "/admin/demo-close",
        "/auth/login",
        "/auth/register",
        "/auth/logout",
    }

    if is_demo_closed() and path not in allowed_paths and not path.startswith("/auth/refresh"):
        return JSONResponse(
            status_code=503,
            content={"detail": "Demo is closed"},
        )

    return await call_next(request)

app.include_router(auth_api.router)
app.include_router(chat_api.router)
app.include_router(conversations_api.router)
app.include_router(admin_api.router)


@app.get("/")
def root():
    return {"message": "AI Platform API"}


if __name__ == "__main__":
    import argparse

    import uvicorn

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()

    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=args.reload)
