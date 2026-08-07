import MenuState from './MenuState.js';
import State from './State.js';
import GameSnapshot from '../persistence/GameSnapshot.js';
import PlayingState from './PlayingState.js';

export default class GameOverState extends State {
    constructor(stateManager, context) {
        super(stateManager, context);
        this.deathTimer = 0;
        this.latestSaveSlot = null;
        this.latestSaveSnapshot = null;
    }

    enter() {
        // Timer para mostrar a animação de morte antes de exibir Game Over
        this.deathTimer = 0;

        // Detecta o save mais recente (por timestamp)
        this._findLatestSave();
    }

    /**
     * Procura pelo save com o maior timestamp (mais recente)
     * Se encontrado, armazena em this.latestSaveSlot e carrega o snapshot
     */
    _findLatestSave() {
        const { saveManager } = this.context;
        const slots = saveManager.listSlots();

        let maxTimestamp = -1;
        let latestSlot = null;

        slots.forEach(slot => {
            if (slot && slot.exists && slot.timestamp) {
                if (slot.timestamp > maxTimestamp) {
                    maxTimestamp = slot.timestamp;
                    latestSlot = slot.index;
                }
            }
        });

        if (latestSlot !== null) {
            this.latestSaveSlot = latestSlot;
            this.latestSaveSnapshot = saveManager.load(latestSlot);
            console.log(`[GAME OVER] Save mais recente encontrado no slot ${latestSlot + 1}`);
        } else {
            this.latestSaveSlot = null;
            this.latestSaveSnapshot = null;
            console.log('[GAME OVER] Nenhum save encontrado');
        }
    }

    update() {
        const { input } = this.context;

        this.deathTimer++;

        // Detecta ENTER após tempo mínimo (para deixar a animação rodar)
        if (this.deathTimer > 60 && input.keys['Enter']) {
            input.keys['Enter'] = false; // Consome a tecla

            // Se houver um save recente, oferece renascimento direto
            if (this.latestSaveSlot !== null && this.latestSaveSnapshot) {
                const success = GameSnapshot.apply(this.latestSaveSnapshot, this.context);
                if (success) {
                    console.log(`[GAME OVER] Renascendo do save no slot ${this.latestSaveSlot + 1}`);
                    this.stateManager.changeState(PlayingState);
                } else {
                    // Se falhar, volta ao menu
                    console.error('[GAME OVER] Falha ao aplicar snapshot. Voltando ao menu.');
                    this.stateManager.changeState(MenuState);
                }
            } else {
                // Sem save: volta ao menu
                this.stateManager.changeState(MenuState);
            }
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

            // Se houver um save recente, oferece renascimento direto
            if (this.latestSaveSlot !== null && this.latestSaveSnapshot) {
                ctx.fillText('Pressione ENTER para renascer do último ponto salvo', this.context.canvas.width / 2, this.context.canvas.height / 2 + 60);
            } else {
                ctx.fillText('Pressione ENTER para retornar ao menu', this.context.canvas.width / 2, this.context.canvas.height / 2 + 60);
            }
        }
    }

    exit() {}
}
