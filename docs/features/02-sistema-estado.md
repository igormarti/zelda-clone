# Feature: Sistema de Gerenciamento de Estados

## Objetivo
Implementar um sistema centralizado de gerenciamento de estados globais do jogo (Menu, Playing, Paused, GameOver) que orquestre o fluxo de execução, permitindo transições limpas entre contextos e preparando a arquitetura para futuros estados (Cinematic, Inventory, etc).

Resultado esperado: o jogo inicia em Menu, pode pausar/despausar durante gameplay, retorna ao menu após game over, e o loop de renderização responde dinamicamente ao estado ativo.

## Contexto
O jogo atual:
- Executa um loop infinito que sempre atualiza e renderiza (sem considerar contexto)
- Player e World são sempre atualizados independente de pausa ou menu
- InputHandler apenas captura teclas, sem responder a contextos globais
- Não existe diferenciação entre "estado do personagem" (idle/move/attack) e "estado do jogo" (playing/paused)

Problema: adicionar menu, pausa ou game over exigiria refatoração significativa do gameLoop. A arquitetura proposta segrega essa responsabilidade em um StateManager centralizado.

## Escopo
**Entra na feature:**
- Classe abstrata State (contrato para todos os estados)
- Classe StateManager (orquestrador central)
- 4 estados concretos: MenuState, PlayingState, PausedState, GameOverState
- Refatoração do gameLoop em main.js para delegar lógica ao StateManager
- Extensão do InputHandler para capturar ESC (pausa/menu) e ENTER (confirmar)

**Fica fora:**
- Renderização visual detalhada do menu (UI/UX será feature separada)
- Lógica de morte/game over (coube ao estado reagir, não ao PlayerState)
- Sounds/feedback (feature futura de áudio)
- Persistência de saves (feature separada)

## Requisitos Técnicos

### 1. Estrutura de pastas
```
src/classes/
├── states/               ← NOVO
│   ├── State.js          (classe abstrata)
│   ├── MenuState.js
│   ├── PlayingState.js
│   ├── PausedState.js
│   └── GameOverState.js
├── StateManager.js       ← NOVO
├── Player.js             (sem mudanças críticas)
├── World.js              (sem mudanças críticas)
└── InputHandler.js       (estendido)
```

### 2. Classe State (abstrata)
- Construtor recebe `(stateManager, context)`
  - `stateManager`: referência para trocar estado via `changeState(NovoState)`
  - `context`: objeto com { player, world, input, canvas, ctx, SCREEN_WIDTH, SCREEN_HEIGHT, FRAME_SIZE, spriteSheet }
- Métodos implementáveis (vazios por padrão):
  - `enter()`: executado quando o estado é ativado
  - `update()`: lógica por frame
  - `draw(ctx)`: renderização por frame
  - `exit()`: cleanup quando sai do estado

### 3. Classe StateManager
- Construtor recebe `context`
- Propriedade `currentState` (instância do estado ativo)
- Método `changeState(NewStateClass)`:
  - Chama `exit()` do estado anterior
  - Instancia novo estado
  - Chama `enter()` do novo estado
- Método `update()`: delega para `currentState.update()`
- Método `draw(ctx)`: delega para `currentState.draw(ctx)`
- Método `getCurrentState()`: retorna nome da classe do estado ativo (string)
- Contexto é passado no construtor e fica acessível para todos os estados

### 4. InputHandler - Extensões
- Adicionar captura de ESC (key 'Escape')
- Adicionar captura de ENTER (key 'Enter')
- Manter compatibilidade com `keys` object existente para keys de movimento
- Estados podem consultar `input.keys['Escape']` ou `input.keys['Enter']` como booleano

### 5. Integração com main.js
**Antes:**
```javascript
function gameLoop() {
    ctx.clearRect(...);
    player.update(input.keys, world);
    world.update(player);
    world.draw(ctx);
    player.draw(ctx, spriteSheetImage, FRAME_SIZE);
    requestAnimationFrame(gameLoop);
}
```

**Depois:**
```javascript
const stateManager = new StateManager({ 
    player, world, input, canvas, ctx, 
    SCREEN_WIDTH, SCREEN_HEIGHT, FRAME_SIZE, 
    spriteSheetImage 
});

stateManager.changeState(MenuState); // Estado inicial

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stateManager.update();
    stateManager.draw(ctx);
    requestAnimationFrame(gameLoop);
}

spriteSheetImage.onload = () => { gameLoop(); };
```

## Fluxo do Jogador

### MenuState
- **Entrada**: Jogo inicia neste estado
- **Renderização**: Tela inicial com opções (Novo Jogo, Créditos, Sair)
- **Input esperado**: ENTER → inicia jogo (muda para PlayingState)
- **Saída**: Ao pressionar ENTER, transiciona para PlayingState; player e world são resetados neste momento

