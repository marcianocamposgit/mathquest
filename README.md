# MathQuest

Sistema educacional de matemática focado em **compreensão**, não memorização. Projetado para crianças de 8-12 anos, com ênfase em raciocínio lógico, macetes visuais e feedback imediato.

**Demo:** [mathquest no Netlify](https://dreamy-mandazi-f4f46b.netlify.app)

## Sobre o Projeto

O MathQuest nasceu de uma necessidade real: ensinar matemática de um jeito que faça sentido para uma criança que aprende melhor construindo do que decorando. O sistema nunca entrega a resposta pronta — ele decompõe cada operação visualmente, trata o erro como parte do processo e recompensa o raciocínio, não a memorização.

## Funcionalidades (Fase 1 — MVP)

- **4 operações** (adição, subtração, multiplicação, divisão) com geração dinâmica de desafios, validação e decomposição passo a passo
- **3 modos de jogo:**
  - **Descoberta** — apresenta macetes e estratégias de cálculo
  - **Desafio** — resolução com input numérico
  - **Detetive** — investigação (Certo/Errado, Número Escondido, Qual Operação)
- **Progressão por nível** (1-4) com 5 acertos consecutivos para avançar
- **17 conquistas** com popup animado + microrecompensas a cada acerto
- **Sons** via Web Audio API (acerto, erro suave, conquista, level up) com toggle de mute
- **Visual inteligente** para números grandes (divisão com caixas, multiplicação com grupos)
- **PWA** — instalável, funciona offline, testado em desktop e mobile
- **Persistência local** via localStorage — sem login, sem servidor, sem coleta de dados

## Decisões de Design

| Decisão | Justificativa |
|---|---|
| Anti-calculadora | O sistema nunca entrega a resposta. Erro = "bug de engenharia" para consertar |
| Sessão curta | Uma coisa por vez, ação em 10s, recompensa imediata |
| Progressão por macete | O aluno domina "Dobrar Duas Vezes" ou "Completar 10", não "Adição" |
| Zero framework | HTML/CSS/JS puro. Sem build, sem dependência. Roda em qualquer navegador |
| Sem backend (Fase 1) | Privacidade total — nenhum dado sai do dispositivo |

## Arquitetura

```
src/frontend/
├── index.html
├── manifest.json
├── service-worker.js
└── assets/
    ├── css/
    │   ├── variables.css        # Design tokens
    │   ├── main.css             # Layout e componentes
    │   ├── animations.css       # Keyframes e transições
    │   └── responsive.css       # Breakpoints mobile/tablet
    ├── js/
    │   ├── data/
    │   │   ├── tricks.js        # Base de macetes por operação
    │   │   └── challenges.js    # Templates de desafios
    │   ├── engine/
    │   │   ├── gameEngine.js    # Orquestrador principal (telas, estados, ciclo)
    │   │   ├── progressionEngine.js  # Níveis, streaks, level up
    │   │   ├── soundEngine.js   # Web Audio API
    │   │   ├── animationEngine.js    # Animações de conquista
    │   │   └── storageManager.js     # Persistência localStorage
    │   ├── modes/
    │   │   ├── discoveryMode.js      # Modo Descoberta
    │   │   ├── challengeMode.js      # Modo Desafio
    │   │   └── detectiveMode.js      # Modo Detetive
    │   ├── operations/
    │   │   ├── addition.js      # Geração, validação, decomposição
    │   │   ├── subtraction.js
    │   │   ├── multiplication.js
    │   │   └── division.js
    │   └── ui/
    │       ├── screens.js       # Renderização de telas
    │       ├── components.js    # Componentes reutilizáveis
    │       └── rewards.js       # Sistema de conquistas
    └── images/
        └── icon.svg             # Ícone do PWA
```

**Padrão:** Separação de responsabilidades (DDD leve) — domínio (macetes, validação, progressão) independente da UI. Cada arquivo tem responsabilidade única.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript ES6+ (vanilla) |
| Sons | Web Audio API |
| Persistência | localStorage |
| PWA | Service Worker + Web App Manifest |
| Deploy | Netlify (static hosting) |

## Como Rodar Localmente

```bash
git clone https://github.com/SEU_USUARIO/mathquest.git
cd mathquest/src/frontend
python -m http.server 8000
# Abre http://localhost:8000
```

Qualquer servidor estático funciona (`live-server`, `npx serve`, etc).

## Roadmap

- [ ] **Service Worker definitivo** — estratégia Network-First, ignorar extensões do Chrome
- [ ] **Animações pedagógicas** — blocos se movendo, agrupando e dividindo em tempo real
- [ ] **Fase 2: Backend** — Python/FastAPI + PostgreSQL + painel de acompanhamento (pai/professor)
- [ ] **Fase 3: Lógica computacional** — condicionais, loops e variáveis com blocos visuais (ponte matemática → programação)
- [ ] **Modo Construtor** — a criança cria seus próprios desafios

## Licença

MIT
