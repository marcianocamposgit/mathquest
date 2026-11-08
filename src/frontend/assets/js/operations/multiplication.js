/**
 * MathQuest - Modulo: Multiplicação
 * Adição repetida - grupos iguais lado a lado
 */
const MultiplicacaoModule = (() => {
    'use strict';

    const LEVEL_CONFIG = {
        1: { tables: [2, 5, 10], maxFactor: 10, label: 'Tabuada do 2, 5, 10' },
        2: { tables: [3, 4, 6, 9], maxFactor: 10, label: 'Tabuada do 3, 4, 6, 9' },
        3: { tables: [2,3,4,5,6,7,8,9,10], maxFactor: 10, label: 'Tabuada completa' },
        4: { tables: [2,3,4,5,6,7,8,9,10], maxFactor: 20, label: 'Multiplicação 2 digitos' }
    };

    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function generateChallenge(level) {
        const config = LEVEL_CONFIG[level];
        if (!config) return null;

        const a = randomChoice(config.tables); // Itens por grupo
        const b = randomInt(1, config.maxFactor); // Número de grupos
        const correctAnswer = a * b;

        const contexto = randomChoice([
            { item: 'diamantes', icone: '💎', container: 'baú', containerPlural: 'baús' },
            { item: 'espadas', icone: '⚔', container: 'armário', containerPlural: 'armários' },
            { item: 'blocos', icone: '🧱', container: 'pilha', containerPlural: 'pilhas' },
            { item: 'moedas', icone: '🪙', container: 'saco', containerPlural: 'sacos' },
            { item: 'poções', icone: '🧪', container: 'estante', containerPlural: 'estantes' }
        ]);

        const situacaoTexto = `Você tem ${b} ${contexto.containerPlural}, cada um com ${a} ${contexto.item}. Quantos ${contexto.item} no total?`;
        
        // TRUQUE DE ENGENHARIA: Força o visual usando apenas texto e quebras de linha
        let visualTexto = '';
        const itensPorLinha = Math.min(a, 5); // Mostra no máximo 5 por linha para caber na tela
        const gruposParaDesenhar = Math.min(b, 5); // Mostra no máximo 5 grupos

        for (let i = 0; i < gruposParaDesenhar; i++) {
            visualTexto += '[ ';
            for (let j = 0; j < itensPorLinha; j++) {
                visualTexto += contexto.icone + ' ';
            }
            if (a > 5) visualTexto += '... ';
            visualTexto += ']\n';
        }
        if (b > 5) visualTexto += '...';

        return {
            a, b, operation: 'multiplicacao', correctAnswer, level, contexto, situacao: situacaoTexto,
            maceteAplicavel: detectTrick(a, b),
            // O Front-end vai ler "visualHint.display", que contém os grupos formatados
            visualHint: { 
                groups: b, 
                itemsPerGroup: a, 
                animationType: 'replicateGroup', 
                itemIcon: contexto.icone, 
                display: visualTexto // <-- Aqui está a mágica!
            }
        };
    }
        
    function detectTrick(a, b) {
        if (a === 1 || b === 1) return 'mul_by1';
        if (a === 0 || b === 0) return 'mul_by0';
        if (a === 2 || b === 2) return 'mul_by2';
        if (a === 10 || b === 10) return 'mul_by10';
        if (a === 5 || b === 5) return 'mul_by5';
        if (a === 9 || b === 9) return 'mul_by9';
        if (a === 4 || b === 4) return 'mul_by4';
        return 'mul_repeated';
    }

    function validate(a, b, userAnswer) {
        const correctAnswer = a * b;
        const isCorrect = userAnswer === correctAnswer;
        const diff = Math.abs(userAnswer - correctAnswer);

        let feedback;
        if (isCorrect) feedback = randomChoice(['Perfeito!', 'Isso ai!', 'Mandou bem!', 'Craque!']);
        else if (diff <= a || diff <= b) feedback = `Quase! Errou por pouco. ${a} x ${b} = ${correctAnswer}.`;
        else feedback = `Hmm, vamos ver por que ${a} x ${b} = ${correctAnswer}...`;

        return { correct: isCorrect, correctAnswer, userAnswer, difference: diff, feedback,
                 decomposition: getVisualDecomposition(a, b), trick: detectTrick(a, b) };
    }

    function getVisualDecomposition(a, b) {
        const result = a * b;
        const steps = [{ step: `${a} x ${b}`, visual: `${b} grupos de ${a}`, animationType: 'show_groups', data: { groups: b, perGroup: a } }];

        // Adição repetida
        const parts = Array(b).fill(a);
        steps.push({ step: parts.join(' + '), visual: `Somar ${a}, ${b} vezes.`, animationType: 'repeated_add', data: { value: a, times: b } });

        // Macetes
        if (a === 9 || b === 9) {
            const other = (a === 9) ? b : a;
            const dezena = other - 1;
            const unidade = 9 - dezena;
            steps.push({ step: `Truque do 9: ${dezena}${unidade}`, visual: `Dedo ${other}: esquerda=${dezena}, direita=${unidade}`, animationType: 'finger_trick', data: { finger: other, tens: dezena, ones: unidade } });
        } else if (a === 5 || b === 5) {
            steps.push({ step: `Conta de 5 em 5`, visual: `5, 10, 15... pulando de 5!`, animationType: 'clock_jump', data: { step: 5, times: (a === 5) ? b : a } });
        } else if (a === 4 || b === 4) {
            const other = (a === 4) ? b : a;
            steps.push({ step: `${other} x 2 x 2`, visual: `Dobro do dobro! ${other}x2=${other*2}, x2=${other*4}`, animationType: 'double_double', data: { base: other, first: other*2, second: other*4 } });
        }

        steps.push({ step: `= ${result}`, visual: `Total: ${result}!`, animationType: 'merge_result', data: { result } });
        return steps;
    }

    function getTricks(level) {
        const all = [
            { id: 'mul_repeated', nível: 1, nome: 'Soma Repetida', descricao: 'Multiplicar e somar o mesmo número varias vezes. 3x4 = 4+4+4.', animationType: 'group_add', exemplo: { a: 3, b: 4, result: 12 }, dica: 'Conte grupo por grupo!' },
            { id: 'mul_by2', nível: 1, nome: 'O Dobro', descricao: 'Tabuada do 2 e sempre o dobro do número. 2x7 = 7+7 = 14.', animationType: 'mirror', exemplo: { a: 2, b: 7, result: 14 }, dica: 'x2 = espelho! Some o número com ele mesmo.' },
            { id: 'mul_by5', nível: 1, nome: 'Relogio de 5', descricao: 'Tabuada do 5 sempre termina em 0 ou 5. Conte no relogio!', animationType: 'clock_jump', exemplo: { a: 5, b: 7, result: 35 }, dica: 'Ímpar x5 = termina em 5. Par x5 = termina em 0.' },
            { id: 'mul_by10', nível: 1, nome: 'Cola o Zero', descricao: 'Multiplicar por 10: cola um zero no final. 6x10 = 60.', animationType: 'append_zero', exemplo: { a: 10, b: 6, result: 60 }, dica: 'x10 = número + zero na frente.' },
            { id: 'mul_commute', nível: 1, nome: 'Girar a Grade', descricao: '3x4 = 4x3. A grade so gira, a quantidade nao muda!', animationType: 'grid_rotate', exemplo: { a: 3, b: 4, result: 12 }, dica: 'Se um lado e mais facil, inverte!' },
            { id: 'mul_by9', nível: 2, nome: 'Truque dos Dedos', descricao: 'Tabuada do 9: baixa o dedo N, esquerda=dezena, direita=unidade. E a soma dos digitos sempre = 9!', animationType: 'finger_trick', exemplo: { a: 9, b: 7, result: 63 }, dica: '9x7: baixa dedo 7. Esquerda: 6 dedos, Direita: 3 dedos = 63.' },
            { id: 'mul_by4', nível: 2, nome: 'Dobro do Dobro', descricao: 'x4 = dobrar duas vezes. 3x4 = 3x2x2 = 6x2 = 12.', animationType: 'double_double', exemplo: { a: 4, b: 3, result: 12 }, dica: 'Dobre uma vez, depois dobre de novo.' },
            { id: 'mul_distribute', nível: 3, nome: 'Quebrar e Juntar', descricao: 'Quebra um fator pra facilitar. 7x6 = (5x6)+(2x6) = 30+12 = 42.', animationType: 'decompose_mul', exemplo: { a: 7, b: 6, result: 42 }, dica: 'Quebre no 5 + resto. 5x qualquer coisa e facil!' }
        ];
        return all.filter(t => t.nível <= level);
    }

    function generateTrueOrFalse(level) {
        const config = LEVEL_CONFIG[level];
        const a = randomChoice(config.tables);
        const b = randomInt(1, config.maxFactor);
        const correct = a * b;
        const isTrue = Math.random() > 0.5;
        let fake = correct;
        if (!isTrue) {
            fake = correct + randomChoice([-a, a, -b, b, -1, 1]);
            if (fake <= 0 || fake === correct) fake = correct + a;
        }
        return { statement: `${a} x ${b} = ${isTrue ? correct : fake}`, a, b, displayedAnswer: isTrue ? correct : fake,
                 isTrue, correctAnswer: correct, decomposition: getVisualDecomposition(a, b),
                 explanation: isTrue ? `Correto! ${a} x ${b} = ${correct}.` : `Nao! ${a} x ${b} = ${correct}. Sao ${b} grupos de ${a}.` };
    }

    function generateHiddenNumber(level) {
        const config = LEVEL_CONFIG[level];
        const a = randomChoice(config.tables);
        const b = randomInt(1, Math.min(config.maxFactor, 10));
        const result = a * b;
        const hideFirst = Math.random() > 0.5;
        return { equation: hideFirst ? `? x ${b} = ${result}` : `${a} x ? = ${result}`,
                 hiddenValue: hideFirst ? a : b, result, position: hideFirst ? 'first' : 'second',
                 hint: `Pense: ${result} / ${hideFirst ? b : a} = ?`,
                 explanation: `${result} / ${hideFirst ? b : a} = ${hideFirst ? a : b}. Divisão e a multiplicacao ao contrario!` };
    }

    return { generateChallenge, validate, getVisualDecomposition, getTricks, generateTrueOrFalse, generateHiddenNumber, detectTrick, LEVEL_CONFIG };
})();

// Export global
window.MultiplicacaoModule = MultiplicacaoModule;