from fastapi import FastAPI
from routes import auth, closet
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(closet.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)