### PlayingState
- **Entrada**: Jogo começou ou retornou de pausa
- **Update**: Executa Player.update(keys, world) e World.update(player)
- **Draw**: Executa world.draw(ctx) e player.draw(ctx, spriteSheetImage, FRAME_SIZE)
- **Input esperado**: 
  - Setas/WASD → movimenta player (já capturado por Player.update)
  - ESC → pausa o jogo (muda para PausedState)
  - Se player.state === 'die' → detecta morte (muda para GameOverState)
- **Saída**: ESC ou morte

### PausedState
- **Entrada**: Ao entrar, salva estado congelado (player não se move mais)
- **Renderização**: Renderiza world + player congelados + overlay "PAUSED" (opcional: menu de opções)
- **Input esperado**: 
  - ESC → volta a PlayingState
  - (Futura extensão) M → retorna ao menu
- **Saída**: ESC para PlayingState ou M para MenuState

### GameOverState
- **Entrada**: Ao entrar, renderiza tela final com pontos/resultado
- **Renderização**: Tela de morte com mensagem "Game Over"
- **Input esperado**: 
  - ENTER → retorna ao MenuState
  - (Futura extensão) R → restart automático
- **Saída**: ENTER para MenuState

## Regras de Negócio / Gameplay

1. **Transição obrigatória**: MenuState → PlayingState → (PausedState ↔ PlayingState) → GameOverState → MenuState
2. **Exclusividade**: Apenas um estado pode estar ativo por vez
3. **Contexto compartilhado**: Todos os estados acessam o mesmo player, world, input via `context`
4. **Estado do personagem vs Estado do jogo**: 
   - Player.state = 'idle'/'move'/'attack'/'die' (animação e movimento do personagem)
   - StateManager.currentState = MenuState/PlayingState/PausedState/GameOverState (contexto global do jogo)
   - Estes dois são independentes e podem coexistir
5. **Sem atualização durante pausa**: PlayingState atualiza lógica; PausedState apenas renderiza sem update
6. **Preservação de contexto**: Ao pausar, player e world mantêm seu estado interno intacto
7. **Reset ao retornar ao menu**: MenuState deve resetar player e world para estado inicial

## Edge Cases

### 1. Pausa durante transição de sala
- **Cenário**: Jogador pausa enquanto caminhando em direção a uma porta
- **Comportamento esperado**: Door não dispara, player congelado, estado mantido ao despausar

### 2. Morte durante pausa (impossível, mas validar)
- **Cenário**: Não existe atualmente (sem inimigos), mas futuro pode ter dano por tempo
- **Comportamento esperado**: GameOverState só ativa se PlayingState detectar morte antes da transição

### 3. Spam de ESC
- **Cenário**: Jogador pressiona ESC muito rápido entre Paused e Playing
- **Comportamento esperado**: changeState valida se já está no estado alvo, não falha

### 4. InputHandler captura ESC durante Menu
- **Cenário**: Jogador pressiona ESC no MenuState
- **Comportamento esperado**: MenuState ignora ESC (não muda de estado); apenas ENTER funciona

### 5. Menu com opções múltiplas (futura expansão)
- **Cenário**: MenuState pode ter "New Game", "Resume", "Credits"
- **Comportamento esperado**: Arquitetura suporta isso via switch/case interno em MenuState

### 6. Death animation vs GameOverState
- **Cenário**: Player.state = 'die' ainda roda animação enquanto transiciona para GameOverState
- **Comportamento esperado**: PlayingState detecta `player.state === 'die'` e chama `changeState(GameOverState)`, aguardando fim da animação se necessário

### 7. Canvas resize (fora de escopo, mas mencionar)
- **Cenário**: Usuário redimensiona janela
- **Comportamento esperado**: Contexto passa SCREEN_WIDTH e SCREEN_HEIGHT atualizados em próxima versão

## Critérios de Implementação

- [ ] StateManager criada e funcional (changeState, update, draw, getCurrentState)
- [ ] Classe State criada com contrato (enter, update, draw, exit)
- [ ] MenuState implementada e renderiza algo (placeholder é válido)
- [ ] PlayingState implementada, delega ao Player/World e detecta morte
- [ ] PausedState implementada, congela lógica mas renderiza
- [ ] GameOverState implementada, aguarda ENTER e retorna ao menu
- [ ] InputHandler estendida para ESC e ENTER sem quebrar movimento existente
- [ ] main.js refatorado para usar StateManager
- [ ] gameLoop inicia em MenuState
- [ ] ESC faz pausa/volta do menu
- [ ] ENTER inicia jogo ou confirma opções
- [ ] Transições entre estados funcionam sem crashes
- [ ] Player e World não atualizam durante PausedState
- [ ] Contexto compartilhado passa corretamente (player, world, input, spriteSheet)
- [ ] Reset de Player/World ao retornar ao MenuState após GameOver
