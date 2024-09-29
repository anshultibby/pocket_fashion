import logging
from fastapi import FastAPI
from routes import auth, closet
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from config import env
from middleware import LoggingStaticFiles  # Ensure this import is correct

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Serve static files from the "data/images" directory at the "/static" path using the custom LoggingStaticFiles class
app.mount("/static", LoggingStaticFiles(directory="data/images"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(closet.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)