from pathlib import Path
p = Path(r'D:\Projetos\MathQuest\src\frontend\pai\pai.js')
c = p.read_text(encoding='utf-8')
c = c.replace(
    'const API = localStorage.getItem(\"mathquest_api_url\") || \"https://mathquest-qh53.onrender.com\"',
    '''const API = (() => {
    const stored = localStorage.getItem(\"mathquest_api_url\");
    if (stored) return stored;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'http://localhost:8001';
    }
    return 'https://mathquest-qh53.onrender.com';
})()'''
)
if 'location.hostname' in c and 'pai' in str(p):
    p.write_text(c, encoding='utf-8', newline='\n')
    print('[OK] pai.js: localhost -> 8001, producao -> Render')
else:
    print('[ERRO] Padrao nao encontrado, verifique manualmente')
