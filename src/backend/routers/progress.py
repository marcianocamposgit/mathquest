"""Sincronização de progresso — salvar resultados e consultar."""
from datetime import datetime, timezone
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
    prog.atualizado_em = datetime.now(timezone.utc)

    session.commit()
    return {"status": "ok", "streak": prog.streak_atual}
