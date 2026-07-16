from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .common import register_exception_handlers
from .config import settings
from .database import connect, init_database
from .security import hash_password
from .routers import auth, users

from datetime import datetime, timezone


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def seed_admin() -> None:
    db = connect()
    try:
        admin = db.execute(
            "SELECT id FROM users WHERE email = ?", ("admin@example.com",)
        ).fetchone()
        if not admin:
            db.execute(
                """
                INSERT INTO users(name, email, password_hash, role, is_active, created_at)
                VALUES (?, ?, ?, 'ADMIN', 1, ?)
                """,
                ("管理员", "admin@example.com", hash_password("admin123"), utc_now()),
            )
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_database()
    seed_admin()
    yield


app = FastAPI(title="用户管理系统 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(users.router)
