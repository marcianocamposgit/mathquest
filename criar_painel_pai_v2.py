# -*- coding: utf-8 -*-
"""
criar_painel_pai_v2.py — Painel do Pai SIMPLIFICADO (sem cadastro/login).

Fluxo: Pai digita o nome do filho → vê o dashboard com gráficos.

Cria/atualiza:
  1. src/backend/routers/dashboard.py  → adiciona endpoint público GET /api/dashboard/busca?nome=X
  2. src/frontend/pai/index.html       → página simplificada
  3. src/frontend/pai/pai.css          → estilos
  4. src/frontend/pai/pai.js           → lógica (fetch + Chart.js)

Uso: python criar_painel_pai_v2.py
"""
from pathlib import Path
import shutil
from datetime import datetime

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "src" / "frontend"
BACKEND  = ROOT / "src" / "backend"
PAI_DIR  = FRONTEND / "pai"

GREEN  = "\033[92m"
CYAN   = "\033[96m"
YELLOW = "\033[93m"
RED    = "\033[91m"
RESET  = "\033[0m"

def log(color, msg):
    print(f"{color}[PAI-v2]{RESET} {msg}")

def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")
    log(GREEN, f"  Criado: {path.relative_to(ROOT)}")

def backup(path):
    if path.exists():
        bk = path.with_suffix(path.suffix + ".bak")
        shutil.copy2(path, bk)
        log(YELLOW, f"  Backup: {bk.relative_to(ROOT)}")


# ═══════════════════════════════════════════════════════════════
# 1. BACKEND — Adicionar endpoint público ao dashboard.py
# ═══════════════════════════════════════════════════════════════
DASHBOARD_PATCH = '''

# ── Endpoint público (sem JWT) — busca por nome ──────────────
@router.get("/busca")
def dashboard_busca_por_nome(
    nome: str,
    session: Session = Depends(get_session),
):
    """Dashboard público: pai digita o nome do filho e vê o progresso.
    Sem autenticação. Para MVP/uso familiar."""
    nome_limpo = nome.strip()
    if not nome_limpo:
        raise HTTPException(400, "Informe o nome do jogador")

    jogador = session.exec(
        select(Jogador).where(Jogador.nome == nome_limpo)
    ).first()
    if not jogador:
        raise HTTPException(404, f"Nenhum jogador encontrado com o nome \\"{nome_limpo}\\"")

    progs = session.exec(select(Progresso).where(Progresso.jogador_id == jogador.id)).all()
    por_operacao = []
    total_acertos = 0
    total_desafios = 0
    soma_tempo = 0.0

    for p in progs:
        total = p.total_acertos + p.total_erros
        taxa = round((p.total_acertos / total * 100) if total > 0 else 0, 1)
        total_acertos += p.total_acertos
        total_desafios += total
        soma_tempo += p.tempo_medio * total
        por_operacao.append(ProgressoResponse(
            operacao=p.operacao, nivel=p.nivel,
            total_acertos=p.total_acertos, total_erros=p.total_erros,
            streak_atual=p.streak_atual, melhor_streak=p.melhor_streak,
            tempo_medio=round(p.tempo_medio, 2), taxa_acerto=taxa
        ))

    taxa_geral = round((total_acertos / total_desafios * 100) if total_desafios > 0 else 0, 1)
    tempo_medio_geral = round((soma_tempo / total_desafios) if total_desafios > 0 else 0, 2)

    conquistas = session.exec(select(Conquista).where(Conquista.jogador_id == jogador.id)).all()
    lista_conquistas = [c.conquista_id for c in conquistas]

    ultimos = session.exec(
        select(Resultado)
        .where(Resultado.jogador_id == jogador.id)
        .order_by(Resultado.criado_em.desc())
        .limit(20)
    ).all()
    ultimos_dict = [
        {
            "operacao": r.operacao, "modo": r.modo, "nivel": r.nivel,
            "acertou": r.acertou, "tempo": r.tempo_segundos,
            "data": r.criado_em.isoformat()
        }
        for r in ultimos
    ]

    return DashboardResponse(
        jogador=jogador.nome,
        total_desafios=total_desafios,
        total_acertos=total_acertos,
        taxa_geral=taxa_geral,
        tempo_medio_geral=tempo_medio_geral,
        por_operacao=por_operacao,
        conquistas=lista_conquistas,
        ultimos_resultados=ultimos_dict
    )
'''


