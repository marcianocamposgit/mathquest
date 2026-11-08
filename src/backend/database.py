"""Conexão com o banco de dados."""
import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mathquest.db")

# check_same_thread só é necessário para SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def create_db():
    """Cria todas as tabelas no banco."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency injection para FastAPI."""
    with Session(engine) as session:
        yield session
