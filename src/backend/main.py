"""MathQuest — Backend FastAPI (Fase 2 Multi-Usuário)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_db
from .routers import auth, progress, dashboard, pai

app = FastAPI(
    title="MathQuest API",
    description="Backend do sistema educacional MathQuest — multi-usuário",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(progress.router)
app.include_router(pai.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup():
    create_db()


@app.get("/")
def root():
    return {
        "app": "MathQuest API",
        "versao": "2.1.0",
        "docs": "/docs",
        "status": "online"
    }
