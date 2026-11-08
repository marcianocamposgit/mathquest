"""Modelos do banco de dados (SQLModel = SQLAlchemy + Pydantic)."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


def agora_utc() -> datetime:
    return datetime.now(timezone.utc)


# ══════════════════════════════════════════════════════
# TABELAS
# ══════════════════════════════════════════════════════

class Responsavel(SQLModel, table=True):
    """Pai/mãe/responsável — conta com email e senha."""
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(max_length=100)
    email: str = Field(max_length=200, unique=True, index=True)
    senha_hash: str = Field(max_length=200)
    criado_em: datetime = Field(default_factory=agora_utc)


class Jogador(SQLModel, table=True):
    """Criança — vinculada a um Responsavel."""
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(max_length=50)
    token: str = Field(default_factory=lambda: uuid.uuid4().hex, unique=True, index=True)
    responsavel_id: Optional[int] = Field(default=None, foreign_key="responsavel.id", index=True)
    criado_em: datetime = Field(default_factory=agora_utc)


class Resultado(SQLModel, table=True):
    """Cada desafio resolvido."""
    id: Optional[int] = Field(default=None, primary_key=True)
    jogador_id: int = Field(foreign_key="jogador.id", index=True)
    operacao: str = Field(max_length=20)
    modo: str = Field(max_length=20)
    nivel: int = Field(default=1)
    acertou: bool
    tempo_segundos: float = Field(default=0.0)
    detalhes: Optional[str] = Field(default=None)
    criado_em: datetime = Field(default_factory=agora_utc)


class Progresso(SQLModel, table=True):
    """Progresso consolidado por operação."""
    id: Optional[int] = Field(default=None, primary_key=True)
    jogador_id: int = Field(foreign_key="jogador.id", index=True)
    operacao: str = Field(max_length=20)
    nivel: int = Field(default=1)
    total_acertos: int = Field(default=0)
    total_erros: int = Field(default=0)
    streak_atual: int = Field(default=0)
    melhor_streak: int = Field(default=0)
    tempo_medio: float = Field(default=0.0)
    atualizado_em: datetime = Field(default_factory=agora_utc)


class Conquista(SQLModel, table=True):
    """Conquistas desbloqueadas."""
    id: Optional[int] = Field(default=None, primary_key=True)
    jogador_id: int = Field(foreign_key="jogador.id", index=True)
    conquista_id: str = Field(max_length=50)
    desbloqueada_em: datetime = Field(default_factory=agora_utc)


# ══════════════════════════════════════════════════════
# SCHEMAS (request/response)
# ══════════════════════════════════════════════════════

# ── Auth da criança (simples, sem senha) ───────────
class LoginRequest(SQLModel):
    nome: str


class LoginResponse(SQLModel):
    token: str
    nome: str
    mensagem: str = "Bem-vindo ao MathQuest!"


# ── Auth do pai (email + senha) ────────────────────
class RegistroResponsavelRequest(SQLModel):
    nome: str
    email: str
    senha: str


class LoginResponsavelRequest(SQLModel):
    email: str
    senha: str


class ResponsavelResponse(SQLModel):
    id: int
    nome: str
    email: str
    jwt: str


class AddFilhoRequest(SQLModel):
    nome: str


class FilhoResponse(SQLModel):
    id: int
    nome: str
    token: str


# ── Progresso ──────────────────────────────────────
class ResultadoRequest(SQLModel):
    operacao: str
    modo: str = "desafio"
    nivel: int = 1
    acertou: bool
    tempo_segundos: float = 0.0
    detalhes: Optional[str] = None


class ProgressoResponse(SQLModel):
    operacao: str
    nivel: int
    total_acertos: int
    total_erros: int
    streak_atual: int
    melhor_streak: int
    tempo_medio: float
    taxa_acerto: float = 0.0


class DashboardResponse(SQLModel):
    jogador: str
    total_desafios: int
    total_acertos: int
    taxa_geral: float
    tempo_medio_geral: float
    por_operacao: list[ProgressoResponse]
    conquistas: list[str]
    ultimos_resultados: list[dict]
