# Feature: Sistema de colisão com obstáculos

## Objetivo
Implementar um sistema de colisão simples e previsível para impedir que o jogador atravesse paredes, objetos bloqueados e limites do ambiente durante o movimento.

## Contexto
O jogo já possui:
- movimentação do personagem em [src/classes/Player.js](src/classes/Player.js)
- transições de sala em [src/classes/World.js](src/classes/World.js)
- entrada de teclado em [src/classes/InputHandler.js](src/classes/InputHandler.js)

No estado atual, o personagem pode se mover livremente pela tela, o que compromete a sensação de mundo interativo e dificulta a criação de futuras mecânicas como inimigos, portas, baús e combate.

## Requisitos Técnicos

### 1. Estrutura de colisão
- O sistema deve suportar uma lista de obstáculos por sala.
- Cada obstáculo deve ser representado por um retângulo com coordenadas $x$, $y$, $width$ e $height$.
- A estrutura deve ser tratada no módulo de mundo, pois cada sala pode ter um layout diferente.

### 2. Validação de movimento
- Antes de aplicar qualquer movimento no jogador, o sistema deve verificar se a nova posição colide com algum obstáculo.
- A verificação deve acontecer de forma separada por eixo para evitar que o jogador fique preso em cantos.
- Exemplo: se o movimento horizontal for bloqueado, a movimentação vertical pode continuar normalmente.

### 3. Integração com o Player
- A lógica de movimento do jogador deve ser ajustada para aceitar uma validação de colisão antes de atualizar a posição.
- O estado de animação deve continuar funcionando normalmente, mesmo quando o movimento for bloqueado.
- O jogador não deve “entrar” parcialmente em um obstáculo.

### 4. Limites do ambiente
- O jogador deve ser impedido de sair da área jogável da sala, exceto nas transições de sala já existentes.
- As transições entre salas devem continuar funcionando, mas sem permitir que o personagem atravesse paredes ou objetos posicionados na borda da tela.

### 5. Escalabilidade
- A implementação deve ser suficientemente modular para que, no futuro, a mesma lógica sirva para:
  - portas
  - inimigos
  - NPCs
  - objetos interativos
  - áreas de trigger

## Regras de Negócio
1. O jogador não pode atravessar obstáculos sólidos.
2. Se a tentativa de movimento for bloqueada, a posição atual do jogador deve ser mantida.
3. O movimento deve ser bloqueado antes da atualização visual do personagem.
4. O sistema deve respeitar a direção atual do personagem e a animação correspondente.
5. O jogador pode continuar se movimentando em outras direções caso uma delas esteja bloqueada.
6. O sistema deve ser simples o bastante para funcionar com o estilo atual de jogo em tela 2D top-down.

## Casos de Borda
- O jogador tenta se mover contra uma parede em linha reta.
- O jogador tenta passar por um canto de obstáculo.
- O jogador tenta atravessar um obstáculo enquanto pressiona duas teclas ao mesmo tempo.
- O jogador tenta entrar em uma sala e colidir com a borda do cenário logo após a transição.
- O jogador tenta se mover em uma área onde há um obstáculo parcialmente visível ou mal posicionado.

## Critérios de Aceitação
- O personagem não consegue atravessar paredes nem objetos bloqueados.
- A movimentação continua fluida em direções livres.
- O sistema funciona para pelo menos uma sala com obstáculos simples.
- A lógica de transição de sala continua operando sem quebrar o fluxo do jogo.
- O código permanece organizado dentro da arquitetura modular do projeto.

## Implementação Sugerida
A implementação inicial pode seguir este fluxo:
1. Criar uma lista de obstáculos na sala atual no módulo de mundo.
2. No update do jogador, calcular a próxima posição com base no input.
3. Verificar se essa posição entra em conflito com algum obstáculo.
4. Se houver colisão, manter a posição atual.
5. Se não houver colisão, aplicar a movimentação.

## Observação de Arquitetura
Para manter o projeto consistente com o padrão atual, a lógica de colisão deve ser encapsulada de forma limpa, preferencialmente em métodos auxiliares no módulo responsável pelo movimento ou pelo controle do ambiente, sem acoplar demais o jogador ao mundo.
