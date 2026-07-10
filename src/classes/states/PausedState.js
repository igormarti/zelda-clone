import MenuState from './MenuState.js';
import PlayingState from './PlayingState.js';
import State from './State.js';

export default class PausedState extends State {
    enter() {
        // Estado congelado; nada a fazer aqui
    }

    update() {
        const { input } = this.context;

        // Detecta ESC para despausar
        if (input.keys['Escape']) {
            input.keys['Escape'] = false; // Consome a tecla
            this.stateManager.changeState(PlayingState);
        }

        // Detectar S para sair para o menu
        if (input.keys['s'] || input.keys['S']) {
            input.keys['s'] = false; // Consome a tecla
            this.stateManager.changeState(MenuState);
        }
    }

    draw(ctx) {
        const { world, player, spriteSheet, FRAME_SIZE } = this.context;

        // Renderiza mundo e player congelados (sem atualizar)
        world.draw(ctx);

        if (spriteSheet.complete) {
            player.draw(ctx, spriteSheet, FRAME_SIZE);
        }

        // Overlay de pausa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        // Texto "PAUSED"
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.context.canvas.width / 2, this.context.canvas.height / 2);

        // Instruções para continuar
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Pressione ESC para continuar', this.context.canvas.width / 2, this.context.canvas.height / 2 + 60);

        // Instruções para sair para o menu
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Pressione S para sair para o menu', this.context.canvas.width / 2, this.context.canvas.height / 2 + 100);
    }

    exit() {}
}
