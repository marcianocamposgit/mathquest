# -*- coding: utf-8 -*-
"""
preparar_deploy_v2.py — Prepara o deploy (Render + Aiven) com as 3 correções:
  1. startCommand com python -m uvicorn
  2. JWT_SECRET → SECRET_KEY (nome que o auth_utils.py realmente lê)
  3. PAI_PASSWORD incluído no render.yaml

Uso: python preparar_deploy_v2.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "src" / "backend"

GREEN  = "\033[92m"
CYAN   = "\033[96m"
YELLOW = "\033[93m"
RESET  = "\033[0m"

def log(color, msg):
    print(f"{color}[DEPLOY]{RESET} {msg}")


def main():
    log(CYAN, "=== Preparando deploy (v2 corrigido) ===\n")

    # ── 1. Adicionar psycopg2-binary ao requirements.txt ──
    req_path = BACKEND / "requirements.txt"
    content = req_path.read_text(encoding="utf-8")
    if "psycopg2" not in content:
        content = content.rstrip() + "\npsycopg2-binary>=2.9\n"
        req_path.write_text(content, encoding="utf-8", newline="\n")
        log(GREEN, "  requirements.txt: psycopg2-binary adicionado")
    else:
        log(YELLOW, "  requirements.txt: psycopg2 ja existe")

    # ── 2. Criar render.yaml corrigido ──
    render_yaml = ROOT / "render.yaml"
    render_yaml.write_text(
        'services:\n'
        '  - type: web\n'
        '    name: mathquest-api\n'
        '    runtime: python\n'
        '    region: oregon\n'
        '    plan: free\n'
        '    buildCommand: pip install -r src/backend/requirements.txt\n'
        '    startCommand: python -m uvicorn src.backend.main:app --host 0.0.0.0 --port $PORT\n'
        '    envVars:\n'
        '      - key: DATABASE_URL\n'
        '        sync: false\n'
        '      - key: SECRET_KEY\n'
        '        generateValue: true\n'
        '      - key: PAI_PASSWORD\n'
        '        value: nikolas2024\n'
        '      - key: PYTHONPATH\n'
        '        value: .\n',
        encoding="utf-8", newline="\n"
    )
    log(GREEN, "  render.yaml criado (corrigido)")

    # ── 3. Patch no auth_utils.py: aceitar SECRET_KEY ou JWT_SECRET ──
    auth_path = BACKEND / "auth_utils.py"
    if auth_path.exists():
        auth_content = auth_path.read_text(encoding="utf-8")
        # Verifica se já aceita os dois
        if "JWT_SECRET" not in auth_content:
            # Adiciona fallback para JWT_SECRET
            old = 'os.getenv("SECRET_KEY"'
            if old in auth_content:
                new = 'os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET"'
                auth_content = auth_content.replace(old, new, 1)
                auth_path.write_text(auth_content, encoding="utf-8", newline="\n")
                log(GREEN, "  auth_utils.py: fallback JWT_SECRET adicionado")
            else:
                log(YELLOW, "  auth_utils.py: padrao de SECRET_KEY nao encontrado (verifique manualmente)")
        else:
            log(YELLOW, "  auth_utils.py: ja aceita JWT_SECRET")
    else:
        log(YELLOW, "  auth_utils.py nao encontrado")

    # ── Instruções ──
    log(GREEN, "\n=== Arquivos prontos! ===\n")

    log(CYAN, "CORRECOES APLICADAS:")
    log(CYAN, "  [1] startCommand: python -m uvicorn (mais robusto que uvicorn direto)")
    log(CYAN, "  [2] SECRET_KEY no render.yaml (nome correto que auth_utils.py le)")
    log(CYAN, "  [3] PAI_PASSWORD incluido no render.yaml\n")

    log(CYAN, "PASSO 1 — Commit e push:")
    log(CYAN, "  git add .")
    log(CYAN, '  git commit -m "chore: preparar deploy Render + PostgreSQL"')
    log(CYAN, "  git push\n")

    log(CYAN, "PASSO 2 — Criar banco PostgreSQL gratuito no Aiven:")
    log(CYAN, "  a) Acesse: https://aiven.io")
    log(CYAN, "  b) Crie conta gratuita (login Google/GitHub, sem cartao)")
    log(CYAN, "  c) Create Service > PostgreSQL > Free plan")
    log(CYAN, "  d) Regiao: google-europe-west1 (ou a mais proxima)")
    log(CYAN, "  e) Copie a Service URI completa")
    log(CYAN, "     Formato: postgresql://user:pass@host:port/db?sslmode=require\n")

    log(CYAN, "PASSO 3 — Deploy no Render:")
    log(CYAN, "  a) Acesse: https://render.com")
    log(CYAN, "  b) Crie conta com GitHub")
    log(CYAN, "  c) New > Web Service > conecte marcianocamposgit/mathquest")
    log(CYAN, "  d) O Render detecta o render.yaml automaticamente")
    log(CYAN, "  e) Em Environment > DATABASE_URL, cole a URI do Aiven")
    log(CYAN, "  f) Clique Deploy\n")

    log(CYAN, "PASSO 4 — Testar o backend na nuvem:")
    log(CYAN, "  https://mathquest-api.onrender.com/docs")
    log(CYAN, "  https://mathquest-api.onrender.com/api/dashboard/busca?nome=Nikolas\n")

    log(CYAN, "PASSO 5 — Conectar o frontend ao backend na nuvem:")
    log(CYAN, "  No console do navegador:")
    log(CYAN, '  localStorage.setItem("mathquest_api_url", "https://SUA-URL.onrender.com")')
    log(CYAN, "  Ou edite pai.js e storageManager.js com a URL fixa\n")

    log(YELLOW, "NOTAS:")
    log(YELLOW, "  - Render Free hiberna apos 15 min (primeiro acesso ~30s)")
    log(YELLOW, "  - Aiven Free NAO hiberna (dados seguros)")
    log(YELLOW, "  - Custo total: R$ 0\n")


if __name__ == "__main__":
    main()
