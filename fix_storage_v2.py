from pathlib import Path
import re

p = Path(r'D:\Projetos\MathQuest\src\frontend\assets\js\engine\storageManager.js')
c = p.read_text(encoding='utf-8')
original = c

# Fix 1: URL de producao
c = re.sub(
    r"//\s*Produ.*?alterar.*?\n\s*return\s*'http://localhost:8001';",
    "return 'https://mathquest-qh53.onrender.com';",
    c
)

# Fix 2: tempo em segundos (responseTime vem em ms)
c = c.replace(
    'tempo_segundos: result.responseTime || 0',
    'tempo_segundos: Math.round((result.responseTime || 0) / 1000 * 100) / 100'
)

if c == original:
    print('[ERRO] Nenhuma alteracao feita. Verifique o arquivo manualmente.')
else:
    changes = []
    if 'onrender.com' in c:
        changes.append('URL producao -> Render')
    if '/ 1000' in c:
        changes.append('tempo ms -> segundos')
    p.write_text(c, encoding='utf-8', newline='\n')
    print('[OK] ' + ' | '.join(changes))
