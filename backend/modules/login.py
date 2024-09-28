import os
from dotenv import load_dotenv
from fastapi import HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
from datetime import datetime, timedelta

# Load environment variables from .env file
load_dotenv()

# Get credentials from environment variables
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
JWT_SECRET = os.getenv('JWT_SECRET')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 30

if not GOOGLE_CLIENT_ID:
    raise ValueError("GOOGLE_CLIENT_ID is not set in the environment variables")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET is not set in the environment variables")

class GoogleToken(BaseModel):
    token: str

class User(BaseModel):
    id: str
    email: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str

def create_jwt_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def google_auth(google_token: GoogleToken):
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(google_token.token, requests.Request(), GOOGLE_CLIENT_ID)

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Get user info from the idinfo
        user = User(
            id=idinfo['sub'],
            email=idinfo['email'],
            name=idinfo['name']
        )

        # Create JWT token
        access_token = create_jwt_token({"sub": user.id})

        # In a real application, you would typically:
        # 1. Check if the user exists in your database
        # 2. Create the user if they don't exist
        # 3. Update the user's information if necessary

        return {"access_token": access_token, "token_type": "bearer", "user": user}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token")

def get_current_user(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    # Here you would typically fetch the user from your database
    # For this example, we'll just return a User object with the ID
    return User(id=user_id, email="example@email.com", name="Example User")
