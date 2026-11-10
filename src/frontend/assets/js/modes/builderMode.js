/**
 * MathQuest - Maquina Matematica (Fase 3)
 * A crianca encadeia operacoes pra transformar um numero em outro.
 * Logica computacional + matematica = ponte perfeita.
 */
const BuilderMode = (() => {
    'use strict';

    const OPS = {
        'add1':  { symbol: '+ 1',  fn: n => n + 1,  color: '#00b894', emoji: '\u2795' },
        'add2':  { symbol: '+ 2',  fn: n => n + 2,  color: '#00b894', emoji: '\u2795' },
        'add3':  { symbol: '+ 3',  fn: n => n + 3,  color: '#00b894', emoji: '\u2795' },
        'add5':  { symbol: '+ 5',  fn: n => n + 5,  color: '#00b894', emoji: '\u2795' },
        'sub1':  { symbol: '- 1',  fn: n => n - 1,  color: '#e17055', emoji: '\u2796' },
        'sub2':  { symbol: '- 2',  fn: n => n - 2,  color: '#e17055', emoji: '\u2796' },
        'sub3':  { symbol: '- 3',  fn: n => n - 3,  color: '#e17055', emoji: '\u2796' },
        'mul2':  { symbol: '\u00d7 2',  fn: n => n * 2,  color: '#6c5ce7', emoji: '\u2716' },
        'mul3':  { symbol: '\u00d7 3',  fn: n => n * 3,  color: '#6c5ce7', emoji: '\u2716' },
        'div2':  { symbol: '\u00f7 2',  fn: n => n / 2,  color: '#fdcb6e', emoji: '\u2797' },
        'div3':  { symbol: '\u00f7 3',  fn: n => n / 3,  color: '#fdcb6e', emoji: '\u2797' },
    };

    const LEVELS = [
        { name: 'Primeiro Passo', desc: 'Use uma operacao pra chegar no resultado.', start: 3, goal: 5, ops: ['add1', 'add2', 'add3'], maxBlocks: 3, hint: '3 + ? = 5' },
        { name: 'Dois Passos', desc: 'Agora precisa de duas operacoes!', start: 2, goal: 7, ops: ['add1', 'add2', 'add3', 'add5'], maxBlocks: 4, hint: '2 + ? + ? = 7' },
        { name: 'Multiplicar!', desc: 'A multiplicacao transforma rapido.', start: 3, goal: 9, ops: ['add1', 'add2', 'mul2', 'mul3'], maxBlocks: 4, hint: 'Multiplique!' },
        { name: 'Dobrar e Somar', desc: 'Combine multiplicacao com adicao.', start: 2, goal: 9, ops: ['add1', 'add2', 'add3', 'mul2', 'mul3'], maxBlocks: 4, hint: 'Primeiro multiplica, depois soma...' },
        { name: 'Pra Tras Tambem Vale', desc: 'As vezes precisa subtrair pra chegar la.', start: 10, goal: 4, ops: ['add1', 'sub1', 'sub2', 'sub3', 'mul2', 'div2'], maxBlocks: 4, hint: 'Subtrair ajuda!' },
        { name: 'Dividir pra Conquistar', desc: 'A divisao deixa tudo menor.', start: 12, goal: 2, ops: ['sub1', 'sub2', 'sub3', 'div2', 'div3'], maxBlocks: 4, hint: '12 \u00f7 ? \u00f7 ? = 2' },
        { name: 'Caminho Longo', desc: 'Mais passos, mais poder!', start: 1, goal: 20, ops: ['add1', 'add2', 'add3', 'add5', 'mul2', 'mul3'], maxBlocks: 5, hint: 'Varias formas de chegar la...' },
        { name: 'Ida e Volta', desc: 'Somar, multiplicar, subtrair... tudo junto!', start: 5, goal: 13, ops: ['add1', 'add2', 'add3', 'sub1', 'sub2', 'mul2', 'mul3', 'div2'], maxBlocks: 5, hint: 'Tente caminhos diferentes!' },
        { name: 'Mestre das Funcoes', desc: 'Use tudo que aprendeu!', start: 4, goal: 25, ops: ['add1', 'add2', 'add3', 'add5', 'sub1', 'sub2', 'mul2', 'mul3', 'div2'], maxBlocks: 6, hint: 'Voce consegue!' },
        { name: 'Desafio Final', desc: 'Transforme com o menor numero de passos.', start: 1, goal: 100, ops: ['add1', 'add2', 'add3', 'add5', 'sub1', 'mul2', 'mul3'], maxBlocks: 8, hint: 'Multiplicar eh mais rapido que somar...' }
    ];

    let currentLevel = 0;
    let program = [];
    let isRunning = false;

    function injectStyles() {
        if (document.getElementById('machine-style')) return;
        const style = document.createElement('style');
        style.id = 'machine-style';
        style.textContent = `
            .machine-container { width:100%; max-width:500px; margin:0 auto; display:flex; flex-direction:column; align-items:center; gap:16px; }
            .number-display { display:flex; align-items:center; justify-content:center; gap:20px; width:100%; padding:20px; background:var(--color-bg-card); border-radius:16px; border:2px solid var(--color-bg-surface); flex-wrap:wrap; }
            .num-box { text-align:center; padding:12px 24px; border-radius:12px; min-width:80px; }
            .num-box .label { font-size:0.75rem; color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
            .num-box .value { font-size:2.2rem; font-weight:800; font-family:var(--font-family-display); }
            .num-start { border:2px solid #00b894; }
            .num-start .value { color:#00b894; }
            .num-arrow { font-size:1.5rem; color:var(--color-text-secondary); }
            .num-current { border:2px solid var(--color-primary); background:rgba(108,92,231,0.1); transition:all 0.3s ease; }
            .num-current .value { color:var(--color-primary); }
            .num-current.success { border-color:#00b894; background:rgba(0,184,148,0.15); }
            .num-current.success .value { color:#00b894; }
            .num-current.wrong { border-color:#e17055; background:rgba(225,112,85,0.15); }
            .num-current.wrong .value { color:#e17055; }
            .num-goal { border:2px dashed var(--color-accent); }
            .num-goal .value { color:var(--color-accent); }
            .pipeline { width:100%; padding:16px; background:var(--color-bg-card); border-radius:12px; border:1px solid var(--color-bg-surface); min-height:70px; }
            .pipeline-label { font-size:0.8rem; color:var(--color-text-secondary); margin-bottom:10px; }
            .pipeline-flow { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-height:40px; }
            .pipeline-empty { color:var(--color-text-secondary); font-size:0.85rem; text-align:center; width:100%; padding:8px 0; }
            .pipe-step { display:flex; flex-direction:column; align-items:center; gap:2px; animation:popIn 0.25s ease; }
            .pipe-op { padding:8px 14px; border-radius:8px; font-weight:700; font-size:0.95rem; color:white; cursor:pointer; transition:0.2s; position:relative; }
            .pipe-op:hover { transform:scale(1.08); }
            .pipe-op.executing { outline:3px solid white; transform:scale(1.12); box-shadow:0 0 15px rgba(255,255,255,0.3); }
            .pipe-op .remove-x { display:none; position:absolute; top:-6px; right:-6px; background:#d63031; color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:0.65rem; cursor:pointer; line-height:18px; text-align:center; }
            .pipe-op:hover .remove-x { display:block; }
            .pipe-result { font-size:0.7rem; color:var(--color-text-secondary); font-weight:600; min-height:14px; }
            .pipe-arrow { color:var(--color-text-secondary); font-size:1.1rem; margin:0 2px; }
            @keyframes popIn { 0%{transform:scale(0);opacity:0;} 100%{transform:scale(1);opacity:1;} }
            .ops-palette { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; padding:14px; background:var(--color-bg-card); border-radius:12px; border:1px solid var(--color-bg-surface); width:100%; }
            .op-btn { padding:10px 16px; border:none; border-radius:8px; font-size:1rem; font-weight:700; color:white; cursor:pointer; transition:0.2s; font-family:var(--font-family-main); box-shadow:0 2px 6px rgba(0,0,0,0.2); }
            .op-btn:hover { transform:scale(1.08); }
            .op-btn:active { transform:scale(0.95); }
            .op-btn.disabled { opacity:0.35; cursor:not-allowed; transform:none; }
            .machine-controls { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
            .m-btn { padding:10px 20px; border:none; border-radius:8px; font-size:0.95rem; font-weight:600; cursor:pointer; font-family:var(--font-family-main); transition:0.2s; display:flex; align-items:center; gap:6px; }
            .m-btn:hover { transform:scale(1.03); }
            .m-btn:disabled { opacity:0.5; cursor:not-allowed; }
            .m-run { background:#00b894; color:white; }
            .m-clear { background:var(--color-bg-surface); color:var(--color-text-secondary); }
            .m-hint { background:var(--color-bg-surface); color:var(--color-accent); }
            .machine-msg { text-align:center; padding:12px 18px; border-radius:10px; font-size:0.9rem; width:100%; animation:slideDown 0.3s ease; }
            .machine-msg.success { background:rgba(0,184,148,0.15); color:#00b894; border:1px solid #00b89444; }
            .machine-msg.error { background:rgba(225,112,85,0.15); color:#e17055; border:1px solid #e1705544; }
            .machine-msg.info { background:rgba(108,92,231,0.15); color:#a29bfe; border:1px solid #6c5ce744; }
            @keyframes slideDown { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
            .machine-header { text-align:center; width:100%; }
            .machine-header h3 { font-family:var(--font-family-display); color:var(--color-accent); font-size:1.2rem; margin-bottom:4px; }
            .machine-header p { color:var(--color-text-secondary); font-size:0.85rem; }
            .level-dots { display:flex; gap:6px; justify-content:center; margin-bottom:8px; }
            .ldot { width:10px; height:10px; border-radius:50%; background:var(--color-bg-surface); transition:0.3s; }
            .ldot.done { background:#00b894; }
            .ldot.current { background:var(--color-primary); transform:scale(1.3); }
            .block-counter { font-size:0.8rem; color:var(--color-text-secondary); text-align:center; }
        `;
        document.head.appendChild(style);
    }

    function computeSteps(startVal, prog) {
        const results = [startVal];
        let current = startVal;
        for (const opId of prog) {
            const op = OPS[opId];
            if (!op) break;
            current = Math.round(op.fn(current) * 100) / 100;
            results.push(current);
        }
        return results;
    }

    function start(levelIndex) {
        injectStyles();
        if (levelIndex !== undefined) currentLevel = levelIndex;
        if (currentLevel >= LEVELS.length) currentLevel = LEVELS.length - 1;
        program = [];
        isRunning = false;
        render();
    }

    function render() {
        const level = LEVELS[currentLevel];
        const app = document.getElementById('app');
        const steps = computeSteps(level.start, program);
        const currentVal = steps[steps.length - 1];

        let dotsHtml = '';
        for (let i = 0; i < LEVELS.length; i++) {
            const cls = i < currentLevel ? 'done' : i === currentLevel ? 'current' : '';
            dotsHtml += '<div class="ldot ' + cls + '"></div>';
        }

        let pipeHtml = '';
        if (program.length === 0) {
            pipeHtml = '<div class="pipeline-empty">Clique nas operacoes pra montar a sequencia</div>';
        } else {
            program.forEach((opId, i) => {
                const op = OPS[opId];
                const stepResult = steps[i + 1];
                if (i > 0) pipeHtml += '<span class="pipe-arrow">\u2192</span>';
                pipeHtml += '<div class="pipe-step">'
                    + '<div class="pipe-op" id="pipe-' + i + '" style="background:' + op.color + ';" onclick="BuilderMode.removeBlock(' + i + ')">'
                    + op.symbol
                    + '<button class="remove-x" onclick="event.stopPropagation(); BuilderMode.removeBlock(' + i + ')">\u2715</button>'
                    + '</div>'
                    + '<div class="pipe-result">' + (stepResult !== undefined ? '= ' + stepResult : '') + '</div>'
                    + '</div>';
            });
        }

        let opsHtml = '';
        level.ops.forEach(opId => {
            const op = OPS[opId];
            const disabled = program.length >= level.maxBlocks;
            opsHtml += '<button class="op-btn' + (disabled ? ' disabled' : '') + '" style="background:' + op.color + ';" onclick="BuilderMode.addOp(\'' + opId + '\')"' + (disabled ? ' disabled' : '') + '>' + op.symbol + '</button>';
        });

        app.innerHTML = '<div class="screen active">'
            + '<button onclick="GameEngine.renderHome()" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-size:var(--font-size-md); margin-bottom:8px; font-family:var(--font-family-main);">\u2190 Voltar</button>'
            + '<div class="machine-container">'
            + '<div class="level-dots">' + dotsHtml + '</div>'
            + '<div class="machine-header"><h3>\u2699\uFE0F Fase ' + (currentLevel + 1) + ': ' + level.name + '</h3><p>' + level.desc + '</p></div>'
            + '<div class="number-display">'
            + '<div class="num-box num-start"><div class="label">Inicio</div><div class="value">' + level.start + '</div></div>'
            + '<div class="num-arrow">\u27A1</div>'
            + '<div class="num-box num-current" id="num-current"><div class="label">Agora</div><div class="value" id="current-value">' + currentVal + '</div></div>'
            + '<div class="num-arrow">\u27A1</div>'
            + '<div class="num-box num-goal"><div class="label">Objetivo</div><div class="value">' + level.goal + '</div></div>'
            + '</div>'
            + '<div class="pipeline"><div class="pipeline-label">\uD83D\uDD27 Sua sequencia:</div><div class="pipeline-flow" id="pipeline-flow">' + pipeHtml + '</div></div>'
            + '<div class="block-counter">Operacoes: ' + program.length + ' / ' + level.maxBlocks + '</div>'
            + '<div class="ops-palette">' + opsHtml + '</div>'
            + '<div class="machine-controls">'
            + '<button class="m-btn m-run" id="btn-run" onclick="BuilderMode.run()"' + (program.length === 0 ? ' disabled' : '') + '>\u25B6\uFE0F Testar</button>'
            + '<button class="m-btn m-clear" onclick="BuilderMode.clearProgram()"' + (program.length === 0 ? ' disabled' : '') + '>\uD83D\uDDD1\uFE0F Limpar</button>'
            + '<button class="m-btn m-hint" onclick="BuilderMode.showHint()">\uD83D\uDCA1 Dica</button>'
            + '</div>'
            + '<div id="machine-msg"></div>'
            + '</div></div>';
    }

    function addOp(opId) {
        if (isRunning) return;
        const level = LEVELS[currentLevel];
        if (program.length >= level.maxBlocks) return;
        program.push(opId);
        if (typeof SoundEngine !== 'undefined') SoundEngine.playSuccess();
        render();
    }

    function removeBlock(index) {
        if (isRunning) return;
        program.splice(index, 1);
        render();
    }

    function clearProgram() {
        if (isRunning) return;
        program = [];
        render();
    }

    async function run() {
        if (isRunning || program.length === 0) return;
        isRunning = true;
        const level = LEVELS[currentLevel];
        const btnRun = document.getElementById('btn-run');
        if (btnRun) btnRun.disabled = true;
        clearMessage();

        let current = level.start;
        const numCurrent = document.getElementById('num-current');
        const currentValueEl = document.getElementById('current-value');
        if (numCurrent) numCurrent.classList.remove('success', 'wrong');

        for (let i = 0; i < program.length; i++) {
            const opId = program[i];
            const op = OPS[opId];
            const pipeEl = document.getElementById('pipe-' + i);
            if (pipeEl) pipeEl.classList.add('executing');
            await sleep(600);

            current = Math.round(op.fn(current) * 100) / 100;

            if (currentValueEl) {
                currentValueEl.style.transition = 'transform 0.2s';
                currentValueEl.style.transform = 'scale(1.3)';
                currentValueEl.textContent = current;
                await sleep(200);
                currentValueEl.style.transform = 'scale(1)';
            }
            if (pipeEl) pipeEl.classList.remove('executing');
            await sleep(300);
        }

        if (current === level.goal) {
            if (numCurrent) numCurrent.classList.add('success');
            showMessage('\uD83C\uDF89 ' + level.start + ' virou ' + level.goal + '! Perfeito!', 'success');
            if (typeof SoundEngine !== 'undefined') SoundEngine.playSuccess();

            const progressKey = 'mathquest_machine_level';
            const saved = parseInt(localStorage.getItem(progressKey) || '0');
            if (currentLevel >= saved) localStorage.setItem(progressKey, String(currentLevel + 1));

            if (currentLevel === 0) StorageManager.addAchievement('primeira_funcao');
            if (currentLevel >= 9) StorageManager.addAchievement('mestre_funcoes');

            setTimeout(() => {
                if (currentLevel < LEVELS.length - 1) {
                    const msgArea = document.getElementById('machine-msg');
                    if (msgArea) {
                        const nextBtn = document.createElement('button');
                        nextBtn.className = 'm-btn m-run';
                        nextBtn.style.marginTop = '10px';
                        nextBtn.innerHTML = 'Pr\u00f3xima Fase \u25B6\uFE0F';
                        nextBtn.onclick = () => { currentLevel++; start(); };
                        msgArea.appendChild(nextBtn);
                    }
                } else {
                    showMessage('\uD83D\uDC51 Todas as fases completas! Voce eh um Mestre das Funcoes!', 'success');
                    if (typeof SoundEngine !== 'undefined') SoundEngine.playAchievement();
                }
            }, 800);
        } else {
            if (numCurrent) numCurrent.classList.add('wrong');
            const diff = level.goal - current;
            const dica = diff > 0 ? 'Faltam ' + diff + '. Precisa aumentar mais!' : 'Passou ' + Math.abs(diff) + '. Precisa diminuir!';
            showMessage('\uD83E\uDD14 Chegou em ' + current + ', mas o objetivo \u00e9 ' + level.goal + '. ' + dica, 'error');
            if (typeof SoundEngine !== 'undefined') SoundEngine.playError();
        }

        isRunning = false;
        if (btnRun) btnRun.disabled = false;
    }

    function showHint() {
        const level = LEVELS[currentLevel];
        showMessage('\uD83D\uDCA1 Dica: ' + level.hint, 'info');
    }

    function showMessage(text, type) {
        const el = document.getElementById('machine-msg');
        if (!el) return;
        el.innerHTML = '<div class="machine-msg ' + type + '">' + text + '</div>';
    }

    function clearMessage() {
        const el = document.getElementById('machine-msg');
        if (el) el.innerHTML = '';
    }

    function showLevelSelect() {
        injectStyles();
        const app = document.getElementById('app');
        const savedLevel = parseInt(localStorage.getItem('mathquest_machine_level') || '0');

        let levelsHtml = '';
        LEVELS.forEach((level, i) => {
            const unlocked = i <= savedLevel;
            const done = i < savedLevel;
            levelsHtml += '<div onclick="' + (unlocked ? 'BuilderMode.start(' + i + ')' : '') + '"'
                + ' style="background:var(--color-bg-card); border:2px solid ' + (done ? '#00b89433' : unlocked ? '#6c5ce733' : '#2d343633') + ';'
                + ' border-radius:var(--radius-lg); padding:var(--space-md) var(--space-lg); margin:var(--space-xs) 0;'
                + ' cursor:' + (unlocked ? 'pointer' : 'not-allowed') + '; opacity:' + (unlocked ? '1' : '0.4') + ';'
                + ' transition:var(--transition-normal); display:flex; align-items:center; gap:var(--space-md); width:100%;"'
                + (unlocked ? ' onmouseover="this.style.borderColor=\'' + (done ? '#00b894' : '#6c5ce7') + '\'" onmouseout="this.style.borderColor=\'' + (done ? '#00b89433' : '#6c5ce733') + '\'"' : '') + '>'
                + '<span style="font-size:1.5rem; min-width:32px; text-align:center;">'
                + (done ? '\u2705' : unlocked ? '\u2699\uFE0F' : '\uD83D\uDD12')
                + '</span>'
                + '<div style="flex:1;"><div style="font-weight:700;">Fase ' + (i + 1) + ': ' + level.name + '</div>'
                + '<div style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">' + level.desc
                + ' <span style="margin-left:8px; color:var(--color-accent);">' + level.start + ' \u27A1 ' + level.goal + '</span></div></div>'
                + '<span style="font-size:1rem; color:var(--color-text-secondary);">' + (unlocked ? '\u25B8' : '') + '</span>'
                + '</div>';
        });

        app.innerHTML = '<div class="screen active" style="width:100%; max-width:500px;">'
            + '<button onclick="GameEngine.renderHome()" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-size:var(--font-size-md); margin-bottom:var(--space-md); font-family:var(--font-family-main);">\u2190 Voltar</button>'
            + '<div style="text-align:center; margin-bottom:var(--space-lg);">'
            + '<span style="font-size:2.5rem;">\u2699\uFE0F</span>'
            + '<h2 style="font-family:var(--font-family-display); color:var(--color-accent); margin-top:var(--space-sm);">Maquina Matematica</h2>'
            + '<p style="color:var(--color-text-secondary); font-size:0.9rem;">Encadeie operacoes pra transformar o numero!</p>'
            + '</div>'
            + levelsHtml
            + '</div>';
    }

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    return { start, showLevelSelect, run, addOp, removeBlock, clearProgram, showHint, LEVELS };
})();
