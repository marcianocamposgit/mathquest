"""Auth e gestão do pai/responsável — registro, login JWT, vincular filhos."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from ..database import get_session
from ..auth_utils import hash_password, verify_password, create_token, decode_token
from ..models import (
    Responsavel, Jogador,
    RegistroResponsavelRequest, LoginResponsavelRequest,
    ResponsavelResponse, AddFilhoRequest, FilhoResponse
)

router = APIRouter(prefix="/api/pai", tags=["pai"])
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


@router.post("/registro", response_model=ResponsavelResponse)
def registrar(req: RegistroResponsavelRequest, session: Session = Depends(get_session)):
    if not req.nome.strip():
        raise HTTPException(400, "Nome não pode ser vazio")
    if not req.email.strip() or "@" not in req.email:
        raise HTTPException(400, "Email inválido")
    if len(req.senha) < 6:
        raise HTTPException(400, "Senha deve ter pelo menos 6 caracteres")

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


@router.post("/filhos", response_model=FilhoResponse)
def adicionar_filho(
    req: AddFilhoRequest,
    pai: Responsavel = Depends(get_pai_logado),
    session: Session = Depends(get_session),
):
    nome = req.nome.strip()
    if not nome:
        raise HTTPException(400, "Nome do filho não pode ser vazio")

    existente = session.exec(
        select(Jogador).where(Jogador.nome == nome, Jogador.responsavel_id == pai.id)
    ).first()
    if existente:
        return FilhoResponse(id=existente.id, nome=existente.nome, token=existente.token)

    solto = session.exec(
        select(Jogador).where(Jogador.nome == nome, Jogador.responsavel_id == None)
    ).first()
    if solto:
        solto.responsavel_id = pai.id
        session.commit()
        session.refresh(solto)
        return FilhoResponse(id=solto.id, nome=solto.nome, token=solto.token)

    jogador = Jogador(nome=nome, responsavel_id=pai.id)
    session.add(jogador)
    session.commit()
    session.refresh(jogador)
    return FilhoResponse(id=jogador.id, nome=jogador.nome, token=jogador.token)


@router.get("/filhos", response_model=list[FilhoResponse])
def listar_filhos(
    pai: Responsavel = Depends(get_pai_logado),
    session: Session = Depends(get_session),
):
    filhos = session.exec(select(Jogador).where(Jogador.responsavel_id == pai.id)).all()
    return [FilhoResponse(id=f.id, nome=f.nome, token=f.token) for f in filhos]
