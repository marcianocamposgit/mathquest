# -*- coding: utf-8 -*-
"""
integrar_builder.py — Integra o BuilderMode no MathQuest.
1. Adiciona <script> do builderMode.js no index.html
2. Adiciona rota 'builder' no gameEngine.js
3. Adiciona botao 'Logica' na tela inicial

Uso: python integrar_builder.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def log(color, msg):
    print(f"{color}[BUILDER]{RESET} {msg}")


def fix_index_html():
    p = ROOT / "src" / "frontend" / "index.html"
    c = p.read_text(encoding="utf-8")

    if "builderMode" in c:
        log(YELLOW, "index.html: builderMode ja existe, pulando.")
        return

    # Inserir antes do gameEngine.js
    old = 'assets/js/engine/gameEngine.js'
    new = 'assets/js/modes/builderMode.js"></script>\n    <script src="assets/js/engine/gameEngine.js'

    if old in c:
        c = c.replace(old, new, 1)
        p.write_text(c, encoding="utf-8", newline="\n")
        log(GREEN, "index.html: builderMode.js adicionado antes do gameEngine.js")
    else:
        log(YELLOW, "index.html: padrao gameEngine.js nao encontrado, adicione manualmente")


def fix_game_engine():
    p = ROOT / "src" / "frontend" / "assets" / "js" / "engine" / "gameEngine.js"
    c = p.read_text(encoding="utf-8")

    changes = 0

    # 1. Adicionar rota builder no startMode
    if "BuilderMode" not in c:
        old_route = "else if (modeKey === 'detetive')"
        new_route = (
            "else if (modeKey === 'builder') { BuilderMode.showLevelSelect(); return; }\n"
            "        else if (modeKey === 'detetive')"
        )
        if old_route in c:
            c = c.replace(old_route, new_route, 1)
            changes += 1
            log(GREEN, "gameEngine.js: rota 'builder' adicionada no startMode")

    # 2. Adicionar botao Logica na tela inicial
    if "Logica" not in c and "logica" not in c.lower():
        # Procura o botao de Conquistas e adiciona o de Logica depois
        marker = "Conquistas</button>'"
        if marker in c:
            botao_logica = (
                "Conquistas</button>'\n"
                "            + '<button onclick=\"BuilderMode.showLevelSelect()\" "
                "style=\"background:none; border:1px solid var(--color-accent)33; "
                "color:var(--color-accent); padding:var(--space-sm) var(--space-lg); "
                "border-radius:var(--radius-md); cursor:pointer; "
                "font-family:var(--font-family-main);\">\\uD83E\\uDDE0 L\\u00f3gica</button>'"
            )
            c = c.replace(marker, botao_logica, 1)
            changes += 1
            log(GREEN, "gameEngine.js: botao Logica adicionado na tela inicial")

    if changes > 0:
        p.write_text(c, encoding="utf-8", newline="\n")
    elif "BuilderMode" in c:
        log(YELLOW, "gameEngine.js: BuilderMode ja integrado")
    else:
        log(YELLOW, "gameEngine.js: padroes nao encontrados, verifique manualmente")


def verify():
    # Verificar se builderMode.js existe
    bm = ROOT / "src" / "frontend" / "assets" / "js" / "modes" / "builderMode.js"
    if bm.exists():
        log(GREEN, f"builderMode.js encontrado ({bm.stat().st_size} bytes)")
    else:
        log(YELLOW, "ATENCAO: builderMode.js NAO encontrado em assets/js/modes/")
        log(YELLOW, "Baixe o arquivo e salve em: src/frontend/assets/js/modes/builderMode.js")


def main():
    log(GREEN, "=== Integrando BuilderMode ===\n")
    verify()
    fix_index_html()
    fix_game_engine()
    log(GREEN, "\n=== Integracao completa! ===")
    log(GREEN, "Teste: http://localhost:8000 -> botao 'Logica' na tela inicial")


if __name__ == "__main__":
    main()
