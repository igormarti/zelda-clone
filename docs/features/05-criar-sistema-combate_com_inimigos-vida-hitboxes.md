# 05-criar-sistema-combate_com_inimigos-vida-hitboxes

## Objetivo
- Adicionar um sistema de combate simples, mas escalável, com inimigos, vida, dano e hitboxes.
- Transformar o jogo em uma experiência de ação mais envolvente, sem perder a arquitetura modular já adotada.
- Preparar a base para futuras expansões como drops, inventário, armas, boss e quests.

## Escopo
- Entra na feature:
  - criação de inimigos básicos por sala;
  - sistema de vida para player e inimigos;
  - hitboxes de ataque e de colisão para combate;
  - dano por contato e/ou ataque direto;
  - feedback visual mínimo de dano e morte;
  - integração com o estado de gameplay e com a transição de salas.
- Fica fora da feature:
  - combate com armas variadas;
  - sistema de inventário;
  - drops e loot;
  - IA avançada ou comportamentos complexos;
  - áudio e animações sofisticadas.

## Fluxo do jogador
- O jogador entra em uma sala e encontra um ou mais inimigos.
- O jogador pode se mover normalmente e tentar se aproximar do inimigo.
- Ao pressionar o comando de ataque, o sistema verifica se o alvo está dentro do alcance e da hitbox de ataque.
- Se o ataque acertar, o inimigo perde vida e pode ser derrotado.
- Se o inimigo alcançar o jogador, ele pode causar dano por contato.
- Quando a vida do jogador chega a zero, o jogo entra em estado de game over ou em uma tela de derrota.
- Quando o inimigo morre, ele deixa de agir e pode ser removido da sala.

## Requisitos técnicos
- Módulos impactados:
  - Player: deve passar a ter vida, estado de dano, cooldown de invulnerabilidade e lógica de ataque.
  - World: deve permitir a presença de inimigos por sala e integrar a respawn/remoção quando necessário.
  - PlayingState: deve orquestrar atualização de inimigos, combate e transições de estado.
  - Novo módulo Enemy: representa um inimigo com vida, velocidade, hitbox e comportamento simples.
  - Novo módulo CombatSystem ou AttackSystem: centraliza regras de dano, alcance, cooldown e colisão entre entidades.
- Dados/estado necessários:
  - vida atual e vida máxima do player;
  - vida atual e vida máxima do inimigo;
  - estado de dano/invulnerabilidade;
  - cooldown de ataque;
  - estado de morte/derrota;
  - referência ao alvo e à sala atual.
- Integrações necessárias:
  - o combate deve respeitar a mesma lógica de colisão do mundo;
  - a lógica de ataque não deve depender diretamente do render loop;
  - o sistema deve ser preparado para futuras extensões por composição.

## Regras de negócio / gameplay
- O jogador só causa dano se o ataque estiver ativo e o alvo estiver dentro do alcance definido.
- O dano deve ser aplicado apenas uma vez por impacto/ataque, evitando múltiplos triggers por frame.
- O inimigo só pode atacar quando estiver em uma distância mínima e dentro de sua própria hitbox de contato.
- O player deve ficar temporariamente invulnerável após sofrer dano, para evitar dano repetido instantâneo.
- Um inimigo derrotado deve parar de se mover e não deve mais causar dano.
- O combate deve funcionar de forma consistente tanto em salas simples quanto em salas com obstáculos.

## Edge cases
- O jogador tenta atacar sem alvo ou com o alvo fora de alcance; o ataque deve ser ignorado sem erro.
- O jogador sofre dano enquanto já está invulnerável; o sistema deve ignorar o segundo hit.
- Um inimigo entra em contato com uma parede ou obstáculo; ele deve respeitar a colisão e não atravessar o mapa.
- O jogador ataca repetidamente rapidamente; o cooldown deve evitar spam de dano.
- Um inimigo morre no meio do update; sua lógica deve cessar imediatamente sem causar crash.
- O jogador troca de sala durante uma animação/ataque; o estado do combate deve ser limpo ou reavaliado sem inconsistência.

## Critérios de implementação
- [ ] o player possui vida e pode sofrer dano;
- [ ] inimigos podem ser criados e atualizados por sala;
- [ ] ataques do player causam dano quando acertam um alvo válido;
- [ ] inimigos causam dano ao player por contato;
- [ ] hitboxes de ataque e colisão são respeitadas;
- [ ] morte e invulnerabilidade funcionam sem bugs visíveis;
- [ ] o sistema integra-se ao loop atual sem quebrar o fluxo de jogo;
- [ ] a estrutura permite expansão futura para mais tipos de inimigo e combate.
