from fastapi import APIRouter, Depends, HTTPException
from modules.auth import login_google, auth_google, create_token, get_current_user, User, GoogleToken

router = APIRouter()

@router.get("/api/auth/google")
async def google_login():
    return login_google()

@router.post("/api/auth/google")
async def google_auth(google_token: GoogleToken):
    try:
        user = await auth_google(google_token)
        token = create_token(user)
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/user/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
