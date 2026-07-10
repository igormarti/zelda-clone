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
        return player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y;
    }
}
