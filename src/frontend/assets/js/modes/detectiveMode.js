/**
 * MathQuest - Modo Detetive
 * Investigar, provar, descobrir (3 variantes)
 */
const DetectiveMode = (() => {
    'use strict';

    const VARIANTS = ['trueOrFalse', 'hiddenNumber', 'whichOperation'];
    let currentOp = null;
    let currentModule = null;
    let currentLevel = 1;
    let currentVariant = null;
    let currentChallenge = null;
    let startTime = null;

    function start(operation, opModule, level) {
        currentOp = operation;
        currentModule = opModule;
        currentLevel = level;
        currentVariant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
        startTime = Date.now();

        if (currentVariant === 'trueOrFalse') { startTrueOrFalse(); }
        else if (currentVariant === 'hiddenNumber') { startHiddenNumber(); }
        else { startWhichOperation(); }
    }

    function startTrueOrFalse() {
        currentChallenge = currentModule.generateTrueOrFalse(currentLevel);
        const op = GameEngine.OPERATIONS[currentOp];
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="screen active" style="width:100%; max-width:500px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg);">
                    <button onclick="GameEngine.selectOperation('${currentOp}')" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-family:var(--font-family-main);">← Voltar </button>
                    <span style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">🕵️️ Detetive</span>
                </div>
                <div style="text-align:center; background:var(--color-bg-card); border-radius:var(--radius-lg); padding:var(--space-xl); border:1px solid ${op.cor}33;">
                    <p style="color:var(--color-text-secondary); margin-bottom:var(--space-md);">Essa conta está certa ou errada?</p>
                    <div style="font-family:var(--font-family-display); font-size:var(--font-size-2xl); color:var(--color-text-primary); margin:var(--space-lg) 0; padding:var(--space-lg); background:var(--color-bg-main); border-radius:var(--radius-md);">
                        ${currentChallenge.statement}
                    </div>
                    <div style="display:flex; gap:var(--space-md); justify-content:center; margin-top:var(--space-lg);">
                        <button onclick="DetectiveMode.answerTF(true)"
                            style="padding:var(--space-md) var(--space-xl); border:none; border-radius:var(--radius-md); background:var(--color-secondary); color:white; cursor:pointer; font-size:var(--font-size-lg); font-weight:700; font-family:var(--font-family-main); min-width:120px;">
                            ✓ Certo
                        </button>
                        <button onclick="DetectiveMode.answerTF(false)"
                            style="padding:var(--space-md) var(--space-xl); border:none; border-radius:var(--radius-md); background:var(--color-danger); color:white; cursor:pointer; font-size:var(--font-size-lg); font-weight:700; font-family:var(--font-family-main); min-width:120px;">
                            ✗ Errado
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function answerTF(userSaysTrue) { SoundEngine.playClick();
        const correct = (userSaysTrue === currentChallenge.isTrue);
        const result = {
            correct, feedback: correct ? 'Investigação correta! Bom olho!' : currentChallenge.explanation,
            correctAnswer: currentChallenge.correctAnswer,
            decomposition: currentChallenge.decomposition,
            responseTime: Date.now() - startTime, mode: 'detetive', trick: null
        };
        GameEngine.showResult(result);
    }

    function startHiddenNumber() {
        currentChallenge = currentModule.generateHiddenNumber(currentLevel);
        const op = GameEngine.OPERATIONS[currentOp];
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="screen active" style="width:100%; max-width:500px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg);">
                    <button onclick="GameEngine.selectOperation('${currentOp}')" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-family:var(--font-family-main);">← Voltar </button>
                    <span style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">🕵️️ Detetive</span>
                </div>
                <div style="text-align:center; background:var(--color-bg-card); border-radius:var(--radius-lg); padding:var(--space-xl); border:1px solid ${op.cor}33;">
                    <p style="color:var(--color-text-secondary); margin-bottom:var(--space-md);">Descubra o número escondido!</p>
                    <div style="font-family:var(--font-family-display); font-size:var(--font-size-2xl); color:var(--color-text-primary); margin:var(--space-lg) 0; padding:var(--space-lg); background:var(--color-bg-main); border-radius:var(--radius-md);">
                        ${currentChallenge.equation}
                    </div>
                    <div style="color:var(--color-accent); font-size:var(--font-size-sm); margin-bottom:var(--space-md);">💡 ${currentChallenge.hint}</div>
                    <input id="hidden-input" type="number" inputmode="numeric" placeholder="?" autocomplete="off"
                        style="font-size:var(--font-size-2xl); width:100px; text-align:center; padding:var(--space-md); border:2px solid ${op.cor}; border-radius:var(--radius-md); background:var(--color-bg-main); color:var(--color-text-primary); outline:none; font-family:var(--font-family-display);">
                    <br><br>
                    <button onclick="DetectiveMode.answerHidden()"
                        style="padding:var(--space-md) var(--space-xl); border:none; border-radius:var(--radius-md); background:${op.cor}; color:white; cursor:pointer; font-size:var(--font-size-lg); font-weight:700; font-family:var(--font-family-main);">
                        Revelar!
                    </button>
                </div>
            </div>`;

        const input = document.getElementById('hidden-input');
        input.focus();
        input.addEventListener('keypress', e => { if (e.key === 'Enter') DetectiveMode.answerHidden(); });
    }

    function answerHidden() { SoundEngine.playClick();
        const input = document.getElementById('hidden-input');
        const userAnswer = parseInt(input.value, 10);
        if (isNaN(userAnswer)) { input.style.borderColor = 'var(--color-danger)'; return; }
        const correct = (userAnswer === currentChallenge.hiddenValue);
        const result = {
            correct, feedback: correct ? 'Número encontrado! Ótimo raciocinio!' : `O número era ${currentChallenge.hiddenValue}. ${currentChallenge.explanation}`,
            correctAnswer: currentChallenge.hiddenValue,
            decomposition: null, responseTime: Date.now() - startTime, mode: 'detetive', trick: null
        };
        GameEngine.showResult(result);
    }

    function startWhichOperation() {
        // Gerar situação e pedir qual operacao resolve
        const ops = ['adicao', 'subtracao', 'multiplicacao', 'divisao'];
        const correctOp = currentOp;
        const opModule = GameEngine.OPERATIONS[correctOp].module();
        const challenge = opModule.generateChallenge(currentLevel);

        // DEBUG: Vai mostrar no console (F12) quais propriedades o desafio tem
        console.log('[Detetive] Desafio gerado:', challenge);

        currentChallenge = { ...challenge, correctOp };
        const op = GameEngine.OPERATIONS[currentOp];
        const app = document.getElementById('app');

        const opButtons = ops.map(o => {
            const info = GameEngine.OPERATIONS[o];
            return `<button onclick="DetectiveMode.answerWhichOp('${o}')" style="padding:var(--space-md) var(--space-lg); border:1px solid var(--color-bg-surface); border-radius:var(--radius-md); background:var(--color-bg-card); color:var(--color-text-primary); cursor:pointer; font-size:var(--font-size-md); font-family:var(--font-family-main); display:flex; align-items:center; gap:var(--space-sm); width:100%; justify-content:center;">
                <span>${info.icone}</span> ${info.label}
            </button>`;
        }).join('');

        // Tenta pegar o texto de várias propriedades possíveis para não dar undefined
        const textoDesafio = challenge.text || challenge.texto || challenge.scenario || challenge.situacao || challenge.situação || challenge.statement || '';

        app.innerHTML = `
            <div class="screen active" style="width:100%; max-width:500px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg);">
                    <button onclick="GameEngine.selectOperation('${currentOp}')" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-family:var(--font-family-main);">← Voltar</button>
                    <span style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">🕵️ Detetive</span>
                </div>
                <div style="text-align:center; background:var(--color-bg-card); border-radius:var(--radius-lg); padding:var(--space-xl); border:1px solid ${op.cor}33;">
                    <p style="color:var(--color-text-secondary); margin-bottom:var(--space-lg);">Qual operação resolve essa situação?</p>
                    <div style="background:var(--color-bg-main); border-radius:var(--radius-md); padding:var(--space-lg); margin-bottom:var(--space-lg);">
                        <p style="font-size:var(--font-size-md); line-height:1.6;">${textoDesafio}</p>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:var(--space-sm);">${opButtons}</div>
                </div>
            </div>`;
    }

    function answerWhichOp(chosen) { SoundEngine.playClick();
        const correct = (chosen === currentChallenge.correctOp);
        const result = {
            correct, feedback: correct ? 'Operação certa! Você pensou como um programador!' : `Era ${GameEngine.OPERATIONS[currentChallenge.correctOp].label}. Pense no que a situação pede...`,
            correctAnswer: currentChallenge.correctOp,
            decomposition: null, responseTime: Date.now() - startTime, mode: 'detetive', trick: null
        };
        GameEngine.showResult(result);
    }

    return { start, answerTF, answerHidden, answerWhichOp };
})();
