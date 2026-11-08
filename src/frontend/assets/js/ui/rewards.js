/**
 * MathQuest - Rewards System
 * Microconquistas e recompensas
 */
const RewardsSystem = (() => {
    'use strict';

    const ACHIEVEMENTS = [
        { id: 'first_challenge', nome: 'Primeiro Passo',    desc: 'Completou seu primeiro desafio',              icone: '⭐' },
        { id: 'first_addition', nome: 'Somador',            desc: 'Primeiro acerto em adicao',                   icone: '➕' },
        { id: 'first_subtraction', nome: 'Subtraidor',      desc: 'Primeiro acerto em subtracao',                icone: '➖' },
        { id: 'first_multiplication', nome: 'Multiplicador', desc: 'Primeiro acerto em multiplicacao',           icone: '×' },
        { id: 'first_division', nome: 'Divisor',            desc: 'Primeiro acerto em divisao',                  icone: '➗' },
        { id: 'streak_5',      nome: 'Em Chamas',           desc: '5 acertos seguidos numa operacao',            icone: '🔥' },
        { id: 'streak_10',     nome: 'Imparavel',           desc: '10 acertos seguidos numa operacao',           icone: '⚡' },
        { id: 'streak_20',     nome: 'Lendario',            desc: '20 acertos seguidos numa operacao',           icone: 'ðŸ’«' },
        { id: 'explorer',      nome: 'Explorador',          desc: 'Experimentou os 3 modos de uma operacao',    icone: '🧭' },
        { id: 'detective_5',   nome: 'Detetive Jr',         desc: 'Acertou 5 no modo Detetive',                 icone: '🔍' },
        { id: 'speed_3s',      nome: 'Raio',                desc: 'Respondeu em menos de 3 segundos',           icone: '💨' },
        { id: 'level_2',       nome: 'Subindo',             desc: 'Alcancou nível 2 em qualquer operacao',      icone: 'ðŸ“ˆ' },
        { id: 'level_3',       nome: 'Avancado',            desc: 'Alcancou nível 3 em qualquer operacao',      icone: 'ðŸš€' },
        { id: 'level_4',       nome: 'Mestre',              desc: 'Alcancou nível 4 em qualquer operacao',      icone: '👑' },
        { id: 'total_50',      nome: 'Meio Centena',        desc: '50 desafios completados no total',           icone: 'ðŸŽ¯' },
        { id: 'total_100',     nome: 'Centuriao',           desc: '100 desafios completados no total',          icone: 'ðŸ’¯' },
        { id: 'master_all',    nome: 'Lenda Matemática',    desc: 'Nível 4 em todas as operacoes',              icone: '🏆' }
    ];

    function checkAchievements(operation, lastResult) {
        const unlocked = StorageManager.getAchievements();
        const progress = StorageManager.getProgress();
        const newOnes = [];

        function tryUnlock(id) {
            if (!unlocked.find(u => u.id === id)) {
                if (StorageManager.addAchievement(id)) {
                    newOnes.push(ACHIEVEMENTS.find(a => a.id === id));
                }
            }
        }

        // Primeiro desafio
        const totalAll = Object.values(progress).reduce((s, p) => s + p.totalAcertos + p.totalErros, 0);
        if (totalAll >= 1) tryUnlock('first_challenge');

        // Primeiro acerto por operacao
        if (lastResult.correct) {
            const firstMap = { adicao: 'first_addition', subtracao: 'first_subtraction', multiplicacao: 'first_multiplication', divisao: 'first_division' };
            if (firstMap[operation]) tryUnlock(firstMap[operation]);
        }

        // Streaks
        const p = progress[operation];
        if (p && p.acertosConsecutivos >= 5) tryUnlock('streak_5');
        if (p && p.acertosConsecutivos >= 10) tryUnlock('streak_10');
        if (p && p.acertosConsecutivos >= 20) tryUnlock('streak_20');

        // Velocidade
        if (lastResult.correct && lastResult.responseTime && lastResult.responseTime < 3000) tryUnlock('speed_3s');

        // Niveis
        Object.values(progress).forEach(pr => {
            if (pr.nível >= 2) tryUnlock('level_2');
            if (pr.nível >= 3) tryUnlock('level_3');
            if (pr.nível >= 4) tryUnlock('level_4');
        });

        // Totais
        const totalAcertos = Object.values(progress).reduce((s, pr) => s + pr.totalAcertos, 0);
        if (totalAcertos >= 50) tryUnlock('total_50');
        if (totalAcertos >= 100) tryUnlock('total_100');

        // Mestre geral
        if (Object.values(progress).every(pr => pr.nível >= 4)) tryUnlock('master_all');

        return newOnes;
    }

    function getUnlocked() { return StorageManager.getAchievements(); }

    return { ACHIEVEMENTS, checkAchievements, getUnlocked };
})();
