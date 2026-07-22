import MenuState from './MenuState.js';
import State from './State.js';

export default class GameOverState extends State {
    constructor(stateManager, context) {
        super(stateManager, context);
        this.deathTimer = 0;
    }

    enter() {
        // Timer para mostrar a animação de morte antes de exibir Game Over
        this.deathTimer = 0;
    }

    update() {
        const { input } = this.context;

        this.deathTimer++;

        // Detecta ENTER após tempo mínimo (para deixar a animação rodar)
        if (this.deathTimer > 60 && input.keys['Enter']) {
            input.keys['Enter'] = false; // Consome a tecla
            this.stateManager.changeState(MenuState);
        }
    }

    draw(ctx) {
        const { world, player, spriteSheet, FRAME_SIZE, npcManager } = this.context;

        // Renderiza mundo e player
        world.draw(ctx, player, spriteSheet, FRAME_SIZE,  npcManager);

        if (spriteSheet.complete) {
            player.draw(ctx, spriteSheet, FRAME_SIZE);
        }

        // Overlay escuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        // Texto "GAME OVER"
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.context.canvas.width / 2, this.context.canvas.height / 2);

        // Instruções (aparece após 60 frames)
        if (this.deathTimer > 60) {
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText('Pressione ENTER para retornar ao menu', this.context.canvas.width / 2, this.context.canvas.height / 2 + 60);
        }
    }

    exit() {}
}
