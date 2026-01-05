# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.cronograma import router as cronograma_router
from app.routers.auth import router as auth_router  # 👈 ADD

import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
engine = create_engine(os.getenv("DB_URL"))

app = FastAPI(title="RadioClub Cronograma API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/testdb")
def test_db_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT NOW();"))
            timestamp = result.scalar()
            return {"status": "ok", "connected": True, "timestamp": str(timestamp)}
    except Exception as e:
        return {"status": "error", "connected": False, "error": str(e)}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# ✅ inclui auth primeiro
app.include_router(auth_router)

# ✅ inclui cronograma
app.include_router(cronograma_router)
