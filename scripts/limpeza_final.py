# -*- coding: utf-8 -*-
"""
limpeza_final.py — Limpa raiz e atualiza roadmap.
1. Move scripts de fix pra scripts/
2. Marca animacoes e Fase 3 como completas no README
3. Atualiza descricao da Fase 3

Uso: python limpeza_final.py
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
SCRIPTS_DIR = ROOT / "scripts"

GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def log(color, msg):
    print(f"{color}[LIMPEZA]{RESET} {msg}")


def main():
    log(GREEN, "=== Limpeza final ===\n")

    # 1. Mover scripts da raiz pra scripts/
    scripts_to_move = [
        "fix_botao_maquina.py",
        "fix_builder_integration.py",
        "fix_builder_levels.py",
        "fix_builder_ux.py",
        "integrar_builder.py",
        "limpeza_final.py",
    ]

    movidos = 0
    for f in scripts_to_move:
        src = ROOT / f
        if src.exists():
            dest = SCRIPTS_DIR / f
            shutil.move(str(src), str(dest))
            movidos += 1
            log(GREEN, f"  Movido: {f} -> scripts/")

    if movidos == 0:
        log(YELLOW, "  Nenhum script pra mover")

    # 2. Atualizar roadmap no README
    readme = ROOT / "README.md"
    c = readme.read_text(encoding="utf-8")
    changes = 0

    updates = [
        (
            "[ ] Animações pedagógicas avançadas",
            "[x] Animações pedagógicas avançadas (Passar o 10, divisão com resto, decomposição)"
        ),
        (
            "[ ] Empacotamento para lojas (PWABuilder/Capacitor)",
            "[ ] Empacotamento para lojas (PWABuilder/Capacitor)"
        ),
        (
            "[ ] Fase 3: Lógica computacional (condicionais, loops, variáveis com blocos visuais)",
            "[x] Fase 3: Máquina Matemática (10 fases, encadeamento de operações)"
        ),
    ]

    for old, new in updates:
        if old in c and old != new:
            c = c.replace(old, new)
            changes += 1

    if changes > 0:
        readme.write_text(c, encoding="utf-8", newline="\n")
        log(GREEN, f"  README: {changes} itens atualizados no roadmap")
    else:
        log(YELLOW, "  README: roadmap ja esta atualizado")

    # 3. Mostrar estado final
    log(GREEN, "\n=== Raiz limpa ===")
    for item in sorted(ROOT.iterdir()):
        if item.name in ('.git', 'venv', '__pycache__'):
            continue
        log(GREEN, f"  {item.name}")

    log(GREEN, "\nRoadmap atualizado:")
    log(GREEN, "  [x] Animacoes pedagogicas avancadas")
    log(GREEN, "  [x] Fase 3: Maquina Matematica")
    log(YELLOW, "  [ ] Empacotamento para lojas (unico pendente)")


if __name__ == "__main__":
    main()
