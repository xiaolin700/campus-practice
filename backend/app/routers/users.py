"""User CRUD routes: list (paginated), create, update, soft-delete."""

import sqlite3
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ..common import BizException, PageData, Result
from ..database import get_db
from ..schemas import CreateUserBody, UserUpdateBody
from ..security import hash_password
from .auth import admin_user, public_user

router = APIRouter(prefix="/api/users", tags=["users"])
Database = Annotated[sqlite3.Connection, Depends(get_db)]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("")
def list_users(
    db: Database,
    _: Annotated[sqlite3.Row, Depends(admin_user)],
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(10, ge=1, le=100, description="每页条数"),
    keyword: str | None = Query(None, description="按姓名/邮箱模糊搜索"),
    role: str | None = Query(None, description="按角色筛选: STUDENT | ADMIN"),
) -> Result[PageData[dict[str, object]]]:
    conditions = "WHERE 1=1"
    params: list = []

    if keyword:
        conditions += " AND (name LIKE ? OR email LIKE ?)"
        params.extend([f"%{keyword}%", f"%{keyword}%"])
    if role and role in ("STUDENT", "ADMIN"):
        conditions += " AND role = ?"
        params.append(role)

    total = db.execute(
        f"SELECT COUNT(*) FROM users {conditions}", params
    ).fetchone()[0]

    offset = (page - 1) * size
    rows = db.execute(
        f"SELECT * FROM users {conditions} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [size, offset],
    ).fetchall()

    return Result.success(PageData(
        records=[public_user(row) for row in rows],
        total=total,
        page=page,
        size=size,
    ))


@router.post("", status_code=201)
def create_user(
    body: CreateUserBody,
    db: Database,
    _: Annotated[sqlite3.Row, Depends(admin_user)],
) -> Result[dict[str, object]]:
    email = body.email.lower()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        raise BizException(409, "该邮箱已注册")
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
    return Result.success(public_user(user))


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    body: UserUpdateBody,
    db: Database,
    admin: Annotated[sqlite3.Row, Depends(admin_user)],
) -> Result[dict[str, object]]:
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        raise BizException(404, "用户不存在")
    if body.is_active is False and user_id == admin["id"]:
        raise BizException(400, "不能停用当前管理员")

    name = body.name if body.name is not None else user["name"]
    role = body.role if body.role in {"STUDENT", "ADMIN"} else user["role"]
    active = int(body.is_active) if body.is_active is not None else user["is_active"]

    db.execute(
        "UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?",
        (name.strip(), role, active, user_id),
    )
    db.commit()
    updated = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return Result.success(public_user(updated))


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Database,
    admin: Annotated[sqlite3.Row, Depends(admin_user)],
) -> None:
    if user_id == admin["id"]:
        raise BizException(400, "不能删除当前登录的管理员")
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        raise BizException(404, "用户不存在")
    # Hard delete: permanently remove the record
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
