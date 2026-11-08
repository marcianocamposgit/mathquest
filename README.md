# MathQuest

Sistema educacional de matemática focado em compreensão, não memorização. Projetado para crianças de 8-12 anos, com ênfase em raciocínio lógico, macetes visuais e feedback imediato.

**Demo:** [mathquest no Netlify](https://dreamy-mandazi-f4f46b.netlify.app)

## Sobre o Projeto

O MathQuest nasceu de uma necessidade real: ensinar matemática de um jeito que faça sentido para uma criança que aprende melhor construindo do que decorando. O sistema nunca entrega a resposta pronta — ele decompõe cada operação visualmente, trata o erro como parte do processo e recompensa o raciocínio, não a memorização.

## Status do Projeto

| Fase | Status | Descrição |
|------|--------|-----------|
| Fase 1 — Frontend/PWA | ✅ Completa | App completo com 4 operações, 3 modos, progressão, conquistas, sons, PWA offline |
| Fase 2 — Backend/API | ✅ Completa | FastAPI + SQLite, auth criança/pai, multi-usuário, sync offline-first |
| Painel do Pai | ✅ Completo | Dashboard visual com gráficos, busca por nome, sem cadastro obrigatório |
| Deploy Nuvem | ✅ Completo | Backend no Render (mathquest-qh53.onrender.com) + PostgreSQL no Aiven |

## Funcionalidades

### App da Criança (Frontend)
- 4 operações (adição, subtração, multiplicação, divisão) com geração dinâmica de desafios
- 3 modos de jogo: Descoberta (macetes), Desafio (resolução), Detetive (investigação)
- Progressão por nível (1-5) com 5 acertos consecutivos para avançar
- 17 conquistas com popup animado + microrecompensas a cada acerto
- Sons via Web Audio API com toggle de mute
- Visual inteligente para números grandes
- PWA instalável, funciona offline
- Sync offline-first com o backend (localStorage + fila de sync)

### Backend (API)
- Python/FastAPI com SQLite (5 tabelas: Responsavel, Jogador, Resultado, Progresso, Conquista)
- Auth criança: token simples via `POST /api/login`
- Auth pai: email + senha → JWT via `POST /api/pai/registro` e `POST /api/pai/login`
- Vínculo pai → filho(s) com isolamento de dados por JWT
- 10+ endpoints testados e funcionando

### Painel do Pai
- Acesso simplificado: digita o nome do filho e vê o dashboard
- 4 KPIs: total de desafios, acertos, taxa de acerto, tempo médio
- Gráfico de desempenho por operação (Chart.js)
- Gráfico de acertos vs erros empilhado
- 17 conquistas com nomes e emojis
- Sequências atuais e recordes por operação
- Histórico dos últimos 20 desafios com data/hora
- Buscas recentes salvas no localStorage

## Decisões de Design

| Decisão | Justificativa |
|---------|---------------|
| Anti-calculadora | O sistema nunca entrega a resposta. Erro = "bug de engenharia" para consertar |
| Sessão curta | Uma coisa por vez, ação em 10s, recompensa imediata |
| Progressão por macete | O aluno domina "Dobrar Duas Vezes" ou "Completar 10", não "Adição" |
| Zero framework (frontend) | HTML/CSS/JS puro. Sem build, sem dependência |
| Painel sem cadastro | O pai digita o nome do filho e vê o progresso. Zero fricção |
| Offline-first | O app funciona sem internet. Sincroniza quando há conexão |

## Arquitetura

```
MathQuest/
├── src/
│   ├── frontend/
│   │   ├── index.html              # App da criança
│   │   ├── manifest.json           # PWA manifest
│   │   ├── service-worker.js       # Cache offline
│   │   ├── pai/                    # Painel do Pai
│   │   │   ├── index.html
│   │   │   ├── pai.css
│   │   │   └── pai.js
│   │   └── assets/
│   │       ├── css/                # Design tokens, layout, animações, responsivo
│   │       ├── js/
│   │       │   ├── data/           # Macetes e templates de desafios
│   │       │   ├── engine/         # Game, progressão, som, animação, storage
│   │       │   ├── modes/          # Descoberta, desafio, detetive
│   │       │   ├── operations/     # Adição, subtração, multiplicação, divisão
│   │       │   └── ui/             # Telas, componentes, recompensas
│   │       └── images/
│   └── backend/
│       ├── main.py                 # FastAPI app + CORS
│       ├── database.py             # SQLite/PostgreSQL connection
│       ├── models.py               # SQLModel schemas (5 tabelas)
│       ├── auth_utils.py           # JWT + hashing
│       └── routers/
│           ├── auth.py             # Login criança (token)
│           ├── pai.py              # Registro/login pai (JWT), vincular filhos
│           ├── dashboard.py        # Dashboard protegido + busca pública
│           └── progress.py         # Sync de progresso e resultados
├── docs/
│   └── specs/
│       └── ARCHITECTURE.md
└── README.md
```

## API Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/login` | — | Login da criança (nome → token) |
| POST | `/api/pai/registro` | — | Cadastro do pai (nome, email, senha → JWT) |
| POST | `/api/pai/login` | — | Login do pai (email, senha → JWT) |
| GET | `/api/pai/filhos` | JWT | Listar filhos vinculados |
| POST | `/api/pai/filhos` | JWT | Adicionar/vincular filho |
| GET | `/api/dashboard/busca?nome=X` | — | Dashboard público por nome (Painel do Pai) |
| GET | `/api/dashboard/filhos` | JWT | Lista filhos com resumo |
| GET | `/api/dashboard/{id}` | JWT | Dashboard detalhado de um filho |
| POST | `/api/progresso/sync` | Token | Sincronizar progresso offline |
| GET | `/api/progresso/{id}` | Token | Consultar progresso atual |

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5, CSS3, JavaScript ES6+ (vanilla) |
| Painel do Pai | HTML/CSS/JS + Chart.js 4.4.4 |
| Backend | Python 3.14, FastAPI, SQLModel |
| Banco de Dados | SQLite (dev) / PostgreSQL (produção) |
| Auth | JWT (pai) + Token simples (criança) |
| Sons | Web Audio API |
| PWA | Service Worker + Web App Manifest |
| Deploy Frontend | Netlify (static hosting) |
| Deploy Backend | Render (planejado) |
| Banco Produção | Aiven/Supabase PostgreSQL (planejado) |

## Como Rodar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/marcianocamposgit/mathquest.git
cd mathquest

# 2. Backend
cd src/backend
python -m venv venv
venv\Scripts\Activate.ps1          # Windows
pip install -r requirements.txt
cd ../..
uvicorn src.backend.main:app --port 8001

# 3. Frontend (outro terminal)
cd src/frontend
python -m http.server 8000

# 4. Acesse
# App da criança:  http://localhost:8000
# Painel do pai:   http://localhost:8000/pai/
# API docs:        http://localhost:8001/docs
```

## Roadmap

- [x] Frontend PWA com 4 operações, 3 modos, 17 conquistas
- [x] Backend FastAPI com auth e multi-usuário
- [x] Painel do Pai com gráficos (Chart.js)
- [x] Sync offline-first
- [ ] Deploy do backend (Render + PostgreSQL)
- [ ] Service Worker definitivo (Network-First)
- [ ] Animações pedagógicas avançadas
- [ ] Empacotamento para lojas (PWABuilder/Capacitor)
- [ ] Fase 3: Lógica computacional (condicionais, loops, variáveis com blocos visuais)

## Licença

MIT
