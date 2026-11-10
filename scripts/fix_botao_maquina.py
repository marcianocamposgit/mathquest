# -*- coding: utf-8 -*-
"""Troca label do botao de Logica pra Maquina no gameEngine.js"""
from pathlib import Path

p = Path(__file__).resolve().parent / "src" / "frontend" / "assets" / "js" / "engine" / "gameEngine.js"
c = p.read_text(encoding="utf-8")

if "Logica" in c or "\\u00f3gica" in c:
    # Troca qualquer variacao do label
    c = c.replace("\\uD83E\\uDDE0 L\\u00f3gica", "\\u2699\\uFE0F M\\u00e1quina")
    c = c.replace("L\\u00f3gica", "M\\u00e1quina")
    p.write_text(c, encoding="utf-8", newline="\n")
    print("[OK] Botao renomeado: Logica -> Maquina")
else:
    print("[OK] Botao ja esta correto ou nao encontrado")
