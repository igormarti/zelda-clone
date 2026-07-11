# 03-sistema-npcs

## Objetivo
- Adicionar um sistema modular e escalável de NPCs (Non-Player Characters) preparado para múltiplos comportamentos, diálogos e persistência.  
- Resultado esperado: desenvolvedores podem declarar NPCs por sala via dados, NPCs podem ser estáticos ou mover-se com diferentes comportamentos, iniciar diálogo com `X` quando o jogador estiver próximo, e recuar para suporte a quests/lojas/persistência sem alterar a lógica core.

## Escopo
- Inclui: arquitetura, contratos públicos, formato de configuração POC e detalhes de integração com o loop atual (`PlayingState`, `World`, `Player`, `InputHandler`).  
- Não inclui: implementação concreta de diálogos (UI rica), sistema de quests completo ou backend de persistência além de um `NPCStateStore` local (POC).

## Fluxo do jogador
- Ativação: ao entrar em uma sala, `NPCManager` instancia NPCs definidos para o `roomKey`.  
- Ações possíveis do jogador: mover-se, pressionar `X` quando próximo de um NPC, iniciar diálogo.  
- Resposta do sistema: se `player` estiver em alcance e `X` for pressionado, `NPCManager` solicita `DialogManager.start(dialogueId, { npc })`; movimentos do player e de NPCs são pausados durante diálogo.  
- Sucesso: diálogo iniciado; NPC e jogador permanecem imóveis até `DialogManager.end()`.  
- Cancelamento/interrupção: diálogo pode ser cancelado por `DialogManager` (ex.: botão fechar) ou por mudança de sala — nesse caso `NPCManager` serializa estado e descarta instâncias.

## Requisitos técnicos
- Módulos envolvidos: `NPCManager`, `NPC`, `behaviors/*` (Strategy), `BehaviorFactory`, `DialogManager`, `NPCStateStore`, (opcional) `EventBus`.  
- Dados necessários: arquivo declarativo `assets/data/npcs.json` mapeando `roomKey` → lista de NPCs (id, sprite, position, behavior, dialogueId, persistentKey, zOrder).  
- Estados: cada `NPC` mantém `position`, `state` (idle/moving/talking), `behaviorInstance`, `collisionBox`, `persistentFlags`.  
- Integração com `World`: usar apenas `world.isPositionBlocked(rect)` e `world.SCREEN_WIDTH/HEIGHT`.  
- Integração com `Player`: `NPC.isInteractable(player)` usa `player.getCollisionRect()` ou distância por centros.  
- Input: `InputHandler` já expõe `keys['x']`; `NPCManager` observa essa tecla e consome quando inicia diálogo.  
- Ciclo: em `PlayingState.update()` chamar, na ordem: `player.update(...)`, `world.update(...)`, `npcManager.update({ world, player, input, delta })`. Em `draw()`: `world.draw()`, `npcManager.draw(ctx, spriteSheet)`, `player.draw(...)`, `dialogManager.draw(ctx)`.

## Regras de negócio / gameplay
- Interação: somente NPCs com `isInteractable(player) === true` respondem a `X`.  
- Movimentação: behaviors solicitam intenção de movimento; `NPC` valida com `world.isPositionBlocked()` e limites da sala.  
- Pausa durante diálogo: `DialogManager.start()` emite `dialogStart`; `NPCManager` pausa movimentos e bloqueia respostas a inputs até `dialogEnd`.  
- Colisões: `NPC` deve respeitar obstáculos do `World`. Para POC, NPCs podem ignorar colisões entre si (configurável no futuro).  
- Consumo de tecla: `NPCManager` deve zerar `input.keys['x']` ao iniciar diálogo para evitar re-trigger.

## Edge cases
- Spam de input (`X` repetido): tecla é consumida ao iniciar diálogo; reentradas bloqueadas enquanto `DialogManager.isActive()`.  
- NPC empacado por colisão: behavior recebe fallback (parar / mudar direção / aguardar) — evitar que NPC tente mover-se infinitamente contra obstáculo.  
- Mudança de sala durante diálogo: `DialogManager` deve encerrar diálogo e `NPCManager` serializar estado; se diálogo não puder ser continuado, reverter para estado salvo.  
- Falta do asset de sprite: `NPCManager` usa assetLoader central; se `sprite` não carregado, exibir placeholder e log de erro em dev mode.  
- Persistência inconsistente: `NPCStateStore` valida schemas e aplica valores default para evitar crash.

## Estrutura de dados (POC)
Exemplo `assets/data/npcs.json` (POC para `roomKey` "0,-1"):

