/**
 * Utilitário para capturar e redimensionar thumbnails do canvas
 * Gera PNG 160x120px em base64 para armazenamento em localStorage
 */
export default class ThumbnailCapture {
    static TARGET_WIDTH = 160;
    static TARGET_HEIGHT = 120;

    /**
     * Captura o canvas atual e retorna base64 PNG redimensionado
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas principal
     * @param {HTMLCanvasElement} canvas - Canvas principal do jogo
     * @returns {string} Data URL em base64 (data:image/png;base64,...)
     */
    static capture(ctx, canvas) {
        try {
            // Cria canvas temporário redimensionado
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.TARGET_WIDTH;
            tempCanvas.height = this.TARGET_HEIGHT;
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) {
                console.warn('[THUMBNAIL] Falha ao criar contexto temporário');
                return null;
            }

            // Desenha canvas original redimensionado (scaling)
            tempCtx.drawImage(
                canvas,
                0, 0, canvas.width, canvas.height,
                0, 0, this.TARGET_WIDTH, this.TARGET_HEIGHT
            );

            // Retorna como base64 PNG
            return tempCanvas.toDataURL('image/png');
        } catch (error) {
            console.warn('[THUMBNAIL] Erro ao capturar thumbnail:', error);
            return null;
        }
    }
}
