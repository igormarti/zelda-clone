import PlayingState from './PlayingState.js';
import State from './State.js';

export default class MenuState extends State {
    enter() {
        // Reset do player e mundo ao retornar ao menu
        this.context.player.x = 400;
        this.context.player.y = 300;
        this.context.player.state = 'idle';
        this.context.player.direction = 'front';
        this.context.player.currentFrame = 0;
        this.context.world.currentRoom = { x: 0, y: 0 };
    }

    update() {
        // Detecta ENTER para iniciar o jogo
        if (this.context.input.keys['Enter']) {
            this.context.input.keys['Enter'] = false; // Consome a tecla
            this.stateManager.changeState(PlayingState);
        }
    }

    draw(ctx) {
        // Renderização do menu
        const { canvas, ctx: gameCtx } = this.context;
        
        // Fundo
        gameCtx.fillStyle = '#111';
        gameCtx.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        // Título
        gameCtx.fillStyle = '#fff';
        gameCtx.font = 'bold 48px Arial';
        gameCtx.textAlign = 'center';
        gameCtx.fillText('ZELDA CLONE', this.context.canvas.width / 2, 150);

        // Menu options
        gameCtx.font = '24px Arial';
        gameCtx.fillStyle = '#4a543b';
        gameCtx.fillText('Pressione ENTER para iniciar', this.context.canvas.width / 2, 300);

        // Instruções
        gameCtx.font = '16px Arial';
        gameCtx.fillStyle = '#888';
        gameCtx.fillText('Use SETAS para se mover', this.context.canvas.width / 2, 400);
        gameCtx.fillText('ESC para pausar', this.context.canvas.width / 2, 430);
    }

    exit() {}
}
