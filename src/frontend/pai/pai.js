/* MathQuest — Painel do Pai v2 (sem login, busca por nome) */
(() => {
"use strict";

// ── Config ──────────────────────────────────────────────────
const API = (() => {
    const stored = localStorage.getItem("mathquest_api_url");
    if (stored) return stored;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'http://localhost:8001';
    }
    return 'https://mathquest-qh53.onrender.com';
})();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let chartOps = null;
let chartAE  = null;

// ── Helpers ─────────────────────────────────────────────────
function showLoading() { $("#loading").classList.remove("hidden"); }
function hideLoading() { $("#loading").classList.add("hidden"); }

function showMsg(texto) {
    const el = $("#msg-busca");
    el.textContent = texto;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 5000);
}

function trocarTela(id) {
    $$(".tela").forEach(t => t.classList.remove("active"));
    $(id).classList.add("active");
}

// ── Nomes recentes (localStorage) ───────────────────────────
function getNomesRecentes() {
    try { return JSON.parse(localStorage.getItem("pai_nomes_recentes") || "[]"); }
    catch { return []; }
}

function salvarNomeRecente(nome) {
    let nomes = getNomesRecentes().filter(n => n.toLowerCase() !== nome.toLowerCase());
    nomes.unshift(nome);
    if (nomes.length > 5) nomes = nomes.slice(0, 5);
    localStorage.setItem("pai_nomes_recentes", JSON.stringify(nomes));
    renderNomesRecentes();
}

function renderNomesRecentes() {
    const nomes = getNomesRecentes();
    const container = $("#historico-nomes");
    const grid = $("#nomes-recentes");
    if (!nomes.length) {
        container.classList.add("hidden");
        return;
    }
    container.classList.remove("hidden");
    grid.innerHTML = nomes.map(n =>
        `<span class="nome-recente" onclick="PaiApp.buscarNome('${n}')">${n}</span>`
    ).join("");
}

// ── Labels ──────────────────────────────────────────────────
const OP_LABELS = {
    adicao: "Adição", subtracao: "Subtração",
    multiplicacao: "Multiplicação", divisao: "Divisão"
};
const OP_CORES = {
    adicao: "#34d399", subtracao: "#60a5fa",
    multiplicacao: "#fbbf24", divisao: "#f87171"
};

const CONQUISTAS_NOMES = {
    primeiro_acerto: "🌟 Primeiro Acerto",
    streak_5: "🔥 5 Seguidos",
    streak_10: "🔥 10 Seguidos",
    rapido: "⚡ Relâmpago",
    sem_erros_10: "💎 10 sem Errar",
    nivel_2: "📈 Nível 2",
    nivel_3: "📈 Nível 3",
    nivel_4: "📈 Nível 4",
    nivel_5: "🏔️ Nível 5",
    mestre_adicao: "➕ Mestre da Adição",
    mestre_subtracao: "➖ Mestre da Subtração",
    mestre_multiplicacao: "✖️ Mestre da Multiplicação",
    mestre_divisao: "➗ Mestre da Divisão",
    explorador: "🧭 Explorador",
    dedicado: "📚 Dedicado",
    persistente: "💪 Persistente",
    lendario: "👑 Lendário"
};

