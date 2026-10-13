from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # F401
from app.api import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"], allow_headers=["*"], allow_credentials=True,
)

app.include_router(router)


@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}