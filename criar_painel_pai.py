# -*- coding: utf-8 -*-
"""
criar_painel_pai.py — Gera o Painel Visual do Pai completo.
Cria: src/frontend/pai/index.html, pai.css, pai.js
Consome os endpoints reais:
  POST /api/pai/registro  → {id, nome, email, jwt}
  POST /api/pai/login     → {id, nome, email, jwt}
  GET  /api/pai/filhos    → [{id, nome, token}]
  POST /api/pai/filhos    → {id, nome, token}
  GET  /api/dashboard/filhos       → [{id, nome, total_desafios, taxa_acerto}]
  GET  /api/dashboard/{jogador_id} → {jogador, total_desafios, total_acertos,
       taxa_geral, tempo_medio_geral, por_operacao[], conquistas[], ultimos_resultados[]}

Uso: python criar_painel_pai.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "src" / "frontend"
PAI_DIR = FRONTEND / "pai"

GREEN  = "\033[92m"
CYAN   = "\033[96m"
YELLOW = "\033[93m"
RESET  = "\033[0m"

def log(color, msg):
    print(f"{color}[PAI]{RESET} {msg}")

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    log(GREEN, f"  Criado: {path.relative_to(ROOT)}")

# ═══════════════════════════════════════════════════════════════
# 1. HTML
# ═══════════════════════════════════════════════════════════════
HTML = r'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MathQuest — Painel do Pai</title>
    <link rel="stylesheet" href="pai.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4"></script>
</head>
<body>

<div id="app-pai">

    <!-- ========== TELA AUTH ========== -->
    <div id="tela-auth" class="tela active">
        <div class="auth-card">
            <div class="logo">
                <span class="logo-icon">📐</span>
                <h1>MathQuest</h1>
                <p>Acompanhe a evolução do seu filho</p>
            </div>

            <div class="tabs">
                <button id="tab-login" class="tab active" onclick="PaiApp.mudarTab('login')">Entrar</button>
                <button id="tab-registro" class="tab" onclick="PaiApp.mudarTab('registro')">Criar Conta</button>
            </div>

            <form id="form-login" onsubmit="PaiApp.login(event)">
                <input type="email" id="login-email" placeholder="E-mail" required autocomplete="email">
                <input type="password" id="login-senha" placeholder="Senha" required autocomplete="current-password">
                <button type="submit" class="btn-primario">Entrar</button>
            </form>

            <form id="form-registro" class="hidden" onsubmit="PaiApp.registrar(event)">
                <input type="text" id="reg-nome" placeholder="Seu nome" required autocomplete="name">
                <input type="email" id="reg-email" placeholder="E-mail" required autocomplete="email">
                <input type="password" id="reg-senha" placeholder="Senha (mín. 6 caracteres)" required minlength="6" autocomplete="new-password">
                <button type="submit" class="btn-primario">Criar Conta</button>
            </form>

            <p id="msg-auth" class="msg-erro hidden"></p>

            <a href="../index.html" class="link-voltar">← Voltar ao MathQuest</a>
        </div>
    </div>

    <!-- ========== TELA FILHOS ========== -->
    <div id="tela-filhos" class="tela">
        <header class="top-bar">
            <div>
                <h2>Meus Filhos</h2>
                <p class="sub" id="pai-nome-header"></p>
            </div>
            <button onclick="PaiApp.logout()" class="btn-ghost">Sair</button>
        </header>

        <div id="lista-filhos" class="grid-filhos"></div>

        <div class="add-filho-row">
            <input type="text" id="input-novo-filho" placeholder="Nome do filho" maxlength="30">
            <button onclick="PaiApp.addFilho()" class="btn-primario">Adicionar</button>
        </div>
        <p id="msg-filho" class="msg-erro hidden"></p>
    </div>

    <!-- ========== TELA DASHBOARD ========== -->
    <div id="tela-dashboard" class="tela">
        <header class="top-bar">
            <button onclick="PaiApp.voltarFilhos()" class="btn-ghost">← Voltar</button>
            <h2 id="dash-nome"></h2>
        </header>

        <!-- KPIs -->
        <div class="kpis">
            <div class="kpi"><span class="kpi-label">Desafios</span><strong id="kpi-total" class="kpi-valor">—</strong></div>
            <div class="kpi"><span class="kpi-label">Acertos</span><strong id="kpi-acertos" class="kpi-valor">—</strong></div>
            <div class="kpi"><span class="kpi-label">Taxa</span><strong id="kpi-taxa" class="kpi-valor">—</strong></div>
            <div class="kpi"><span class="kpi-label">Tempo Médio</span><strong id="kpi-tempo" class="kpi-valor">—</strong></div>
        </div>

        <!-- Gráfico: desempenho por operação -->
        <section class="card-section">
            <h3>Desempenho por Operação</h3>
            <div class="chart-wrap"><canvas id="chart-operacoes"></canvas></div>
        </section>

        <!-- Gráfico: acertos vs erros por operação -->
        <section class="card-section">
            <h3>Acertos vs Erros</h3>
            <div class="chart-wrap"><canvas id="chart-acertos-erros"></canvas></div>
        </section>

        <!-- Conquistas -->
        <section class="card-section">
            <h3>Conquistas Desbloqueadas</h3>
            <div id="conquistas-grid" class="conquistas-grid">
                <p class="vazio">Nenhuma conquista ainda.</p>
            </div>
        </section>

        <!-- Últimos resultados -->
        <section class="card-section">
            <h3>Últimos Desafios</h3>
            <ul id="lista-historico" class="historico"></ul>
        </section>
    </div>

    <!-- Loading overlay -->
    <div id="loading" class="loading hidden">
        <div class="spinner"></div>
    </div>

</div>

<script src="pai.js"></script>
</body>
</html>'''

# ═══════════════════════════════════════════════════════════════
# 2. CSS
# ═══════════════════════════════════════════════════════════════
CSS = r'''/* MathQuest — Painel do Pai */
:root {
    --bg:       #0e0e14;
    --surface:  #18182a;
    --surface2: #222238;
    --border:   #2a2a44;
    --text:     #eaeaf0;
    --text2:    #8888a8;
    --accent:   #7c6cf0;
    --accent2:  #9b8afb;
    --green:    #34d399;
    --red:      #f87171;
    --orange:   #fbbf24;
    --radius:   10px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
}

/* === Layout === */
.tela { display: none; padding: 24px 20px 40px; max-width: 720px; margin: 0 auto; }
.tela.active { display: block; animation: fadeUp .35s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } }

.hidden { display: none !important; }

/* === Top Bar === */
.top-bar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
}
.top-bar h2 { font-size: 1.25rem; }
.sub { color: var(--text2); font-size: .85rem; margin-top: 2px; }

/* === Buttons === */
.btn-primario {
    padding: 12px 24px; border: none; border-radius: var(--radius);
    background: var(--accent); color: #fff; font-weight: 600;
    font-size: .95rem; cursor: pointer; transition: background .2s;
}
.btn-primario:hover { background: var(--accent2); }
.btn-primario:disabled { opacity: .5; cursor: not-allowed; }
.btn-ghost {
    padding: 8px 16px; border: 1px solid var(--border); border-radius: var(--radius);
    background: transparent; color: var(--text2); cursor: pointer; font-size: .85rem;
    transition: border-color .2s;
}
.btn-ghost:hover { border-color: var(--accent); color: var(--text); }

/* === Auth === */
.auth-card {
    background: var(--surface); border-radius: 16px; padding: 40px 32px;
    max-width: 400px; margin: 8vh auto 0; border: 1px solid var(--border);
}
.logo { text-align: center; margin-bottom: 28px; }
.logo-icon { font-size: 2.5rem; display: block; margin-bottom: 8px; }
.logo h1 { font-size: 1.5rem; letter-spacing: -.02em; }
.logo p { color: var(--text2); font-size: .9rem; margin-top: 4px; }

.tabs { display: flex; gap: 8px; margin-bottom: 24px; }
.tab {
    flex: 1; padding: 10px; border: none; border-radius: var(--radius);
    background: var(--surface2); color: var(--text2); font-weight: 600;
    cursor: pointer; font-size: .9rem; transition: .2s;
}
.tab.active { background: var(--accent); color: #fff; }

form { display: flex; flex-direction: column; gap: 14px; }
input[type="text"], input[type="email"], input[type="password"] {
    padding: 12px 14px; border-radius: var(--radius); border: 1px solid var(--border);
    background: var(--surface2); color: var(--text); font-size: .95rem;
    transition: border-color .2s;
}
input:focus { outline: none; border-color: var(--accent); }

.msg-erro { color: var(--red); font-size: .85rem; margin-top: 8px; text-align: center; }

.link-voltar {
    display: block; text-align: center; margin-top: 24px;
    color: var(--text2); font-size: .85rem; text-decoration: none;
}
.link-voltar:hover { color: var(--accent); }

/* === Grid Filhos === */
.grid-filhos { display: grid; gap: 12px; margin-bottom: 28px; }
.filho-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px; cursor: pointer; transition: .2s;
    display: flex; justify-content: space-between; align-items: center;
}
.filho-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.filho-card .nome { font-weight: 600; font-size: 1.05rem; }
.filho-card .resumo { color: var(--text2); font-size: .8rem; margin-top: 4px; }
.filho-card .seta { color: var(--text2); font-size: 1.2rem; }

.add-filho-row { display: flex; gap: 10px; }
.add-filho-row input { flex: 1; }

/* === KPIs === */
.kpis {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px; margin-bottom: 28px;
}
.kpi {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px; text-align: center;
}
.kpi-label { color: var(--text2); font-size: .8rem; }
.kpi-valor { display: block; font-size: 1.6rem; color: var(--accent); margin-top: 4px; }

/* === Cards / Sections === */
.card-section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 24px; margin-bottom: 20px;
}
.card-section h3 { font-size: 1rem; margin-bottom: 16px; color: var(--text); }

.chart-wrap { position: relative; height: 260px; }

/* === Conquistas === */
.conquistas-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.conquista-badge {
    background: var(--surface2); border-radius: 20px; padding: 6px 14px;
    font-size: .82rem; color: var(--orange); border: 1px solid var(--border);
}
.vazio { color: var(--text2); font-size: .85rem; }

/* === Histórico === */
.historico { list-style: none; }
.historico li {
    padding: 10px 0; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    font-size: .85rem;
}
.historico li:last-child { border-bottom: none; }
.historico .op { font-weight: 600; min-width: 90px; }
.historico .resultado { font-weight: 600; }
.historico .resultado.certo { color: var(--green); }
.historico .resultado.errado { color: var(--red); }
.historico .tempo { color: var(--text2); }

/* === Loading === */
.loading {
    position: fixed; inset: 0; background: rgba(14,14,20,.7);
    display: flex; align-items: center; justify-content: center; z-index: 100;
}
.spinner {
    width: 36px; height: 36px; border: 3px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* === Responsivo === */
@media (max-width: 480px) {
    .auth-card { padding: 28px 20px; margin-top: 4vh; }
    .kpis { grid-template-columns: repeat(2, 1fr); }
    .kpi-valor { font-size: 1.3rem; }
    .chart-wrap { height: 220px; }
}
'''

# ═══════════════════════════════════════════════════════════════
# 3. JAVASCRIPT
# ═══════════════════════════════════════════════════════════════
JS = r'''/* MathQuest — Painel do Pai (lógica) */
(() => {
"use strict";

// ── Config ──────────────────────────────────────────────────
// Em dev: http://localhost:8001   |   Em produção: URL do Render/Railway
const API = localStorage.getItem("mathquest_api_url") || "http://localhost:8001";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── State ───────────────────────────────────────────────────
let jwt = localStorage.getItem("pai_jwt") || null;
let paiNome = localStorage.getItem("pai_nome") || "";
let chartOps = null;
let chartAE = null;

// ── Helpers ─────────────────────────────────────────────────
function showLoading() { $("#loading").classList.remove("hidden"); }
function hideLoading() { $("#loading").classList.add("hidden"); }

function showMsg(id, texto) {
    const el = $(id);
    el.textContent = texto;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 5000);
}

function trocarTela(id) {
    $$(".tela").forEach(t => t.classList.remove("active"));
    $(id).classList.add("active");
}

async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...opts.headers };
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erro ${res.status}`);
    }
    return res.json();
}

// ── Nomes das conquistas ────────────────────────────────────
const CONQUISTAS_NOMES = {
    primeiro_acerto: "Primeiro Acerto",
    streak_5: "5 Seguidos",
    streak_10: "10 Seguidos",
    rapido: "Relâmpago",
    sem_erros_10: "10 sem Errar",
    nivel_2: "Nível 2",
    nivel_3: "Nível 3",
    nivel_4: "Nível 4",
    nivel_5: "Nível 5",
    mestre_adicao: "Mestre da Adição",
    mestre_subtracao: "Mestre da Subtração",
    mestre_multiplicacao: "Mestre da Multiplicação",
    mestre_divisao: "Mestre da Divisão",
    explorador: "Explorador",
    dedicado: "Dedicado",
    persistente: "Persistente",
    lendario: "Lendário"
};

const OP_LABELS = {
    adicao: "Adição", subtracao: "Subtração",
    multiplicacao: "Multiplicação", divisao: "Divisão"
};
const OP_CORES = {
    adicao: "#34d399", subtracao: "#60a5fa",
    multiplicacao: "#fbbf24", divisao: "#f87171"
};

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
window.PaiApp = {

    mudarTab(tab) {
        if (tab === "login") {
            $("#form-login").classList.remove("hidden");
            $("#form-registro").classList.add("hidden");
            $("#tab-login").classList.add("active");
            $("#tab-registro").classList.remove("active");
        } else {
            $("#form-login").classList.add("hidden");
            $("#form-registro").classList.remove("hidden");
            $("#tab-login").classList.remove("active");
            $("#tab-registro").classList.add("active");
        }
        $("#msg-auth").classList.add("hidden");
    },

    async login(e) {
        e.preventDefault();
        showLoading();
        try {
            const data = await api("/api/pai/login", {
                method: "POST",
                body: JSON.stringify({
                    email: $("#login-email").value.trim(),
                    senha: $("#login-senha").value
                })
            });
            salvarSessao(data);
            carregarFilhos();
        } catch (err) {
            showMsg("#msg-auth", err.message);
        }
        hideLoading();
    },

    async registrar(e) {
        e.preventDefault();
        showLoading();
        try {
            const data = await api("/api/pai/registro", {
                method: "POST",
                body: JSON.stringify({
                    nome: $("#reg-nome").value.trim(),
                    email: $("#reg-email").value.trim(),
                    senha: $("#reg-senha").value
                })
            });
            salvarSessao(data);
            carregarFilhos();
        } catch (err) {
            showMsg("#msg-auth", err.message);
        }
        hideLoading();
    },

    logout() {
        jwt = null;
        paiNome = "";
        localStorage.removeItem("pai_jwt");
        localStorage.removeItem("pai_nome");
        trocarTela("#tela-auth");
    },

    async addFilho() {
        const nome = $("#input-novo-filho").value.trim();
        if (!nome) return;
        showLoading();
        try {
            await api("/api/pai/filhos", {
                method: "POST",
                body: JSON.stringify({ nome })
            });
            $("#input-novo-filho").value = "";
            carregarFilhos();
        } catch (err) {
            showMsg("#msg-filho", err.message);
        }
        hideLoading();
    },

    voltarFilhos() {
        destroyCharts();
        trocarTela("#tela-filhos");
    }
};

function salvarSessao(data) {
    jwt = data.jwt;
    paiNome = data.nome;
    localStorage.setItem("pai_jwt", jwt);
    localStorage.setItem("pai_nome", paiNome);
}

// ═══════════════════════════════════════════════════════════
// FILHOS
// ═══════════════════════════════════════════════════════════
async function carregarFilhos() {
    $("#pai-nome-header").textContent = paiNome;
    trocarTela("#tela-filhos");
    showLoading();
    try {
        const filhos = await api("/api/dashboard/filhos");
        renderFilhos(filhos);
    } catch (err) {
        // Se JWT expirou
        if (err.message.includes("401") || err.message.includes("Token")) {
            PaiApp.logout();
            showMsg("#msg-auth", "Sessão expirada. Faça login novamente.");
        }
    }
    hideLoading();
}

function renderFilhos(filhos) {
    const el = $("#lista-filhos");
    if (!filhos.length) {
        el.innerHTML = '<p class="vazio">Nenhum filho cadastrado. Adicione abaixo.</p>';
        return;
    }
    el.innerHTML = filhos.map(f => `
        <div class="filho-card" onclick="PaiApp.abrirDash(${f.id}, '${f.nome}')">
            <div>
                <div class="nome">${f.nome}</div>
                <div class="resumo">${f.total_desafios} desafios · ${f.taxa_acerto}% acerto</div>
            </div>
            <span class="seta">→</span>
        </div>
    `).join("");
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
PaiApp.abrirDash = async function(jogadorId, nome) {
    trocarTela("#tela-dashboard");
    $("#dash-nome").textContent = nome;
    showLoading();
    try {
        const d = await api(`/api/dashboard/${jogadorId}`);
        renderDashboard(d);
    } catch (err) {
        showMsg("#msg-auth", err.message);
    }
    hideLoading();
};

function renderDashboard(d) {
    // KPIs
    $("#kpi-total").textContent = d.total_desafios;
    $("#kpi-acertos").textContent = d.total_acertos;
    $("#kpi-taxa").textContent = d.taxa_geral + "%";
    $("#kpi-tempo").textContent = d.tempo_medio_geral + "s";

    // Gráfico 1: taxa de acerto por operação (bar)
    destroyCharts();
    const ops = d.por_operacao || [];
    const labels = ops.map(o => OP_LABELS[o.operacao] || o.operacao);
    const taxas = ops.map(o => o.taxa_acerto);
    const cores = ops.map(o => OP_CORES[o.operacao] || "#7c6cf0");

    const ctx1 = $("#chart-operacoes").getContext("2d");
    chartOps = new Chart(ctx1, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Taxa de acerto (%)",
                data: taxas,
                backgroundColor: cores,
                borderRadius: 6,
                maxBarThickness: 48
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100,
                     ticks: { color: "#8888a8", callback: v => v + "%" },
                     grid: { color: "#2a2a44" }
                },
                x: { ticks: { color: "#8888a8" }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Gráfico 2: acertos vs erros (stacked bar)
    const acertos = ops.map(o => o.total_acertos);
    const erros = ops.map(o => o.total_erros);

    const ctx2 = $("#chart-acertos-erros").getContext("2d");
    chartAE = new Chart(ctx2, {
        type: "bar",
        data: {
            labels,
            datasets: [
                { label: "Acertos", data: acertos, backgroundColor: "#34d399", borderRadius: 6, maxBarThickness: 48 },
                { label: "Erros",   data: erros,   backgroundColor: "#f87171", borderRadius: 6, maxBarThickness: 48 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, stacked: true,
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
            `<span class="conquista-badge">🏆 ${CONQUISTAS_NOMES[c] || c}</span>`
        ).join("");
    } else {
        grid.innerHTML = '<p class="vazio">Nenhuma conquista ainda.</p>';
    }

    // Histórico
    const ul = $("#lista-historico");
    const hist = d.ultimos_resultados || [];
    if (!hist.length) {
        ul.innerHTML = '<li class="vazio">Nenhum desafio registrado.</li>';
        return;
    }
    ul.innerHTML = hist.map(r => {
        const op = OP_LABELS[r.operacao] || r.operacao;
        const cls = r.acertou ? "certo" : "errado";
        const txt = r.acertou ? "✓ Acertou" : "✗ Errou";
        const dt = new Date(r.data);
        const dia = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        return `<li>
            <span class="op">${op}</span>
            <span class="resultado ${cls}">${txt}</span>
            <span class="tempo">${r.tempo}s · ${dia}</span>
        </li>`;
    }).join("");
}

function destroyCharts() {
    if (chartOps) { chartOps.destroy(); chartOps = null; }
    if (chartAE)  { chartAE.destroy();  chartAE = null; }
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
(function init() {
    if (jwt) {
        carregarFilhos();
    } else {
        trocarTela("#tela-auth");
    }
})();

})();
'''

# ═══════════════════════════════════════════════════════════════
# MAIN — gera os 3 arquivos
# ═══════════════════════════════════════════════════════════════
def main():
    log(CYAN, "═══ Criando Painel do Pai ═══")
    write(PAI_DIR / "index.html", HTML)
    write(PAI_DIR / "pai.css", CSS)
    write(PAI_DIR / "pai.js", JS)

    # Verificar se index.html principal existe e sugerir botão
    index_path = FRONTEND / "index.html"
    if index_path.exists():
        conteudo = index_path.read_text(encoding="utf-8")
        if "pai/" not in conteudo and "Área do Pai" not in conteudo:
            log(YELLOW, "")
            log(YELLOW, "AÇÃO MANUAL: Adicione um botão no index.html da criança.")
            log(YELLOW, "Sugestão — cole antes do </body>:")
            log(YELLOW, '  <a href="pai/" style="position:fixed;bottom:12px;right:12px;')
            log(YELLOW, '     background:#7c6cf0;color:#fff;padding:8px 16px;border-radius:8px;')
            log(YELLOW, '     text-decoration:none;font-size:13px;opacity:.8;z-index:99;">')
            log(YELLOW, '     👨‍👩‍👧 Área do Pai</a>')
        else:
            log(GREEN, "index.html já tem referência ao painel do pai.")

    log(GREEN, "")
    log(GREEN, "═══ Painel do Pai criado com sucesso! ═══")
    log(CYAN,  "")
    log(CYAN,  "Para testar:")
    log(CYAN,  "  1. Inicie o backend:  cd src/backend && uvicorn main:app --port 8001")
    log(CYAN,  "  2. Sirva o frontend:  cd src/frontend && python -m http.server 8000")
    log(CYAN,  "  3. Acesse:            http://localhost:8000/pai/")


if __name__ == "__main__":
    main()
