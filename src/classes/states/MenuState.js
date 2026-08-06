import LoadGameState from './LoadGameState.js';
import PlayingState from './PlayingState.js';
import State from './State.js';

export default class MenuState extends State {
    enter() {
        const { player, world } = this.context;

        // 1. Dados de posicionamento (continuam direto no player)
        player.x = 400;
        player.y = 300;

        // 2. Estados e Direções (funcionam via setters do player)
        player.stateComponent.state = 'idle';
        player.stateComponent.direction = 'front';
        player.stateComponent.health = player.stateComponent.maxHealth; // Restaura a saúde do jogador

        // 3. Frame de animação (ajustado para usar o método de reset do componente)
        player.animationComponent.reset();

        // 4. Cooldowns e atributos físicos (ajustados para acessar o componente correto)
        player.stateComponent.doorCooldown = 0;
        world.reset();
    }

    update() {
        // Detecta ENTER para iniciar o jogo (novo jogo)
        if (this.context.input.keys['Enter']) {
            this.context.input.keys['Enter'] = false; // Consome a tecla
            this.stateManager.changeState(PlayingState);
        }

        // Detecta L para carregar jogo existente
        if (this.context.input.keys['l'] || this.context.input.keys['L']) {
            this.context.input.keys['l'] = false;
            this.context.input.keys['L'] = false;
            this.stateManager.changeState(LoadGameState);
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

        gameCtx.fillStyle = '#6a8b3b';
        gameCtx.fillText('Pressione L para carregar jogo', this.context.canvas.width / 2, 340);

        // Instruções
        gameCtx.font = '16px Arial';
        gameCtx.fillStyle = '#888';
        gameCtx.fillText('Use SETAS para se mover', this.context.canvas.width / 2, 420);
        gameCtx.fillText('X para interagir | ESC para pausar', this.context.canvas.width / 2, 450);
    }

    exit() {}
}