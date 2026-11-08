from pathlib import Path
p = Path(r'D:\Projetos\MathQuest\src\frontend\index.html')
c = p.read_text(encoding='utf-8')
if 'href="pai/"' in c:
    print('[OK] Botao ja existe.')
else:
    b = '<a href="pai/" style="position:fixed;bottom:12px;right:12px;background:#7c6cf0;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:13px;opacity:.85;z-index:99;font-family:system-ui,sans-serif;">Area do Pai</a>'
    c = c.replace('</body>', b + '\n</body>')
    p.write_text(c, encoding='utf-8', newline='\n')
    print('[OK] Botao adicionado.')
