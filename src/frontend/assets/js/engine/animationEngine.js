/**
 * MathQuest - Animation Engine (v2)
 * Animacoes pedagogicas usando CSS + DOM
 * Inclui: Passar o 10, divisao com resto, decomposicao de multiplicacao
 */
const AnimationEngine = (() => {
    'use strict';

    const TIMING = { fast: 300, normal: 600, slow: 1000, pedagogical: 1500 };

    if (!document.getElementById('mathquest-anim-style')) {
        const style = document.createElement('style');
        style.id = 'mathquest-anim-style';
        style.textContent = `
            @keyframes flyToTarget {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                50% { transform: translate(0, -20px) scale(1.2); opacity: 1; }
                100% { transform: translate(var(--tx), var(--ty)) scale(1); opacity: 1; }
            }
            @keyframes popIn {
                0% { transform: scale(0); opacity: 0; }
                80% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes glowPulse {
                0%, 100% { box-shadow: 0 0 5px rgba(108,92,231,0.3); }
                50% { box-shadow: 0 0 20px rgba(108,92,231,0.8); }
            }
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes tryAgainShake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-5px); }
                40%, 80% { transform: translateX(5px); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes achievementReveal {
                0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            .math-block {
                display: inline-block; font-size: 1.2rem;
                width: 30px; height: 30px; line-height: 30px;
                text-align: center; border-radius: 8px;
                margin: 2px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .math-block-a { background: var(--color-secondary); color: white; }
            .math-block-b { background: var(--color-accent); color: white; }
            .math-block-result { background: var(--color-primary); color: white; }
            .math-block-highlight {
                background: #e84393; color: white;
                animation: glowPulse 1s ease infinite;
            }
            .math-block-remainder {
                background: #d63031; color: white;
                border: 2px dashed #ff7675;
            }
            .math-group-container {
                display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 15px;
            }
            .math-group-box {
                border: 2px dashed var(--color-secondary);
                border-radius: 8px;
                padding: 10px;
                display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start; gap: 2px;
                width: 80px; min-height: 80px;
                background: rgba(0,184,148,0.1);
                animation: popIn 0.4s ease forwards;
                opacity: 0;
            }
            .division-shelf {
                display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 300px;
            }
            .division-box {
                border: 2px solid var(--color-accent);
                border-radius: 8px;
                padding: 10px;
                display: flex; align-items: center; gap: 5px;
                background: rgba(253,203,110,0.1);
                opacity: 0; transform: translateX(-20px);
                transition: all 0.4s ease;
            }
            .division-box.active {
                opacity: 1; transform: translateX(0);
            }
            .division-box .label {
                color: var(--color-accent); font-weight: bold; margin-right: 10px; font-size: 1.2rem;
            }
            .remainder-box {
                border: 2px dashed #d63031;
                background: rgba(214,48,49,0.1);
            }
            .remainder-box .label { color: #d63031; }
            .step-narration {
                font-size: 1rem; color: var(--color-text-secondary);
                text-align: center; padding: 8px 16px;
                background: var(--color-bg-card); border-radius: 8px;
                border-left: 3px solid var(--color-primary);
                animation: slideDown 0.4s ease;
                margin: 8px 0;
            }
            .decomp-step {
                display: flex; align-items: center; gap: 10px;
                padding: 10px; margin: 5px 0;
                background: var(--color-bg-card); border-radius: 8px;
                border-left: 3px solid var(--color-accent);
                opacity: 0; transform: translateX(-20px);
                transition: all 0.5s ease;
            }
            .decomp-step.active { opacity: 1; transform: translateX(0); }
            .decomp-step .number {
                font-size: 1.5rem; font-weight: bold; color: var(--color-primary);
                min-width: 50px; text-align: center;
            }
            .decomp-step .explain {
                color: var(--color-text-secondary); font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }

    // ══════════════════════════════════════════════════
    // BLOCOS CONSTRUTORES
    // ══════════════════════════════════════════════════

    function createItems(container, count, icon, className) {
        container.innerHTML = '';
        const items = [];
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = `item ${className || ''}`;
            el.textContent = icon || '\u{1F9F1}';
            el.style.cssText = 'display:inline-block; font-size:1.5rem; margin:4px; transition: all 0.5s cubic-bezier(0.68,-0.55,0.265,1.55); opacity:0; transform:scale(0);';
            container.appendChild(el);
            items.push(el);
        }
        items.forEach((el, i) => {
            setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'scale(1)'; }, i * 80);
        });
        return items;
    }

    function buildBlock(isA) {
        const block = document.createElement('div');
        block.className = `math-block ${isA ? 'math-block-a' : 'math-block-b'}`;
        block.textContent = '1';
        return block;
    }

    function buildResultBlock() {
        const block = document.createElement('div');
        block.className = 'math-block math-block-result';
        block.textContent = '1';
        return block;
    }

    function buildHighlightBlock() {
        const block = document.createElement('div');
        block.className = 'math-block math-block-highlight';
        block.textContent = '1';
        return block;
    }

    function buildRemainderBlock() {
        const block = document.createElement('div');
        block.className = 'math-block math-block-remainder';
        block.textContent = '?';
        return block;
    }

    function narrate(container, text) {
        const el = document.createElement('div');
        el.className = 'step-narration';
        el.textContent = text;
        container.appendChild(el);
        return el;
    }

    function createPlayButton(container, callback) {
        const playBtn = document.createElement('button');
        playBtn.textContent = '\u2728 Ver a m\u00e1gica!';
        playBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-size: 1rem; font-weight: bold; border: none; border-radius: 8px; background: var(--color-accent); color: white; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: transform 0.2s;';
        playBtn.onmouseover = () => playBtn.style.transform = 'scale(1.05)';
        playBtn.onmouseout = () => playBtn.style.transform = 'scale(1)';
        container.appendChild(playBtn);
        playBtn.addEventListener('click', () => {
            playBtn.remove();
            callback();
        });
        return playBtn;
    }

    // ══════════════════════════════════════════════════
    // 1. ADICAO E SUBTRACAO (basico)
    // ══════════════════════════════════════════════════

    function animateMathProblem(container, a, b, operation) {
        // Se for adicao e der pra usar "Passar o 10", usa a animacao especial
        if (operation === 'adicao' && a >= 2 && b >= 2 && a + b > 10 && a < 10 && b < 10) {
            animatePassarO10(container, a, b);
            return;
        }

        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:15px; position:relative;';

        const groupA = document.createElement('div');
        groupA.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:200px; padding:5px; border:2px dashed var(--color-secondary); border-radius:8px; background:rgba(0,184,148,0.1); min-height:40px;';
        const groupB = document.createElement('div');
        groupB.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:200px; padding:5px; border:2px dashed var(--color-accent); border-radius:8px; background:rgba(253,203,110,0.1); min-height:40px;';
        const symbol = document.createElement('div');
        symbol.style.cssText = 'font-size:2rem; font-weight:bold; color:var(--color-text-primary);';
        symbol.textContent = operation === 'adicao' ? '+' : '-';

        if (a === 0) { groupA.innerHTML = '<span style="color:var(--color-text-secondary); font-size:0.8rem; margin:auto;">(nada)</span>'; }
        else { for (let i = 0; i < a; i++) groupA.appendChild(buildBlock(true)); }

        if (b === 0) { groupB.innerHTML = '<span style="color:var(--color-text-secondary); font-size:0.8rem; margin:auto;">(nada)</span>'; }
        else { for (let i = 0; i < b; i++) groupB.appendChild(buildBlock(false)); }

        const targetGroup = document.createElement('div');
        targetGroup.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:300px; padding:5px; border:2px solid var(--color-primary); border-radius:8px; min-height:40px; background:rgba(108,92,231,0.1); opacity:0; transition:opacity 0.5s;';

        container.appendChild(groupA);
        container.appendChild(symbol);
        container.appendChild(groupB);
        container.appendChild(targetGroup);

        createPlayButton(container, () => {
            if (operation === 'adicao') {
                const allBlocks = [...groupA.querySelectorAll('.math-block'), ...groupB.querySelectorAll('.math-block')];
                if (allBlocks.length === 0) {
                    targetGroup.innerHTML = '<span style="color:var(--color-text-secondary); font-size:0.8rem; margin:auto;">(nada)</span>';
                    targetGroup.style.opacity = '1';
                    pulseSuccess(targetGroup);
                    return;
                }

                allBlocks.forEach(block => {
                    const clone = block.cloneNode(true);
                    clone.style.position = 'fixed';
                    const blockRect = block.getBoundingClientRect();
                    clone.style.top = blockRect.top + 'px'; clone.style.left = blockRect.left + 'px'; clone.style.zIndex = '999';
                    document.body.appendChild(clone); block.style.opacity = '0';

                    const targetLeft = targetGroup.getBoundingClientRect().left + (targetGroup.children.length % 5) * 34 + 5;
                    const targetTop = targetGroup.getBoundingClientRect().top + 5;
                    clone.style.setProperty('--tx', (targetLeft - blockRect.left) + 'px');
                    clone.style.setProperty('--ty', (targetTop - blockRect.top) + 'px');
                    clone.style.animation = 'flyToTarget 1.2s cubic-bezier(0.68,-0.55,0.265,1.55) forwards';

                    setTimeout(() => {
                        targetGroup.appendChild(buildResultBlock());
                        clone.remove();
                    }, 1200);
                });
                setTimeout(() => { targetGroup.style.opacity = '1'; }, 800);
                setTimeout(() => { pulseSuccess(targetGroup); }, 2000);

            } else if (operation === 'subtracao') {
                if (a === b) {
                    targetGroup.innerHTML = '<span style="color:var(--color-text-secondary); font-size:0.8rem; margin:auto;">(nada)</span>';
                    targetGroup.style.opacity = '1';
                    const blocksToRemove = [...groupB.querySelectorAll('.math-block')];
                    blocksToRemove.forEach((block, i) => {
                        setTimeout(() => {
                            block.style.transform = 'scale(0) rotate(45deg)'; block.style.opacity = '0.3'; block.textContent = '\u2716';
                            setTimeout(() => block.style.opacity = '0', 500);
                        }, i * 300);
                    });
                    setTimeout(() => pulseSuccess(targetGroup), blocksToRemove.length * 300 + 500);
                    return;
                }

                targetGroup.style.opacity = '1';
                const blocksA = [...groupA.querySelectorAll('.math-block')];
                blocksA.forEach(block => {
                    const resultBlock = buildResultBlock();
                    resultBlock.style.animation = 'popIn 0.6s ease forwards';
                    targetGroup.appendChild(resultBlock);
                });

                const blocksToRemove = [...groupB.querySelectorAll('.math-block')];
                if (blocksToRemove.length > 0) {
                    setTimeout(() => {
                        blocksToRemove.forEach((block, i) => {
                            setTimeout(() => {
                                block.style.transform = 'scale(0) rotate(45deg)'; block.style.opacity = '0.3'; block.textContent = '\u2716';
                                setTimeout(() => block.style.opacity = '0', 500);
                            }, i * 300);
                        });

                        // Remove blocos correspondentes do resultado
                        const resultBlocks = [...targetGroup.querySelectorAll('.math-block')];
                        const toRemoveCount = blocksToRemove.length;
                        for (let i = resultBlocks.length - 1; i >= resultBlocks.length - toRemoveCount && i >= 0; i--) {
                            const rb = resultBlocks[i];
                            setTimeout(() => {
                                rb.style.transform = 'scale(0)'; rb.style.opacity = '0';
                                setTimeout(() => rb.remove(), 400);
                            }, (resultBlocks.length - 1 - i) * 300);
                        }

                        setTimeout(() => pulseSuccess(targetGroup), blocksToRemove.length * 300 + 500);
                    }, 800);
                } else {
                    setTimeout(() => pulseSuccess(targetGroup), 800);
                }
            }
        });
    }

    // ══════════════════════════════════════════════════
    // 2. PASSAR O 10 (animacao especial de adicao)
    // Ex: 7 + 5 → 7 + 3 = 10, depois 10 + 2 = 12
    // ══════════════════════════════════════════════════

    function animatePassarO10(container, a, b) {
        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:12px; position:relative;';

        const faltaPra10 = 10 - a;
        const sobra = b - faltaPra10;

        // Titulo
        const title = document.createElement('div');
        title.style.cssText = 'font-size:1rem; color:var(--color-text-secondary); text-align:center;';
        title.textContent = `${a} + ${b} = ? Vamos usar o macete "Passar o 10"!`;
        container.appendChild(title);

        // Grupo A
        const labelA = document.createElement('div');
        labelA.style.cssText = 'font-size:0.85rem; color:var(--color-secondary); font-weight:bold;';
        labelA.textContent = `${a} blocos`;
        container.appendChild(labelA);

        const groupA = document.createElement('div');
        groupA.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:250px; padding:8px; border:2px dashed var(--color-secondary); border-radius:8px; background:rgba(0,184,148,0.1); min-height:40px;';
        for (let i = 0; i < a; i++) groupA.appendChild(buildBlock(true));
        container.appendChild(groupA);

        // Simbolo +
        const symbol = document.createElement('div');
        symbol.style.cssText = 'font-size:2rem; font-weight:bold; color:var(--color-text-primary);';
        symbol.textContent = '+';
        container.appendChild(symbol);

        // Grupo B
        const labelB = document.createElement('div');
        labelB.style.cssText = 'font-size:0.85rem; color:var(--color-accent); font-weight:bold;';
        labelB.textContent = `${b} blocos`;
        container.appendChild(labelB);

        const groupB = document.createElement('div');
        groupB.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:250px; padding:8px; border:2px dashed var(--color-accent); border-radius:8px; background:rgba(253,203,110,0.1); min-height:40px;';
        for (let i = 0; i < b; i++) groupB.appendChild(buildBlock(false));
        container.appendChild(groupB);

        // Area do resultado (10 + sobra)
        const resultArea = document.createElement('div');
        resultArea.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:8px; margin-top:10px; opacity:0; transition:opacity 0.5s;';

        const result10 = document.createElement('div');
        result10.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:280px; padding:8px; border:2px solid var(--color-primary); border-radius:8px; background:rgba(108,92,231,0.1); min-height:40px;';

        const resultSobra = document.createElement('div');
        resultSobra.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:150px; padding:8px; border:2px solid #e84393; border-radius:8px; background:rgba(232,67,147,0.1); min-height:40px;';

        resultArea.appendChild(result10);
        if (sobra > 0) resultArea.appendChild(resultSobra);
        container.appendChild(resultArea);

        // Narracoes vao aparecer aqui
        const narrationArea = document.createElement('div');
        narrationArea.style.cssText = 'width:100%; max-width:300px;';
        container.appendChild(narrationArea);

        createPlayButton(container, () => {
            // PASSO 1: Mostrar que falta X pra chegar no 10
            narrate(narrationArea, `${a} precisa de ${faltaPra10} pra chegar no 10...`);

            setTimeout(() => {
                // Destaca os blocos que vao "passar"
                const blocksB = [...groupB.querySelectorAll('.math-block')];
                for (let i = 0; i < faltaPra10 && i < blocksB.length; i++) {
                    blocksB[i].className = 'math-block math-block-highlight';
                }

                narrate(narrationArea, `Pega ${faltaPra10} do ${b} e completa o 10!`);

                // PASSO 2: Animar os blocos destacados voando pro grupo A
                setTimeout(() => {
                    resultArea.style.opacity = '1';

                    // Preenche o resultado com os A originais
                    for (let i = 0; i < a; i++) {
                        const rb = buildResultBlock();
                        rb.style.animation = 'popIn 0.3s ease forwards';
                        result10.appendChild(rb);
                    }

                    // Voa os blocos destacados pra dentro do resultado (completando 10)
                    for (let i = 0; i < faltaPra10 && i < blocksB.length; i++) {
                        const block = blocksB[i];
                        setTimeout(() => {
                            block.style.transform = 'scale(0)';
                            block.style.opacity = '0';
                            const rb = buildResultBlock();
                            rb.style.animation = 'popIn 0.4s ease forwards';
                            result10.appendChild(rb);
                        }, i * 400);
                    }

                    // PASSO 3: Mostrar o que sobrou
                    const tempoPassar = faltaPra10 * 400 + 600;
                    setTimeout(() => {
                        narrationArea.innerHTML = '';
                        narrate(narrationArea, `Agora temos 10! E sobraram ${sobra} do ${b}.`);

                        // Os blocos restantes do B vao pra area de sobra
                        for (let i = faltaPra10; i < blocksB.length; i++) {
                            const block = blocksB[i];
                            setTimeout(() => {
                                block.style.transform = 'scale(0)';
                                block.style.opacity = '0';
                                const hb = buildHighlightBlock();
                                hb.style.animation = 'popIn 0.4s ease forwards';
                                resultSobra.appendChild(hb);
                            }, (i - faltaPra10) * 300);
                        }

                        // PASSO 4: Resultado final
                        const tempoSobra = sobra * 300 + 800;
                        setTimeout(() => {
                            narrationArea.innerHTML = '';
                            narrate(narrationArea, `10 + ${sobra} = ${a + b}. Pronto!`);
                            pulseSuccess(resultArea);
                        }, tempoSobra);
                    }, tempoPassar);
                }, 1200);
            }, 1500);
        });
    }

    // ══════════════════════════════════════════════════
    // 3. MULTIPLICACAO (com decomposicao visual)
    // ══════════════════════════════════════════════════

    function animateMultiplication(container, a, b) {
        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; align-items:center;';

        const numGroups = Math.min(a, 6);
        const itemsPerGroup = Math.min(b, 10);
        const useDecomp = a > 2 && b > 5;

        const title = document.createElement('div');
        title.style.cssText = 'font-size:1rem; color:var(--color-text-secondary); margin-bottom:5px;';
        title.textContent = `${a} grupos de ${b} blocos = ${a * b}`;
        container.appendChild(title);

        if (useDecomp) {
            // Decomposicao: ex 7x8 = 7x5 + 7x3
            const part1 = Math.min(b, 5);
            const part2 = b - part1;

            const decompTitle = document.createElement('div');
            decompTitle.style.cssText = 'font-size:0.9rem; color:var(--color-accent); margin-bottom:10px; text-align:center;';
            decompTitle.textContent = `Macete: ${a}\u00d7${b} = ${a}\u00d7${part1} + ${a}\u00d7${part2}`;
            container.appendChild(decompTitle);

            const stepsArea = document.createElement('div');
            stepsArea.style.cssText = 'width:100%; max-width:300px;';
            container.appendChild(stepsArea);

            const groupContainer = document.createElement('div');
            groupContainer.className = 'math-group-container';
            container.appendChild(groupContainer);

            createPlayButton(container, () => {
                // Passo 1
                const step1 = document.createElement('div');
                step1.className = 'decomp-step';
                step1.innerHTML = `<div class="number">${a * part1}</div><div class="explain">${a} \u00d7 ${part1} = ${a * part1}</div>`;
                stepsArea.appendChild(step1);
                setTimeout(() => step1.classList.add('active'), 100);

                // Mostra grupos da parte 1
                for (let i = 0; i < Math.min(a, 4); i++) {
                    setTimeout(() => {
                        const box = document.createElement('div');
                        box.className = 'math-group-box';
                        box.style.borderColor = 'var(--color-secondary)';
                        for (let j = 0; j < part1; j++) {
                            const bl = buildBlock(true);
                            bl.style.fontSize = '0.8rem'; bl.style.width = '18px'; bl.style.height = '18px'; bl.style.lineHeight = '18px'; bl.textContent = '\u2022';
                            box.appendChild(bl);
                        }
                        groupContainer.appendChild(box);
                    }, i * 500);
                }

                // Passo 2
                setTimeout(() => {
                    const step2 = document.createElement('div');
                    step2.className = 'decomp-step';
                    step2.innerHTML = `<div class="number">${a * part2}</div><div class="explain">${a} \u00d7 ${part2} = ${a * part2}</div>`;
                    stepsArea.appendChild(step2);
                    setTimeout(() => step2.classList.add('active'), 100);

                    // Mostra grupos da parte 2
                    for (let i = 0; i < Math.min(a, 4); i++) {
                        setTimeout(() => {
                            const box = document.createElement('div');
                            box.className = 'math-group-box';
                            box.style.borderColor = 'var(--color-accent)';
                            box.style.background = 'rgba(253,203,110,0.1)';
                            for (let j = 0; j < part2; j++) {
                                const bl = buildBlock(false);
                                bl.style.fontSize = '0.8rem'; bl.style.width = '18px'; bl.style.height = '18px'; bl.style.lineHeight = '18px'; bl.textContent = '\u2022';
                                box.appendChild(bl);
                            }
                            groupContainer.appendChild(box);
                        }, i * 500);
                    }

                    // Resultado
                    setTimeout(() => {
                        const step3 = document.createElement('div');
                        step3.className = 'decomp-step';
                        step3.style.borderLeftColor = 'var(--color-primary)';
                        step3.innerHTML = `<div class="number" style="font-size:2rem;">${a * b}</div><div class="explain">${a * part1} + ${a * part2} = ${a * b}</div>`;
                        stepsArea.appendChild(step3);
                        setTimeout(() => step3.classList.add('active'), 100);
                        setTimeout(() => pulseSuccess(stepsArea), 500);
                    }, Math.min(a, 4) * 500 + 600);
                }, Math.min(a, 4) * 500 + 800);
            });

        } else {
            // Animacao simples pra numeros pequenos
            const groupContainer = document.createElement('div');
            groupContainer.className = 'math-group-container';

            for (let i = 0; i < numGroups; i++) {
                const box = document.createElement('div');
                box.className = 'math-group-box';
                groupContainer.appendChild(box);
            }
            container.appendChild(groupContainer);

            createPlayButton(container, () => {
                const boxes = groupContainer.querySelectorAll('.math-group-box');
                let groupIndex = 0;

                const fillInterval = setInterval(() => {
                    if (groupIndex >= numGroups) {
                        clearInterval(fillInterval);
                        setTimeout(() => pulseSuccess(groupContainer), 500);
                        return;
                    }

                    const box = boxes[groupIndex];
                    box.style.animationDelay = '0s';
                    box.style.opacity = '1';

                    for (let j = 0; j < itemsPerGroup; j++) {
                        setTimeout(() => {
                            const block = buildBlock(true);
                            block.style.fontSize = '0.8rem'; block.style.width = '20px'; block.style.height = '20px'; block.style.lineHeight = '20px'; block.textContent = '\u2022';
                            block.style.animation = 'popIn 0.3s ease forwards';
                            box.appendChild(block);
                        }, j * 100);
                    }

                    groupIndex++;
                }, 800);
            });
        }
    }

    // ══════════════════════════════════════════════════
    // 4. DIVISAO (com suporte a resto)
    // ══════════════════════════════════════════════════

    function animateDivision(container, total, divisor) {
        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; align-items:center; width: 100%;';

        const quociente = Math.floor(total / divisor);
        const resto = total % divisor;

        const title = document.createElement('div');
        title.style.cssText = 'font-size:1rem; color:var(--color-text-secondary); margin-bottom:10px; text-align:center;';
        title.textContent = resto > 0
            ? `Vamos dividir ${total} blocos em ${divisor} grupos (sobra ${resto}!)`
            : `Vamos dividir ${total} blocos em ${divisor} grupos`;
        container.appendChild(title);

        // Monte original
        const sourceBox = document.createElement('div');
        sourceBox.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; padding:10px; border:2px solid var(--color-text-secondary); border-radius:8px; background:rgba(255,255,255,0.05); min-width:100px; min-height:40px; margin-bottom: 20px; position: relative;';

        const sourceLabel = document.createElement('div');
        sourceLabel.style.cssText = 'position:absolute; top:-10px; left:10px; background:var(--color-bg-card); padding:0 5px; font-size:0.8rem; color:var(--color-text-secondary);';
        sourceLabel.textContent = `Monte: ${total}`;
        sourceBox.appendChild(sourceLabel);

        for (let i = 0; i < total; i++) {
            sourceBox.appendChild(buildBlock(false));
        }
        container.appendChild(sourceBox);

        // Caixas de destino
        const shelfContainer = document.createElement('div');
        shelfContainer.className = 'division-shelf';

        const shelves = [];
        for (let i = 0; i < divisor; i++) {
            const box = document.createElement('div');
            box.className = 'division-box';
            box.style.opacity = '0.5';

            const label = document.createElement('span');
            label.className = 'label'; label.textContent = `Grupo ${i + 1}`;
            box.appendChild(label);

            const itemsContainer = document.createElement('div');
            itemsContainer.style.cssText = 'display:flex; flex-wrap:wrap; gap:2px; min-height: 30px;';
            box.appendChild(itemsContainer);

            shelfContainer.appendChild(box);
            shelves.push({ box, itemsContainer });
        }
        container.appendChild(shelfContainer);

        // Caixa de resto (se houver)
        let remainderShelf = null;
        if (resto > 0) {
            const rBox = document.createElement('div');
            rBox.className = 'division-box remainder-box';
            rBox.style.opacity = '0.3';
            rBox.style.marginTop = '15px';

            const rLabel = document.createElement('span');
            rLabel.className = 'label'; rLabel.textContent = `Resto`;
            rBox.appendChild(rLabel);

            const rItems = document.createElement('div');
            rItems.style.cssText = 'display:flex; flex-wrap:wrap; gap:2px; min-height: 30px;';
            rBox.appendChild(rItems);

            shelfContainer.appendChild(rBox);
            remainderShelf = { box: rBox, itemsContainer: rItems };
        }

        const narrationArea = document.createElement('div');
        narrationArea.style.cssText = 'width:100%; max-width:300px; margin-top:10px;';
        container.appendChild(narrationArea);

        createPlayButton(container, () => {
            sourceLabel.textContent = 'Distribuindo...';

            const sourceBlocks = Array.from(sourceBox.querySelectorAll('.math-block'));
            const distributeCount = quociente * divisor; // blocos que cabem certinho
            let blockIndex = 0;

            const interval = setInterval(() => {
                if (blockIndex >= distributeCount) {
                    clearInterval(interval);

                    // Se tem resto, anima os blocos restantes
                    if (resto > 0 && remainderShelf) {
                        setTimeout(() => {
                            narrate(narrationArea, `Sobraram ${resto} blocos. N\u00e3o cabem em nenhum grupo!`);
                            remainderShelf.box.style.opacity = '1';
                            remainderShelf.box.classList.add('active');

                            for (let r = 0; r < resto; r++) {
                                const block = sourceBlocks[distributeCount + r];
                                if (!block) continue;

                                setTimeout(() => {
                                    block.style.opacity = '0';
                                    const rb = buildRemainderBlock();
                                    rb.textContent = '1';
                                    rb.style.animation = 'popIn 0.4s ease forwards';
                                    remainderShelf.itemsContainer.appendChild(rb);
                                }, r * 400);
                            }

                            setTimeout(() => {
                                sourceLabel.textContent = 'Vazio!';
                                sourceLabel.style.color = 'var(--color-danger)';
                                narrationArea.innerHTML = '';
                                narrate(narrationArea, `${total} \u00f7 ${divisor} = ${quociente} (resto ${resto})`);
                                pulseSuccess(shelfContainer);
                            }, resto * 400 + 600);
                        }, 500);
                    } else {
                        sourceLabel.textContent = 'Vazio!';
                        sourceLabel.style.color = 'var(--color-danger)';
                        narrate(narrationArea, `${total} \u00f7 ${divisor} = ${quociente}. Perfeito!`);
                        setTimeout(() => pulseSuccess(shelfContainer), 500);
                    }
                    return;
                }

                const shelfIndex = blockIndex % divisor;
                const shelf = shelves[shelfIndex];
                shelf.box.style.opacity = '1';
                shelf.box.classList.add('active');

                const block = sourceBlocks[blockIndex];
                const blockRect = block.getBoundingClientRect();
                const targetRect = shelf.itemsContainer.getBoundingClientRect();

                const clone = block.cloneNode(true);
                clone.style.position = 'fixed';
                clone.style.top = blockRect.top + 'px';
                clone.style.left = blockRect.left + 'px';
                clone.style.zIndex = '999';
                clone.style.width = blockRect.width + 'px';
                clone.style.height = blockRect.height + 'px';
                document.body.appendChild(clone);

                block.style.opacity = '0';

                const targetX = targetRect.left + (shelf.itemsContainer.children.length * 22);
                const targetY = targetRect.top + 5;

                clone.style.setProperty('--tx', (targetX - blockRect.left) + 'px');
                clone.style.setProperty('--ty', (targetY - blockRect.top) + 'px');
                clone.style.animation = 'flyToTarget 0.8s cubic-bezier(0.68,-0.55,0.265,1.55) forwards';

                setTimeout(() => {
                    clone.remove();
                    const newBlock = buildBlock(false);
                    newBlock.style.fontSize = '0.8rem';
                    newBlock.style.width = '20px';
                    newBlock.style.height = '20px';
                    newBlock.style.lineHeight = '20px';
                    newBlock.style.animation = 'popIn 0.3s ease forwards';
                    shelf.itemsContainer.appendChild(newBlock);
                }, 800);

                blockIndex++;
            }, 700);
        });
    }

    // ══════════════════════════════════════════════════
    // UTILITARIOS
    // ══════════════════════════════════════════════════

    function pulseSuccess(element) {
        element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = '0 0 20px var(--color-primary)';
        setTimeout(() => { element.style.transform = 'scale(1)'; element.style.boxShadow = ''; }, 600);
    }

    function shakeElement(element) {
        element.style.animation = 'tryAgainShake 0.5s ease';
        setTimeout(() => { element.style.animation = ''; }, 500);
    }

    function countUpAnimation(element, from, to, duration) {
        const start = performance.now(); const diff = to - from;
        function step(timestamp) {
            const progress = Math.min((timestamp - start) / (duration || 800), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(from + diff * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function showAchievementAnimation(container, icon, text) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); z-index:1000; animation: fadeIn 0.3s ease;';
        overlay.innerHTML = `<div style="font-size:4rem; animation: achievementReveal 0.8s cubic-bezier(0.68,-0.55,0.265,1.55);">${icon}</div><div style="color:#FDCB6E; font-family:var(--font-family-display); font-size:1.5rem; margin-top:1rem; animation: fadeIn 0.5s 0.3s both;">${text}</div>`;
        overlay.addEventListener('click', () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 300); });
        container.appendChild(overlay);
        setTimeout(() => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 300); }, 3000);
    }

    return {
        createItems, animateMathProblem, animateMultiplication, animateDivision,
        animatePassarO10,
        pulseSuccess, shakeElement, countUpAnimation, showAchievementAnimation, TIMING
    };
})();
