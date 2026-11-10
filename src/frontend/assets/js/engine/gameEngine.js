/**
 * MathQuest - Game Engine
 * Orquestrador principal: telas, estados, ciclo de jogo
 */
const GameEngine = (() => {
    'use strict';

    const OPERATIONS = {
        adicao:        { module: () => window.AdicaoModule,        label: 'Adição',        icone: '➕', cor: '#6C5CE7' },
        subtracao:     { module: () => window.SubtracaoModule,     label: 'Subtração',     icone: '➖', cor: '#00B894' },
        multiplicacao: { module: () => window.MultiplicacaoModule, label: 'Multiplicação', icone: '×',  cor: '#FDCB6E' },
        divisao:       { module: () => window.DivisaoModule,       label: 'Divisão',       icone: '÷',  cor: '#E17055' }
    };

    const MODES = {
        descoberta: { label: 'Descoberta', icone: '🔍', desc: 'Aprenda os macetes' },
        desafio:    { label: 'Desafio',    icone: '⚔',  desc: 'Resolva desafios' },
        detetive:   { label: 'Detetive',   icone: '🕵️', desc: 'Investigue e prove' }
    };

    let state = { screen: 'home', operation: null, mode: null, level: 1, challenge: null, startTime: null };

    function init() {
        console.log('[MathQuest] Inicializando...');
        const nome = StorageManager.getUserName();
        if (!nome) { showNameInput(); }
        else { renderHome(); }
    }

    function showNameInput() {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="screen active" style="text-align:center; padding-top:15vh;">'
            + '<h1 style="font-family:var(--font-family-display); font-size:var(--font-size-3xl); color:var(--color-accent);">MathQuest</h1>'
            + '<p style="margin:var(--space-lg) 0; color:var(--color-text-secondary);">Qual é o seu nome, aventureiro?</p>'
            + '<input id="name-input" type="text" maxlength="20" placeholder="Seu nome aqui..." style="font-size:var(--font-size-lg); padding:var(--space-md) var(--space-lg); border:2px solid var(--color-primary); border-radius:var(--radius-md); background:var(--color-bg-card); color:var(--color-text-primary); text-align:center; outline:none; width:80%; max-width:300px;">'
            + '<br><br>'
            + '<button id="name-btn" onclick="GameEngine.submitName()" style="font-size:var(--font-size-lg); padding:var(--space-md) var(--space-xl); border:none; border-radius:var(--radius-md); background:var(--color-primary); color:white; cursor:pointer; font-family:var(--font-family-main); font-weight:700;">Começar!</button>'
            + '</div>';
        document.getElementById('name-input').focus();
        document.getElementById('name-input').addEventListener('keypress', e => { if (e.key === 'Enter') GameEngine.submitName(); });
    }

    function submitName() {
        const input = document.getElementById('name-input');
        const nome = (input.value || '').trim();
        if (nome.length < 1) { input.style.borderColor = 'var(--color-danger)'; return; }
        StorageManager.setUserName(nome);
        renderHome();
    }

    function renderHome() {
        state.screen = 'home';
        const nome = StorageManager.getUserName();
        const overview = ProgressionEngine.getOverview();
        const app = document.getElementById('app');

        let cardsHtml = '';
        Object.keys(OPERATIONS).forEach(opKey => {
            const op = OPERATIONS[opKey];
            const prog = overview[opKey] || { nivel: 1, taxa: 0, streak: 0 };
            const nivelSeguro = prog.nivel !== undefined ? prog.nivel : (prog['nível'] !== undefined ? prog['nível'] : 1);
            const taxaSegura = prog.taxa || 0;
            const streakSeguro = prog.streak || 0;

            const barWidth = Math.min(taxaSegura, 100);
            cardsHtml += '<div class="op-card" onclick="GameEngine.selectOperation(\'' + opKey + '\')" style="background:var(--color-bg-card); border:2px solid ' + op.cor + '33; border-radius:var(--radius-lg); padding:var(--space-lg); margin:var(--space-sm) 0; cursor:pointer; transition:var(--transition-normal); display:flex; align-items:center; gap:var(--space-lg); width:100%;" onmouseover="this.style.borderColor=\'' + op.cor + '\'; this.style.boxShadow=\'0 0 20px ' + op.cor + '44\';" onmouseout="this.style.borderColor=\'' + op.cor + '33\'; this.style.boxShadow=\'none\';">'
                + '<span style="font-size:2rem;">' + op.icone + '</span>'
                + '<div style="flex:1;">'
                + '<div style="font-weight:700; font-size:var(--font-size-lg);">' + op.label + '</div>'
                + '<div style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">Nível ' + nivelSeguro + ' · ' + taxaSegura + '% acerto' + (streakSeguro > 0 ? ' · 🔥' + streakSeguro : '') + '</div>'
                + '<div style="background:var(--color-bg-main); border-radius:4px; height:6px; margin-top:6px; overflow:hidden;">'
                + '<div style="background:' + op.cor + '; height:100%; width:' + barWidth + '%; border-radius:4px; transition:width 0.5s ease;"></div>'
                + '</div></div>'
                + '<span style="font-size:1.2rem; color:var(--color-text-secondary);">▸</span>'
                + '</div>';
        });

        app.innerHTML = '<div class="screen active" style="width:100%; max-width:500px;">'
            + '<div style="text-align:center; margin-bottom:var(--space-xl);">'
            + '<h1 style="font-family:var(--font-family-display); font-size:var(--font-size-2xl); color:var(--color-accent);">MathQuest</h1>'
            + '<p style="color:var(--color-text-secondary);">Olá, ' + nome + '! Escolha sua aventura.</p>'
            + '</div>'
            + cardsHtml
            + '<div style="text-align:center; margin-top:var(--space-xl); display:flex; gap:16px; justify-content:center;">'
            + '<button id="mute-btn" onclick="GameEngine.toggleMute()" style="background:none; border:1px solid var(--color-accent)33; color:var(--color-accent); padding:var(--space-sm) var(--space-lg); border-radius:var(--radius-md); cursor:pointer; font-family:var(--font-family-main);">🔊 Som</button>'
            + '<button onclick="GameEngine.showAchievements()" style="background:none; border:1px solid var(--color-accent)33; color:var(--color-accent); padding:var(--space-sm) var(--space-lg); border-radius:var(--radius-md); cursor:pointer; font-family:var(--font-family-main);">🏆 Conquistas</button>'
            + '<button onclick="BuilderMode.showLevelSelect()" style="background:none; border:1px solid var(--color-accent)33; color:var(--color-accent); padding:var(--space-sm) var(--space-lg); border-radius:var(--radius-md); cursor:pointer; font-family:var(--font-family-main);">\u2699\uFE0F M\u00e1quina</button>'
            + '</div></div>';
    }

    function selectOperation(opKey) {
        state.operation = opKey;
        state.screen = 'operation';
        const op = OPERATIONS[opKey];
        const prog = StorageManager.getProgress(opKey);
        const app = document.getElementById('app');
        const nivelAtual = prog.nivel !== undefined ? prog.nivel : (prog['nível'] !== undefined ? prog['nível'] : 1);

        let modesHtml = '';
        Object.keys(MODES).forEach(modeKey => {
            const mode = MODES[modeKey];
            modesHtml += '<div class="mode-card" onclick="GameEngine.startMode(\'' + modeKey + '\')" style="background:var(--color-bg-card); border:1px solid var(--color-bg-surface); border-radius:var(--radius-md); padding:var(--space-lg); margin:var(--space-sm) 0; cursor:pointer; transition:var(--transition-normal); display:flex; align-items:center; gap:var(--space-md); width:100%;" onmouseover="this.style.borderColor=\'' + op.cor + '\';" onmouseout="this.style.borderColor=\'var(--color-bg-surface)\';">'
                + '<span style="font-size:1.8rem;">' + mode.icone + '</span>'
                + '<div><div style="font-weight:700;">' + mode.label + '</div><div style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">' + mode.desc + '</div></div>'
                + '</div>';
        });

        let levelHtml = '';
        for (let i = 1; i <= 4; i++) {
            const active = i === nivelAtual;
            levelHtml += '<button onclick="GameEngine.setLevel(' + i + ')" style="padding:var(--space-sm) var(--space-md); border:2px solid ' + (active ? op.cor : 'var(--color-bg-surface)') + '; background:' + (active ? op.cor + '22' : 'var(--color-bg-card)') + '; color:' + (active ? op.cor : 'var(--color-text-secondary)') + '; border-radius:var(--radius-sm); cursor:pointer; font-weight:' + (active ? '700' : '400') + '; font-family:var(--font-family-main);">Nível ' + i + '</button> ';
        }

        app.innerHTML = '<div class="screen active" style="width:100%; max-width:500px;">'
            + '<button onclick="GameEngine.renderHome()" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-size:var(--font-size-md); margin-bottom:var(--space-md); font-family:var(--font-family-main);">← Voltar</button>'
            + '<div style="text-align:center; margin-bottom:var(--space-lg);">'
            + '<span style="font-size:2.5rem;">' + op.icone + '</span>'
            + '<h2 style="font-family:var(--font-family-display); color:' + op.cor + '; margin-top:var(--space-sm);">' + op.label + '</h2>'
            + '</div>'
            + '<div style="margin-bottom:var(--space-lg);">'
            + '<p style="color:var(--color-text-secondary); font-size:var(--font-size-sm); margin-bottom:var(--space-sm);">Nível:</p>'
            + '<div style="display:flex; gap:var(--space-sm);">' + levelHtml + '</div>'
            + '</div>'
            + '<p style="color:var(--color-text-secondary); font-size:var(--font-size-sm); margin-bottom:var(--space-sm);">Modo:</p>'
            + modesHtml
            + '</div>';
    }

    function setLevel(level) { state.level = level; selectOperation(state.operation); }

    function startMode(modeKey) {
        state.mode = modeKey;
        state.screen = 'play';
        const opModule = OPERATIONS[state.operation].module();

        if (modeKey === 'descoberta') { DiscoveryMode.start(state.operation, opModule, state.level); }
        else if (modeKey === 'desafio') { ChallengeMode.start(state.operation, opModule, state.level); }
        else if (modeKey === 'builder') { BuilderMode.showLevelSelect(); return; }
        else if (modeKey === 'detetive') { DetectiveMode.start(state.operation, opModule, state.level); }
    }

    function showResult(result) {
        StorageManager.updateProgress(state.operation, result);
        if (typeof SoundEngine !== 'undefined') {
            if (result.correct) { SoundEngine.playSuccess(); } else { SoundEngine.playError(); }
        }

        const levelUp = ProgressionEngine.checkLevelUp(state.operation);
        const newAchievements = RewardsSystem.checkAchievements(state.operation, result);
        const op = OPERATIONS[state.operation];
        const app = document.getElementById('app');
        const feedbackColor = result.correct ? 'var(--color-secondary)' : 'var(--color-accent)';
        const feedbackIcon = result.correct ? '✅' : '💡';

        let extraHtml = '';
        if (levelUp) {
            if (typeof SoundEngine !== 'undefined') SoundEngine.playLevelUp();
            extraHtml += '<div style="background:var(--color-accent)22; border:1px solid var(--color-accent); border-radius:var(--radius-md); padding:var(--space-md); margin:var(--space-md) 0; text-align:center; color:var(--color-accent); font-weight:700;">🎉 ' + levelUp.message + '</div>';
        }

        let decompHtml = '';
        if (!result.correct && result.decomposition) {
            decompHtml = '<div style="margin:var(--space-md) 0; text-align:left;">';
            result.decomposition.forEach(step => {
                decompHtml += '<div style="background:var(--color-bg-card); border-radius:var(--radius-sm); padding:var(--space-sm) var(--space-md); margin:var(--space-xs) 0; border-left:3px solid ' + op.cor + ';">'
                    + '<div style="font-weight:700; font-family:var(--font-family-display);">' + step.step + '</div>'
                    + '<div style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">' + step.visual + '</div></div>';
            });
            decompHtml += '</div>';
        }

        app.innerHTML = '<div class="screen active" style="width:100%; max-width:500px; text-align:center;">'
            + '<div style="font-size:3rem; margin:var(--space-lg) 0;">' + feedbackIcon + '</div>'
            + '<p style="font-size:var(--font-size-lg); color:' + feedbackColor + '; font-weight:700;">' + result.feedback + '</p>'
            + decompHtml
            + extraHtml
            + '<div style="display:flex; gap:var(--space-md); justify-content:center; margin-top:var(--space-xl); flex-wrap:wrap;">'
            + '<button onclick="GameEngine.startMode(\'' + state.mode + '\')" style="padding:var(--space-md) var(--space-xl); border:none; border-radius:var(--radius-md); background:' + op.cor + '; color:white; cursor:pointer; font-size:var(--font-size-md); font-weight:700; font-family:var(--font-family-main);">Próximo ▸</button>'
            + '<button onclick="GameEngine.selectOperation(\'' + state.operation + '\')" style="padding:var(--space-md) var(--space-xl); border:1px solid var(--color-bg-surface); border-radius:var(--radius-md); background:var(--color-bg-card); color:var(--color-text-primary); cursor:pointer; font-family:var(--font-family-main);">Modos</button>'
            + '<button onclick="GameEngine.renderHome()" style="padding:var(--space-md) var(--space-xl); border:1px solid var(--color-bg-surface); border-radius:var(--radius-md); background:var(--color-bg-card); color:var(--color-text-primary); cursor:pointer; font-family:var(--font-family-main);">Início</button>'
            + '</div></div>';

        if (newAchievements.length > 0) {
            if (typeof SoundEngine !== 'undefined') SoundEngine.playAchievement();
            setTimeout(() => { newAchievements.forEach(a => AnimationEngine.showAchievementAnimation(document.body, a.icone, a.nome)); }, 800);
        }
    }

    function showAchievements() {
        const unlocked = StorageManager.getAchievements();
        const all = RewardsSystem.ACHIEVEMENTS;
        const app = document.getElementById('app');

        let html = '';
        all.forEach(a => {
            const got = unlocked.find(u => u.id === a.id);
            html += '<div style="background:var(--color-bg-card); border-radius:var(--radius-md); padding:var(--space-md); margin:var(--space-xs) 0; display:flex; align-items:center; gap:var(--space-md); opacity:' + (got ? '1' : '0.4') + '; width:100%;">'
                + '<span style="font-size:1.8rem;">' + a.icone + '</span>'
                + '<div><div style="font-weight:700;">' + a.nome + '</div><div style="font-size:var(--font-size-sm); color:var(--color-text-secondary);">' + a.desc + '</div></div>'
                + (got ? '<span style="color:var(--color-secondary);">✓</span>' : '')
                + '</div>';
        });

        app.innerHTML = '<div class="screen active" style="width:100%; max-width:500px;">'
            + '<button onclick="GameEngine.renderHome()" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-size:var(--font-size-md); margin-bottom:var(--space-md); font-family:var(--font-family-main);">← Voltar</button>'
            + '<h2 style="font-family:var(--font-family-display); color:var(--color-accent); text-align:center;">🏆 Conquistas</h2>'
            + '<p style="color:var(--color-text-secondary); text-align:center; margin-bottom:var(--space-lg);">' + unlocked.length + ' de ' + all.length + ' desbloqueadas</p>'
            + html
            + '</div>';
    }

    function toggleMute() {
        const isMuted = SoundEngine.toggleMute();
        const btn = document.getElementById('mute-btn');
        if (btn) btn.textContent = isMuted ? '🔇 Mute' : '🔊 Som';
    }

    return { init, renderHome, toggleMute, selectOperation, setLevel, startMode, showResult, showAchievements, submitName, OPERATIONS, MODES, state };
})();

document.addEventListener('DOMContentLoaded', () => GameEngine.init());