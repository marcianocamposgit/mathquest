# -*- coding: utf-8 -*-
"""
setup_fase2.py — Cria toda a estrutura do backend FastAPI (Fase 2) do MathQuest.
Rodar na raiz do projeto: python setup_fase2.py
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "src" / "backend"

GREEN, YELLOW, CYAN, RESET = "\033[92m", "\033[93m", "\033[96m", "\033[0m"

def log(color, msg):
    print(f"{color}[SETUP]{RESET} {msg}")

def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    log(GREEN, f"Criado: {path.relative_to(ROOT)}")

def main():
    print(f"{CYAN}{'='*60}")
    print(f"  MathQuest — Setup Fase 2 (Backend FastAPI)")
    print(f"{'='*60}{RESET}\n")

    # =====================================================
    # 1. ESTRUTURA DE DIRETÓRIOS
    # =====================================================
    log(CYAN, "1. Criando estrutura de diretórios...")

    dirs = [
        BACKEND / "routers",
        BACKEND / "tests",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
        log(GREEN, f"Pasta: {d.relative_to(ROOT)}")

    # =====================================================
    # 2. requirements.txt
    # =====================================================
    write(BACKEND / "requirements.txt", """\
fastapi==0.115.*
uvicorn[standard]==0.32.*
sqlmodel==0.0.22
pydantic==2.*
python-dotenv==1.*
passlib[bcrypt]==1.*
python-multipart==0.*
""")

    # =====================================================
    # 3. .env (config local)
    # =====================================================
    env_path = BACKEND / ".env"
    if not env_path.exists():
        write(env_path, """\
DATABASE_URL=sqlite:///./mathquest.db
PAI_PASSWORD=nikolas2024
SECRET_KEY=mathquest-dev-secret-change-in-production
""")
    else:
        log(YELLOW, ".env já existe, pulando")

    # =====================================================
    # 4. database.py — Conexão com o banco
    # =====================================================
    write(BACKEND / "database.py", '''\
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
''')

    # =====================================================
    # 5. models.py — Modelos SQLModel
    # =====================================================
    write(BACKEND / "models.py", '''\
"""Modelos do banco de dados (SQLModel = SQLAlchemy + Pydantic)."""
import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


# ── Jogador (criança) ──────────────────────────────────
class Jogador(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nome: str = Field(max_length=50)
    token: str = Field(default_factory=lambda: uuid.uuid4().hex, unique=True, index=True)
    criado_em: datetime = Field(default_factory=datetime.utcnow)


# ── Registro de cada desafio resolvido ─────────────────
class Resultado(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jogador_id: int = Field(foreign_key="jogador.id", index=True)
    operacao: str = Field(max_length=20)       # adicao, subtracao, etc.
    modo: str = Field(max_length=20)           # descoberta, desafio, detetive
    nivel: int = Field(default=1)
    acertou: bool
    tempo_segundos: float = Field(default=0.0)
    detalhes: Optional[str] = Field(default=None)  # JSON extra (macete usado, etc.)
    criado_em: datetime = Field(default_factory=datetime.utcnow)


# ── Progresso consolidado por operação ─────────────────
class Progresso(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jogador_id: int = Field(foreign_key="jogador.id", index=True)
    operacao: str = Field(max_length=20)
    nivel: int = Field(default=1)
    total_acertos: int = Field(default=0)
    total_erros: int = Field(default=0)
    streak_atual: int = Field(default=0)
    melhor_streak: int = Field(default=0)
    tempo_medio: float = Field(default=0.0)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)


# ── Conquistas desbloqueadas ───────────────────────────
class Conquista(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    jogador_id: int = Field(foreign_key="jogador.id", index=True)
    conquista_id: str = Field(max_length=50)   # ex: "primeiro_acerto", "streak_10"
    desbloqueada_em: datetime = Field(default_factory=datetime.utcnow)


# ── Schemas Pydantic (request/response, sem table=True) ─
class LoginRequest(SQLModel):
    nome: str


class LoginResponse(SQLModel):
    token: str
    nome: str
    mensagem: str = "Bem-vindo ao MathQuest!"


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
''')

    # =====================================================
    # 6. routers/auth.py — Login simples
    # =====================================================
    write(BACKEND / "routers" / "__init__.py", "")

    write(BACKEND / "routers" / "auth.py", '''\
"""Autenticação simples — sem senha para a criança."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Jogador, LoginRequest, LoginResponse

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, session: Session = Depends(get_session)):
    """Cria ou recupera um jogador pelo nome. Retorna o token."""
    nome = req.nome.strip()
    if not nome:
        raise HTTPException(400, "Nome não pode ser vazio")

    # Busca jogador existente
    jogador = session.exec(select(Jogador).where(Jogador.nome == nome)).first()

    if not jogador:
        jogador = Jogador(nome=nome)
        session.add(jogador)
        session.commit()
        session.refresh(jogador)

    return LoginResponse(token=jogador.token, nome=jogador.nome)
''')

    # =====================================================
    # 7. routers/progress.py — Sincronização
    # =====================================================
    write(BACKEND / "routers" / "progress.py", '''\
