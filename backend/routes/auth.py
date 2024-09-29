from fastapi import APIRouter, Depends
from modules.auth import login_google, auth_google, create_token, get_current_user, User

router = APIRouter()

@router.get("/api/auth/google")
async def google_login():
    return login_google()

@router.get("/api/auth/google/callback")
async def google_auth(code: str):
    user = await auth_google(code)
    token = create_token(user)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/api/user/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
