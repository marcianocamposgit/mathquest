/**
 * MathQuest - Animation Engine
 * Animacoes pedagogicas usando CSS + DOM
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
        `;
        document.head.appendChild(style);
    }

    function createItems(container, count, icon, className) {
        container.innerHTML = '';
        const items = [];
        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = `item ${className || ''}`;
            el.textContent = icon || '🧱';
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

    // --- 1. ANIMAÇÃO DE ADIÇÃO E SUBTRAÇÃO (PASSO A PASSO) ---
    function animateMathProblem(container, a, b, operation) {
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
        else { for (let i=0; i<a; i++) groupA.appendChild(buildBlock(true)); }

        if (b === 0) { groupB.innerHTML = '<span style="color:var(--color-text-secondary); font-size:0.8rem; margin:auto;">(nada)</span>'; } 
        else { for (let i=0; i<b; i++) groupB.appendChild(buildBlock(false)); }

        const targetGroup = document.createElement('div');
        targetGroup.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; max-width:300px; padding:5px; border:2px solid var(--color-primary); border-radius:8px; min-height:40px; background:rgba(108,92,231,0.1); opacity:0; transition:opacity 0.5s;';

        // Botão de Play para a criança iniciar a animação
        const playBtn = document.createElement('button');
        playBtn.textContent = '✨ Ver a mágica!';
        playBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-size: 1rem; font-weight: bold; border: none; border-radius: 8px; background: var(--color-accent); color: white; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: transform 0.2s;';
        playBtn.onmouseover = () => playBtn.style.transform = 'scale(1.05)';
        playBtn.onmouseout = () => playBtn.style.transform = 'scale(1)';

        container.appendChild(groupA); 
        container.appendChild(symbol); 
        container.appendChild(groupB); 
        container.appendChild(targetGroup);
        container.appendChild(playBtn);

        playBtn.addEventListener('click', () => {
            playBtn.remove(); // Remove o botão para não clicar duas vezes
            
            if (operation === 'adicao') {
                const allBlocks = [...groupA.querySelectorAll('.math-block'), ...groupB.querySelectorAll('.math-block')];
                if (allBlocks.length === 0) {
                    targetGroup.innerHTML = '<span style="color:var(--color-text-secondary); font-size:0.8rem; margin:auto;">(nada)</span>';
                    targetGroup.style.opacity = '1';
                    pulseSuccess(targetGroup);
                    return;
                }

                // Animação de voo ajustada para ser mais lenta e didática
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
                    
                    // Aumentei de 0.8s para 1.2s para dar tempo de ver o movimento
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
                            block.style.transform = 'scale(0) rotate(45deg)'; block.style.opacity = '0.3'; block.textContent = '✖';
                            setTimeout(() => block.style.opacity = '0', 500);
                        }, i * 300); // Aumentei o tempo entre remoções
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
                                block.style.transform = 'scale(0) rotate(45deg)'; block.style.opacity = '0.3'; block.textContent = '✖';
                                setTimeout(() => block.style.opacity = '0', 500);
                            }, i * 300);
                        });
                        setTimeout(() => pulseSuccess(targetGroup), blocksToRemove.length * 300 + 500);
                    }, 800);
                } else {
                    setTimeout(() => pulseSuccess(targetGroup), 800);
                }
            }
        });
    }

    // --- 2. ANIMAÇÃO DE MULTIPLICAÇÃO (PASSO A PASSO) ---
    function animateMultiplication(container, a, b) {
        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; align-items:center;';

        const numGroups = Math.min(a, 6); 
        const itemsPerGroup = Math.min(b, 10);
        
        const title = document.createElement('div');
        title.style.cssText = 'font-size:1rem; color:var(--color-text-secondary); margin-bottom:5px;';
        title.textContent = `${a} grupos de ${b} blocos = ${a * b}`;
        container.appendChild(title);

        const groupContainer = document.createElement('div');
        groupContainer.className = 'math-group-container';

        // Desenha as caixas vazias
        for (let i = 0; i < numGroups; i++) {
            const box = document.createElement('div');
            box.className = 'math-group-box';
            groupContainer.appendChild(box);
        }
        container.appendChild(groupContainer);

        // Cria o botão "Ver a mágica"
        const playBtn = document.createElement('button');
        playBtn.textContent = '✨ Ver a mágica!';
        playBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-size: 1rem; font-weight: bold; border: none; border-radius: 8px; background: var(--color-accent); color: white; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: transform 0.2s;';
        playBtn.onmouseover = () => playBtn.style.transform = 'scale(1.05)';
        playBtn.onmouseout = () => playBtn.style.transform = 'scale(1)';
        container.appendChild(playBtn);

        playBtn.addEventListener('click', () => {
            playBtn.remove(); // Remove o botão

            // Preenche as caixas uma a uma
            const boxes = groupContainer.querySelectorAll('.math-group-box');
            let groupIndex = 0;

            const fillInterval = setInterval(() => {
                if (groupIndex >= numGroups) {
                    clearInterval(fillInterval);
                    setTimeout(() => pulseSuccess(groupContainer), 500);
                    return;
                }

                const box = boxes[groupIndex];
                box.style.animationDelay = '0s'; // Remove o delay original
                box.style.opacity = '1'; // Torna visível
                
                for (let j = 0; j < itemsPerGroup; j++) {
                    setTimeout(() => {
                        const block = buildBlock(true);
                        block.style.fontSize = '0.8rem'; block.style.width = '20px'; block.style.height = '20px'; block.style.lineHeight = '20px'; block.textContent = '•';
                        block.style.animation = 'popIn 0.3s ease forwards';
                        box.appendChild(block);
                    }, j * 100); // Adiciona um bloco a cada 0.1s
                }

                groupIndex++;
            }, 800); // Preenche uma caixa a cada 0.8s
        });
    }

    // --- 3. ANIMAÇÃO DE DIVISÃO (PASSO A PASSO E VISUAL) ---
    function animateDivision(container, total, divisor) {
        container.innerHTML = '';
        container.style.cssText = 'display:flex; flex-direction:column; align-items:center; width: 100%;';

        const title = document.createElement('div');
        title.style.cssText = 'font-size:1rem; color:var(--color-text-secondary); margin-bottom:10px;';
        title.textContent = `Vamos dividir ${total} blocos em ${divisor} grupos`;
        container.appendChild(title);

        // 1. O Monte Original
        const sourceBox = document.createElement('div');
        sourceBox.style.cssText = 'display:flex; flex-wrap:wrap; justify-content:center; padding:10px; border:2px solid var(--color-text-secondary); border-radius:8px; background:rgba(255,255,255,0.05); min-width:100px; min-height:40px; margin-bottom: 20px; position: relative;';
        
        const sourceLabel = document.createElement('div');
        sourceLabel.style.cssText = 'position:absolute; top:-10px; left:10px; background:var(--color-bg-card); padding:0 5px; font-size:0.8rem; color:var(--color-text-secondary);';
        sourceLabel.textContent = 'Monte Total';
        sourceBox.appendChild(sourceLabel);

        for (let i = 0; i < total; i++) {
            sourceBox.appendChild(buildBlock(false));
        }
        container.appendChild(sourceBox);

        // 2. As Caixas de Destino
        const shelfContainer = document.createElement('div');
        shelfContainer.className = 'division-shelf';

        const shelves = [];
        for (let i = 0; i < divisor; i++) {
            const box = document.createElement('div');
            box.className = 'division-box';
            box.style.opacity = '0.5'; // Começa apagado
            
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

        const playBtn = document.createElement('button');
        playBtn.textContent = '✨ Ver a mágica!';
        playBtn.style.cssText = 'margin-top: 15px; padding: 10px 20px; font-size: 1rem; font-weight: bold; border: none; border-radius: 8px; background: var(--color-accent); color: white; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: transform 0.2s;';
        playBtn.onmouseover = () => playBtn.style.transform = 'scale(1.05)';
        playBtn.onmouseout = () => playBtn.style.transform = 'scale(1)';
        container.appendChild(playBtn);

        playBtn.addEventListener('click', () => {
            playBtn.remove();
            sourceLabel.textContent = 'Distribuindo...';

            const sourceBlocks = Array.from(sourceBox.querySelectorAll('.math-block'));
            let blockIndex = 0;

            // Animação: pega um bloco do monte, voa para a caixa
            const interval = setInterval(() => {
                if (blockIndex >= sourceBlocks.length) {
                    clearInterval(interval);
                    sourceLabel.textContent = 'Vazio!';
                    sourceLabel.style.color = 'var(--color-danger)';
                    setTimeout(() => pulseSuccess(shelfContainer), 500);
                    return;
                }

                // Ativa a caixa de destino
                const shelfIndex = blockIndex % divisor;
                const shelf = shelves[shelfIndex];
                shelf.box.style.opacity = '1';
                shelf.box.classList.add('active');

                // Prepara a animação de voo
                const block = sourceBlocks[blockIndex];
                const blockRect = block.getBoundingClientRect();
                const targetRect = shelf.itemsContainer.getBoundingClientRect();

                // Clona o bloco e posiciona fixo
                const clone = block.cloneNode(true);
                clone.style.position = 'fixed';
                clone.style.top = blockRect.top + 'px';
                clone.style.left = blockRect.left + 'px';
                clone.style.zIndex = '999';
                clone.style.width = blockRect.width + 'px';
                clone.style.height = blockRect.height + 'px';
                document.body.appendChild(clone);

                // Esconde o original
                block.style.opacity = '0';

                // Calcula a distância do voo
                const targetX = targetRect.left + (shelf.itemsContainer.children.length * 22); // offset lateral
                const targetY = targetRect.top + 5;

                clone.style.setProperty('--tx', (targetX - blockRect.left) + 'px');
                clone.style.setProperty('--ty', (targetY - blockRect.top) + 'px');
                clone.style.animation = 'flyToTarget 0.8s cubic-bezier(0.68,-0.55,0.265,1.55) forwards';

                // Quando chegar, adiciona no destino e remove o clone
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
            }, 700); // Um bloco a cada 0.7s
        });
    }
        
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

    return { createItems, animateMathProblem, animateMultiplication, animateDivision, pulseSuccess, shakeElement, countUpAnimation, showAchievementAnimation, TIMING };
})();