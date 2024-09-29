import os
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import requests
from jose import jwt
from pydantic import BaseModel
from config import env
import pandas as pd
from datetime import datetime

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

def login_google():
    return {
        "url": f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&scope=openid%20profile%20email&access_type=offline"
    }

async def auth_google(code: str):
    token_url = "https://accounts.google.com/o/oauth2/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    response = requests.post(token_url, data=data)
    access_token = response.json().get("access_token")
    user_info = requests.get("https://www.googleapis.com/oauth2/v1/userinfo", headers={"Authorization": f"Bearer {access_token}"})
    user_data = user_info.json()
    user = User(id=user_data['id'], email=user_data['email'], name=user_data['name'])
    
    # Save user info to CSV
    save_user_info(user)
    
    return user

def save_user_info(user: User):
    csv_file = f'{env.DATA_DIR}/users.csv'
    
    try:
        # Try to read the existing CSV file
        df = pd.read_csv(csv_file)
    except FileNotFoundError:
        # If the file doesn't exist, create a new DataFrame
        df = pd.DataFrame(columns=['user_id', 'email', 'name', 'last_login'])
    
    # Check if the user already exists in the DataFrame
    if user.id not in df['user_id'].values:
        # If the user doesn't exist, add them to the DataFrame
        new_row = pd.DataFrame({
            'user_id': [user.id],
            'email': [user.email],
            'name': [user.name],
            'last_login': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        })
        df = pd.concat([df, new_row], ignore_index=True)
    else:
        # If the user exists, update their last login time
        df.loc[df['user_id'] == user.id, 'last_login'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Save the updated DataFrame to the CSV file
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
