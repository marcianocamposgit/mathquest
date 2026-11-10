from pathlib import Path
p = Path(r'D:\Projetos\MathQuest\README.md')
c = p.read_text(encoding='utf-8')
changes = 0
for old, new in [
    ('Deploy Backend | Render (planejado)', 'Deploy Backend | Render (mathquest-qh53.onrender.com)'),
    ('Banco Produção | Aiven/Supabase PostgreSQL (planejado)', 'Banco Produção | Aiven PostgreSQL (pg-88fecf1)'),
    ('[ ] Service Worker definitivo (Network-First)', '[x] Service Worker definitivo (Network-First, Cache-First assets, /pai/ sem cache)'),
]:
    if old in c:
        c = c.replace(old, new)
        changes += 1
if changes:
    p.write_text(c, encoding='utf-8', newline='\n')
    print(f'[OK] README atualizado ({changes} correcoes)')
else:
    print('[AVISO] Nenhuma alteracao encontrada')
