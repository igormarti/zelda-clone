# 07 - Mapa do Mundo

## Visão Geral

O mundo do jogo é composto por **37 salas** distribuídas em **7 regiões** distintas.  
Ao pressionar **M** durante o jogo, o jogador pode visualizar o mapa completo (`assets/map-world.png`) com um marcador indicando sua posição atual.

---

## Regiões e Salas

### 1. Campos Verdejante (4 salas)

Região inicial, gramíneas e flores.

| Sala | Grid (x,y) | Descrição |
|------|-------------|-----------|
| 0-1  | `0,0`       | Clareira Verdejante (sala inicial) |
| 0-2  | `1,0`       | Campo com cercas |
| 0-3  | `0,1`       | Campo sul |
| 0-4  | `1,1`       | Campo sudeste |

### 2. Floresta Princesa das Matas (5 salas)

Floresta densa com árvores grandes e caminhos ocultos.

| Sala | Grid (x,y) | Descrição |
|------|-------------|-----------|
| 1-1  | `2,0`       | Entrada da floresta |
| 1-2  | `3,0`       | Coração da floresta |
| 1-3  | `4,0`       | Clareira da princesa |
| 1-4  | `2,1`       | Trilha sul da floresta |
| 1-5  | `3,1`       | Passagem para a Vila |

### 3. Cemitério (5 salas)

Região sombria com lápides, estátuas e inimigos mortos-vivos.

| Sala | Grid (x,y) | Descrição |
|------|-------------|-----------|
| C-1  | `5,0`       | Entrada do cemitério |
| C-2  | `6,0`       | Ala leste do cemitério |
| C-3  | `5,1`       | Catacumbas superiores |
| C-4  | `6,1`       | Cripta central |
| C-5  | `5,2`       | Profundezas do cemitério |

### 4. Floresta Assombrada (5 salas)

Floresta escura com tons roxos e criaturas corrompidas.

| Sala | Grid (x,y) | Descrição |
|------|-------------|-----------|
| 2-1  | `7,0`       | Entrada sombria |
| 2-2  | `8,0`       | Trilha nebulosa |
| 2-3  | `9,0`       | Altar corrompido |
| 2-4  | `7,1`       | Bosque interior |
| 2-5  | `8,1`       | Coração da maldição |

### 5. Vila Águas Vermelhas (3 salas)

Vila central do mapa, ponto de convergência entre regiões.

| Sala | Grid (x,y) | Descrição |
|------|-------------|-----------|
| 3-1  | `3,2`       | Entrada oeste da vila |
| 3-2  | `4,2`       | Praça central |
| 3-3  | `5,2`       | Entrada leste da vila — **conflito com C-5, usa `6,2`** |

> Nota: A sala `3-3` foi mapeada para `6,2` para evitar conflito com `C-5 (5,2)`.

### 6. Deserto do Sul (7 salas)

Região árida com dunas, cactos e ruínas antigas.

| Sala | Grid (x,y) | Descrição |
|------|-------------|-----------|
| 4-1  | `0,3`       | Oásis abandonado |
| 4-2  | `1,3`       | Lago do deserto |
| 4-3  | `2,3`       | Desfiladeiro |
| 4-4  | `3,3`       | Cemitério dos Ossos |
| 4-5  | `0,4`       | Ruínas sul |
| 4-6  | `1,4`       | Vila do Deserto do Sul |
| 4-7  | `2,4`       | Portal para Montanhas |

### 7. Montanhas Cajumas (8 salas)

Montanhas geladas com cachoeiras e cavernas.

| Sala | Grid (x,y) | Descrição |
|------|-------------|-----------|
| 5-1  | `5,3`       | Vila das montanhas |
| 5-2  | `6,3`       | Passo rochoso |
| 5-3  | `7,3`       | Caverna de cristal |
| 5-4  | `8,3`       | Pico nevado |
| 5-5  | `5,4`       | Base da cachoeira |
| 5-6  | `6,4`       | Ravina profunda |
| 5-7  | `7,4`       | Passagem secreta |
| 5-8  | `8,4`       | Santuário da montanha |

---

## Grid Visual (x → horizontal, y → vertical)

```
y\x   0       1       2       3       4       5       6       7       8       9
 0   [0-1]   [0-2]   [1-1]   [1-2]   [1-3]   [C-1]   [C-2]   [2-1]   [2-2]   [2-3]
 1   [0-3]   [0-4]   [1-4]   [1-5]    ---    [C-3]   [C-4]   [2-4]   [2-5]    ---
 2    ---     ---      ---    [3-1]   [3-2]   [C-5]   [3-3]    ---     ---     ---
 3   [4-1]   [4-2]   [4-3]   [4-4]    ---    [5-1]   [5-2]   [5-3]   [5-4]    ---
 4   [4-5]   [4-6]   [4-7]    ---     ---    [5-5]   [5-6]   [5-7]   [5-8]    ---
```

---

## Conexões entre regiões (Portas principais)

- **Campos Verdejante → Floresta Princesa**: `0-2 (1,0)` ↔ `1-1 (2,0)` (porta leste/oeste)
- **Floresta Princesa → Cemitério**: `1-3 (4,0)` ↔ `C-1 (5,0)` (porta leste/oeste)
- **Cemitério → Floresta Assombrada**: `C-2 (6,0)` ↔ `2-1 (7,0)` (porta leste/oeste)
- **Floresta Princesa → Vila**: `1-5 (3,1)` ↔ `3-1 (3,2)` (porta sul/norte)
- **Cemitério → Vila**: `C-5 (5,2)` ↔ `3-3 (6,2)` (porta leste/oeste)
- **Vila → Deserto do Sul**: `3-1 (3,2)` ↔ `4-4 (3,3)` (porta sul/norte)
- **Vila → Montanhas Cajumas**: `3-3 (6,2)` ↔ `5-1 (5,3)` (porta sul/norte)
- **Deserto → Montanhas**: `4-4 (3,3)` ↔ `5-1 (5,3)` (porta leste/oeste)
  - Alternativa: `4-7 (2,4)` ↔ `5-5 (5,4)` (caminho secreto)

---

## Controles do Mapa (Estado MapState)

| Tecla       | Ação                     |
|-------------|--------------------------|
| `M`         | Abre/fecha o mapa        |
| `Esc`       | Fecha o mapa             |
| `+` / `=`   | Zoom in                  |
| `-`         | Zoom out                 |
| `W/A/S/D`   | Mover visualização (pan) |
| Setas       | Mover visualização (pan) |

---

## Referência técnica

- **Imagem do mapa**: `assets/map-world.png` (1536×1024 px)
- **Classe do estado**: `src/classes/states/MapState.js`
- **Grid no código**: `World.worldMap` usa chaves `"x,y"` (ex: `"0,0"`, `"3,2"`)
- **Sala atual**: `World.currentRoom = { x, y }`

---

## Biomas e cores de fundo

| Região | Cor de fundo | Tileset |
|--------|-------------|---------|
| Campos Verdejante | `#548a3c` | world-tileset.svg / tileset PNG |
| Floresta Princesa | `#2d5a1e` | world-tileset.svg |
| Cemitério | `#5a3a6e` | cemetery-tileset.svg |
| Floresta Assombrada | `#3d1f4e` | cemetery-tileset.svg (variante roxa) |
| Vila Águas Vermelhas | `#8b3a3a` | world-tileset.svg |
| Deserto do Sul | `#c4a035` | desert-tileset.svg |
| Montanhas Cajumas | `#4a5568` | cave-tileset.svg |
