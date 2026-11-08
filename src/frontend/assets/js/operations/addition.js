/**
 * MathQuest - Modulo: Adição
 * ============================================
 * Juntar grupos - conceito visual de uniao
 *
 * Responsabilidades:
 * - Gerar desafios para cada nível (1-4)
 * - Fornecer macetes visuais para o modo Descoberta
 * - Validar respostas
 * - Fornecer decomposicao da resposta (o "por que")
 *
 * Niveis:
 * 1: Números ate 10
 * 2: Números ate 20 (quase-dobros, completar 10)
 * 3: Números ate 100
 * 4: Soma com transporte (dezenas + centenas)
 */

const AdicaoModule = (() => {
    'use strict';

    // ========================================================
    // CONFIGURACAO DE NIVEIS
    // ========================================================
    const LEVEL_CONFIG = {
        1: { minA: 1, maxA: 9,   minB: 0, maxB: 9,   label: 'Números ate 10' },
        2: { minA: 5, maxA: 15,  minB: 2, maxB: 15,  label: 'Números ate 20' },
        3: { minA: 10, maxA: 99, minB: 10, maxB: 99,  label: 'Números ate 100' },
        4: { minA: 50, maxA: 999, minB: 25, maxB: 999, label: 'Soma com transporte' }
    };

    // ========================================================
    // UTILITARIOS
    // ========================================================

    /**
     * Gera inteiro aleatorio entre min e max (inclusive)
     */
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Escolhe item aleatorio de um array
     */
    function randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ========================================================
    // GERACAO DE DESAFIOS
    // ========================================================

    /**
     * Gera um desafio de adicao para o nível especificado
     * @param {number} level - Nível 1 a 4
     * @returns {object} Desafio completo com contexto visual
     */
    function generateChallenge(level) {
        const config = LEVEL_CONFIG[level];
        if (!config) {
            console.error('[Adição] Nível invalido:', level);
            return null;
        }

        let a = randomInt(config.minA, config.maxA);
        let b = randomInt(config.minB, config.maxB);

        // Garantir que A >= B pra manter intuicao visual
        if (b > a) { [a, b] = [b, a]; }

        const correctAnswer = a + b;

        // Contexto visual aleatorio (universo do jogador)
        const contexto = randomChoice([
            { item: 'diamantes',  icone: '💎', container: 'bau',     containerIcone: '📦' },
            { item: 'espadas',    icone: '⚔', container: 'armario',  containerIcone: '🗄' },
            { item: 'blocos',     icone: '🧱', container: 'pilha',    containerIcone: '📐' },
            { item: 'moedas',     icone: '🪙', container: 'saco',     containerIcone: '💰' },
            { item: 'poções',     icone: '🧪', container: 'estante',  containerIcone: '🧫' },
            { item: 'cristais',   icone: '🔮', container: 'caixa',    containerIcone: '📦' }
        ]);

        // Texto da situacao
        const situacao = `Você tem ${a} ${contexto.item} num ${contexto.container} e encontrou mais ${b}. Quantos ${contexto.item} no total?`;

        // Detectar qual macete se aplica a este desafio
        const maceteAplicavel = detectTrick(a, b);

        return {
            a,
            b,
            operation: 'adicao',
            correctAnswer,
            level,
            contexto,
            situacao,
            maceteAplicavel,
            visualHint: {
                groupA: a,
                groupB: b,
                animationType: 'mergeGroups',
                itemIcon: contexto.icone
            }
        };
    }

    /**
     * Detecta qual macete se aplica melhor a esta combinacao
     * @returns {string|null} ID do macete aplicavel
     */
    function detectTrick(a, b) {
        // Zero Invisivel
        if (b === 0 || a === 0) return 'add_zero';

        // Dobros exatos
        if (a === b) return 'add_doubles';

        // Quase-dobros (diferenca de 1)
        if (Math.abs(a - b) === 1) return 'add_near_dbl';

        // Somar 10
        if (b === 10 || a === 10) return 'add_plus_10';

        // Completar 10 (quando um dos números esta perto de 10)
        if ((a >= 7 && a <= 9 && b >= 2) || (b >= 7 && b <= 9 && a >= 2)) {
            return 'add_make_10';
        }

        // Comutatividade (quando trocar facilita: ex 3+8 -> 8+3)
        if (b > a) return 'add_commute';

        return null;
    }

    // ========================================================
    // VALIDACAO
    // ========================================================

    /**
     * Valida a resposta do usuario e retorna feedback pedagogico
     * @param {number} a - Primeiro operando
     * @param {number} b - Segundo operando
     * @param {number} userAnswer - Resposta do usuario
     * @returns {object} Resultado com explicacao e decomposicao
     */
    function validate(a, b, userAnswer) {
        const correctAnswer = a + b;
        const isCorrect = userAnswer === correctAnswer;
        const difference = Math.abs(userAnswer - correctAnswer);

        let feedback;
        if (isCorrect) {
            feedback = randomChoice([
                'Isso ai! Mandou bem!',
                'Perfeito! Você e fera!',
                'Acertou em cheio!',
                'Excelente! Continue assim!'
            ]);
        } else if (difference === 1) {
            feedback = `Quase! Você chegou muito perto. ${a} + ${b} da ${correctAnswer}. Olha so por que...`;
        } else if (difference <= 3) {
            feedback = `Passou perto! A resposta e ${correctAnswer}. Vamos ver como chegar la...`;
        } else {
            feedback = `Hmm, nao foi dessa vez. Vamos descobrir juntos quanto da ${a} + ${b}...`;
        }

        return {
            correct: isCorrect,
            correctAnswer,
            userAnswer,
            difference,
            feedback,
            decomposition: getVisualDecomposition(a, b),
            trick: detectTrick(a, b)
        };
    }

    // ========================================================
    // DECOMPOSICAO VISUAL (o "por que")
    // ========================================================

    /**
     * Retorna os passos visuais de como a adicao funciona.
     * Cada passo tem: step (expressao), visual (descricao animavel),
     * e animationType (tipo de animacao pro AnimationEngine).
     *
     * @param {number} a - Primeiro operando
     * @param {number} b - Segundo operando
     * @returns {Array} Passos da decomposicao
     */
    function getVisualDecomposition(a, b) {
        const result = a + b;
        const steps = [];

        // Passo 1: sempre mostra a conta original com objetos
        steps.push({
            step: `${a} + ${b}`,
            visual: `${a} blocos de um lado, ${b} blocos do outro`,
            animationType: 'show_groups',
            data: { groupA: a, groupB: b }
        });

        // --- ZERO INVISIVEL ---
        if (b === 0) {
            steps.push({
                step: `${a} + 0 = ${a}`,
                visual: `Zero e invisivel! Nao muda nada.`,
                animationType: 'ghost_fade',
                data: { ghostValue: 0, result: a }
            });
            return steps;
        }
        if (a === 0) {
            steps.push({
                step: `0 + ${b} = ${b}`,
                visual: `Zero e invisivel! Sobram so os ${b}.`,
                animationType: 'ghost_fade',
                data: { ghostValue: 0, result: b }
            });
            return steps;
        }

        // --- DOBROS (espelho) ---
        if (a === b) {
            steps.push({
                step: `${a} + ${a}`,
                visual: `Espelho! ${a} e seu reflexo.`,
                animationType: 'mirror',
                data: { value: a }
            });
            steps.push({
                step: `= ${result}`,
                visual: `${a} dobrado = ${result}`,
                animationType: 'merge_result',
                data: { result }
            });
            return steps;
        }

        // --- QUASE-DOBROS ---
        if (Math.abs(a - b) === 1) {
            const menor = Math.min(a, b);
            const dobro = menor * 2;
            steps.push({
                step: `${a} + ${b} = ${menor} + ${menor} + 1`,
                visual: `Quase espelho! E o dobro de ${menor}, mais 1.`,
                animationType: 'mirror_plus',
                data: { base: menor, extra: 1 }
            });
            steps.push({
                step: `${dobro} + 1 = ${result}`,
                visual: `${dobro} + 1 = ${result}`,
                animationType: 'merge_result',
                data: { result }
            });
            return steps;
        }

        // --- COMPLETAR 10 ---
        const bigger = Math.max(a, b);
        const smaller = Math.min(a, b);
        const faltaPra10 = 10 - bigger;

        if (bigger >= 7 && bigger <= 9 && smaller >= 2 && faltaPra10 > 0 && faltaPra10 <= smaller) {
            const sobra = smaller - faltaPra10;
            steps.push({
                step: `${bigger} + ${smaller}`,
                visual: `O ${bigger} precisa de ${faltaPra10} pra completar 10.`,
                animationType: 'highlight_gap',
                data: { value: bigger, gap: faltaPra10 }
            });
            steps.push({
                step: `${bigger} + ${faltaPra10} + ${sobra}`,
                visual: `Quebramos o ${smaller} em ${faltaPra10} e ${sobra}.`,
                animationType: 'decompose',
                data: { original: smaller, partA: faltaPra10, partB: sobra }
            });
            steps.push({
                step: `10 + ${sobra} = ${result}`,
                visual: `10 + ${sobra} = ${result}. Facil!`,
                animationType: 'merge_result',
                data: { result }
            });
            return steps;
        }

        // --- SOMAR 10 ---
        if (b === 10 || a === 10) {
            const outro = (a === 10) ? b : a;
            steps.push({
                step: `${outro} + 10`,
                visual: `Somar 10 e so trocar a dezena!`,
                animationType: 'digit_change',
                data: { original: outro, add: 10 }
            });
            steps.push({
                step: `= ${result}`,
                visual: `${outro} virou ${result}. A dezena subiu.`,
                animationType: 'merge_result',
                data: { result }
            });
            return steps;
        }

        // --- DECOMPOSICAO PADRAO (números maiores) ---
        if (a >= 10 && b >= 10) {
            const dezA = Math.floor(a / 10) * 10;
            const uniA = a % 10;
            const dezB = Math.floor(b / 10) * 10;
            const uniB = b % 10;
            const somaDez = dezA + dezB;
            const somaUni = uniA + uniB;

            steps.push({
                step: `${a} + ${b}`,
                visual: `Separar em dezenas e unidades.`,
                animationType: 'split_digits',
                data: { a: { tens: dezA, ones: uniA }, b: { tens: dezB, ones: uniB } }
            });
            steps.push({
                step: `(${dezA} + ${dezB}) + (${uniA} + ${uniB})`,
                visual: `Dezenas juntas: ${somaDez}. Unidades juntas: ${somaUni}.`,
                animationType: 'group_by_place',
                data: { tens: somaDez, ones: somaUni }
            });

            if (somaUni >= 10) {
                // Transporte!
                const transporte = Math.floor(somaUni / 10) * 10;
                const restoUni = somaUni % 10;
                steps.push({
                    step: `${somaDez} + ${somaUni}`,
                    visual: `As unidades deram ${somaUni}! O ${transporte} sobe pra dezena.`,
                    animationType: 'carry_over',
                    data: { carry: transporte, remainder: restoUni, tens: somaDez }
                });
            }

            steps.push({
                step: `= ${result}`,
                visual: `Juntando tudo: ${result}!`,
                animationType: 'merge_result',
                data: { result }
            });
            return steps;
        }

        // --- CONTAGEM SIMPLES (fallback pra números pequenos) ---
        steps.push({
            step: `${a} + ${b}`,
            visual: `Juntamos os ${a} blocos com os ${b} blocos.`,
            animationType: 'count_together',
            data: { groupA: a, groupB: b }
        });
        steps.push({
            step: `= ${result}`,
            visual: `Contando tudo junto: ${result}!`,
            animationType: 'merge_result',
            data: { result }
        });

        return steps;
    }

    // ========================================================
    // MACETES DISPONIVEIS POR NIVEL
    // ========================================================

    /**
     * Retorna macetes disponiveis para o nível
     * @param {number} level - Nível 1 a 4
     * @returns {Array} Lista de macetes com exemplos
     */
    function getTricks(level) {
        const allTricks = [
            {
                id: 'add_zero',
                nível: 1,
                nome: 'O Zero Invisivel',
                descricao: 'Qualquer número + 0 = ele mesmo. O zero e como um fantasma: aparece mas nao muda nada!',
                animationType: 'ghost_fade',
                exemplo: { a: 5, b: 0, result: 5 },
                dica: 'Quando vir + 0, a resposta e o proprio número.'
            },
            {
                id: 'add_commute',
                nível: 1,
                nome: 'Troca-Troca',
                descricao: 'Trocar a ordem nao muda o resultado. 2 + 3 = 3 + 2. Comece pelo maior pra facilitar!',
                animationType: 'swap_groups',
                exemplo: { a: 3, b: 8, result: 11 },
                dica: 'Se o segundo número e maior, inverte! Contar a partir do maior e mais rapido.'
            },
            {
                id: 'add_doubles',
                nível: 1,
                nome: 'Espelho',
                descricao: 'Dobros: o mesmo número + ele mesmo. E como olhar no espelho! 6 + 6 = 12.',
                animationType: 'mirror',
                exemplo: { a: 7, b: 7, result: 14 },
                dica: 'Decore os dobros: 1+1=2, 2+2=4, 3+3=6... ate 10+10=20. Sao so 10!'
            },
            {
                id: 'add_near_dbl',
                nível: 2,
                nome: 'Quase Espelho',
                descricao: 'Quando os números diferem por 1, e o dobro do menor + 1. 6 + 7 = 6 + 6 + 1 = 13.',
                animationType: 'mirror_plus',
                exemplo: { a: 6, b: 7, result: 13 },
                dica: 'Sabendo os dobros, os quase-dobros ficam faceis!'
            },
            {
                id: 'add_make_10',
                nível: 2,
                nome: 'Completar 10',
                descricao: 'Quebra um número pra formar 10 primeiro. 8 + 5 = 8 + 2 + 3 = 10 + 3 = 13.',
                animationType: 'decompose',
                exemplo: { a: 8, b: 5, result: 13 },
                dica: 'Quanto falta pro número maior chegar em 10? Tira essa parte do outro!'
            },
            {
                id: 'add_plus_10',
                nível: 2,
                nome: 'Pular Dezena',
                descricao: 'Somar 10 e so trocar a dezena. 17 + 10 = 27. O 1 virou 2!',
                animationType: 'digit_change',
                exemplo: { a: 17, b: 10, result: 27 },
                dica: 'Somar 10 = o digito da dezena sobe 1. Somar 20 = sobe 2!'
            }
        ];

        // Retorna macetes ate o nível solicitado
        return allTricks.filter(t => t.nível <= level);
    }

    // ========================================================
    // GERACAO PARA MODO DETETIVE
    // ========================================================

    /**
     * Gera desafio "Certo ou Errado" para o modo Detetive
     * @param {number} level - Nível do desafio
     * @returns {object} Afirmacao com resposta e explicacao
     */
    function generateTrueOrFalse(level) {
        const config = LEVEL_CONFIG[level];
        const a = randomInt(config.minA, config.maxA);
        const b = randomInt(config.minB, config.maxB);
        const correctAnswer = a + b;

        // 50% chance de ser verdadeiro
        const isTrue = Math.random() > 0.5;

        let fakeAnswer = correctAnswer;
        if (!isTrue) {
            // Gerar erro plausivel (erros comuns de criancas)
            const errorType = randomChoice(['off_by_one', 'off_by_ten', 'digit_swap', 'nearby']);
            switch (errorType) {
                case 'off_by_one':
                    fakeAnswer = correctAnswer + randomChoice([-1, 1]);
                    break;
                case 'off_by_ten':
                    fakeAnswer = correctAnswer + randomChoice([-10, 10]);
                    break;
                case 'digit_swap':
                    if (correctAnswer >= 10) {
                        const str = correctAnswer.toString();
                        fakeAnswer = parseInt(str.split('').reverse().join(''), 10);
                        if (fakeAnswer === correctAnswer) fakeAnswer += 1;
                    } else {
                        fakeAnswer = correctAnswer + randomChoice([-2, 2]);
                    }
                    break;
                case 'nearby':
                    fakeAnswer = correctAnswer + randomInt(-3, 3);
                    if (fakeAnswer === correctAnswer) fakeAnswer += 1;
                    break;
            }
            // Garantir que nao ficou negativo
            if (fakeAnswer < 0) fakeAnswer = correctAnswer + 2;
        }

        const displayedAnswer = isTrue ? correctAnswer : fakeAnswer;

        return {
            statement: `${a} + ${b} = ${displayedAnswer}`,
            a,
            b,
            displayedAnswer,
            isTrue,
            correctAnswer,
            explanation: isTrue
                ? `Correto! ${a} + ${b} = ${correctAnswer}.`
                : `Nao! ${a} + ${b} = ${correctAnswer}, nao ${fakeAnswer}. Olha a decomposicao...`,
            decomposition: getVisualDecomposition(a, b)
        };
    }

    /**
     * Gera desafio "Número Escondido" para o modo Detetive
     * @param {number} level - Nível do desafio
     * @returns {object} Equacao com incognita
     */
    function generateHiddenNumber(level) {
        const config = LEVEL_CONFIG[level];
        const a = randomInt(config.minA, config.maxA);
        const b = randomInt(config.minB, Math.min(config.maxB, config.maxA));
        const result = a + b;

        // Esconder A ou B aleatoriamente
        const hideFirst = Math.random() > 0.5;

        return {
            equation: hideFirst ? `? + ${b} = ${result}` : `${a} + ? = ${result}`,
            hiddenValue: hideFirst ? a : b,
            knownValue: hideFirst ? b : a,
            result,
            position: hideFirst ? 'first' : 'second',
            hint: `Pense ao contrario: ${result} - ${hideFirst ? b : a} = ?`,
            explanation: `${result} - ${hideFirst ? b : a} = ${hideFirst ? a : b}. Subtração e a adicao de tras pra frente!`
        };
    }

    // ========================================================
    // API PUBLICA
    // ========================================================

    return {
        generateChallenge,
        validate,
        getVisualDecomposition,
        getTricks,
        generateTrueOrFalse,
        generateHiddenNumber,
        detectTrick,
        LEVEL_CONFIG
    };
})();

// Export global
window.AdicaoModule = AdicaoModule;
