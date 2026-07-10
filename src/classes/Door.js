export default class Door {
    constructor(x, y, width, height, targetRoomKey, spawnPoint) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.targetRoomKey = targetRoomKey;
        this.spawnPoint = spawnPoint;
    }

    intersects(player) {
        // 1. Pega a hitbox real do jogador (a que ajustamos antes)
        const rect = player.getCollisionRect();
        return rect.x < this.x + this.width &&
            rect.x + rect.width > this.x &&
            rect.y < this.y + this.height &&
            rect.y + rect.height > this.y;
    }
}
