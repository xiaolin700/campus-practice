from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Annotated
import sqlite3

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from .config import settings
from .database import connect, get_db, init_database
from .security import create_token, decode_token, hash_password, verify_password


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class CreateUserBody(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: str = "STUDENT"


class UserUpdateBody(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=40)
    role: str | None = None
    is_active: bool | None = None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_user(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
    }


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

Database = Annotated[sqlite3.Connection, Depends(get_db)]


def current_user(
    db: Database, authorization: Annotated[str | None, Header()] = None
) -> sqlite3.Row:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    payload = decode_token(authorization.removeprefix("Bearer ").strip())
    if not payload:
        raise HTTPException(status_code=401, detail="登录状态已失效")
    user = db.execute(
        "SELECT * FROM users WHERE id = ?", (int(str(payload["sub"])),)
    ).fetchone()
    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="账号不可用")
    return user


def admin_user(user: Annotated[sqlite3.Row, Depends(current_user)]) -> sqlite3.Row:
    if user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "1.0.0"}


@app.post("/api/auth/register", status_code=201)
def register(body: RegisterBody, db: Database) -> dict[str, object]:
    email = body.email.lower()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        raise HTTPException(status_code=409, detail="该邮箱已注册")
    cursor = db.execute(
        """
        INSERT INTO users(name, email, password_hash, role, is_active, created_at)
        VALUES (?, ?, ?, 'STUDENT', 1, ?)
        """,
        (body.name.strip(), email, hash_password(body.password), utc_now()),
    )
    db.commit()
    user = db.execute(
        "SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    return {"token": create_token(user["id"], user["role"]), "user": public_user(user)}


@app.post("/api/auth/login")
def login(body: LoginBody, db: Database) -> dict[str, object]:
    user = db.execute(
        "SELECT * FROM users WHERE email = ?", (body.email.lower(),)
    ).fetchone()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="账号已停用")
    return {"token": create_token(user["id"], user["role"]), "user": public_user(user)}


@app.get("/api/auth/me")
def me(user: Annotated[sqlite3.Row, Depends(current_user)]) -> dict[str, object]:
    return public_user(user)


@app.get("/api/users")
def list_users(
    db: Database, _: Annotated[sqlite3.Row, Depends(admin_user)]
) -> list[dict[str, object]]:
    rows = db.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    return [public_user(row) for row in rows]


@app.post("/api/users", status_code=201)
def create_user(
    body: CreateUserBody,
    db: Database,
    _: Annotated[sqlite3.Row, Depends(admin_user)],
) -> dict[str, object]:
    email = body.email.lower()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        raise HTTPException(status_code=409, detail="该邮箱已注册")
    role = body.role if body.role in {"STUDENT", "ADMIN"} else "STUDENT"
    cursor = db.execute(
        """
        INSERT INTO users(name, email, password_hash, role, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
        """,
        (body.name.strip(), email, hash_password(body.password), role, utc_now()),
    )
    db.commit()
    user = db.execute(
        "SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    return public_user(user)


@app.patch("/api/users/{user_id}")
def update_user(
    user_id: int,
    body: UserUpdateBody,
    db: Database,
    admin: Annotated[sqlite3.Row, Depends(admin_user)],
) -> dict[str, object]:
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if body.is_active is False and user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="不能停用当前管理员")

    name = body.name if body.name is not None else user["name"]
    role = body.role if body.role in {"STUDENT", "ADMIN"} else user["role"]
    active = int(body.is_active) if body.is_active is not None else user["is_active"]

    db.execute(
        "UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?",
        (name.strip(), role, active, user_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return public_user(updated)


@app.delete("/api/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Database,
    admin: Annotated[sqlite3.Row, Depends(admin_user)],
) -> None:
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="不能删除当前登录的管理员")
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