// ═══════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════
window.PaiApp = {

    buscar() {
        const nome = $("#input-nome").value.trim();
        if (!nome) {
            showMsg("Digite o nome do seu filho.");
            return;
        }
        this.buscarNome(nome);
    },

    async buscarNome(nome) {
        showLoading();
        try {
            const res = await fetch(`${API}/api/dashboard/busca?nome=${encodeURIComponent(nome)}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Erro ${res.status}`);
            }
            const data = await res.json();
            salvarNomeRecente(nome);
            trocarTela("#tela-dashboard");
            renderDashboard(data);
        } catch (err) {
            if (err.message.includes("Nenhum jogador")) {
                showMsg(`Nenhum jogador encontrado com o nome "${nome}". Verifique se o nome está correto.`);
            } else if (err.message.includes("Failed to fetch")) {
                showMsg("Não foi possível conectar ao servidor. O backend está rodando?");
            } else {
                showMsg(err.message);
            }
        }
        hideLoading();
    },

    voltar() {
        destroyCharts();
        trocarTela("#tela-busca");
        $("#input-nome").focus();
    }
};

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function renderDashboard(d) {
    // Nome
    $("#dash-nome").textContent = d.jogador;

    // KPIs
    $("#kpi-total").textContent = d.total_desafios;
    $("#kpi-acertos").textContent = d.total_acertos;
    $("#kpi-taxa").textContent = d.taxa_geral + "%";
    $("#kpi-tempo").textContent = d.tempo_medio_geral + "s";

    // Limpa gráficos anteriores
    destroyCharts();

    const ops = d.por_operacao || [];
    const labels = ops.map(o => OP_LABELS[o.operacao] || o.operacao);
    const cores  = ops.map(o => OP_CORES[o.operacao] || "#7c6cf0");

    // Gráfico 1: taxa de acerto por operação
    const ctx1 = $("#chart-operacoes").getContext("2d");
    chartOps = new Chart(ctx1, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Taxa de acerto (%)",
                data: ops.map(o => o.taxa_acerto),
                backgroundColor: cores,
                borderRadius: 6,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true, max: 100,
                    ticks: { color: "#8888a8", callback: v => v + "%" },
                    grid: { color: "#2a2a44" }
                },
                x: { ticks: { color: "#8888a8" }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Gráfico 2: acertos vs erros (stacked)
    const ctx2 = $("#chart-acertos-erros").getContext("2d");
    chartAE = new Chart(ctx2, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Acertos",
                    data: ops.map(o => o.total_acertos),
                    backgroundColor: "#34d399",
                    borderRadius: 6, maxBarThickness: 50
                },
                {
                    label: "Erros",
                    data: ops.map(o => o.total_erros),
                    backgroundColor: "#f87171",
                    borderRadius: 6, maxBarThickness: 50
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true, stacked: true,
                    ticks: { color: "#8888a8" }, grid: { color: "#2a2a44" }
                },
                x: { stacked: true, ticks: { color: "#8888a8" }, grid: { display: false } }
            },
            plugins: { legend: { labels: { color: "#eaeaf0" } } }
        }
    });

    // Conquistas
    const grid = $("#conquistas-grid");
    if (d.conquistas && d.conquistas.length) {
        grid.innerHTML = d.conquistas.map(c =>
            `<span class="conquista-badge">${CONQUISTAS_NOMES[c] || c}</span>`
        ).join("");
    } else {
        grid.innerHTML = '<p class="vazio">Nenhuma conquista ainda. Continue jogando!</p>';
    }

    // Streaks
    const streaksGrid = $("#streaks-grid");
    if (ops.length) {
        streaksGrid.innerHTML = ops.map(o => `
            <div class="streak-item">
                <div class="op-name">${OP_LABELS[o.operacao] || o.operacao}</div>
                <div class="streak-num streak-atual">${o.streak_atual}</div>
                <div class="streak-label">atual</div>
                <div class="streak-num streak-melhor">${o.melhor_streak}</div>
                <div class="streak-label">recorde</div>
            </div>
        `).join("");
    } else {
        streaksGrid.innerHTML = '<p class="vazio">Nenhum dado de sequência.</p>';
    }

    // Histórico
    const ul = $("#lista-historico");
    const hist = d.ultimos_resultados || [];
    if (!hist.length) {
        ul.innerHTML = '<li class="vazio">Nenhum desafio registrado.</li>';
        return;
    }
    ul.innerHTML = hist.map(r => {
        const op  = OP_LABELS[r.operacao] || r.operacao;
        const cls = r.acertou ? "certo" : "errado";
        const txt = r.acertou ? "✓ Acertou" : "✗ Errou";
        const dt  = new Date(r.data);
        const dia = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        return `<li>
            <span class="op">${op}</span>
            <span class="resultado ${cls}">${txt}</span>
            <span class="tempo">${r.tempo}s · ${dia} ${hora}</span>
        </li>`;
    }).join("");
}

function destroyCharts() {
    if (chartOps) { chartOps.destroy(); chartOps = null; }
    if (chartAE)  { chartAE.destroy();  chartAE  = null; }
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
(function init() {
    renderNomesRecentes();

    // Enter no input dispara busca
    $("#input-nome").addEventListener("keydown", (e) => {
        if (e.key === "Enter") PaiApp.buscar();
    });

    // Focus automático
    setTimeout(() => $("#input-nome").focus(), 400);
})();

})();
