export default class Door {
    constructor(x, y, width, height, targetRoomKey, spawnPoint, options = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.targetRoomKey = targetRoomKey;
        this.spawnPoint = spawnPoint;
        this.requiresProgression = options.requiresProgression || null;
    }

    intersects(player, world = null) {
        const rect = player.getCollisionRect();

        // Se o jogador estiver fora da área visível (parte negativa), não dispare a porta.
        if (world && (rect.y < 0 || rect.x < 0 || rect.x + rect.width > world.SCREEN_WIDTH)) {
            return false;
        }

        return rect.x < this.x + this.width &&
            rect.x + rect.width > this.x &&
            rect.y < this.y + this.height &&
            rect.y + rect.height > this.y;
    }
}