# ═══════════════════════════════════════════════════════════════
# 2. HTML — Painel simplificado
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

    <!-- ========== TELA BUSCA ========== -->
    <div id="tela-busca" class="tela active">
        <div class="busca-card">
            <div class="logo">
                <span class="logo-icon">📐</span>
                <h1>MathQuest</h1>
                <p>Veja o progresso do seu filho</p>
            </div>

            <div class="busca-form">
                <input type="text" id="input-nome"
                       placeholder="Nome do seu filho"
                       autocomplete="off"
                       maxlength="30">
                <button id="btn-buscar" class="btn-primario" onclick="PaiApp.buscar()">
                    Ver Progresso
                </button>
            </div>

            <p id="msg-busca" class="msg-erro hidden"></p>

            <div id="historico-nomes" class="historico-nomes hidden">
                <p class="label-recentes">Buscas recentes:</p>
                <div id="nomes-recentes"></div>
            </div>

            <a href="../index.html" class="link-voltar">← Voltar ao MathQuest</a>
        </div>
    </div>

    <!-- ========== TELA DASHBOARD ========== -->
    <div id="tela-dashboard" class="tela">
        <header class="top-bar">
            <button onclick="PaiApp.voltar()" class="btn-ghost">← Buscar outro</button>
            <h2 id="dash-nome"></h2>
        </header>

        <!-- KPIs -->
        <div class="kpis">
            <div class="kpi">
                <span class="kpi-label">Desafios</span>
                <strong id="kpi-total" class="kpi-valor">—</strong>
            </div>
            <div class="kpi">
                <span class="kpi-label">Acertos</span>
                <strong id="kpi-acertos" class="kpi-valor">—</strong>
            </div>
            <div class="kpi">
                <span class="kpi-label">Taxa</span>
                <strong id="kpi-taxa" class="kpi-valor">—</strong>
            </div>
            <div class="kpi">
                <span class="kpi-label">Tempo Médio</span>
                <strong id="kpi-tempo" class="kpi-valor">—</strong>
            </div>
        </div>

        <!-- Gráfico 1: taxa por operação -->
        <section class="card-section">
            <h3>Desempenho por Operação</h3>
            <div class="chart-wrap"><canvas id="chart-operacoes"></canvas></div>
        </section>

        <!-- Gráfico 2: acertos vs erros -->
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

        <!-- Streaks -->
        <section class="card-section">
            <h3>Sequências por Operação</h3>
            <div id="streaks-grid" class="streaks-grid"></div>
        </section>

        <!-- Últimos desafios -->
        <section class="card-section">
            <h3>Últimos Desafios</h3>
            <ul id="lista-historico" class="historico"></ul>
        </section>
    </div>

    <!-- Loading -->
    <div id="loading" class="loading hidden">
        <div class="spinner"></div>
    </div>

</div>

<script src="pai.js"></script>
</body>
</html>'''


# ═══════════════════════════════════════════════════════════════
# 3. CSS
# ═══════════════════════════════════════════════════════════════
CSS = r'''/* MathQuest — Painel do Pai v2 (simplificado) */
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
    --blue:     #60a5fa;
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
.tela { display: none; padding: 24px 20px 48px; max-width: 720px; margin: 0 auto; }
.tela.active { display: block; animation: fadeUp .35s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } }
.hidden { display: none !important; }

/* === Top Bar === */
.top-bar {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
}
.top-bar h2 { font-size: 1.25rem; }

/* === Buttons === */
.btn-primario {
    padding: 14px 28px; border: none; border-radius: var(--radius);
    background: var(--accent); color: #fff; font-weight: 600;
    font-size: 1rem; cursor: pointer; transition: background .2s;
    width: 100%;
}
.btn-primario:hover { background: var(--accent2); }
.btn-primario:disabled { opacity: .5; cursor: not-allowed; }
.btn-ghost {
    padding: 8px 16px; border: 1px solid var(--border); border-radius: var(--radius);
    background: transparent; color: var(--text2); cursor: pointer; font-size: .85rem;
    transition: border-color .2s;
}
.btn-ghost:hover { border-color: var(--accent); color: var(--text); }

/* === Busca (tela principal) === */
.busca-card {
    background: var(--surface); border-radius: 16px; padding: 44px 32px;
    max-width: 420px; margin: 10vh auto 0; border: 1px solid var(--border);
}
.logo { text-align: center; margin-bottom: 32px; }
.logo-icon { font-size: 2.8rem; display: block; margin-bottom: 10px; }
.logo h1 { font-size: 1.6rem; letter-spacing: -.02em; }
.logo p { color: var(--text2); font-size: .95rem; margin-top: 6px; }

.busca-form { display: flex; flex-direction: column; gap: 14px; }

input[type="text"] {
    padding: 14px 16px; border-radius: var(--radius); border: 1px solid var(--border);
    background: var(--surface2); color: var(--text); font-size: 1.05rem;
    transition: border-color .2s; text-align: center;
}
input[type="text"]:focus { outline: none; border-color: var(--accent); }
input[type="text"]::placeholder { color: var(--text2); }

.msg-erro { color: var(--red); font-size: .85rem; margin-top: 8px; text-align: center; }

