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
