/**
 * MathQuest - Modulo: Subtração
 * Remover de um grupo - conceito visual de separacao
 */
const SubtracaoModule = (() => {
    'use strict';

    const LEVEL_CONFIG = {
        1: { minA: 2, maxA: 10,  minB: 0, maxB: 9,   label: 'Números ate 10' },
        2: { minA: 10, maxA: 20, minB: 1, maxB: 15,  label: 'Números ate 20' },
        3: { minA: 20, maxA: 100, minB: 5, maxB: 80, label: 'Números ate 100' },
        4: { minA: 100, maxA: 999, minB: 10, maxB: 500, label: 'Com emprestimo' }
    };

    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function generateChallenge(level) {
        const config = LEVEL_CONFIG[level];
        if (!config) return null;

        let a = randomInt(config.minA, config.maxA);
        let b = randomInt(config.minB, Math.min(config.maxB, a));
        if (b > a) [a, b] = [a, b > a ? a - 1 : b];

        const correctAnswer = a - b;
        const contexto = randomChoice([
            { item: 'diamantes', icone: '💎' }, { item: 'espadas', icone: '⚔' },
            { item: 'blocos', icone: '🧱' }, { item: 'moedas', icone: '🪙' },
            { item: 'poções', icone: '🧪' }, { item: 'cristais', icone: '🔮' }
        ]);

        return {
            a, b, operation: 'subtracao', correctAnswer, level, contexto,
            situacao: `Você tinha ${a} ${contexto.item} e usou ${b}. Quantos sobraram?`,
            maceteAplicavel: detectTrick(a, b),
            visualHint: { groupTotal: a, removeCount: b, animationType: 'removeItems', itemIcon: contexto.icone }
        };
    }

    function detectTrick(a, b) {
        if (b === 0) return 'sub_zero';
        if (a === b) return 'sub_self';
        if (b >= 7 && b <= 9 && a <= 20) return 'sub_count_up';
        if (a === 10 || a === 100) return 'sub_from_10';
        return 'sub_reverse';
    }

    function validate(a, b, userAnswer) {
        const correctAnswer = a - b;
        const isCorrect = userAnswer === correctAnswer;
        const diff = Math.abs(userAnswer - correctAnswer);

        let feedback;
        if (isCorrect) feedback = randomChoice(['Perfeito!', 'Mandou bem!', 'Isso ai!', 'Arrasou!']);
        else if (diff === 1) feedback = `Quase! ${a} - ${b} = ${correctAnswer}. Chegou muito perto!`;
        else if (diff <= 3) feedback = `Passou perto! Vamos ver como chegar em ${correctAnswer}...`;
        else feedback = `Hmm, vamos descobrir juntos quanto da ${a} - ${b}...`;

        return { correct: isCorrect, correctAnswer, userAnswer, difference: diff, feedback,
                 decomposition: getVisualDecomposition(a, b), trick: detectTrick(a, b) };
    }

    function getVisualDecomposition(a, b) {
        const result = a - b;
        const steps = [{ step: `${a} - ${b}`, visual: `${a} blocos. Vamos tirar ${b}.`, animationType: 'show_group', data: { total: a, remove: b } }];

        if (b === 0) {
            steps.push({ step: `${a} - 0 = ${a}`, visual: 'Zero nao leva nada!', animationType: 'ghost_fade', data: { result: a } });
            return steps;
        }
        if (a === b) {
            steps.push({ step: `${a} - ${a} = 0`, visual: 'Tudo saiu! Caixa vazia.', animationType: 'empty_box', data: { result: 0 } });
            return steps;
        }

        // Contagem pra frente (subtrair contando do menor pro maior)
        if (b >= 7 && a <= 20) {
            steps.push({ step: `Conta de ${b} ate ${a}`, visual: `De ${b} ate ${a}: quantos saltos?`, animationType: 'jump_forward', data: { from: b, to: a, jumps: result } });
            steps.push({ step: `= ${result} saltos`, visual: `${result} saltos = ${result}!`, animationType: 'merge_result', data: { result } });
            return steps;
        }

        // Decomposicao por dezena/unidade
        if (a >= 10 && b >= 10) {
            const dezA = Math.floor(a / 10) * 10, uniA = a % 10;
            const dezB = Math.floor(b / 10) * 10, uniB = b % 10;
            steps.push({ step: `(${dezA} - ${dezB}) + (${uniA} - ${uniB})`, visual: 'Separar dezenas e unidades.', animationType: 'split_digits',
                         data: { a: { tens: dezA, ones: uniA }, b: { tens: dezB, ones: uniB } } });
            if (uniA < uniB) {
                steps.push({ step: `Emprestimo!`, visual: `${uniA} < ${uniB}, entao pegamos 10 emprestado da dezena.`, animationType: 'borrow', data: { from: dezA, to: uniA } });
            }
            steps.push({ step: `= ${result}`, visual: `Resultado: ${result}!`, animationType: 'merge_result', data: { result } });
            return steps;
        }

        // Simples
        steps.push({ step: `${a} - ${b} = ${result}`, visual: `Tiramos ${b}, sobraram ${result}.`, animationType: 'remove_and_count', data: { result } });
        return steps;
    }

    function getTricks(level) {
        const all = [
            { id: 'sub_zero', nível: 1, nome: 'Zero Nao Leva Nada', descricao: 'Qualquer número - 0 = ele mesmo.', animationType: 'ghost_fade', exemplo: { a: 7, b: 0, result: 7 }, dica: 'Viu - 0? A resposta e o proprio número.' },
            { id: 'sub_self', nível: 1, nome: 'Tudo Sai', descricao: 'Qualquer número - ele mesmo = 0. Caixa vazia!', animationType: 'empty_box', exemplo: { a: 5, b: 5, result: 0 }, dica: 'Números iguais? Resultado e sempre zero.' },
            { id: 'sub_reverse', nível: 1, nome: 'Rebobinar', descricao: 'Subtração e a adicao de tras pra frente. Se 3+4=7, entao 7-4=3.', animationType: 'rewind', exemplo: { a: 7, b: 4, result: 3 }, dica: 'Pense na adicao que formou esse número!' },
            { id: 'sub_count_up', nível: 2, nome: 'Contar Pra Frente', descricao: 'Em vez de tirar, conte do menor ate o maior. 15-9: de 9 ate 15 = 6 saltos.', animationType: 'jump_forward', exemplo: { a: 15, b: 9, result: 6 }, dica: 'Quando o número que tira e grande, conte pra frente!' },
            { id: 'sub_from_10', nível: 2, nome: 'Completar', descricao: 'O que falta pra chegar em 10? 10-7=3 porque 7+3=10.', animationType: 'fill_gap', exemplo: { a: 10, b: 7, result: 3 }, dica: 'Decore os complementos de 10: 1+9, 2+8, 3+7, 4+6, 5+5.' }
        ];
        return all.filter(t => t.nível <= level);
    }

    function generateTrueOrFalse(level) {
        const config = LEVEL_CONFIG[level];
        let a = randomInt(config.minA, config.maxA);
        let b = randomInt(config.minB, Math.min(config.maxB, a));
        const correct = a - b;
        const isTrue = Math.random() > 0.5;
        let fake = correct;
        if (!isTrue) { fake = correct + randomChoice([-2, -1, 1, 2, 3]); if (fake < 0) fake = correct + 2; }
        return { statement: `${a} - ${b} = ${isTrue ? correct : fake}`, a, b, displayedAnswer: isTrue ? correct : fake,
                 isTrue, correctAnswer: correct, explanation: isTrue ? `Correto! ${a} - ${b} = ${correct}.` : `Nao! ${a} - ${b} = ${correct}.`,
                 decomposition: getVisualDecomposition(a, b) };
    }

    function generateHiddenNumber(level) {
        const config = LEVEL_CONFIG[level];
        let a = randomInt(config.minA, config.maxA);
        let b = randomInt(config.minB, Math.min(config.maxB, a));
        const result = a - b;
        const hideFirst = Math.random() > 0.5;
        return { equation: hideFirst ? `? - ${b} = ${result}` : `${a} - ? = ${result}`,
                 hiddenValue: hideFirst ? a : b, knownValue: hideFirst ? b : a, result,
                 position: hideFirst ? 'first' : 'second',
                 hint: hideFirst ? `Pense: ? = ${result} + ${b}` : `Pense: ? = ${a} - ${result}`,
                 explanation: hideFirst ? `${result} + ${b} = ${a}` : `${a} - ${result} = ${b}` };
    }

    return { generateChallenge, validate, getVisualDecomposition, getTricks, generateTrueOrFalse, generateHiddenNumber, detectTrick, LEVEL_CONFIG };
})();

// Export global
window.SubtracaoModule = SubtracaoModule;
