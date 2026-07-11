export default class DialogManager {
    constructor() {
        this.active = false;
        this.dialogueId = null;
        this.npc = null;
        this.onEndCallbacks = [];
        this.dialogData = { step: 0, lines: [] };
        this.dialogues = null;
        this.isLoading = false;
    }

    start(dialogueId, options = {}) {
        if (!dialogueId || this.active) return;
        this.active = true;
        this.dialogueId = dialogueId;
        this.npc = options.npc || null;
        this.dialogData = { step: 0, lines: [] };

        if (this.dialogues) {
            this.dialogData.lines = this.dialogues[this.dialogueId] || [];
        } else {
            this.ensureDialoguesLoaded();
        }
    }

    end() {
        if (!this.active) return;
        this.active = false;
        this.dialogueId = null;
        this.npc = null;
        this.dialogData = { step: 0, lines: [] };
        this.onEndCallbacks.forEach(callback => callback());
    }

    isActive() {
        return this.active;
    }

    onEnd(callback) {
        if (typeof callback === 'function') {
            this.onEndCallbacks.push(callback);
        }
    }

    offEnd(callback) {
        this.onEndCallbacks = this.onEndCallbacks.filter(fn => fn !== callback);
    }

    async ensureDialoguesLoaded() {
        if (this.dialogues || this.isLoading) {
            return;
        }

        this.isLoading = true;
        try {
            this.dialogues = await this.loadJSONDialogues();
            this.dialogData.lines = this.dialogues[this.dialogueId] || [];
        } catch (error) {
            console.warn('DialogManager: não foi possível carregar diálogos.', error);
            this.dialogues = {};
            this.dialogData.lines = [];
        } finally {
            this.isLoading = false;
        }
    }

    advance() {
        if (!this.active) return;
        const lines = this.dialogData.lines || [];
        if (this.dialogData.step < lines.length - 1) {
            this.dialogData.step += 1;
            return;
        }
        this.end();
    }

    update(input) {
        if (!this.active) return;
        if (input.keys['x']) {
            input.keys['x'] = false;
            this.advance();
        }
    }

    draw(ctx, canvas) {
        if (!this.active) return;

        const width = 520;
        const height = 140;
        const x = (canvas.width - width) / 2;
        const y = canvas.height - height - 30;

        ctx.fillStyle = 'rgba(53, 52, 52, 0.4)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        const lines = this.dialogData.lines || [];
        const text = lines[this.dialogData.step] || 'Carregando diálogo...';

        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.npc?.name || '...'}: `, x + 20, y + 35);
        ctx.fillText(text, x + 20, y + 70);
        ctx.fillText('Pressione X para avançar ou encerrar.', x + 20, y + 110);

        if (lines.length > 1) {
            ctx.fillText(`(${this.dialogData.step + 1}/${lines.length})`, x + 20, y + 135);
        }
    }

    async loadJSONDialogues() {
        const response = await fetch('assets/data/dialogues.json');
        if (!response.ok) {
            throw new Error(`Falha ao carregar dialogues.json: ${response.statusText}`);
        }
        return response.json();
    }
}
