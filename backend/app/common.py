"""Unified response, custom exceptions, and global error handlers."""

import time
from typing import Any, Generic, TypeVar

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

T = TypeVar("T")


class BizException(HTTPException):
    """Custom business exception, caught by global handler."""

    def __init__(self, code: int, message: str):
        super().__init__(status_code=code, detail=message)
        self.code = code
        self.message = message


class Result(BaseModel, Generic[T]):
    """Unified response envelope: {code, message, data, timestamp}."""

    code: int = 200
    message: str = "success"
    data: T | None = None
    timestamp: int = 0

    @staticmethod
    def success(data: Any = None, message: str = "success") -> "Result":
        return Result(
            code=200, message=message, data=data, timestamp=int(time.time() * 1000)
        )

    @staticmethod
    def error(code: int, message: str) -> "Result":
        return Result(
            code=code, message=message, data=None, timestamp=int(time.time() * 1000)
        )


class PageData(BaseModel, Generic[T]):
    """Paginated data: {records, total, page, size}."""

    records: list[T] = []
    total: int = 0
    page: int = 1
    size: int = 10


# ---- Exception handlers ----


async def biz_handler(request: Request, exc: BizException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=Result.error(exc.code, exc.message).model_dump(),
    )


async def http_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=Result.error(exc.status_code, str(exc.detail)).model_dump(),
    )


async def validation_handler(request: Request, exc: Exception) -> JSONResponse:
    from fastapi.exceptions import RequestValidationError

    if isinstance(exc, RequestValidationError):
        errors = exc.errors()
        detail = "; ".join(
            f"{e['loc'][-1] if e['loc'] else '?'}: {e['msg']}" for e in errors
        )
        return JSONResponse(
            status_code=422, content=Result.error(422, detail).model_dump()
        )
    return JSONResponse(
        status_code=500, content=Result.error(500, str(exc)).model_dump()
    )


def register_exception_handlers(app):
    from fastapi.exceptions import RequestValidationError

    app.add_exception_handler(BizException, biz_handler)
    app.add_exception_handler(HTTPException, http_handler)
    app.add_exception_handler(RequestValidationError, validation_handler)
