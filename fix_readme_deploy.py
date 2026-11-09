from pathlib import Path
p = Path(r'D:\Projetos\MathQuest\README.md')
c = p.read_text(encoding='utf-8')
c = c.replace(
    'Deploy Nuvem | \U0001f532 Pendente | Backend no Render + PostgreSQL no Aiven/Supabase',
    'Deploy Nuvem | \u2705 Completo | Backend no Render (mathquest-qh53.onrender.com) + PostgreSQL no Aiven'
)
p.write_text(c, encoding='utf-8', newline='\n')
print('[OK] README atualizado')
