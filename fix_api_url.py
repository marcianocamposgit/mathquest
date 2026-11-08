from pathlib import Path
pai = Path(r'D:\Projetos\MathQuest\src\frontend\pai\pai.js')
c = pai.read_text(encoding='utf-8')
c = c.replace(
    'const API = localStorage.getItem("mathquest_api_url") || "http://localhost:8001"',
    'const API = localStorage.getItem("mathquest_api_url") || "https://mathquest-qh53.onrender.com"'
)
pai.write_text(c, encoding='utf-8', newline='\n')
print('[OK] pai.js atualizado com URL do Render')
