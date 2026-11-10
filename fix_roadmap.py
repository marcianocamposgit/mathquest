from pathlib import Path
p = Path(r'D:\Projetos\MathQuest\README.md')
c = p.read_text(encoding='utf-8')
c = c.replace('[ ] Deploy do backend (Render + PostgreSQL)', '[x] Deploy do backend (Render + PostgreSQL)')
p.write_text(c, encoding='utf-8', newline='\n')
print('[OK] Roadmap: deploy marcado como completo')
