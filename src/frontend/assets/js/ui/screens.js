/**
 * MathQuest - Screens Manager
 * =============================
 * Gerencia renderizacao e transicao entre telas.
 *
 * Telas:
 * - home: selecao de operacao + visao de progresso
 * - operation: selecao de modo (descoberta/desafio/detetive)
 * - play: tela de jogo ativa
 * - result: resultado do desafio + próximo passo
 * - achievements: galeria de conquistas
 */

const ScreensManager = (() => {
    'use strict';

    function renderHome(progress) {
        // TODO: 4 cards de operacao com progresso visual
        // TODO: Botao de conquistas
    }

    function renderOperationMenu(operation) {
        // TODO: 3 opcoes de modo com descricao curta
        // TODO: Seletor de nível (desbloqueados + sugerido)
    }

    function renderPlay(challenge) {
        // TODO: Area de jogo com objetos interativos
        // TODO: Timer discreto (nao pressiona, so mede)
    }

    function renderResult(result) {
        // TODO: Feedback visual
        // TODO: Botoes: repetir / próximo / voltar
    }

    return { renderHome, renderOperationMenu, renderPlay, renderResult };
})();
