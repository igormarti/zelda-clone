# 04-criar-slice-jogavel

## Objetivo
- Transformar o protótipo em uma slice jogável curta, com uma experiência completa e coerente de início ao fim.
- Garantir que o jogador consiga entrar no jogo, explorar uma sala, interagir com um NPC, avançar em uma narrativa simples e transitar entre salas sem quebrar o fluxo.
- Validar os sistemas já existentes de estados, movimento, colisão, diálogo, NPCs e transição de sala em uma experiência mínima, mas completa.

## Escopo
- Entra na feature:
  - menu inicial e início de partida;
  - uma sala jogável com obstáculos e uma porta de saída;
  - interação com um NPC via teclado;
  - diálogo simples com pausa de movimento;
  - transição para uma nova sala após a interação;
  - pausa e retorno ao menu.
- Fica fora da feature:
  - combate;
  - inventário;
  - sistema de save;
  - múltiplas quests;
  - UI avançada ou cinematics.

## Fluxo do jogador
- O jogo inicia no menu e permanece em estado de espera até o jogador pressionar Enter.
- Ao iniciar, o jogador entra na sala inicial e pode se mover livremente, respeitando obstáculos e limites da sala.
- O jogador encontra um NPC configurado para a sala atual e se aproxima dele.
- Ao pressionar X, o jogo inicia um diálogo simples e o movimento do player é pausado temporariamente.
- Ao finalizar o diálogo, a sala entra em um estado de progressão mínimo: a porta ou o gatilho de saída fica disponível.
- O jogador atravessa a porta e entra em outra sala, fechando o ciclo básico da slice.
- O jogador pode pausar o jogo com ESC e voltar ao menu a qualquer momento.

## Requisitos técnicos
- Os sistemas impactados são:
  - StateManager e os estados de menu, gameplay, pausa e game over;
  - Player, para movimento, animação e interação com o ambiente;
  - World, para obstáculos, portas e transição entre salas;
  - NPCManager e NPC, para carga de NPCs por sala e interação;
  - DialogManager, para fluxo de diálogos e bloqueio de input durante a conversa;
  - dados declarativos em assets/data/npcs.json para o NPC da slice.
- A slice deve ser sustentada por uma estrutura de sala simples, com:
  - pelo menos um NPC interativo;
  - pelo menos um obstáculo sólido;
  - pelo menos uma porta/saída que complete a progressão.
- O fluxo deve permanecer compatível com o modelo atual de estados e com a ordem de update/draw já adotada em PlayingState.

## Regras de negócio / gameplay
- A slice deve ser jogável sem depender de sistemas complexos ou de conteúdo adicional.
- A interação com NPC só deve ser possível quando o jogador estiver próximo o suficiente.
- O diálogo deve pausar o movimento do jogador e dos NPCs enquanto estiver ativo.
- A porta de saída só deve se tornar funcional após o fluxo mínimo de interação ser concluído.
- A progressão deve ser clara para o jogador: ele entende que precisa falar com o NPC para avançar.
- O jogo deve continuar responsivo durante a slice, sem travamentos causados por transições de estado.

## Edge cases
- O jogador pressiona X repetidamente durante a interação; o diálogo deve ser iniciado apenas uma vez e não duplicar eventos.
- O jogador tenta pausar durante um diálogo; a pausa deve ser tratada sem quebrar o estado do diálogo.
- O jogador tenta atravessar uma parede ou entrar em uma porta antes do fluxo esperado; o movimento deve ser bloqueado ou a porta deve permanecer indisponível.
- O jogador troca de sala enquanto o diálogo está ativo; o estado deve ser tratado sem gerar inconsistência.
- O jogador retorna ao menu e inicia uma nova partida; o estado do player e da sala deve ser reiniciado corretamente.

## Critérios de implementação
- [ ] o jogo inicia em uma slice com fluxo claro e objetivo simples;
- [ ] o player consegue se mover, evitar obstáculos e interagir com um NPC;
- [ ] o diálogo inicia corretamente e interrompe o movimento durante a conversa;
- [ ] a progressão para a próxima sala depende do fluxo mínimo definido;
- [ ] a transição de salas funciona sem quebrar o estado atual do jogo;
- [ ] pausa e retorno ao menu permanecem operacionais;
- [ ] a feature pode ser jogada de forma contínua sem falhas evidentes.

## Implementação (status)
- [x] Implementado: carregamento de NPCs por sala (`NPCManager` já em uso);
- [x] Implementado: diálogo via `DialogManager` que pausa movimentos;
- [x] Implementado: desbloqueio de progressão via `World.completeProgression()` acionado por `NPCManager` ao fim do diálogo;
- [x] Implementado: ajustes de colisão e checagem de portas para evitar transições indevidas;
- [x] Testes automatizados: suíte de testes atualizada e passando (`node --test tests/*.test.mjs`).

## Como testar localmente (rápido)
1. Executar a suíte de testes:

```bash
node --test tests/*.test.mjs
```

2. Para teste visual no navegador:
- Abrir `index.html` em um servidor local (por exemplo `npx http-server .` ou usar Live Server do VS Code).
- Inicie o jogo, pressione `Enter` para começar, aproxime-se do NPC e pressione `X` para iniciar o diálogo. Após o diálogo, atravesse a porta para validar a progressão.

## Próximos passos recomendados
- Ajustar assets (sprites) para o NPC `cemiterio_srpoo_01` se quiser renderização final.
- Criar uma pequena página de smoke-test/manual case para QA com passos reproduzíveis.
- Adicionar um simples log de progresso visível no HUD para jogadores entenderem a meta.
