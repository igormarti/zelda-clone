export default class DialogManager {
    constructor() {
        this.active = false;
        this.dialogueId = null;
        this.npc = null;
        this.player = null;
        this.onEndCallbacks = [];
        this.dialogData = { step: 0, lines: [] };
        this.dialogues = null;
        this.isLoading = false;
        this.displayedText = ""; // O texto que está aparecendo gradualmente
        this.charIndex = 0;
        this.typingSpeed = 2; // Quantos frames por caractere
        this.typingTimer = 0;
        this.hasAlreadyReward = false;
    }

    start(dialogueId, options = {}) {
        if (!dialogueId || this.active) return;

        this.hasAlreadyReward = options.hasAlreadyReward;
        this.active = true;
        this.dialogueId = dialogueId;
        this.npc = options.npc || null;
        this.player = options.player || null;
        this.dialogData = { step: 0, lines: [] };

        if (this.dialogues) {
            this.dialogData.lines = this.dialogues[!this.hasAlreadyReward ? this.dialogueId: `${this.dialogueId}_after_reward`] || [];
        } else {
            this.ensureDialoguesLoaded();
        }
    }

    /**
     * NOVO: Inicia um diálogo de informação simples passando o texto diretamente
     * Pode receber uma string única ou um array de strings para múltiplas telas
     */
    showInfo(text, options = {}) {
        if (this.active) return;

        this.active = true;
        this.isInfoDialog = true;
        this.infoTitle = options.title || "Informação";
        this.npc = null;
        this.player = options.player || null;
        
        // Se passar apenas uma string, converte para array de 1 posição
        const lines = Array.isArray(text) ? text : [text];
        this.dialogData = { step: 0, lines: lines };
        
        this.resetTyping();
    }

    end() {
        if (!this.active) return;
        this.active = false;
        this.dialogueId = null;
        this.npc = null;
        this.dialogData = { step: 0, lines: [] };
        this.onEndCallbacks.forEach(callback => callback());
        this.resetTyping();
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
            this.dialogData.lines = this.dialogues[!this.hasAlreadyReward ? this.dialogueId: `${this.dialogueId}_after_reward`] || [];
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
            this.resetTyping();
            return;
        }
        this.end();
    }

    update(input) {
        if (!this.active) return;
       
        const fullText = this.dialogData.lines[this.dialogData.step] || "";

        // Efeito de digitação
        if (this.charIndex < fullText.length) {
            this.typingTimer++;
            if (this.typingTimer >= this.typingSpeed) {
                this.charIndex++;
                this.displayedText = fullText.substring(0, this.charIndex);
                this.typingTimer = 0;
            }
        }

        if (input.keys['x']) {
            input.keys['x'] = false;

            if (this.charIndex < fullText.length) {
                this.charIndex = fullText.length;
                this.displayedText = fullText;
            } else {
                this.advance();
            }
        }
    }

    draw(ctx, canvas) {
        if (!this.active) return;

        const width = 520;
        const height = 140;
        const x = (canvas.width - width) / 2;
        const y = canvas.height - height - 30;

        ctx.fillStyle = 'rgba(89, 87, 87, 0.2)';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        const lines = this.dialogData.lines || [];
        const text = lines[this.dialogData.step] || 'Carregando diálogo...';

        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.npc?.name || ''} `, x + 20, y + 35);
        this.drawWrappedText(ctx, this.displayedText.replace('${name}', this.player?.name), x + 20, y + 65, width - 40, 25);
        ctx.fillText('Pressione X para avançar ou encerrar.', x + 200, y + 130);

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

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testY = y;

        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, testY);
                line = words[i] + ' ';
                testY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, testY);
    }

    resetTyping() {
        this.displayedText = "";
        this.charIndex = 0;
        this.typingTimer = 0;
    }
}
