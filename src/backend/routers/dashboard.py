"""Painel do pai — visão analítica do progresso dos filhos."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from ..database import get_session
from ..auth_utils import decode_token
from ..models import (
    Responsavel, Jogador, Progresso, Resultado, Conquista,
    DashboardResponse, ProgressoResponse
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
bearer_scheme = HTTPBearer()


def get_pai_logado(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> Responsavel:
    """Extrai o pai do JWT no header Authorization."""
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("tipo") != "pai":
        raise HTTPException(401, "Token inválido ou expirado")
    pai = session.get(Responsavel, int(payload["sub"]))
    if not pai:
        raise HTTPException(404, "Responsável não encontrado")
    return pai


@router.get("/filhos")
def listar_filhos_dashboard(
    session: Session = Depends(get_session),
    pai: Responsavel = Depends(get_pai_logado)
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
    pai: Responsavel = Depends(get_pai_logado)
):
    """Dashboard detalhado de um filho específico."""
    jogador = session.get(Jogador, jogador_id)
    if not jogador:
        raise HTTPException(404, "Jogador não encontrado")
    if jogador.responsavel_id != pai.id:
        raise HTTPException(403, "Este jogador não é seu filho")

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

    conquistas = session.exec(select(Conquista).where(Conquista.jogador_id == jogador.id)).all()
    lista_conquistas = [c.conquista_id for c in conquistas]

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