/**
 * MathQuest - UI Components
 * ===========================
 * Componentes visuais reutilizaveis.
 * Botoes, cards, barras de progresso, objetos arrastáveis.
 */

const UIComponents = (() => {
    'use strict';

    function createBlock(type, value) {
        // TODO: Criar elemento visual de bloco (tipo Minecraft)
    }

    function createChest(items) {
        // TODO: Criar bau com itens dentro
    }

    function createProgressBar(current, total) {
        // TODO: Barra de progresso animada
    }

    function createOperationCard(operation, progress) {
        // TODO: Card de selecao de operacao na tela inicial
    }

    function showAchievement(achievement) {
        // TODO: Popup de conquista com animacao
    }

    function showFeedback(type, message) {
        // TODO: type = 'success' | 'tryAgain'
        // Nunca 'error' - sempre positivo ou encorajador
    }

    return { createBlock, createChest, createProgressBar, createOperationCard, showAchievement, showFeedback };
})();
