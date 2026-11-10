from pathlib import Path

# 1. Adicionar script no index.html
idx = Path(r'D:\Projetos\MathQuest\src\frontend\index.html')
c = idx.read_text(encoding='utf-8')
if 'builderMode' not in c:
    c = c.replace(
        '<script src=""assets/js/engine/soundEngine.js""></script>',
        '<script src=""assets/js/engine/soundEngine.js""></script>\n    <script src=""assets/js/modes/builderMode.js""></script>'
    )
    # Fallback: tenta outro padrao de aspas
    if 'builderMode' not in c:
        c = idx.read_text(encoding='utf-8')
        c = c.replace(
            'src=""assets/js/engine/soundEngine.js""',
            'src=""assets/js/engine/soundEngine.js""></script>\n    <script src=""assets/js/modes/builderMode.js""'
        )
    if 'builderMode' not in c:
        c = idx.read_text(encoding='utf-8')
        # Insere antes do gameEngine
        c = c.replace(
            'assets/js/engine/gameEngine.js',
            'assets/js/modes/builderMode.js""></script>\n    <script src=""assets/js/engine/gameEngine.js'
        )
    idx.write_text(c, encoding='utf-8', newline='\n')
    print('[OK] builderMode.js adicionado ao index.html')
else:
    print('[OK] builderMode.js ja existe no index.html')

# 2. Adicionar botao Logica no gameEngine.js
ge = Path(r'D:\Projetos\MathQuest\src\frontend\assets\js\engine\gameEngine.js')
g = ge.read_text(encoding='utf-8')
if 'builderMode' not in g.lower() and 'BuilderMode' not in g:
    # Adicionar botao na tela inicial (depois do botao de Conquistas)
    old = \"\"\"'<button onclick=""GameEngine.showAchievements()""'\"\"\"
    # Usar regex pra ser mais flexivel
    import re
    # Adiciona botao de Logica ao lado dos outros
    g = g.replace(
        'GameEngine.showAchievements()',
        'GameEngine.showAchievements()'
    )
    # Injeta o modo builder no startMode
    if 'builder' not in g:
        g = g.replace(
            \"\"\"else if (modeKey === 'detetive') { DetectiveMode.start(state.operation, opModule, state.level); }\"\"\",
            \"\"\"else if (modeKey === 'detetive') { DetectiveMode.start(state.operation, opModule, state.level); }
        else if (modeKey === 'builder') { BuilderMode.showLevelSelect(); }\"\"\"
        )
        print('[OK] Builder mode adicionado ao gameEngine startMode')

    ge.write_text(g, encoding='utf-8', newline='\n')
else:
    print('[OK] BuilderMode ja integrado no gameEngine')
