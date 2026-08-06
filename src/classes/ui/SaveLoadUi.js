/**
 * UI para Save/Load com renderização de thumbnails e metadados.
 *
 * Estratégia de preview:
 *  - Ao capturar o snapshot, geramos o PNG (dataURL) normalmente.
 *  - Pré-decodificamos esse PNG para um HTMLImageElement / ImageBitmap em
 *    memória imediatamente após o save, usando `img.decode()`.
 *  - A UI desenha direto do elemento já decodificado, eliminando o
 *    problema de "Carregando preview...".
 *  - Persistimos o dataURL no localStorage via GameSnapshot (igual antes)
 *    — a diferença é que o cache de imagens na UI está sempre pronto.
 */
export default class SaveLoadUi {
    static SLOT_BOX_WIDTH = 420;
    static SLOT_BOX_HEIGHT = 140;
    static THUMBNAIL_WIDTH = 160;
    static THUMBNAIL_HEIGHT = 120;
    static PADDING = 10;
    static SLOT_SPACING = 160;

    // Cache estático de imagens pré-decodificadas por slotIndex
    // Cada entrada: { img: HTMLImageElement|ImageBitmap, dataURL: string }
    // Map<slotIndex, { img, dataURL }>
    static _thumbnailCache = new Map();

    /**
     * Pré-carrega todas as thumbnails do array de slots em cache.
     * Cada slot deve trazer o dataURL em `thumbnailData` (ou `thumbnail`).
     * @param {array|object} slots
     */
    static loadThumbnails(slots) {
        if (Array.isArray(slots)) {
            slots.forEach((slot) => this._ensureSlotLoaded(slot));
            return;
        }
        if (slots && typeof slots === 'object') {
            this._ensureSlotLoaded(slots);
        }
    }

    /**
     * Atualiza o cache de UM slot específico com o dataURL fresco.
     * Pré-decodifica a imagem via `img.decode()` para que o preview
     * apareça de forma síncrona já no próximo frame.
     *
     * @param {number} slotIndex
     * @param {string} dataURL  data:image/png;base64,...
     */
    static async cacheThumbnailForSlot(slotIndex, dataURL) {
        if (slotIndex == null || !dataURL) return;

        const existing = this._thumbnailCache.get(slotIndex);
        if (existing && existing.dataURL === dataURL && existing.img) {
            return existing.img; // já temos essa imagem decodificada
        }

        const img = new Image();
        img.src = dataURL;

        try {
            // Aguarda o decode completo — após isso, drawImage é síncrono.
            if (typeof img.decode === 'function') {
                await img.decode();
            } else {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
            }
        } catch (e) {
            console.warn(`[SAVEUI] Falha ao decodificar thumbnail do slot ${slotIndex + 1}:`, e);
            this._thumbnailCache.delete(slotIndex);
            return null;
        }

        this._thumbnailCache.set(slotIndex, { img, dataURL });
        return img;
    }

    /**
     * Pré-decodifica o dataURL e armazena no cache.
     * Versão "fire-and-forget" (sem await) — usada em fluxos onde
     * não dá pra esperar Promise antes de devolver ao chamador.
     */
    static primeThumbnailForSlot(slotIndex, dataURL) {
        if (slotIndex == null || !dataURL) return;
        const existing = this._thumbnailCache.get(slotIndex);
        if (existing && existing.dataURL === dataURL && existing.img) return;
        // Dispara decode em background; o draw() vai usar a imagem
        // assim que o decode completar (no próximo frame).
        this.cacheThumbnailForSlot(slotIndex, dataURL).catch(() => {});
    }

    /**
     * Limpa o cache de thumbnails.
     */
    static clearThumbnailCache() {
        this._thumbnailCache.clear();
    }

    /**
     * Renderiza a tela de save/load com slots e thumbnails.
     */
    static draw(ctx, canvas, slots, selectedIndex, mode = 'save', title = 'SALVAR JOGO') {
        const centerX = canvas.width / 2;
        const startY = 60;

        // Sincroniza cache com os slots atuais (dispara decode de novos previews)
        this._syncCacheWithSlots(slots);

        // Fundo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Título
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, centerX, 40);

        // Renderiza cada slot
        slots.forEach((slot, idx) => {
            const y = startY + idx * (this.SLOT_BOX_HEIGHT + 10);
            this._drawSlotBox(ctx, startX(0, centerX), y, slot, idx === selectedIndex);
        });

