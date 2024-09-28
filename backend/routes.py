from fastapi import APIRouter, Depends, HTTPException, Response
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

@router.post("/api/auth/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    # Here you would implement your server-side logout logic
    # For example, if you're using server-side sessions:
    # request.session.clear()
    
    # If you're using JWT tokens and want to invalidate them:
    # You could add the token to a blacklist in your database
    
    # Clear any cookies if you're using cookie-based authentication
    response.delete_cookie(key="access_token")
    
    return {"message": "Successfully logged out"}
