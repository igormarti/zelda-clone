import State from './State.js';
import MenuState from './MenuState.js';
import PlayingState from './PlayingState.js';
import SaveLoadUi from '../ui/SaveLoadUi.js';
import GameSnapshot from '../persistence/GameSnapshot.js';
import ConfirmDeleteState from './ConfirmDeleteState.js';

/**
 * Estado de carregamento de save
 * Exibe lista de 3 slots com thumbnails e permite carregar um save
 */
export default class LoadGameState extends State {
    enter() {
        const { saveManager } = this.context;
        this.selectedSlot = 0;
        this.slots = this._enrichSlots(saveManager.listSlots());
        this.message = '';
        this.messageTimer = 0;

        // Pré-carrega imagens do cache da UI
        SaveLoadUi.loadThumbnails(this.slots);
    }

    update() {
        const { input, saveManager } = this.context;

        // Navegar entre slots
        if (input.keys['ArrowUp']) {
            input.keys['ArrowUp'] = false;
            this.selectedSlot = (this.selectedSlot - 1 + 3) % 3;
        }
        if (input.keys['ArrowDown']) {
            input.keys['ArrowDown'] = false;
            this.selectedSlot = (this.selectedSlot + 1) % 3;
        }

        // Seleção por número (1-3)
        if (input.keys['1']) {
            input.keys['1'] = false;
            this.selectedSlot = 0;
        }
        if (input.keys['2']) {
            input.keys['2'] = false;
            this.selectedSlot = 1;
        }
        if (input.keys['3']) {
            input.keys['3'] = false;
            this.selectedSlot = 2;
        }

        // Carregar
        if (input.keys['x'] || input.keys['X'] || input.keys['Enter']) {
            input.keys['x'] = input.keys['X'] = input.keys['Enter'] = false;
            this._performLoad();
        }

        // Apagar (apenas em slot ocupado)
        if (input.keys['Delete'] && this.slots[this.selectedSlot].exists) {
            input.keys['Delete'] = false;
            this.context.slotToDelete = this.selectedSlot;
            this.stateManager.changeState(ConfirmDeleteState);
        }

        // Voltar ao menu
        if (input.keys['Escape']) {
            input.keys['Escape'] = false;
            // Limpa o cache de thumbnails ao sair
            SaveLoadUi.clearThumbnailCache();
            this.stateManager.changeState(MenuState);
        }

        // Atualizar timer de mensagem
        if (this.messageTimer > 0) {
            this.messageTimer--;
        }
    }

    _performLoad() {
        const { saveManager } = this.context;

        // Verifica se slot existe
        if (!this.slots[this.selectedSlot].exists) {
            this.message = `Slot ${this.selectedSlot + 1} está vazio!`;
            this.messageTimer = 120;
            return;
        }

        // Carrega snapshot
        const snapshot = saveManager.load(this.selectedSlot);
        if (!snapshot) {
            this.message = 'Erro ao carregar save!';
            this.messageTimer = 120;
            return;
        }

        // Aplica snapshot ao jogo
        const success = GameSnapshot.apply(snapshot, this.context);
        if (success) {
            console.log('[LOAD] Snapshot aplicado com sucesso');
            // Limpa o cache de thumbnails ao sair
            SaveLoadUi.clearThumbnailCache();
            this.stateManager.changeState(PlayingState);
        } else {
            this.message = 'Erro ao restaurar progresso!';
            this.messageTimer = 120;
        }
    }

    /**
     * Enriquece os metadados dos slots com o dataURL completo da thumbnail,
     * para que a UI possa desenhar a imagem do save no slot.
     */
    _enrichSlots(metaSlots) {
        const { saveManager } = this.context;
        return (metaSlots || []).map((meta) => {
            if (!meta || !meta.exists) {
                return { ...meta, thumbnailData: null };
            }
            const snapshot = saveManager.load(meta.index);
            const thumbnailData = snapshot && snapshot.thumbnail ? snapshot.thumbnail : null;
            return { ...meta, thumbnailData };
        });
    }

    draw(ctx) {
        const { canvas } = this.context;

        // Usa slots enriquecidos cacheados (carregados no enter/refresh)
        SaveLoadUi.draw(
            ctx,
            canvas,
            this.slots,
            this.selectedSlot,
            'load',
            'CARREGAR PROGRESSO'
        );

        // Renderiza mensagem
        if (this.message) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 50, 400, 100);
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width / 2 - 200, canvas.height / 2 - 50, 400, 100);

            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.message, canvas.width / 2, canvas.height / 2);
        }
    }

    exit() {}
}
