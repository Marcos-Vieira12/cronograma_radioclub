# app/routers/auth.py
import os
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from app.security import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest):
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise HTTPException(
            status_code=500,
            detail="ADMIN_EMAIL e ADMIN_PASSWORD não configurados no ambiente",
        )

    if data.email != admin_email or data.password != admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token(subject=data.email, extra_claims={"role": "admin"})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"user": user}
