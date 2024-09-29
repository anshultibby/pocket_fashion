import os
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import requests
from jose import jwt
from pydantic import BaseModel
from config import env
import pandas as pd
from datetime import datetime
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI = env.GOOGLE_REDIRECT_URI
JWT_SECRET = env.JWT_SECRET

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not JWT_SECRET:
    raise ValueError("Missing required environment variables")

class User(BaseModel):
    id: str
    email: str
    name: str

class GoogleToken(BaseModel):
    code: str

def login_google():
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope=openid%20profile%20email&access_type=offline"
    }

async def auth_google(google_token: GoogleToken):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": google_token.code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    response = requests.post(token_url, data=data)
    token_data = response.json()
    
    if "error" in token_data:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {token_data['error']}")
    
    id_info = id_token.verify_oauth2_token(
        token_data['id_token'], google_requests.Request(), GOOGLE_CLIENT_ID)
    
    user = User(id=id_info['sub'], email=id_info['email'], name=id_info['name'])
    
    # Save user info to CSV
    save_user_info(user)
    
    return user

def save_user_info(user: User):
    csv_file = f'{env.DATA_DIR}/users.csv'
    
    try:
        df = pd.read_csv(csv_file)
    except FileNotFoundError:
        df = pd.DataFrame(columns=['id', 'email', 'name', 'last_login'])
    
    if user.id not in df['id'].values:
        new_row = pd.DataFrame({
            'id': [user.id],
            'email': [user.email],
            'name': [user.name],
            'last_login': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        })
        df = pd.concat([df, new_row], ignore_index=True)
    else:
        df.loc[df['id'] == user.id, 'last_login'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    df.to_csv(csv_file, index=False)

def create_token(user: User):
    token = jwt.encode({"sub": user.id, "email": user.email, "name": user.name}, JWT_SECRET, algorithm="HS256")
    return token

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return User(id=payload["sub"], email=payload["email"], name=payload["name"])
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")