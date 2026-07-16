"""Shared Pydantic request/response models."""

from pydantic import BaseModel, EmailStr, Field


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
