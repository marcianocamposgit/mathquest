/**
 * MathQuest - Challenge Templates
 * =================================
 * Templates de cenarios para cada modo e nível.
 * Os cenarios usam vocabulario do universo do usuario
 * (baus, blocos, espadas, diamantes, etc.)
 *
 * Cada template e uma funcao que recebe parametros
 * numericos e retorna um cenario completo.
 */

const ChallengeTemplates = {
    contextos: [
        { item: 'diamantes',  itemPlural: 'diamantes',  container: 'bau',     containerPlural: 'baus',    icone: '💎' },
        { item: 'espada',     itemPlural: 'espadas',     container: 'armario',  containerPlural: 'armarios', icone: '⚔' },
        { item: 'bloco',      itemPlural: 'blocos',      container: 'pilha',    containerPlural: 'pilhas',   icone: '🧱' },
        { item: 'moeda',      itemPlural: 'moedas',      container: 'saco',     containerPlural: 'sacos',    icone: '🪙' },
        { item: 'poção',      itemPlural: 'poções',      container: 'estante',  containerPlural: 'estantes', icone: '🧪' },
        { item: 'cristal',    itemPlural: 'cristais',    container: 'caixa',    containerPlural: 'caixas',   icone: '🔮' },
    ],

    // TODO: Templates de frases por operacao e modo
    // Ex: "Você tem {containers} {containerPlural}, cada um com {itemCount} {itemPlural}. Quantos no total?"
};
