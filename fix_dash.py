p = r"D:\Projetos\MathQuest\src\backend\routers\dashboard.py"
txt = open(p, encoding="utf-8").read()
txt = txt.replace(
    "from fastapi import APIRouter, Depends, HTTPException",
    "from fastapi import APIRouter, Depends, HTTPException\nfrom fastapi.security import HTTPBearer, HTTPAuthorizationCredentials"
)
txt = txt.replace(
    "def get_pai_from_jwt(authorization: str = None, session: Session = Depends(get_session)) -> Responsavel:",
    "bearer_scheme = HTTPBearer()\n\ndef get_pai_from_jwt(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), session: Session = Depends(get_session)) -> Responsavel:"
)
txt = txt.replace("if not authorization:", "# auth via HTTPBearer")
txt = txt.replace('raise HTTPException(401, "Token JWT necess' + u'\u00e1rio no header Authorization")', "pass")
txt = txt.replace('token_str = authorization.replace("Bearer ", "").strip()', "token_str = credentials.credentials")
open(p, "w", encoding="utf-8", newline="\n").write(txt)
print("dashboard.py corrigido!")
