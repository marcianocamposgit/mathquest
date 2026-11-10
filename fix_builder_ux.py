# -*- coding: utf-8 -*-
"""
fix_builder_ux.py — Melhora UX do BuilderMode.
1. Renomeia blocos pra deixar claro que eh girar, nao mover
2. Adiciona turnLeft a partir da Fase 2

Uso: python fix_builder_ux.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BM = ROOT / "src" / "frontend" / "assets" / "js" / "modes" / "builderMode.js"

def main():
    c = BM.read_text(encoding="utf-8")
    changes = 0

    # 1. Renomear labels dos blocos
    renames = [
        ("label: 'Frente',   color: '#00b894'", "label: 'Frente',    color: '#00b894'"),
        ("label: 'Direita',  color: '#6c5ce7'", "label: 'Girar \\u27A1', color: '#6c5ce7'"),
        ("label: 'Esquerda', color: '#fdcb6e'", "label: 'Girar \\u2B05', color: '#fdcb6e'"),
    ]

    # Fix mais robusto: trocar os emojis e labels no BLOCKS
    old_blocks = """const BLOCKS = {
        forward:    { emoji: '\\u2B06\\uFE0F', label: 'Frente',   color: '#00b894' },
        turnRight:  { emoji: '\\u27A1\\uFE0F', label: 'Direita',  color: '#6c5ce7' },
        turnLeft:   { emoji: '\\u2B05\\uFE0F', label: 'Esquerda', color: '#fdcb6e' },
        repeat2:    { emoji: '\\uD83D\\uDD01',  label: 'Repetir 2x', color: '#e17055', advanced: true },
    };"""

    new_blocks = """const BLOCKS = {
        forward:    { emoji: '\\u2B06\\uFE0F', label: 'Frente',       color: '#00b894' },
        turnRight:  { emoji: '\\u21A9\\uFE0F', label: 'Virar Direita', color: '#6c5ce7' },
        turnLeft:   { emoji: '\\u21AA\\uFE0F', label: 'Virar Esquerda', color: '#fdcb6e' },
        repeat2:    { emoji: '\\uD83D\\uDD01',  label: 'Repetir 2x',   color: '#e17055', advanced: true },
    };"""

    if old_blocks in c:
        c = c.replace(old_blocks, new_blocks)
        changes += 1
        print("[OK] Labels dos blocos renomeados (Direita -> Virar Direita, etc)")
    else:
        # Tentar match parcial
        if "label: 'Direita'" in c:
            c = c.replace("label: 'Direita'", "label: 'Virar Direita'")
            c = c.replace("label: 'Esquerda'", "label: 'Virar Esquerda'")
            c = c.replace("emoji: '\\u27A1\\uFE0F'", "emoji: '\\u21A9\\uFE0F'")
            c = c.replace("emoji: '\\u2B05\\uFE0F'", "emoji: '\\u21AA\\uFE0F'")
            changes += 1
            print("[OK] Labels renomeados via match parcial")

    # 2. Fase 2: adicionar turnLeft aos blocos disponiveis
    old_fase2 = "availableBlocks: ['forward', 'turnRight'],"
    new_fase2 = "availableBlocks: ['forward', 'turnRight', 'turnLeft'],"
    if old_fase2 in c:
        c = c.replace(old_fase2, new_fase2, 1)  # so a primeira ocorrencia (Fase 2)
        changes += 1
        print("[OK] Fase 2: turnLeft adicionado aos blocos disponiveis")

    if changes > 0:
        BM.write_text(c, encoding="utf-8", newline="\n")
        print(f"\n[OK] {changes} correcoes aplicadas")
    else:
        print("[AVISO] Nenhuma alteracao feita — verifique o arquivo manualmente")

    print("\nLabels atualizados:")
    print("  Frente      = mover pra frente (na direcao que o robo ta olhando)")
    print("  Virar Direita  = girar 90 graus pra direita (nao move)")
    print("  Virar Esquerda = girar 90 graus pra esquerda (nao move)")
    print("  Repetir 2x  = repete o bloco anterior mais uma vez")


if __name__ == "__main__":
    main()
