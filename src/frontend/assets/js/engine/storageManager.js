/**
 * MathQuest - Storage Manager (Fase 2)
 * Offline-first: localStorage sempre, API quando online.
 * O app funciona 100% sem internet. Quando há conexão, sincroniza.
 */
const StorageManager = (() => {
    'use strict';

    const STORAGE_KEY = 'mathquest_data';
    const TOKEN_KEY = 'mathquest_token';
    const SYNC_QUEUE_KEY = 'mathquest_sync_queue';
    const MAX_HISTORY = 100;

    // ── Configuração da API ───────────────────────────
    // Em dev: localhost:8001. Em produção: trocar pela URL do Render/Railway.
    const API_BASE = (() => {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            return 'http://localhost:8001';
        }
        // Produção: alterar quando fizer deploy do backend
        return 'http://localhost:8001';
    })();

    const DEFAULT_PROGRESS = { nivel: 1, acertosConsecutivos: 0, totalAcertos: 0, totalErros: 0, fluencia: 0, tempos: [] };

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

    // ══════════════════════════════════════════════════
    // LOCAL STORAGE (funciona sempre, mesmo offline)
    // ══════════════════════════════════════════════════

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
            const data = JSON.parse(raw);
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

    // ══════════════════════════════════════════════════
    // TOKEN (autenticação simples)
    // ══════════════════════════════════════════════════

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    // ══════════════════════════════════════════════════
    // FILA DE SYNC (guarda o que não foi enviado)
    // ══════════════════════════════════════════════════

    function getSyncQueue() {
        try {
            return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        } catch { return []; }
    }

    function addToSyncQueue(item) {
        const queue = getSyncQueue();
        queue.push(item);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    }

    function clearSyncQueue() {
        localStorage.removeItem(SYNC_QUEUE_KEY);
    }

    // ══════════════════════════════════════════════════
    // API CALLS (silenciosas, nunca bloqueiam o app)
    // ══════════════════════════════════════════════════

    async function apiCall(endpoint, method, body) {
        const token = getToken();
        if (!token) return null;

        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            };

            const options = { method, headers };
            if (body) options.body = JSON.stringify(body);

            const response = await fetch(API_BASE + endpoint, options);
            if (!response.ok) {
                console.warn('[Sync] API retornou', response.status, 'em', endpoint);
                return null;
            }
            return await response.json();
        } catch (e) {
            console.warn('[Sync] Offline ou erro de rede:', e.message);
            return null;
        }
    }

    /**
     * Login na API. Chamado ao digitar o nome.
     * Retorna o token ou null se offline.
     */
    async function apiLogin(nome) {
        try {
            const response = await fetch(API_BASE + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome })
            });
            if (!response.ok) return null;
            const data = await response.json();
            setToken(data.token);
            console.log('[Sync] Login OK. Token salvo.');
            return data.token;
        } catch (e) {
            console.warn('[Sync] Login offline, continuando local.', e.message);
            return null;
        }
    }

    /**
     * Envia um resultado para a API (fire-and-forget).
     * Se falhar, guarda na fila para enviar depois.
     */
    async function syncResultado(operation, result, nivel) {
        const payload = {
            operacao: operation,
            modo: result.mode || 'desafio',
            nivel: nivel || 1,
            acertou: result.correct,
            tempo_segundos: result.responseTime || 0
        };

        if (!navigator.onLine || !getToken()) {
            addToSyncQueue(payload);
            return;
        }

        const resp = await apiCall('/api/progresso', 'POST', payload);
        if (!resp) {
            addToSyncQueue(payload);
        }
    }

    /**
     * Envia tudo que ficou na fila (chamado quando volta a ter internet).
     */
    async function flushSyncQueue() {
        if (!navigator.onLine || !getToken()) return;

        const queue = getSyncQueue();
        if (queue.length === 0) return;

        console.log('[Sync] Enviando', queue.length, 'resultados pendentes...');
        const failed = [];

        for (const item of queue) {
            const resp = await apiCall('/api/progresso', 'POST', item);
            if (!resp) {
                failed.push(item);
            }
        }

        if (failed.length > 0) {
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));
            console.warn('[Sync]', failed.length, 'itens ainda pendentes.');
        } else {
            clearSyncQueue();
            console.log('[Sync] Fila limpa. Tudo sincronizado!');
        }
    }

    // ══════════════════════════════════════════════════
    // FUNÇÕES PÚBLICAS (mesma interface da Fase 1)
    // ══════════════════════════════════════════════════

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
            const existingPattern = data.padroesErro.find(p => p.operacao === operation && p.tipoErro === result.trick);
            if (existingPattern) { existingPattern.frequencia++; existingPattern.ultimaOcorrencia = new Date().toISOString(); }
            else { data.padroesErro.push({ operacao: operation, tipoErro: result.trick || 'geral', frequencia: 1, ultimaOcorrencia: new Date().toISOString() }); }
        }

        // Fluencia
        if (result.responseTime) {
            prog.tempos = prog.tempos || [];
            prog.tempos.push(result.responseTime);
            if (prog.tempos.length > 20) prog.tempos.shift();
            prog.fluencia = Math.round(prog.tempos.reduce((a, b) => a + b, 0) / prog.tempos.length);
        }

        // Historico
        data.historicoRecente.unshift({
            operacao: operation, modo: result.mode || 'desafio', nivel: prog.nivel,
            acertou: result.correct, tempo: result.responseTime || 0, timestamp: new Date().toISOString()
        });
        if (data.historicoRecente.length > MAX_HISTORY) data.historicoRecente.pop();

        save(data);

        // ── SYNC API (fire-and-forget, não bloqueia) ──
        syncResultado(operation, result, prog.nivel);

        return prog;
    }

    function getProgress(operation) { const d = load(); return operation ? d.progresso[operation] : d.progresso; }
    function setLevel(operation, level) { const d = load(); if (d.progresso[operation]) { d.progresso[operation].nivel = level; save(d); } }
    function addAchievement(id) { const d = load(); if (!d.conquistas.find(c => c.id === id)) { d.conquistas.push({ id, dataDesbloqueio: new Date().toISOString() }); save(d); return true; } return false; }
    function getAchievements() { return load().conquistas; }
    function getErrorPatterns(operation) { const d = load(); return operation ? d.padroesErro.filter(p => p.operacao === operation) : d.padroesErro; }
    function getHistory(limit) { return load().historicoRecente.slice(0, limit || 20); }

    function setUserName(nome) {
        const d = load();
        d.usuario.nome = nome;
        save(d);
        // Tenta login na API ao definir o nome
        apiLogin(nome);
    }

    function getUserName() { return load().usuario.nome; }
    function resetAll() { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(TOKEN_KEY); clearSyncQueue(); }
    function exportData() { return load(); }

    // ── Listeners de conectividade ────────────────────
    window.addEventListener('online', () => {
        console.log('[Sync] Conexão restaurada. Sincronizando...');
        flushSyncQueue();
    });

    // Tenta sincronizar fila pendente ao carregar
    if (navigator.onLine && typeof window !== 'undefined') {
        setTimeout(flushSyncQueue, 3000);
    }

    return {
        load, save, updateProgress, getProgress, setLevel,
        addAchievement, getAchievements, getErrorPatterns, getHistory,
        setUserName, getUserName, resetAll, exportData,
        // Novas funções expostas (Fase 2)
        apiLogin, getToken, flushSyncQueue, getSyncQueue
    };
})();