"""
FormFlow — FastAPI Backend
Main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import engine, Base

# Import all models so SQLAlchemy registers them before create_all
from models import User, Form, FormResponse, FormShare  # noqa: F401

# Import routers
from routers.auth import router as auth_router
from routers.forms import router as forms_router
from routers.responses import router as responses_router
from routers.upload import router as upload_router
from routers.shares import router as shares_router
from routers.ai import router as ai_router

# ── Create tables ────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="FormFlow API",
    description="Research-grade form builder backend — forms, responses, sharing, file uploads, and AI extraction.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://foreform.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ────────────────────────────────────────
app.include_router(auth_router)
app.include_router(forms_router)
app.include_router(responses_router)
app.include_router(upload_router)
app.include_router(shares_router)
app.include_router(ai_router)


# ── Health check ─────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {
        "app": "FormFlow API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
