/**
 * MathQuest - Modo Desafio
 */
const ChallengeMode = (() => {
    'use strict';

    let currentChallenge = null;
    let startTime = null;
    let currentOp = null;
    let currentModule = null;
    let currentLevel = 1;

    function start(operation, opModule, level) {
        currentOp = operation;
        currentModule = opModule;
        currentLevel = level;
        currentChallenge = opModule.generateChallenge(level);
        startTime = Date.now();
        render();
    }

    function render() {
        const ch = currentChallenge;
        const op = GameEngine.OPERATIONS[currentOp];
        const app = document.getElementById('app');

        if (!ch || !ch.situacao) { GameEngine.selectOperation(currentOp); return; }

        app.innerHTML = '<div class="screen active" style="width:100%; max-width:500px;">'
            + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg);">'
            + '<button onclick="GameEngine.selectOperation(\'' + currentOp + '\')" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-family:var(--font-family-main);">← Voltar</button>'
            + '<span style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">Nível ' + currentLevel + '</span>'
            + '</div>'
            + '<div style="text-align:center; background:var(--color-bg-card); border-radius:var(--radius-lg); padding:var(--space-xl); border:1px solid ' + op.cor + '33;">'
            + '<p style="color:var(--color-text-secondary); font-size:var(--font-size-md); margin-bottom:var(--space-lg); line-height:1.6;">' + ch.situacao + '</p>'
            + '<div id="challenge-visual" style="min-height:60px; margin-bottom:var(--space-lg); display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>'
            + '<div style="margin-bottom:var(--space-lg);">'
            + '<input id="answer-input" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="?" autocomplete="off" style="font-size:var(--font-size-2xl); width:120px; text-align:center; padding:var(--space-md); border:2px solid ' + op.cor + '; border-radius:var(--radius-md); background:var(--color-bg-main); color:var(--color-text-primary); outline:none; font-family:var(--font-family-display); -moz-appearance:textfield;">'
            + '</div>'
            + '<button onclick="ChallengeMode.submit()" style="padding:var(--space-md) var(--space-2xl); border:none; border-radius:var(--radius-md); background:' + op.cor + '; color:white; cursor:pointer; font-size:var(--font-size-lg); font-weight:700; font-family:var(--font-family-main);">Confirmar</button>'
            + '</div>'
            + '</div>';

        var input = document.getElementById('answer-input');
        if (input) {
            input.focus();
            input.addEventListener('keypress', function(e) { if (e.key === 'Enter') ChallengeMode.submit(); });
        }

        var vc = document.getElementById('challenge-visual');
        if (vc && ch.visualHint) {
            // REGRA ESPECÍFICA PARA MULTIPLICAÇÃO (Desenha as caixas)
            if (currentOp === 'multiplicacao') {
                var html = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:10px;">';
                var grupos = Math.min(ch.b, 10); // Número de armários/pilhas
                var itens = Math.min(ch.a, 10);  // Espadas por armário
                var icon = ch.contexto.icone;

                for (var i = 0; i < grupos; i++) {
                    html += '<div style="border: 2px dashed var(--color-accent); border-radius: 8px; padding: 5px; display: flex; flex-wrap: wrap; width: 70px; justify-content: center; align-items: center; background: rgba(253,203,110,0.1);">';
                    for (var j = 0; j < itens; j++) {
                        html += '<span style="font-size:1.2rem;">' + icon + '</span>';
                    }
                    html += '</div>';
                }
                if (ch.b > 10) html += '<span style="align-self:center; color:gray;">+' + (ch.b - 10) + '...</span>';
                html += '</div>';
                vc.innerHTML = html;
            } 
            // REGRAS PARA AS OUTRAS OPERAÇÕES (Mantém o comportamento antigo)
            else {
                var total = ch.a || ch.visualHint.groupA || ch.visualHint.totalItems || 10;
                var icon = (ch.contexto && ch.contexto.icone) ? ch.contexto.icone : '■';
                var groups = ch.b || 1;

                if (total <= 20) {
                    AnimationEngine.createItems(vc, total, icon);
                } else {
                    var html = '<div style="display:flex; align-items:center; justify-content:center; gap:16px; width:100%;">';
                    html += '<div style="background:var(--color-bg-main); border-radius:12px; padding:12px 20px; font-size:1.5rem; font-weight:bold; display:flex; align-items:center; gap:8px;">';
                    html += icon + ' ' + total + '</div>';
                    html += '<div style="font-size:2rem; color:var(--color-text-secondary);">→</div>';
                    if (ch.operation === 'divisao' && groups <= 12) {
                        html += '<div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; max-width:220px;">';
                        for (var k = 0; k < Math.min(groups, 12); k++) {
                            html += '<div style="background:var(--color-bg-surface); border:2px dashed var(--color-text-secondary); border-radius:8px; width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; color:var(--color-text-secondary);">?</div>';
                        }
                        html += '</div>';
                    } else {
                        html += '<div style="background:var(--color-bg-surface); border-radius:8px; padding:12px 20px; font-size:1.5rem; font-weight:bold;">' + total + '</div>';
                    }
                    html += '</div>';
                    vc.innerHTML = html;
                }
            }
        }
    }

    function submit() {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        var input = document.getElementById('answer-input');
        var userAnswer = parseInt(input.value, 10);
        if (isNaN(userAnswer)) { input.style.borderColor = 'var(--color-danger)'; input.focus(); return; }

        var responseTime = Date.now() - startTime;
        var result = currentModule.validate(currentChallenge.a, currentChallenge.b, userAnswer);
        result.responseTime = responseTime;
        result.mode = 'desafio';
        GameEngine.showResult(result);
    }

    return { start, submit };
})();