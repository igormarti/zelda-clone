import State from './State.js';
import LoadGameState from './LoadGameState.js';

/**
 * Estado de confirmação de deleção de save
 */
export default class ConfirmDeleteState extends State {
    enter() {
        this.slotIndex = this.context.slotToDelete || 0;
        this.confirmed = false;
    }

    update() {
        const { input, saveManager } = this.context;

        // Confirmar deleção
        if (input.keys['x'] || input.keys['X'] || input.keys['Delete']) {
            input.keys['x'] = input.keys['X'] = input.keys['Delete'] = false;
            const success = saveManager.delete(this.slotIndex);
            if (success) {
                this.confirmed = true;
                this.context.deleteMessage = `Slot ${this.slotIndex + 1} apagado!`;
            }
        }

        // Cancelar
        if (input.keys['Escape']) {
            input.keys['Escape'] = false;
            this.stateManager.changeState(LoadGameState);
        }

        // Volta após confirmar
        if (this.confirmed) {
            setTimeout(() => {
                this.stateManager.changeState(LoadGameState);
            }, 500);
        }
    }

    draw(ctx) {
        const { canvas } = this.context;

        // Fundo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Caixa de confirmação
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(150, 200, canvas.width - 300, 150);
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.strokeRect(150, 200, canvas.width - 300, 150);

        // Texto
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Deseja apagar o Slot ${this.slotIndex + 1}?`, canvas.width / 2, 235);
        ctx.fillText('Esta ação não pode ser desfeita.', canvas.width / 2, 260);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('X/DEL = Apagar | ESC = Cancelar', canvas.width / 2, 310);

        // Mensagem de sucesso
        if (this.confirmed) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 30, 300, 60);
            ctx.strokeStyle = '#4a7c3a';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 30, 300, 60);

            ctx.fillStyle = '#4a7c3a';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Slot apagado!', canvas.width / 2, canvas.height / 2 + 5);
        }
    }

    exit() {}
}
