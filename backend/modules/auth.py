import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests
import pandas as pd
from config import env

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
USER_CSV_PATH = os.path.join(env.DATA_DIR, 'users.csv')

if not SECRET_KEY:
    raise ValueError("JWT_SECRET is not set in the environment variables")
if not GOOGLE_CLIENT_ID:
    raise ValueError("GOOGLE_CLIENT_ID is not set in the environment variables")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    name: str

class GoogleToken(BaseModel):
    token: str

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# User data functions
def get_user_df():
    try:
        return pd.read_csv(USER_CSV_PATH)
    except FileNotFoundError:
        return pd.DataFrame(columns=['id', 'email', 'name'])

def save_user_df(df):
    df.to_csv(USER_CSV_PATH, index=False)

def get_user(user_id: str):
    df = get_user_df()
    user = df[df['id'] == user_id]
    if user.empty:
        return None
    return User(**user.iloc[0].to_dict())

def save_user(user: User):
    df = get_user_df()
    if user.id in df['id'].values:
        df.loc[df['id'] == user.id] = user.dict()
    else:
        df = pd.concat([df, pd.DataFrame([user.dict()])], ignore_index=True)
    save_user_df(df)

# Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

# Google authentication
async def google_auth(google_token: GoogleToken):
    try:
        idinfo = id_token.verify_oauth2_token(google_token.token, requests.Request(), GOOGLE_CLIENT_ID)

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        user = User(
            id=idinfo['sub'],
            email=idinfo['email'],
            name=idinfo['name']
        )

        save_user(user)

        access_token = create_access_token({"sub": user.id})

        return {"access_token": access_token, "token_type": "bearer", "user": user}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token")