"""Sincronização de progresso — salvar resultados e consultar."""
from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import (
    Jogador, Resultado, Progresso,
    ResultadoRequest, ProgressoResponse, Conquista
)

router = APIRouter(prefix="/api", tags=["progresso"])


def get_jogador(authorization: str = Header(...), session: Session = Depends(get_session)) -> Jogador:
    """Extrai o jogador do token no header Authorization."""
    token = authorization.replace("Bearer ", "").strip()
    jogador = session.exec(select(Jogador).where(Jogador.token == token)).first()
    if not jogador:
        raise HTTPException(401, "Token inválido")
    return jogador


@router.get("/progresso", response_model=list[ProgressoResponse])
def get_progresso(jogador: Jogador = Depends(get_jogador), session: Session = Depends(get_session)):
    """Retorna o progresso consolidado de cada operação."""
    progs = session.exec(select(Progresso).where(Progresso.jogador_id == jogador.id)).all()

    result = []
    for p in progs:
        total = p.total_acertos + p.total_erros
        taxa = round((p.total_acertos / total * 100) if total > 0 else 0, 1)
        result.append(ProgressoResponse(
            operacao=p.operacao, nivel=p.nivel,
            total_acertos=p.total_acertos, total_erros=p.total_erros,
            streak_atual=p.streak_atual, melhor_streak=p.melhor_streak,
            tempo_medio=round(p.tempo_medio, 2), taxa_acerto=taxa
        ))
    return result


@router.post("/progresso")
def salvar_resultado(
    req: ResultadoRequest,
    jogador: Jogador = Depends(get_jogador),
    session: Session = Depends(get_session)
):
    """Salva o resultado de um desafio e atualiza o progresso consolidado."""

    # 1. Salvar resultado individual
    resultado = Resultado(
        jogador_id=jogador.id,
        operacao=req.operacao, modo=req.modo, nivel=req.nivel,
        acertou=req.acertou, tempo_segundos=req.tempo_segundos,
        detalhes=req.detalhes
    )
    session.add(resultado)

    # 2. Atualizar progresso consolidado
    prog = session.exec(
        select(Progresso).where(
            Progresso.jogador_id == jogador.id,
            Progresso.operacao == req.operacao
        )
    ).first()

    if not prog:
        prog = Progresso(jogador_id=jogador.id, operacao=req.operacao)
        session.add(prog)

    if req.acertou:
        prog.total_acertos += 1
        prog.streak_atual += 1
        if prog.streak_atual > prog.melhor_streak:
            prog.melhor_streak = prog.streak_atual
    else:
        prog.total_erros += 1
        prog.streak_atual = 0

    prog.nivel = req.nivel

    # Recalcular tempo médio
    total = prog.total_acertos + prog.total_erros
    prog.tempo_medio = ((prog.tempo_medio * (total - 1)) + req.tempo_segundos) / total
    prog.atualizado_em = datetime.utcnow()

    session.commit()
    return {"status": "ok", "streak": prog.streak_atual}
''')

    # =====================================================
    # 8. routers/dashboard.py — Painel do pai
    # =====================================================
    write(BACKEND / "routers" / "dashboard.py", '''\
"""Painel do pai — visão analítica do progresso."""
import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from passlib.hash import bcrypt

from ..database import get_session
from ..models import (
    Jogador, Progresso, Resultado, Conquista,
    DashboardResponse, ProgressoResponse
)

router = APIRouter(prefix="/api", tags=["dashboard"])

PAI_PASSWORD = os.getenv("PAI_PASSWORD", "nikolas2024")


def verificar_pai(x_pai_password: str = Header(...)):
    """Verifica a senha do pai via header."""
    if x_pai_password != PAI_PASSWORD:
        raise HTTPException(403, "Senha do painel incorreta")


