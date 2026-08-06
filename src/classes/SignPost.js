
export default class SignPost{

    constructor(x, y, width = 32, height = 32, message = 'Texto padrão...', type = 'signpost') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; 
        this.message = message;

        // Raio de interação (quantos pixels de distância o jogador precisa estar)
        this.interactionRange = 40;
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
        const chestCenterX = this.x + this.width / 2;
        const chestCenterY = this.y + this.height / 2;

        const distance = Math.hypot(playerCenterX - chestCenterX, playerCenterY - chestCenterY);
        return distance <= this.interactionRange;
    }
}