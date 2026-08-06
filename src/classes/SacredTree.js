/**
 * Árvore Sagrada - Objeto interativo para Save/Load
 * Segue o padrão de Chest e SignPost
 */
export default class SacredTree {
    constructor(x, y, width = 48, height = 64, dialogLines = [], type = 'sacred_tree') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.dialogLines = Array.isArray(dialogLines) ? dialogLines : [dialogLines];
        this.interactionRange = 50; // Um pouco maior que chest/signpost
    }

    /**
     * Retorna o retângulo de colisão física sólida
     */
    get collisionBox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Verifica se o jogador está perto o suficiente para interagir
     */
    isPlayerNearby(player) {
        const playerCenterX = player.x + (player.width || 32) / 2;
        const playerCenterY = player.y + (player.height || 32) / 2;
        const treeCenterX = this.x + this.width / 2;
        const treeCenterY = this.y + this.height / 2;

        const distance = Math.hypot(
            playerCenterX - treeCenterX,
            playerCenterY - treeCenterY
        );
        return distance <= this.interactionRange;
    }

    /**
     * Retorna as linhas de diálogo inicial
     */
    getDialogLines() {
        return this.dialogLines;
    }

    /**
     * Tipo de interação (para identificar na sala)
     */
    getInteractionType() {
        return 'sacred_tree';
    }
}