        // Instruções
        this._drawInstructions(ctx, canvas, mode);
    }

    /**
     * Sincroniza o cache interno com a lista de slots atual.
     * - Slots que sumiram da lista têm suas imagens removidas.
     * - Slots novos têm seu dataURL agendado para decode.
     * - Slots com mesmo dataURL já decodificado são ignorados.
     * @private
     */
    static _syncCacheWithSlots(slots) {
        if (!Array.isArray(slots)) return;
        const seen = new Set();

        slots.forEach((slot) => {
            if (!slot || slot.index == null) return;
            const idx = slot.index;
            seen.add(idx);

            const dataURL = slot.thumbnailData || slot.thumbnail;
            if (!dataURL) {
                if (this._thumbnailCache.has(idx)) this._thumbnailCache.delete(idx);
                return;
            }

            const cached = this._thumbnailCache.get(idx);
            if (cached && cached.dataURL === dataURL) return; // já pronta

            // Dispara decode (fire-and-forget)
            this.primeThumbnailForSlot(idx, dataURL);
        });

        for (const idx of Array.from(this._thumbnailCache.keys())) {
            if (!seen.has(idx)) this._thumbnailCache.delete(idx);
        }
    }

    /**
     * Garante que o slot informado esteja carregado no cache.
     * @private
     */
    static _ensureSlotLoaded(slot) {
        if (!slot || slot.index == null) return;
        const dataURL = slot.thumbnailData || slot.thumbnail;
        if (!dataURL) {
            this._thumbnailCache.delete(slot.index);
            return;
        }
        const cached = this._thumbnailCache.get(slot.index);
        if (cached && cached.dataURL === dataURL) return;
        this.primeThumbnailForSlot(slot.index, dataURL);
    }

    /**
     * Renderiza a caixa de um slot.
     * @private
     */
    static _drawSlotBox(ctx, x, y, slot, isSelected) {
        ctx.fillStyle = isSelected ? '#4a543b' : '#2a3a2a';
        ctx.fillRect(x, y, this.SLOT_BOX_WIDTH, this.SLOT_BOX_HEIGHT);

        ctx.strokeStyle = isSelected ? '#fff' : '#666';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(x, y, this.SLOT_BOX_WIDTH, this.SLOT_BOX_HEIGHT);

        if (isSelected) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('>', x + 10, y + 70);
        }

        this._drawThumbnail(ctx, x + 25, y + 10, slot);
        this._drawMetadata(ctx, x + 210, y + 10, slot);
    }

    /**
     * Desenha thumbnail do cache (já decodificada) ou placeholder.
     * Como o cache guarda o HTMLImageElement só após `img.decode()`
     * resolver, drawImage é totalmente síncrono e o preview aparece
     * imediatamente.
     * @private
     */
    static _drawThumbnail(ctx, x, y, slot) {
        const idx = slot ? slot.index : null;
        const cached = idx != null ? this._thumbnailCache.get(idx) : null;

        if (cached && cached.img) {
            try {
                ctx.drawImage(cached.img, x, y, this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT);
                return;
            } catch (e) {
                console.warn('[SAVEUI] Erro ao desenhar thumbnail:', e);
            }
        }

        // Sem imagem pronta ainda — mas o dataURL existe?
        const hasDataURL = slot && (slot.thumbnailData || slot.thumbnail);
        if (hasDataURL) {
            // Decode ainda em andamento: mostra placeholder genérico
            this._drawPlaceholder(ctx, x, y, '[Sem preview]');
        } else if (slot && slot.exists) {
            this._drawPlaceholder(ctx, x, y, '[Sem preview]');
        } else {
            this._drawPlaceholder(ctx, x, y, '[Slot Vazio]');
        }
    }

    /**
     * Desenha placeholder quando não há thumbnail.
     * @private
     */
    static _drawPlaceholder(ctx, x, y, text) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.THUMBNAIL_WIDTH, this.THUMBNAIL_HEIGHT);

        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + this.THUMBNAIL_WIDTH / 2, y + this.THUMBNAIL_HEIGHT / 2);
    }

    /**
     * Desenha metadados do slot.
     * @private
     */
    static _drawMetadata(ctx, x, y, slot) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`[Slot ${slot.index + 1}]`, x, y + 15);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#ccc';

        if (slot.exists) {
            const date = new Date(slot.timestamp);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            ctx.fillText(dateStr + ' ' + timeStr, x, y + 32);
            ctx.fillText(slot.playerName || 'Joaquim', x, y + 48);
            ctx.fillText(slot.roomName || 'Unknown', x, y + 64);
            ctx.fillText('HP: ' + (slot.hp || 'N/A'), x, y + 80);
        } else {
            ctx.fillStyle = '#666';
            ctx.fillText('(Vazio)', x, y + 32);
        }
    }

    /**
     * Renderiza instruções de controle.
     * @private
     */
    static _drawInstructions(ctx, canvas, mode) {
        const y = canvas.height - 30;
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        let instructions = '';
        if (mode === 'save') {
            instructions = '↑/↓ ou 1-3 = Selecionar | X/ENTER = Salvar | ESC = Cancelar';
        } else if (mode === 'load') {
            instructions = '↑/↓ ou 1-3 = Selecionar | X/ENTER = Carregar | DEL = Apagar | ESC = Voltar';
        }

        ctx.fillText(instructions, canvas.width / 2, y);
    }
}

// Helper local: startX deve ser centralizado horizontalmente com base no SLOT_BOX_WIDTH
function startX(_unused, centerX) {
    return centerX - (SaveLoadUi.SLOT_BOX_WIDTH / 2);
}
