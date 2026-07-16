"""Auth routes: register, login, me, health."""

import sqlite3
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException

from ..common import BizException, Result
from ..database import connect, get_db
from ..schemas import LoginBody, RegisterBody
from ..security import create_token, decode_token, hash_password, verify_password

router = APIRouter(prefix="/api", tags=["auth"])
Database = Annotated[sqlite3.Connection, Depends(get_db)]


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


def current_user(
    db: Database, authorization: Annotated[str | None, Header()] = None
) -> sqlite3.Row:
    if not authorization or not authorization.startswith("Bearer "):
        raise BizException(401, "请先登录")
    payload = decode_token(authorization.removeprefix("Bearer ").strip())
    if not payload:
        raise BizException(401, "登录状态已失效")
    user = db.execute(
        "SELECT * FROM users WHERE id = ?", (int(str(payload["sub"])),)
    ).fetchone()
    if not user or not user["is_active"]:
        raise BizException(401, "账号不可用")
    return user


def admin_user(user: Annotated[sqlite3.Row, Depends(current_user)]) -> sqlite3.Row:
    if user["role"] != "ADMIN":
        raise BizException(403, "需要管理员权限")
    return user


# ---- Endpoints ----


@router.get("/health")
def health() -> Result[dict[str, str]]:
    return Result.success({"status": "ok", "version": "1.0.0"})


@router.post("/auth/register", status_code=201)
def register(body: RegisterBody, db: Database) -> Result[dict[str, object]]:
    email = body.email.lower()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        raise BizException(409, "该邮箱已注册")
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
    return Result.success(
        {"token": create_token(user["id"], user["role"]), "user": public_user(user)},
        message="注册成功",
    )


@router.post("/auth/login")
def login(body: LoginBody, db: Database) -> Result[dict[str, object]]:
    user = db.execute(
        "SELECT * FROM users WHERE email = ?", (body.email.lower(),)
    ).fetchone()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise BizException(401, "邮箱或密码错误")
    if not user["is_active"]:
        raise BizException(403, "账号已停用")
    return Result.success({
        "token": create_token(user["id"], user["role"]),
        "user": public_user(user),
    })


@router.get("/auth/me")
def me(user: Annotated[sqlite3.Row, Depends(current_user)]) -> Result[dict[str, object]]:
    return Result.success(public_user(user))
