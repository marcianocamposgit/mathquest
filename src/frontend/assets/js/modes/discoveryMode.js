/**
 * MathQuest - Modo Descoberta
 * Apresentacao animada de macetes (15-30s cada)
 */
const DiscoveryMode = (() => {
    'use strict';

    let currentTricks = [];
    let currentIndex = 0;
    let currentOp = null;

    function start(operation, opModule, level) {
        currentOp = operation;
        currentTricks = opModule.getTricks(level);
        currentIndex = 0;
        if (currentTricks.length === 0) { GameEngine.selectOperation(operation); return; }
        renderTrick();
    }

    function renderTrick() {
        const trick = currentTricks[currentIndex];
        if (!trick) { GameEngine.selectOperation(currentOp); return; }

        const op = GameEngine.OPERATIONS[currentOp];
        const app = document.getElementById('app');
        const progress = `${currentIndex + 1} / ${currentTricks.length}`;

        const ex = trick.exemplo;
        const opSymbol = currentOp === 'adicao' ? '+' : currentOp === 'subtracao' ? '-' : currentOp === 'multiplicacao' ? 'x' : '/';

        app.innerHTML = `
            <div class="screen active" style="width:100%; max-width:500px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg);">
                    <button onclick="GameEngine.selectOperation('${currentOp}')" style="background:none; border:none; color:var(--color-text-secondary); cursor:pointer; font-family:var(--font-family-main);">← Voltar</button>
                    <span style="color:var(--color-text-secondary); font-size:var(--font-size-sm);">${progress}</span>
                </div>
                <div style="text-align:center; background:var(--color-bg-card); border-radius:var(--radius-lg); padding:var(--space-xl); border:1px solid ${op.cor}33;">
                    <h3 style="font-family:var(--font-family-display); color:${op.cor}; margin-bottom:var(--space-md);">${trick.nome}</h3>
                    <p style="color:var(--color-text-secondary); margin-bottom:var(--space-lg); line-height:1.6;">${trick.descricao}</p>
                    <div style="background:var(--color-bg-main); border-radius:var(--radius-md); padding:var(--space-lg); margin-bottom:var(--space-lg);">
                        <div style="font-family:var(--font-family-display); font-size:var(--font-size-2xl); color:var(--color-text-primary);">
                            ${ex.a} ${opSymbol} ${ex.b} = ${ex.result}
                        </div>
                        <div id="discovery-visual" style="min-height:120px; margin-top:var(--space-md); display:flex; justify-content:center; align-items:center; flex-direction: column;"></div>
                    </div>
                    <div style="background:var(--color-accent)15; border-radius:var(--radius-sm); padding:var(--space-md); border-left:3px solid var(--color-accent);">
                        <p style="color:var(--color-accent); font-size:var(--font-size-sm);">💡 ${trick.dica}</p>
                    </div>
                </div>
                <div style="display:flex; justify-content:center; gap:var(--space-md); margin-top:var(--space-xl);">
                    ${currentIndex > 0 ? `<button onclick="DiscoveryMode.prev()" style="padding:var(--space-md) var(--space-lg); border:1px solid var(--color-bg-surface); border-radius:var(--radius-md); background:var(--color-bg-card); color:var(--color-text-primary); cursor:pointer; font-family:var(--font-family-main);">◂ Anterior</button>` : ''}
                    <button onclick="DiscoveryMode.next()" style="padding:var(--space-md) var(--space-xl); border:none; border-radius:var(--radius-md); background:${op.cor}; color:white; cursor:pointer; font-weight:700; font-family:var(--font-family-main);">
                        ${currentIndex < currentTricks.length - 1 ? 'Próximo ▸' : 'Praticar! ⚔'}
                    </button>
                </div>
            </div>`;

        // Dispara a animação visual pedagógica correta
        const visualContainer = document.getElementById('discovery-visual');
        if (visualContainer) {
            if (currentOp === 'adicao' || currentOp === 'subtracao') {
                AnimationEngine.animateMathProblem(visualContainer, ex.a, ex.b, currentOp);
            } else if (currentOp === 'multiplicacao') {
                AnimationEngine.animateMultiplication(visualContainer, ex.a, ex.b);
            } else if (currentOp === 'divisao') {
                AnimationEngine.animateDivision(visualContainer, ex.a, ex.b);
            }
        }
    }

    function next() { 
        SoundEngine.playClick();
        currentIndex++;
        if (currentIndex >= currentTricks.length) { 
            ChallengeMode.start(currentOp, GameEngine.OPERATIONS[currentOp].module(), StorageManager.getProgress(currentOp).nível); 
        } else { 
            renderTrick(); 
        }
    }

    function prev() { 
        if (currentIndex > 0) { 
            SoundEngine.playClick();
            currentIndex--; 
            renderTrick(); 
        } 
    }

    return { start, next, prev };
})();