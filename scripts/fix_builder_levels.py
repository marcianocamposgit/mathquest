# -*- coding: utf-8 -*-
"""
fix_builder_levels.py — Corrige as fases do BuilderMode.
Problemas: algumas fases nao sao solucionaveis com os blocos disponiveis.
Correcao: direcao inicial, blocos disponiveis e layout das fases.

Uso: python fix_builder_levels.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BM = ROOT / "src" / "frontend" / "assets" / "js" / "modes" / "builderMode.js"

OLD_LEVELS = "const LEVELS = ["

NEW_LEVELS = """const LEVELS = [
        {
            name: 'Primeiro Passo',
            desc: 'Mova o robo 2 casas pra frente.',
            gridSize: 5, robot: [2, 0], robotDir: 'RIGHT', goal: [2, 2],
            walls: [],
            availableBlocks: ['forward'],
            maxBlocks: 4, minBlocks: 2
        },
        {
            name: 'Primeira Curva',
            desc: 'O robo precisa virar pra chegar la.',
            gridSize: 5, robot: [0, 0], robotDir: 'RIGHT', goal: [2, 2],
            walls: [],
            availableBlocks: ['forward', 'turnRight'],
            maxBlocks: 6, minBlocks: 4
        },
        {
            name: 'Curva Dupla',
            desc: 'Duas curvas pra chegar no alvo!',
            gridSize: 5, robot: [0, 0], robotDir: 'RIGHT', goal: [2, 0],
            walls: [],
            availableBlocks: ['forward', 'turnRight', 'turnLeft'],
            maxBlocks: 8, minBlocks: 4
        },
        {
            name: 'Desvio Simples',
            desc: 'Cuidado com a parede!',
            gridSize: 5, robot: [0, 0], robotDir: 'RIGHT', goal: [0, 4],
            walls: [[0, 2]],
            availableBlocks: ['forward', 'turnRight', 'turnLeft'],
            maxBlocks: 10, minBlocks: 6
        },
        {
            name: 'Labirinto Leve',
            desc: 'Planeje o caminho inteiro.',
            gridSize: 5, robot: [0, 0], robotDir: 'RIGHT', goal: [4, 4],
            walls: [[1, 1], [1, 2], [2, 3], [3, 1]],
            availableBlocks: ['forward', 'turnRight', 'turnLeft'],
            maxBlocks: 14, minBlocks: 8
        },
        {
            name: 'Zigue-Zague',
            desc: 'Va e volte ate o objetivo.',
            gridSize: 5, robot: [0, 0], robotDir: 'RIGHT', goal: [4, 4],
            walls: [[1, 0], [1, 2], [1, 4], [3, 0], [3, 2], [3, 4]],
            availableBlocks: ['forward', 'turnRight', 'turnLeft'],
            maxBlocks: 18, minBlocks: 12
        },
        {
            name: 'Repita Comigo',
            desc: 'Use o bloco Repetir pra economizar!',
            gridSize: 5, robot: [0, 0], robotDir: 'RIGHT', goal: [0, 4],
            walls: [],
            availableBlocks: ['forward', 'turnRight', 'turnLeft', 'repeat2'],
            maxBlocks: 4, minBlocks: 2
        },
        {
            name: 'Mestre dos Caminhos',
            desc: 'Use tudo que aprendeu!',
            gridSize: 5, robot: [0, 0], robotDir: 'RIGHT', goal: [4, 4],
            walls: [[0, 3], [1, 1], [2, 2], [2, 3], [3, 1], [4, 1]],
            availableBlocks: ['forward', 'turnRight', 'turnLeft', 'repeat2'],
            maxBlocks: 20, minBlocks: 10
        }
    ];"""

def main():
    c = BM.read_text(encoding="utf-8")

    # Encontra o bloco LEVELS inteiro e substitui
    start = c.find("const LEVELS = [")
    if start == -1:
        print("[ERRO] LEVELS nao encontrado no builderMode.js")
        return

    # Encontra o final do array (]; depois de todos os objetos)
    bracket_count = 0
    end = start
    for i in range(start, len(c)):
        if c[i] == '[':
            bracket_count += 1
        elif c[i] == ']':
            bracket_count -= 1
            if bracket_count == 0:
                end = i + 2  # inclui ];
                break

    old_block = c[start:end]
    c = c.replace(old_block, NEW_LEVELS)
    BM.write_text(c, encoding="utf-8", newline="\n")

    print("[OK] Fases corrigidas:")
    print("  Fase 1: Primeiro Passo (so frente, inicio RIGHT)")
    print("  Fase 2: Primeira Curva (frente + direita, inicio RIGHT)")
    print("  Fase 3: Curva Dupla (frente + direita + esquerda, NOVA)")
    print("  Fase 4: Desvio Simples (1 parede)")
    print("  Fase 5: Labirinto Leve (4 paredes)")
    print("  Fase 6: Zigue-Zague (6 paredes)")
    print("  Fase 7: Repita Comigo (com bloco Repetir)")
    print("  Fase 8: Mestre dos Caminhos (tudo junto)")
    print()
    print("  Todas as fases comecam viradas pra DIREITA")
    print("  Blocos desbloqueados progressivamente")
    print("  maxBlocks aumentado pra dar margem")


if __name__ == "__main__":
    main()
