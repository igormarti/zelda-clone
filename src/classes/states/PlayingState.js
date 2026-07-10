import GameOverState from './GameOverState.js';
import PausedState from './PausedState.js';
import State from './State.js';

export default class PlayingState extends State {
    enter() {
        // Limpando o estado de pausa, se houver
        // Nada específico necessário aqui no enter
    }

    update() {
        const { player, world, input } = this.context;

        // Atualização do jogo
        player.update(input.keys, world);
        world.update(player);

        // Detecta morte
        if (player.state === 'die') {
            this.stateManager.changeState(GameOverState);
            return;
        }

        // Detecta pausa (ESC)
        if (input.keys['Escape']) {
            input.keys['Escape'] = false; // Consome a tecla
            this.stateManager.changeState(PausedState);
        }
    }

    draw(ctx) {
        const { world, player, spriteSheet, FRAME_SIZE } = this.context;

        // Renderiza mundo
        world.draw(ctx);

        // Renderiza player
        if (spriteSheet.complete) {
            player.draw(ctx, spriteSheet, FRAME_SIZE);
        }
    }

    exit() {}
}
