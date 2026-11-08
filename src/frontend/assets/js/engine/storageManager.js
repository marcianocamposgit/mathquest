/**
 * MathQuest - Storage Manager
 * Persistencia local (Fase 1 = localStorage)
 */
const StorageManager = (() => {
    'use strict';

    const STORAGE_KEY = 'mathquest_data';
    const MAX_HISTORY = 100;

    const DEFAULT_PROGRESS = { nível: 1, acertosConsecutivos: 0, totalAcertos: 0, totalErros: 0, fluencia: 0, tempos: [] };

    const DEFAULT_DATA = {
        usuario: { nome: '', dataCriacao: new Date().toISOString(), configUX: {} },
        progresso: {
            adicao: { ...DEFAULT_PROGRESS },
            subtracao: { ...DEFAULT_PROGRESS },
            multiplicacao: { ...DEFAULT_PROGRESS },
            divisao: { ...DEFAULT_PROGRESS }
        },
        conquistas: [],
        historicoRecente: [],
        padroesErro: []
    };

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
            const data = JSON.parse(raw);
            // Merge com defaults pra garantir campos novos
            Object.keys(DEFAULT_DATA.progresso).forEach(op => {
                if (!data.progresso[op]) data.progresso[op] = { ...DEFAULT_PROGRESS };
            });
            return data;
        } catch (e) {
            console.warn('[Storage] Erro ao carregar:', e);
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    }

    function save(data) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
        catch (e) { console.error('[Storage] Erro ao salvar:', e); return false; }
    }

    function updateProgress(operation, result) {
        const data = load();
        const prog = data.progresso[operation];
        if (!prog) return;

        if (result.correct) {
            prog.acertosConsecutivos++;
            prog.totalAcertos++;
        } else {
            prog.acertosConsecutivos = 0;
            prog.totalErros++;
            // Registrar padrao de erro
            const existingPattern = data.padroesErro.find(p => p.operacao === operation && p.tipoErro === result.trick);
            if (existingPattern) { existingPattern.frequencia++; existingPattern.ultimaOcorrencia = new Date().toISOString(); }
            else { data.padroesErro.push({ operacao: operation, tipoErro: result.trick || 'geral', frequencia: 1, ultimaOcorrencia: new Date().toISOString() }); }
        }

        // Fluencia (media movel dos ultimos 20 tempos)
        if (result.responseTime) {
            prog.tempos = prog.tempos || [];
            prog.tempos.push(result.responseTime);
            if (prog.tempos.length > 20) prog.tempos.shift();
            prog.fluencia = Math.round(prog.tempos.reduce((a, b) => a + b, 0) / prog.tempos.length);
        }

        // Historico recente
        data.historicoRecente.unshift({
            operacao: operation, modo: result.mode || 'desafio', nível: prog.nível,
            acertou: result.correct, tempo: result.responseTime || 0, timestamp: new Date().toISOString()
        });
        if (data.historicoRecente.length > MAX_HISTORY) data.historicoRecente.pop();

        save(data);
        return prog;
    }

    function getProgress(operation) { const d = load(); return operation ? d.progresso[operation] : d.progresso; }
    function setLevel(operation, level) { const d = load(); if (d.progresso[operation]) { d.progresso[operation].nível = level; save(d); } }
    function addAchievement(id) { const d = load(); if (!d.conquistas.find(c => c.id === id)) { d.conquistas.push({ id, dataDesbloqueio: new Date().toISOString() }); save(d); return true; } return false; }
    function getAchievements() { return load().conquistas; }
    function getErrorPatterns(operation) { const d = load(); return operation ? d.padroesErro.filter(p => p.operacao === operation) : d.padroesErro; }
    function getHistory(limit) { return load().historicoRecente.slice(0, limit || 20); }
    function setUserName(nome) { const d = load(); d.usuario.nome = nome; save(d); }
    function getUserName() { return load().usuario.nome; }
    function resetAll() { localStorage.removeItem(STORAGE_KEY); }
    function exportData() { return load(); }

    return { load, save, updateProgress, getProgress, setLevel, addAchievement, getAchievements, getErrorPatterns, getHistory, setUserName, getUserName, resetAll, exportData };
})();
