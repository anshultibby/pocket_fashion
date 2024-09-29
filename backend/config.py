import os
from pydantic import BaseSettings

class EnvVar(BaseSettings):
    CLOSETS_DIR: str = 'data/closets/'
    IMAGES_DIR: str = 'data/images/'

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

# Create an instance of EnvVar
env = EnvVar()

# Create directories
os.makedirs(env.CLOSETS_DIR, exist_ok=True)
os.makedirs(env.IMAGES_DIR, exist_ok=True)

# You can access the variables like this:
# CLOSETS_DIR = env.CLOSETS_DIR
# IMAGES_DIR = env.IMAGES_DIR