/**
 * MathQuest - Modulo: Divisão
 * Distribuir igualmente - repartir em caixas
 */
const DivisaoModule = (() => {
    'use strict';

    const LEVEL_CONFIG = {
        1: { divisors: [2, 5, 10], maxDividend: 50, allowRemainder: false, label: 'Divisão por 2, 5, 10' },
        2: { divisors: [2,3,4,5,6], maxDividend: 60, allowRemainder: false, label: 'Divisão por 3, 4, 6' },
        3: { divisors: [2,3,4,5,6,7,8,9], maxDividend: 100, allowRemainder: true, label: 'Divisão com resto' },
        4: { divisors: [2,3,4,5,6,7,8,9,10,11,12], maxDividend: 200, allowRemainder: true, label: 'Divisão 2 digitos' }
    };

    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function generateChallenge(level) {
        const config = LEVEL_CONFIG[level];
        if (!config) return null;

        const b = randomChoice(config.divisors); // divisor
        let a, remainder;

        if (config.allowRemainder && Math.random() > 0.5) {
            // Gerar com resto
            const quotient = randomInt(2, Math.floor(config.maxDividend / b));
            remainder = randomInt(1, b - 1);
            a = quotient * b + remainder;
        } else {
            // Divisão exata
            const quotient = randomInt(1, Math.floor(config.maxDividend / b));
            a = quotient * b;
            remainder = 0;
        }

        const correctAnswer = Math.floor(a / b);
        const contexto = randomChoice([
            { item: 'diamantes', icone: '💎', container: 'bau', containerPlural: 'baus' },
            { item: 'espadas', icone: '⚔', container: 'armario', containerPlural: 'armarios' },
            { item: 'blocos', icone: '🧱', container: 'pilha', containerPlural: 'pilhas' },
            { item: 'moedas', icone: '🪙', container: 'saco', containerPlural: 'sacos' }
        ]);

        let situacao = `Você tem ${a} ${contexto.item} e quer dividir igualmente em ${b} ${contexto.containerPlural}. Quantos em cada?`;
        if (remainder > 0) situacao += ` (e quantos sobram?)`;

        return {
            a, b, operation: 'divisao', correctAnswer, remainder, level, contexto, situacao: situacao,
            maceteAplicavel: detectTrick(a, b),
            visualHint: { totalItems: a, boxes: b, animationType: 'distributeItem', itemIcon: contexto.icone }
        };
    }

    function detectTrick(a, b) {
        if (b === 1) return 'div_by1';
        if (a === b) return 'div_self';
        if (b === 2) return 'div_by2';
        if (a % b !== 0) return 'div_remainder';
        if (b === 5 || b === 10) return 'div_by5_rule';
        return 'div_reverse';
    }

    function validate(a, b, userAnswer, userRemainder) {
        const correctAnswer = Math.floor(a / b);
        const correctRemainder = a % b;
        const isCorrect = userAnswer === correctAnswer && (correctRemainder === 0 || userRemainder === correctRemainder);
        const diff = Math.abs(userAnswer - correctAnswer);

        let feedback;
        if (isCorrect) feedback = randomChoice(['Perfeito!', 'Distribuiu certinho!', 'Mandou bem!', 'Excelente!']);
        else if (diff === 1) feedback = `Quase! ${a} / ${b} = ${correctAnswer}${correctRemainder > 0 ? ' resto ' + correctRemainder : ''}.`;
        else if (userAnswer === correctAnswer && userRemainder !== correctRemainder) feedback = `A divisao ta certa, mas o resto e ${correctRemainder}!`;
        else feedback = `Vamos ver como distribuir ${a} em ${b} grupos...`;

        return { correct: isCorrect, correctAnswer, correctRemainder, userAnswer, feedback,
                 decomposition: getVisualDecomposition(a, b), trick: detectTrick(a, b) };
    }

    function getVisualDecomposition(a, b) {
        const quotient = Math.floor(a / b);
        const remainder = a % b;
        const steps = [{ step: `${a} / ${b}`, visual: `${a} itens, ${b} caixas. Distribuir!`, animationType: 'show_distribution', data: { total: a, boxes: b } }];

        if (b === 1) {
            steps.push({ step: `${a} / 1 = ${a}`, visual: 'Uma caixa so! Tudo vai pra ela.', animationType: 'single_box', data: { result: a } });
            return steps;
        }
        if (a === b) {
            steps.push({ step: `${a} / ${a} = 1`, visual: 'Cada caixa recebe exatamente 1!', animationType: 'individual_box', data: { result: 1 } });
            return steps;
        }

        // Distribuicao visual item por item
        steps.push({ step: `Distribuindo...`, visual: `Um pra cada caixa, rodando: 1, 2, ... ${b}, 1, 2, ...`, animationType: 'round_robin', data: { total: a, boxes: b, perBox: quotient } });

        if (remainder > 0) {
            steps.push({ step: `Sobrou ${remainder}!`, visual: `${remainder} ${remainder === 1 ? 'orfao que nao coube' : 'orfaos que nao couberam'} em nenhuma caixa.`, animationType: 'orphan_item', data: { remainder } });
            steps.push({ step: `${a} / ${b} = ${quotient} resto ${remainder}`, visual: `${quotient} em cada caixa, ${remainder} sobrando.`, animationType: 'merge_result', data: { quotient, remainder } });
        } else {
            steps.push({ step: `${a} / ${b} = ${quotient}`, visual: `${quotient} em cada caixa. Distribuicao perfeita!`, animationType: 'merge_result', data: { result: quotient } });
        }

        // Ligacao com multiplicacao
        steps.push({ step: `Prova: ${quotient} x ${b} = ${quotient * b}${remainder > 0 ? ' + ' + remainder + ' = ' + a : ''}`, visual: 'Divisão e multiplicacao ao contrario!', animationType: 'reverse_multiply', data: { quotient, divisor: b, remainder } });

        return steps;
    }

    function getTricks(level) {
        const all = [
            { id: 'div_by1', nível: 1, nome: 'Caixa Unica', descricao: 'Dividir por 1 nao muda nada. Tudo vai pra mesma caixa.', animationType: 'single_box', exemplo: { a: 8, b: 1, result: 8 }, dica: 'Viu /1? A resposta e o proprio número.' },
            { id: 'div_self', nível: 1, nome: 'Um Cada', descricao: 'Dividir por si mesmo = 1. Cada caixa ganha exatamente 1.', animationType: 'individual_box', exemplo: { a: 5, b: 5, result: 1 }, dica: 'Números iguais na divisao? Sempre 1.' },
            { id: 'div_reverse', nível: 1, nome: 'Desmontar a Multiplicação', descricao: 'Se 3x4=12, entao 12/3=4. Pense na tabuada!', animationType: 'unmultiply', exemplo: { a: 12, b: 3, result: 4 }, dica: 'Qual número vezes o divisor da o total?' },
            { id: 'div_by2', nível: 1, nome: 'Metade', descricao: 'Dividir por 2 e achar a metade. Corta ao meio!', animationType: 'split_half', exemplo: { a: 14, b: 2, result: 7 }, dica: 'Par? Metade e facil. Ímpar? Metade + resto 1.' },
            { id: 'div_remainder', nível: 2, nome: 'O Orfao', descricao: 'Quando nao da pra dividir certinho, sobra o orfao (resto).', animationType: 'orphan_item', exemplo: { a: 13, b: 4, result: '3 resto 1' }, dica: 'Distribui o maximo que da. O que sobrou e o resto.' },
            { id: 'div_by2_rule', nível: 2, nome: 'Par ou Ímpar', descricao: 'Divisivel por 2 se termina em 0,2,4,6,8 (par).', animationType: 'even_dance', exemplo: { a: 24, b: 2, result: 12 }, dica: 'Último digito e par? Divide por 2 certinho.' },
            { id: 'div_by5_rule', nível: 2, nome: 'Regra do 5', descricao: 'Divisivel por 5 se termina em 0 ou 5.', animationType: 'five_check', exemplo: { a: 35, b: 5, result: 7 }, dica: 'Termina em 0 ou 5? Divide por 5.' },
            { id: 'div_by3_rule', nível: 3, nome: 'Soma dos Digitos', descricao: 'Divisivel por 3 se a soma dos digitos divide por 3. 123: 1+2+3=6, 6/3=2.', animationType: 'digit_sum', exemplo: { a: 123, b: 3, result: 41 }, dica: 'Some os digitos. Da pra dividir por 3? Entao o número todo tambem!' }
        ];
        return all.filter(t => t.nível <= level);
    }

    function generateTrueOrFalse(level) {
        const config = LEVEL_CONFIG[level];
        const b = randomChoice(config.divisors);
        const quotient = randomInt(2, Math.floor(config.maxDividend / b));
        const a = quotient * b;
        const correct = quotient;
        const isTrue = Math.random() > 0.5;
        let fake = correct;
        if (!isTrue) { fake = correct + randomChoice([-2, -1, 1, 2]); if (fake <= 0) fake = correct + 1; }
        return { statement: `${a} / ${b} = ${isTrue ? correct : fake}`, a, b, displayedAnswer: isTrue ? correct : fake,
                 isTrue, correctAnswer: correct, decomposition: getVisualDecomposition(a, b),
                 explanation: isTrue ? `Correto! ${a} / ${b} = ${correct}.` : `Nao! ${a} / ${b} = ${correct}, porque ${correct} x ${b} = ${a}.` };
    }

    function generateHiddenNumber(level) {
        const config = LEVEL_CONFIG[level];
        const b = randomChoice(config.divisors);
        const quotient = randomInt(2, Math.floor(config.maxDividend / b));
        const a = quotient * b;
        const hideFirst = Math.random() > 0.5;
        return { equation: hideFirst ? `? / ${b} = ${quotient}` : `${a} / ? = ${quotient}`,
                 hiddenValue: hideFirst ? a : b, result: quotient, position: hideFirst ? 'first' : 'second',
                 hint: hideFirst ? `Pense: ${quotient} x ${b} = ?` : `Pense: ${a} / ${quotient} = ?`,
                 explanation: hideFirst ? `${quotient} x ${b} = ${a}` : `${a} / ${quotient} = ${b}` };
    }

    return { generateChallenge, validate, getVisualDecomposition, getTricks, generateTrueOrFalse, generateHiddenNumber, detectTrick, LEVEL_CONFIG };
})();

// Export global
window.DivisaoModule = DivisaoModule;
