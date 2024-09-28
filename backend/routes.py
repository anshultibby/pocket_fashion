from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from modules.login import google_auth, get_current_user, GoogleToken, User, Token
from pydantic import BaseModel

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = None

@router.post("/api/auth/google", response_model=Token)
async def login_with_google(google_token: GoogleToken):
    return await google_auth(google_token)

@router.get("/api/user/me", response_model=User)
async def read_users_me(current_user: User = Depends(lambda token: get_current_user(token))):
    return current_user

@router.get("/")
async def read_root():
    return {"Hello": "World"}

@router.get("/items/{item_id}")
async def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@router.put("/items/{item_id}")
async def update_item(item_id: int, item: Item):
    return {"item_name": item.name, "item_id": item_id}
