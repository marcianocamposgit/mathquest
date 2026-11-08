/**
 * MathQuest - Progression Engine
 * Niveis, desbloqueios, dificuldade adaptativa
 * NUNCA trava - sempre sugere, nunca impoe
 */
const ProgressionEngine = (() => {
    'use strict';

    const CONSECUTIVE_TO_LEVEL_UP = 5;
    const ERRORS_TO_SUGGEST_DISCOVERY = 3;
    const MAX_LEVEL = 4;

    function checkLevelUp(operation) {
        const prog = StorageManager.getProgress(operation);
        if (!prog) return null;
        if (prog.acertosConsecutivos >= CONSECUTIVE_TO_LEVEL_UP && prog.nível < MAX_LEVEL) {
            const newLevel = prog.nível + 1;
            StorageManager.setLevel(operation, newLevel);
            prog.acertosConsecutivos = 0;
            StorageManager.save(StorageManager.load()); // reset streak
            return { newLevel, message: `Nível ${newLevel} desbloqueado!` };
        }
        return null;
    }

    function shouldSuggestDiscovery(operation) {
        const patterns = StorageManager.getErrorPatterns(operation);
        const recent = patterns.filter(p => p.frequencia >= ERRORS_TO_SUGGEST_DISCOVERY);
        if (recent.length > 0) {
            const worst = recent.sort((a, b) => b.frequencia - a.frequencia)[0];
            return { suggest: true, trickId: worst.tipoErro, message: `Que tal rever o macete "${worst.tipoErro}"?` };
        }
        return { suggest: false };
    }

    function analyzeFluency(operation) {
        const prog = StorageManager.getProgress(operation);
        if (!prog || !prog.tempos || prog.tempos.length < 5) return { status: 'insufficient_data' };
        const recent5 = prog.tempos.slice(-5);
        const older5 = prog.tempos.slice(-10, -5);
        if (older5.length === 0) return { status: 'insufficient_data' };
        const avgRecent = recent5.reduce((a, b) => a + b, 0) / recent5.length;
        const avgOlder = older5.reduce((a, b) => a + b, 0) / older5.length;
        if (avgRecent < avgOlder * 0.8) return { status: 'improving', message: 'Ficando mais rapido! Fluencia aumentando.' };
        if (avgRecent > avgOlder * 1.3) return { status: 'slowing', message: 'Tempo aumentando. Talvez rever um macete ajude.' };
        return { status: 'stable', message: 'Ritmo constante.' };
    }

    function getOverview() {
        const progress = StorageManager.getProgress();
        const overview = {};
        Object.keys(progress).forEach(op => {
            const p = progress[op] || {};
            const total = (p.totalAcertos || 0) + (p.totalErros || 0);
            // Aceita 'nivel' ou 'Nível', e se não achar, usa 1
            const nivelSeguro = p.nivel !== undefined ? p.nivel : (p['Nível'] !== undefined ? p['Nível'] : 1);
            
            overview[op] = {
                nivel: nivelSeguro,
                acertos: p.totalAcertos || 0,
                erros: p.totalErros || 0,
                taxa: total > 0 ? Math.round(((p.totalAcertos || 0) / total) * 100) : 0,
                fluencia: p.fluencia || 0,
                streak: p.acertosConsecutivos || 0
            };
        });
        return overview;
    }

    return { checkLevelUp, shouldSuggestDiscovery, analyzeFluency, getOverview, MAX_LEVEL };
})();
