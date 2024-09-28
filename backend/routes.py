from fastapi import APIRouter, Depends, HTTPException
from modules.login import google_auth, get_current_user, GoogleToken, User, Token

router = APIRouter()

@router.post("/api/auth/google", response_model=Token)
async def login_with_google(google_token: GoogleToken):
    return await google_auth(google_token)

@router.get("/api/auth/verify", response_model=User)
async def verify_token(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/api/user/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