```json
{
  "0,-1": [
    {
      "id": "cemiterio_srpoo_01",
      "name": "SrPoo",
      "sprite": "assets/sprites/srpoo-sheet.png",
      "frameSize": 48,
      "scale": 2,
      "position": { "x": 240, "y": 180 },
      "collisionBox": { "x": 16, "y": 34, "width": 32, "height": 28 },
      "behavior": {
        "type": "randomWalk",
        "params": { "speed": 0.8, "moveDuration": 120, "pauseDuration": 60, "radius": 100 }
      },
      "dialogueId": "cemiterio_srpoo_01_intro",
      "persistentKey": "npc.cemiterio_srpoo_01",
      "zOrder": "auto"
    }
  ]
}
```

## Componentes e responsabilidades
- `NPCManager` (orquestrador): carregar NPCs por sala; instanciar/descartar `NPC`; roteamento de input para interação; subscrição a `DialogManager` e `NPCStateStore`; exposição de API pública mínima (loadForRoom, unloadRoom, update, draw, getNPCById).  
- `NPC` (entidade): mantém estado local, animação, `collisionBox`, delega comportamento à `behaviorInstance`, valida movimentos com `world`. API: `update()`, `draw()`, `isInteractable(player)`, `startDialogue()`, `serializeState()`.  
- `behaviors/*` (Strategy): implementar tipos de IA como `StaticBehavior`, `RandomWalkBehavior`, `PatrolBehavior`, cada uma isolada e testável; contrato: `enter(npc, ctx)`, `update(npc, ctx)`, `exit(npc)`.  
- `BehaviorFactory`: cria behavior por `type` usando parâmetros da config.  
- `DialogManager`: gerencia fluxo de diálogos, UI básico POC, eventos `dialogStart`/`dialogEnd`.  
- `NPCStateStore`: abstração de persistência (POC localStorage); método `load(key)`, `save(key, state)`.  
- `EventBus` (opcional): desacopla eventos entre `DialogManager`, `NPCManager`, sistema de quests e UI.

## Alterações na estrutura atual
- Adicionar cesta `src/classes/npcs/` com arquivos: `NPCManager.js`, `NPC.js`, `BehaviorFactory.js`, `behaviors/StaticBehavior.js`, `behaviors/RandomWalkBehavior.js`, `behaviors/PatrolBehavior.js`.  
- Adicionar `src/classes/DialogManager.js` e `src/classes/NPCStateStore.js`.  
- Adicionar `assets/data/npcs.json` com a configuração declarativa.  
- Em `src/classes/states/PlayingState.js` inserir chamadas a `npcManager.update(...)` e `npcManager.draw(ctx)` (após `world.draw()` e antes/depende de ordenação de profundidade do player).  
- Em `src/classes/World.js` garantir que a transição de sala dispare `npcManager.loadForRoom(newRoomKey)` e `npcManager.unloadRoom()` quando necessário (ou `PlayingState` pode ser responsável por isso).  

## Boas práticas e estratégias de baixo acoplamento
- Composição sobre herança: NPCs têm um `behavior` injetado (Strategy pattern) ao invés de múltiplas subclasses.  
- Pub/Sub para eventos de diálogo e quests para evitar chamadas diretas entre sistemas.  
- Dados-first: adicionar e configurar NPCs via `assets/data/npcs.json` sem tocar na lógica core.  
- Interfaces pequenas e claras entre módulos (`world.isPositionBlocked()`, `player.getCollisionRect()`, `dialogManager.start()`).  
- Persistência isolada em `NPCStateStore` para permitir troca futura (localStorage → IndexedDB / backend).  

## Critérios de implementação
- [ ] `assets/data/npcs.json` existe e contém o NPC `cemiterio_srpoo_01` para `roomKey` "0,-1".  
- [ ] `NPCManager` implementa `loadForRoom(roomKey)`, `unloadRoom()`, `update(context)`, `draw(ctx)`.  
- [ ] `NPC` implementa `isInteractable(player)` e `startDialogue()` que delega ao `DialogManager`.  
- [ ] `RandomWalkBehavior` respeita obstáculos via `world.isPositionBlocked()` e limites da sala.  
- [ ] `DialogManager` pausa o movimento do jogador e dos NPCs durante diálogo e emite `dialogEnd` ao finalizar.  
- [ ] Estado persistente do NPC (flags básicos) é salvo em `NPCStateStore` na mudança de sala e recarregado no spawn.  
- [ ] Integração com `PlayingState` com ordem correta de update/draw e consumo de `input.keys['x']` ao iniciar diálogo.