@router.get("/dashboard/{nome}", response_model=DashboardResponse)
def dashboard(
    nome: str,
    session: Session = Depends(get_session),
    _: None = Depends(verificar_pai)
):
    """Retorna o dashboard completo de um jogador."""
    jogador = session.exec(select(Jogador).where(Jogador.nome == nome)).first()
    if not jogador:
        raise HTTPException(404, "Jogador não encontrado")

    # Progresso por operação
    progs = session.exec(select(Progresso).where(Progresso.jogador_id == jogador.id)).all()
    por_operacao = []
    total_acertos = 0
    total_desafios = 0
    soma_tempo = 0.0

    for p in progs:
        total = p.total_acertos + p.total_erros
        taxa = round((p.total_acertos / total * 100) if total > 0 else 0, 1)
        total_acertos += p.total_acertos
        total_desafios += total
        soma_tempo += p.tempo_medio * total
        por_operacao.append(ProgressoResponse(
            operacao=p.operacao, nivel=p.nivel,
            total_acertos=p.total_acertos, total_erros=p.total_erros,
            streak_atual=p.streak_atual, melhor_streak=p.melhor_streak,
            tempo_medio=round(p.tempo_medio, 2), taxa_acerto=taxa
        ))

    taxa_geral = round((total_acertos / total_desafios * 100) if total_desafios > 0 else 0, 1)
    tempo_medio_geral = round((soma_tempo / total_desafios) if total_desafios > 0 else 0, 2)

    # Conquistas
    conquistas = session.exec(
        select(Conquista).where(Conquista.jogador_id == jogador.id)
    ).all()
    lista_conquistas = [c.conquista_id for c in conquistas]

    # Últimos 20 resultados
    ultimos = session.exec(
        select(Resultado)
        .where(Resultado.jogador_id == jogador.id)
        .order_by(Resultado.criado_em.desc())
        .limit(20)
    ).all()
    ultimos_dict = [
        {
            "operacao": r.operacao, "modo": r.modo, "nivel": r.nivel,
            "acertou": r.acertou, "tempo": r.tempo_segundos,
            "data": r.criado_em.isoformat()
        }
        for r in ultimos
    ]

    return DashboardResponse(
        jogador=jogador.nome,
        total_desafios=total_desafios,
        total_acertos=total_acertos,
        taxa_geral=taxa_geral,
        tempo_medio_geral=tempo_medio_geral,
        por_operacao=por_operacao,
        conquistas=lista_conquistas,
        ultimos_resultados=ultimos_dict
    )


@router.get("/dashboard")
def listar_jogadores(
    session: Session = Depends(get_session),
    _: None = Depends(verificar_pai)
):
    """Lista todos os jogadores (para o pai escolher qual ver)."""
    jogadores = session.exec(select(Jogador)).all()
    return [{"nome": j.nome, "criado_em": j.criado_em.isoformat()} for j in jogadores]
''')

    # =====================================================
    # 9. main.py — App FastAPI
    # =====================================================
    write(BACKEND / "main.py", '''\
"""MathQuest — Backend FastAPI (Fase 2)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_db
from .routers import auth, progress, dashboard

app = FastAPI(
    title="MathQuest API",
    description="Backend do sistema educacional MathQuest",
    version="2.0.0"
)

# CORS — permite o frontend (Netlify, localhost) bater na API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir para o domínio do Netlify
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router)
app.include_router(progress.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup():
    """Cria as tabelas no banco ao iniciar."""
    create_db()


@app.get("/")
def root():
    return {
        "app": "MathQuest API",
        "versao": "2.0.0",
        "docs": "/docs",
        "status": "online"
    }
''')

    # =====================================================
    # 10. __init__.py do backend
    # =====================================================
    write(BACKEND / "__init__.py", "")

    # =====================================================
    # 11. .gitignore update
    # =====================================================
    gitignore = ROOT / ".gitignore"
    current = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    extras = [
        "venv/", "__pycache__/", "*.pyc", ".env",
        "*.db", "*.db-journal", ".pytest_cache/"
    ]
    added = []
    for e in extras:
        if e not in current:
            current += f"\n{e}"
            added.append(e)
    if added:
        gitignore.write_text(current.strip() + "\n", encoding="utf-8")
        log(GREEN, f".gitignore atualizado: +{', '.join(added)}")

    # =====================================================
    # 12. CRIAR VENV E INSTALAR DEPENDÊNCIAS
    # =====================================================
    print(f"\n{CYAN}{'='*60}")
    print(f"  Criando ambiente virtual e instalando dependências...")
    print(f"{'='*60}{RESET}\n")

    venv_dir = ROOT / "venv"
    if not venv_dir.exists():
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
        log(GREEN, "venv criado")
    else:
        log(YELLOW, "venv já existe")

    # Detectar pip do venv
    if os.name == "nt":
        pip = str(venv_dir / "Scripts" / "pip.exe")
    else:
        pip = str(venv_dir / "bin" / "pip")

    subprocess.run([pip, "install", "-r", str(BACKEND / "requirements.txt")], check=True)
    log(GREEN, "Dependências instaladas")

    # =====================================================
    # RESUMO FINAL
    # =====================================================
    print(f"\n{CYAN}{'='*60}")
    print(f"  SETUP COMPLETO!")
    print(f"{'='*60}{RESET}")
    print(f"""
{GREEN}Estrutura criada:{RESET}
  src/backend/
  ├── main.py              (App FastAPI)
  ├── database.py          (Conexão SQLite/PostgreSQL)
  ├── models.py            (4 tabelas + schemas)
  ├── requirements.txt
  ├── .env                 (senha do pai: nikolas2024)
  └── routers/
      ├── auth.py          (POST /api/login)
      ├── progress.py      (GET/POST /api/progresso)
      └── dashboard.py     (GET /api/dashboard)

{YELLOW}Para rodar:{RESET}
  cd D:\\Projetos\\MathQuest
  .\\venv\\Scripts\\Activate.ps1
  uvicorn src.backend.main:app --reload --port 8001

{YELLOW}Depois abra:{RESET}
  http://localhost:8001       → Status
  http://localhost:8001/docs  → Swagger (testar endpoints)
""")


if __name__ == "__main__":
    main()
