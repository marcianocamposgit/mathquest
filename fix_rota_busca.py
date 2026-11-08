# -*- coding: utf-8 -*-
from pathlib import Path

PATH = Path(r"D:\Projetos\MathQuest\src\backend\routers\dashboard.py")
content = PATH.read_text(encoding="utf-8")
lines = content.split("\n")

# Localiza o início do bloco /busca
busca_start = None
for i, line in enumerate(lines):
    if '@router.get("/busca")' in line:
        busca_start = i
        break

if busca_start is None:
    print("[ERRO] Endpoint /busca nao encontrado.")
    exit(1)

# Localiza o fim do bloco (ate o proximo @router ou EOF)
busca_end = len(lines)
for i in range(busca_start + 1, len(lines)):
    if "@router." in lines[i]:
        busca_end = i
        break

busca_block = lines[busca_start:busca_end]
new_lines = lines[:busca_start] + lines[busca_end:]

# Localiza onde inserir (antes de /{jogador_id})
insert_at = None
for i, line in enumerate(new_lines):
    if '@router.get("/{jogador_id}"' in line:
        insert_at = i
        break

if insert_at is None:
    print("[ERRO] Endpoint /{jogador_id} nao encontrado.")
    exit(1)

final_lines = new_lines[:insert_at] + busca_block + ["", ""] + new_lines[insert_at:]
PATH.write_text("\n".join(final_lines), encoding="utf-8", newline="\n")
print("[OK] Bloco /busca movido para antes de /{jogador_id}.")
print("[OK] Ordem correta: /filhos -> /busca -> /{jogador_id}")
