# Feature: Sistema de Save/Load com Árvore Sagrada

## Objetivo

Implementar um sistema de persistência de progresso com 3 slots de save, ativado por uma **Árvore Sagrada** localizada na Caverna Sombria (sala `1,0`). O sistema suporta thumbnails 160x120px em cada slot, navegação por setas/teclas numéricas, e fluxo de load/delete a partir do menu principal.

## Contexto

O jogo não possui persistência de progresso. Cada vez que o jogador inicia o jogo, recomeça do zero. O objetivo é permitir que o jogador:
- Salve o jogo ao encontrar a Árvore Sagrada
- Carregue um save anterior pelo menu principal
- Apague saves indesejados
- Visualize uma miniatura (thumbnail) do momento do save

## Escopo

**Entra na feature:**
- Classe `SacredTree` (objeto interativo, padrão de Chest/SignPost)
- Sistema de persistência com `SaveManager` e `GameSnapshot`
- Captura de thumbnail 160x120px do canvas
- 4 novos estados: `ConfirmSaveState`, `ConfirmDeleteState`, `LoadGameState`, e sub-estado de sobrescrita
- UI dedicada `SaveLoadUi.js` para renderização
- 3 slots de save em `localStorage`
- Opção "Carregar Jogo" no menu principal (tecla L)

**Fica fora:**
- Salvamento automático (auto-save)
- Screenshots fullscreen / animações de save
- Múltiplos perfis de jogador
- Criptografia de saves (localStorage é local)

## Estrutura de Arquivos

```
src/
├── classes/
│   ├── SacredTree.js                          # NOVO
│   ├── persistence/
│   │   ├── SaveManager.js                     # NOVO (3 slots + metadados)
│   │   ├── GameSnapshot.js                    # NOVO (capture/apply)
│   │   └── ThumbnailCapture.js                # NOVO (160x120px base64)
│   ├── states/
│   │   ├── ConfirmSaveState.js                # NOVO
│   │   ├── ConfirmDeleteState.js              # NOVO
│   │   └── LoadGameState.js                   # NOVO
│   └── ui/
│       └── SaveLoadUi.js                      # NOVO
```

## Estrutura no localStorage

```
zelda-save-slot-0   → snapshot completo
zelda-save-slot-1   → snapshot completo
zelda-save-slot-2   → snapshot completo
zelda-save-meta     → metadados agregados para listagem
```

## Schema do Snapshot

```javascript
{
    version: 1,
    slotIndex: 0,                    // 0-based: 0, 1, 2
    timestamp: 1736000000000,
    thumbnail: "data:image/png;base64,...",  // PNG 160x120px
    player: {
        x, y, name, gold,
        health, maxHealth,
        state, direction, facing,
        inventory: { items: [...], weapons: [...] },
        equippedWeapon: { id, name, type, damage }
    },
    world: {
        currentRoom: { x, y },
        roomName: "Caverna Sombria",
        progressionFlags: [...],     // Array<[key, value]>
        openedChests: [...],          // [{ roomKey, obstacleIndex }]
        collectedItems: [...],        // [{ roomKey, itemIndex }]
        enemiesDefeated: [...]        // [{ roomKey, enemyIndex }]
    }
}
```

## Fluxo do Jogador

### Save (Árvore Sagrada - sala `1,0`)
1. Player se aproxima da Árvore na Caverna Sombria
2. Pressiona `X` → `ConfirmSaveState`
3. Navega entre 3 slots (↑/↓ ou 1/2/3)
4. `X` ou `Enter` confirma:
   - Slot vazio → salva direto
   - Slot ocupado → pede confirmação de sobrescrita
5. Mensagem "Progresso salvo!" por 2 segundos
6. Volta para `PlayingState`

### Load (Menu Principal)
1. Player pressiona `L` no menu
2. `LoadGameState` lista 3 slots com thumbnails
3. Navega entre slots (↑/↓ ou 1/2/3)
4. `X` ou `Enter` carrega slot selecionado
5. `Delete` apaga slot (com confirmação)
6. `ESC` volta ao menu

## Controles

| Contexto | Tecla | Ação |
|---|---|---|
| PlayingState (perto da árvore) | `X` | Abre diálogo de save |
| ConfirmSaveState | `↑/↓` ou `1-3` | Seleciona slot |
| ConfirmSaveState | `X`/`Enter` | Confirma save |
| ConfirmSaveState | `ESC` | Cancela |
| MenuState | `Enter` | Novo jogo |
| MenuState | `L` | Carregar jogo |
| LoadGameState | `↑/↓` ou `1-3` | Seleciona slot |
| LoadGameState | `X`/`Enter` | Carrega slot |
| LoadGameState | `Delete` | Apaga slot |
| LoadGameState | `ESC` | Volta ao menu |

## Padrões Seguidos

- **State Pattern**: novos estados herdam de `State`
- **Persistência via localStorage**: mesmo padrão de `NPCStateStore`
- **Objeto interativo polimórfico**: `SacredTree` segue padrão de `Chest`/`SignPost`
- **Versionamento**: campo `version` permite migração futura
- **Isolamento de responsabilidades**: cada estado tem função única

## Edge Cases Tratados

1. **Salvar durante diálogo** → bloqueado (PlayingState já verifica dialogManager)
2. **Salvar slot vazio** → salva direto
3. **Salvar slot ocupado** → pede confirmação de sobrescrita
4. **Carregar slot vazio** → mensagem "Slot vazio"
5. **localStorage cheio** → erro capturado, mensagem "Espaço insuficiente"
6. **Snapshot corrompido** → `null` retornado, estado de erro
7. **Versão incompatível** → bloqueado por `GameSnapshot.VERSION`
8. **Apagar slot** → `ConfirmDeleteState` previne deleção acidental

## Limpeza de Contexto

- `GameSnapshot.capture()` é chamado **apenas** no momento do save, evitando overhead
- Thumbnails são PNGs pequenos (~15KB) → 3 slots ≈ 45KB total
- Metadados (`zelda-save-meta`) são atualizados apenas após save/delete

## Próximas Expansões (Fora de Escopo)

- Auto-save em momentos-chave (entrar em nova sala, derrotar chefe)
- Criptografia de saves (caso o jogo vá para web pública)
- Mais de 3 slots (configurável)
- Exportar/importar saves como arquivo JSON
- Múltiplos perfis de jogador

## Critérios de Implementação

- [x] `SacredTree` aparece na sala `1,0` (Caverna Sombria)
- [x] Player interage com a árvore via tecla `X`
- [x] Sistema suporta 3 slots
- [x] Thumbnail 160x120px capturado no save
- [x] Navegação por setas e teclas numéricas
- [x] Confirmação de sobrescrita em slot ocupado
- [x] Opção "Carregar" no menu principal (tecla L)
- [x] Listagem de saves com thumbnails
- [x] Deleção de saves com confirmação
- [x] Restauração completa: posição, sala, vida, inventário, flags, baús, items, inimigos
- [x] SaveManager com versionamento
- [x] Documentação criada