.link-voltar {
    display: block; text-align: center; margin-top: 28px;
    color: var(--text2); font-size: .85rem; text-decoration: none;
}
.link-voltar:hover { color: var(--accent); }

/* === Buscas recentes === */
.historico-nomes { margin-top: 24px; text-align: center; }
.label-recentes { color: var(--text2); font-size: .8rem; margin-bottom: 8px; }
.nome-recente {
    display: inline-block; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 20px; padding: 6px 16px; margin: 4px;
    color: var(--accent2); font-size: .85rem; cursor: pointer;
    transition: .2s;
}
.nome-recente:hover { border-color: var(--accent); background: var(--accent); color: #fff; }

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

/* === Card sections === */
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

/* === Streaks === */
.streaks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.streak-item {
    background: var(--surface2); border-radius: var(--radius); padding: 14px;
    text-align: center; border: 1px solid var(--border);
}
.streak-item .op-name { font-size: .8rem; color: var(--text2); margin-bottom: 4px; }
.streak-item .streak-num { font-size: 1.3rem; font-weight: 700; }
.streak-item .streak-label { font-size: .7rem; color: var(--text2); }
.streak-atual { color: var(--green); }
.streak-melhor { color: var(--orange); }

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
    .busca-card { padding: 32px 20px; margin-top: 6vh; }
    .kpis { grid-template-columns: repeat(2, 1fr); }
    .kpi-valor { font-size: 1.3rem; }
    .chart-wrap { height: 220px; }
}
'''


# ═══════════════════════════════════════════════════════════════
# 4. JAVASCRIPT
# ═══════════════════════════════════════════════════════════════
JS = r'''/* MathQuest — Painel do Pai v2 (sem login, busca por nome) */
(() => {
"use strict";

// ── Config ──────────────────────────────────────────────────
const API = localStorage.getItem("mathquest_api_url") || "http://localhost:8001";

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
'''


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════
def main():
    log(CYAN, "═══ Painel do Pai v2 (sem login) ═══")
    log(CYAN, "")

    # ── 1. Patch no dashboard.py ──
    dash_path = BACKEND / "routers" / "dashboard.py"
    if dash_path.exists():
        conteudo = dash_path.read_text(encoding="utf-8")
        if "/busca" in conteudo:
            log(YELLOW, "  dashboard.py já contém endpoint /busca — pulando patch.")
        else:
            backup(dash_path)
            with open(dash_path, "a", encoding="utf-8", newline="\n") as f:
                f.write(DASHBOARD_PATCH)
            log(GREEN, "  Patch aplicado: endpoint GET /api/dashboard/busca adicionado ao dashboard.py")
    else:
        log(RED, f"  ERRO: {dash_path} não encontrado! Verifique a estrutura do projeto.")
        return

    # ── 2. Frontend ──
    write(PAI_DIR / "index.html", HTML)
    write(PAI_DIR / "pai.css", CSS)
    write(PAI_DIR / "pai.js", JS)

    # ── 3. Sugestão de botão no index.html principal ──
    index_path = FRONTEND / "index.html"
    if index_path.exists():
        conteudo = index_path.read_text(encoding="utf-8")
        if "pai/" not in conteudo:
            log(YELLOW, "")
            log(YELLOW, "AÇÃO MANUAL SUGERIDA:")
            log(YELLOW, "Adicione este botão no index.html antes do </body>:")
            log(YELLOW, "")
            log(YELLOW, '  <a href="pai/" id="btn-area-pai"')
            log(YELLOW, '     style="position:fixed;bottom:12px;right:12px;')
            log(YELLOW, '     background:#7c6cf0;color:#fff;padding:8px 16px;')
            log(YELLOW, '     border-radius:8px;text-decoration:none;')
            log(YELLOW, '     font-size:13px;opacity:.85;z-index:99;')
            log(YELLOW, '     font-family:system-ui,sans-serif;">')
            log(YELLOW, '     📊 Área do Pai</a>')

    log(GREEN, "")
    log(GREEN, "═══ Painel do Pai v2 criado! ═══")
    log(CYAN, "")
    log(CYAN, "Para testar:")
    log(CYAN, "  1. Reinicie o backend:  cd src/backend && uvicorn main:app --port 8001 --reload")
    log(CYAN, "  2. Sirva o frontend:    cd src/frontend && python -m http.server 8000")
    log(CYAN, "  3. Acesse:              http://localhost:8000/pai/")
    log(CYAN, "  4. Digite 'Nikolas' e clique 'Ver Progresso'")
    log(CYAN, "")
    log(CYAN, "Fluxo: Nome do filho → Ver Progresso → Dashboard com gráficos")
    log(CYAN, "Sem cadastro. Sem login. Sem senha. Três cliques.")


if __name__ == "__main__":
    main()
