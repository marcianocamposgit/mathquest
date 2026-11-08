# -*- coding: utf-8 -*-
"""
setup_multiuser.py — Evolui o backend MathQuest para multi-usuário.
Adiciona: Responsavel (pai), JWT auth, vínculo pai→filho(s), dashboard isolado.
Rodar na raiz: python setup_multiuser.py
"""
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
    print(f"  MathQuest — Setup Multi-Usuário (JWT + Responsável)")
    print(f"{'='*60}{RESET}\n")

    # =====================================================
    # 1. INSTALAR DEPENDÊNCIA JWT
    # =====================================================
    log(CYAN, "1. Atualizando requirements.txt...")
    req_path = BACKEND / "requirements.txt"
    req = req_path.read_text(encoding="utf-8")
    if "python-jose" not in req:
        req += "python-jose[cryptography]==3.*\n"
        req_path.write_text(req, encoding="utf-8", newline="\n")
        log(GREEN, "Adicionado python-jose ao requirements.txt")

        import subprocess, sys, os
        venv = ROOT / "venv"
        pip = str(venv / ("Scripts" if os.name == "nt" else "bin") / "pip")
        subprocess.run([pip, "install", "python-jose[cryptography]"], check=True)
        log(GREEN, "python-jose instalado")
    else:
        log(YELLOW, "python-jose já está no requirements.txt")

    # =====================================================
    # 2. AUTH UTILS (JWT + hashing)
    # =====================================================
    log(CYAN, "2. Criando auth_utils.py...")

    write(BACKEND / "auth_utils.py", '''\
"""Utilitários de autenticação: JWT + hash de senha."""
import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.hash import bcrypt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "mathquest-dev-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)


def create_token(data: dict) -> str:
    """Cria um JWT com expiração."""
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {**data, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodifica o JWT. Retorna None se inválido/expirado."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
''')

    # =====================================================
    # 3. MODELS.PY (atualizado com Responsavel)
    # =====================================================
    log(CYAN, "3. Atualizando models.py com Responsavel...")

    write(BACKEND / "models.py", '''\
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
''')

    # =====================================================
    # 4. ROUTER AUTH DO PAI
    # =====================================================
    log(CYAN, "4. Criando routers/pai.py...")

    write(BACKEND / "routers" / "pai.py", '''\
"""Auth e gestão do pai/responsável — registro, login JWT, vincular filhos."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..auth_utils import hash_password, verify_password, create_token, decode_token
from ..models import (
    Responsavel, Jogador,
    RegistroResponsavelRequest, LoginResponsavelRequest,
    ResponsavelResponse, AddFilhoRequest, FilhoResponse
)

router = APIRouter(prefix="/api/pai", tags=["pai"])


@router.post("/registro", response_model=ResponsavelResponse)
def registrar(req: RegistroResponsavelRequest, session: Session = Depends(get_session)):
    """Cria conta do pai/responsável."""
    # Validações
    if not req.nome.strip():
        raise HTTPException(400, "Nome não pode ser vazio")
    if not req.email.strip() or "@" not in req.email:
        raise HTTPException(400, "Email inválido")
    if len(req.senha) < 6:
        raise HTTPException(400, "Senha deve ter pelo menos 6 caracteres")

    # Verificar email duplicado
    existe = session.exec(select(Responsavel).where(Responsavel.email == req.email.lower().strip())).first()
    if existe:
        raise HTTPException(409, "Email já cadastrado")

    responsavel = Responsavel(
        nome=req.nome.strip(),
        email=req.email.lower().strip(),
        senha_hash=hash_password(req.senha)
    )
    session.add(responsavel)
    session.commit()
    session.refresh(responsavel)

    token = create_token({"sub": str(responsavel.id), "tipo": "pai"})

    return ResponsavelResponse(
        id=responsavel.id, nome=responsavel.nome,
        email=responsavel.email, jwt=token
    )


@router.post("/login", response_model=ResponsavelResponse)
def login(req: LoginResponsavelRequest, session: Session = Depends(get_session)):
    """Login do pai com email + senha. Retorna JWT."""
    responsavel = session.exec(
        select(Responsavel).where(Responsavel.email == req.email.lower().strip())
    ).first()

    if not responsavel or not verify_password(req.senha, responsavel.senha_hash):
        raise HTTPException(401, "Email ou senha incorretos")

    token = create_token({"sub": str(responsavel.id), "tipo": "pai"})

    return ResponsavelResponse(
        id=responsavel.id, nome=responsavel.nome,
        email=responsavel.email, jwt=token
    )


def get_responsavel_logado(authorization: str = Depends(lambda authorization: authorization),
                           session: Session = Depends(get_session)) -> Responsavel:
    """Extrai o responsável do JWT."""
    from fastapi import Header
    # Será chamado via Depends em outros endpoints
    pass


@router.post("/filhos", response_model=FilhoResponse)
def adicionar_filho(
    req: AddFilhoRequest,
    session: Session = Depends(get_session),
    authorization: str = None
):
    """Vincula um filho ao pai autenticado."""
    from fastapi import Header
    if not authorization:
        raise HTTPException(401, "Token JWT necessário no header Authorization")

    token_str = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token_str)
    if not payload or payload.get("tipo") != "pai":
        raise HTTPException(401, "Token inválido ou expirado")

    pai_id = int(payload["sub"])
    pai = session.get(Responsavel, pai_id)
    if not pai:
        raise HTTPException(404, "Responsável não encontrado")

    # Verifica se já existe um jogador com esse nome vinculado a este pai
    existente = session.exec(
        select(Jogador).where(Jogador.nome == req.nome.strip(), Jogador.responsavel_id == pai_id)
    ).first()
    if existente:
        return FilhoResponse(id=existente.id, nome=existente.nome, token=existente.token)

    # Verifica se existe um jogador "solto" com esse nome (sem responsável) e vincula
    solto = session.exec(
        select(Jogador).where(Jogador.nome == req.nome.strip(), Jogador.responsavel_id == None)
    ).first()
    if solto:
        solto.responsavel_id = pai_id
        session.commit()
        session.refresh(solto)
        return FilhoResponse(id=solto.id, nome=solto.nome, token=solto.token)

    # Cria novo jogador vinculado
    jogador = Jogador(nome=req.nome.strip(), responsavel_id=pai_id)
    session.add(jogador)
    session.commit()
    session.refresh(jogador)

    return FilhoResponse(id=jogador.id, nome=jogador.nome, token=jogador.token)


@router.get("/filhos", response_model=list[FilhoResponse])
def listar_filhos(
    session: Session = Depends(get_session),
    authorization: str = None
):
    """Lista os filhos vinculados ao pai autenticado."""
    if not authorization:
        raise HTTPException(401, "Token JWT necessário")

    token_str = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token_str)
    if not payload or payload.get("tipo") != "pai":
        raise HTTPException(401, "Token inválido")

    pai_id = int(payload["sub"])
    filhos = session.exec(select(Jogador).where(Jogador.responsavel_id == pai_id)).all()
    return [FilhoResponse(id=f.id, nome=f.nome, token=f.token) for f in filhos]
''')

    # =====================================================
    # 5. ATUALIZAR DASHBOARD (usar JWT em vez de senha fixa)
    # =====================================================
    log(CYAN, "5. Atualizando dashboard.py com JWT...")

    write(BACKEND / "routers" / "dashboard.py", '''\
"""Painel do pai — visão analítica do progresso dos filhos."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..auth_utils import decode_token
from ..models import (
    Responsavel, Jogador, Progresso, Resultado, Conquista,
    DashboardResponse, ProgressoResponse
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def get_pai_from_jwt(authorization: str = None, session: Session = Depends(get_session)) -> Responsavel:
    """Extrai o pai do JWT no header Authorization."""
    if not authorization:
        raise HTTPException(401, "Token JWT necessário no header Authorization")

    token_str = authorization.replace("Bearer ", "").strip()
    payload = decode_token(token_str)
    if not payload or payload.get("tipo") != "pai":
        raise HTTPException(401, "Token inválido ou expirado")

    pai = session.get(Responsavel, int(payload["sub"]))
    if not pai:
        raise HTTPException(404, "Responsável não encontrado")
    return pai


@router.get("/filhos")
def listar_filhos_dashboard(
    session: Session = Depends(get_session),
    pai: Responsavel = Depends(get_pai_from_jwt)
):
    """Lista filhos do pai com resumo rápido."""
    filhos = session.exec(select(Jogador).where(Jogador.responsavel_id == pai.id)).all()

    result = []
    for f in filhos:
        progs = session.exec(select(Progresso).where(Progresso.jogador_id == f.id)).all()
        total_a = sum(p.total_acertos for p in progs)
        total_e = sum(p.total_erros for p in progs)
        total = total_a + total_e
        taxa = round((total_a / total * 100) if total > 0 else 0, 1)
        result.append({
            "id": f.id, "nome": f.nome,
            "total_desafios": total, "taxa_acerto": taxa,
            "criado_em": f.criado_em.isoformat()
        })
    return result


@router.get("/{jogador_id}", response_model=DashboardResponse)
def dashboard_filho(
    jogador_id: int,
    session: Session = Depends(get_session),
    pai: Responsavel = Depends(get_pai_from_jwt)
):
    """Dashboard detalhado de um filho específico."""
    jogador = session.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(404, "Jogador não encontrado")
    if jogador.responsavel_id != pai.id:
        raise HTTPException(403, "Este jogador não é seu filho")

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
    conquistas = session.exec(select(Conquista).where(Conquista.jogador_id == jogador.id)).all()
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
''')

    # =====================================================
    # 6. ATUALIZAR main.py (adicionar router pai)
    # =====================================================
    log(CYAN, "6. Atualizando main.py...")

    write(BACKEND / "main.py", '''\
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
''')

    # =====================================================
    # 7. DELETAR BANCO ANTIGO (schema mudou)
    # =====================================================
    db_file = ROOT / "mathquest.db"
    if db_file.exists():
        db_file.unlink()
        log(YELLOW, "Banco antigo deletado (schema mudou). Será recriado ao iniciar.")

    # =====================================================
    # RESUMO
    # =====================================================
    print(f"\n{CYAN}{'='*60}")
    print(f"  SETUP MULTI-USUÁRIO COMPLETO!")
    print(f"{'='*60}{RESET}")
    print(f"""
{GREEN}Novos endpoints:{RESET}
  POST /api/pai/registro     → Pai cria conta (nome, email, senha)
  POST /api/pai/login        → Pai faz login (email, senha) → JWT
  POST /api/pai/filhos       → Pai vincula um filho (JWT no header)
  GET  /api/pai/filhos       → Pai lista seus filhos

{GREEN}Dashboard atualizado:{RESET}
  GET  /api/dashboard/filhos       → Lista filhos com resumo (JWT)
  GET  /api/dashboard/{{jogador_id}} → Dashboard detalhado de um filho (JWT)

{GREEN}Mantido (criança):{RESET}
  POST /api/login             → Criança faz login por nome → token
  POST /api/progresso         → Salvar resultado (token)
  GET  /api/progresso         → Ver progresso (token)

{YELLOW}Próximo passo:{RESET}
  Reinicie o uvicorn e teste no Swagger (localhost:8001/docs)
""")


if __name__ == "__main__":
    main()
