import State from './State.js';
import PlayingState from './PlayingState.js';
import SaveLoadUi from '../ui/SaveLoadUi.js';
import SaveManager from '../persistence/SaveManager.js';
import ThumbnailCapture from '../persistence/ThumbnailCapture.js';

/**
 * Estado de confirmação de save
 * Exibe lista de 3 slots e permite selecionar qual será salvo.
 * O snapshot do jogo (com thumbnail) é capturado ANTES da entrada neste estado
 * (via PlayingState) e fica disponível em this.context.pendingSnapshot.
 */
export default class ConfirmSaveState extends State {
    enter() {
        const { saveManager } = this.context;
        this.selectedSlot = 0;
        this.slots = this._enrichSlots(saveManager.listSlots());
        this.message = '';
        this.messageTimer = 0;
        this.mode = 'select'; // 'select' ou 'confirm_overwrite'
        this.overwriteSlot = null;

        // Pré-carrega imagens no cache da UI
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

        // Confirmar
        if (input.keys['x'] || input.keys['X'] || input.keys['Enter']) {
            input.keys['x'] = input.keys['X'] = input.keys['Enter'] = false;

            if (this.mode === 'select') {
                // Verifica se slot está ocupado
                if (this.slots[this.selectedSlot].exists) {
                    this.mode = 'confirm_overwrite';
                    this.overwriteSlot = this.selectedSlot;
                } else {
                    this._performSave();
                }
            } else if (this.mode === 'confirm_overwrite') {
                this._performSave();
            }
        }

        // Cancelar (modo select)
        if (input.keys['Escape']) {
            input.keys['Escape'] = false;
            if (this.mode === 'select') {
                this.stateManager.changeState(PlayingState);
            } else if (this.mode === 'confirm_overwrite') {
                this.mode = 'select';
                this.overwriteSlot = null;
            }
        }

        // Atualizar timer de mensagem
        if (this.messageTimer > 0) {
            this.messageTimer--;
            if (this.messageTimer === 0) {
                this.stateManager.changeState(PlayingState);
            }
        }
    }

    _performSave() {
        const { saveManager, pendingSnapshot } = this.context;

        // Usa snapshot pré-capturado (gerado com o canvas ainda mostrando o mundo)
        let snapshot = pendingSnapshot;
        if (!snapshot) {
            // Fallback: captura novamente se por algum motivo não houver pendingSnapshot
            console.warn('[SAVE] pendingSnapshot ausente; recapturando (pode conter overlay de UI).');
            snapshot = this._captureFallbackSnapshot();
        }
        if (!snapshot) {
            this.message = 'Erro ao capturar progresso!';
            this.messageTimer = 120;
            return;
        }

        // Salva no slot selecionado (sobrescreve automaticamente se já existir)
        const success = saveManager.save(this.selectedSlot, snapshot);
        if (success) {
            this.message = `Progresso salvo no Slot ${this.selectedSlot + 1}!`;
            this.messageTimer = 120; // 2 segundos a 60 FPS
            this.mode = 'select';

            // Consome o pendingSnapshot para não reusar em saves futuros
            this.context.pendingSnapshot = null;

            // Pré-decodifica o thumbnail recém salvo para o cache da UI.
            // Aguarda o decode (1-2 frames) para que o preview apareça
            // IMEDIATAMENTE ao voltar para a tela de save — sem flicker.
            const savedIdx = this.selectedSlot;
            const savedThumb = snapshot.thumbnail;
            if (savedThumb) {
                // Dispara decode (retorna Promise mas não bloqueia aqui).
                SaveLoadUi.cacheThumbnailForSlot(savedIdx, savedThumb).catch(() => {});

                // Atualiza também a lista de slots enriquecida (já com thumbnailData)
                // para o próximo draw().
                this.slots = this._enrichSlots(saveManager.listSlots());
                SaveLoadUi.loadThumbnails(this.slots);
            } else {
                // Sem thumbnail: só atualiza a lista de slots
                this.slots = this._enrichSlots(saveManager.listSlots());
            }
        } else {
            this.message = 'Erro ao salvar! (Storage cheio?)';
            this.messageTimer = 120;
        }
    }

    _captureFallbackSnapshot() {
        const { ctx, canvas } = this.context;
        // Captura manual mínima caso o GameSnapshot não esteja disponível
        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 160;
            tempCanvas.height = 120;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 160, 120);
            return {
                version: 1,
                slotIndex: null,
                timestamp: Date.now(),
                thumbnail: tempCanvas.toDataURL('image/png'),
                player: null,
                world: null
            };
        } catch (e) {
            console.warn('[SAVE] Falha no fallback de captura:', e);
            return null;
        }
    }

    /**
     * Enriquece os metadados dos slots com o dataURL completo da thumbnail,
     * para que a UI possa desenhar a imagem do save anterior no slot.
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

        if (this.mode === 'select') {
            SaveLoadUi.draw(
                ctx,
                canvas,
                this.slots,
                this.selectedSlot,
                'save',
                'SALVAR PROGRESSO'
            );
        } else if (this.mode === 'confirm_overwrite') {
            // Renderiza a tela de save com destaque
            SaveLoadUi.draw(
                ctx,
                canvas,
                this.slots,
                this.selectedSlot,
                'save',
                'SALVAR PROGRESSO'
            );

            // Overlay de confirmação
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(150, 200, canvas.width - 300, 150);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(150, 200, canvas.width - 300, 150);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Este slot já tem um save.', canvas.width / 2, 235);
            ctx.fillText('Deseja sobrescrever?', canvas.width / 2, 265);

            ctx.font = '14px Arial';
            ctx.fillText('X/ENTER = Sim | ESC = Não', canvas.width / 2, 310);
        }

        // Renderiza mensagem de sucesso
        if (this.message) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 50, 400, 100);
            ctx.strokeStyle = '#4a7c3a';
            ctx.lineWidth = 3;
            ctx.strokeRect(canvas.width / 2 - 200, canvas.height / 2 - 50, 400, 100);

            ctx.fillStyle = '#4a7c3a';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.message, canvas.width / 2, canvas.height / 2);
        }
    }

    exit() {
        // Limpa pendingSnapshot para evitar vazamento entre estados
        this.context.pendingSnapshot = null;
    }
}
