from pathlib import Path
p = Path(r'D:\Projetos\MathQuest\README.md')
p.write_text(open(r'D:\Projetos\MathQuest\update_readme.py').read().split('README_CONTENT = """')[1].split('"""')[0], encoding='utf-8', newline='\n')
print('[OK] README.md atualizado')
