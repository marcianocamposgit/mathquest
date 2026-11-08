# Arquitetura - MathQuest

## Modulos Principais

### Engine (Nucleo)
- **GameEngine**: Orquestrador principal, ciclo de vida, navegacao
- **AnimationEngine**: Motor de animacoes pedagogicas (CSS + SVG)
- **ProgressionEngine**: Niveis, desbloqueios, dificuldade adaptativa
- **StorageManager**: Persistencia (localStorage Fase 1, API Fase 2)

### Operations (Conteudo)
- **AdditionModule**: Geracao, validacao e decomposicao da adicao
- **SubtractionModule**: Idem para subtracao
- **MultiplicationModule**: Idem para multiplicacao
- **DivisionModule**: Idem para divisao

### Modes (Interacao)
- **DiscoveryMode**: Apresentacao animada de macetes
- **ChallengeMode**: Desafios interativos com manipulacao visual
- **DetectiveMode**: Investigacao logica (3 variantes)

### UI (Apresentacao)
- **UIComponents**: Blocos, baus, barras, cards reutilizaveis
- **ScreensManager**: Renderizacao e transicao de telas
- **RewardsSystem**: Conquistas e microrecompensas

### Data (Conteudo Estatico)
- **TricksDatabase**: Banco completo de macetes por operacao
- **ChallengeTemplates**: Templates de cenarios contextualizados
