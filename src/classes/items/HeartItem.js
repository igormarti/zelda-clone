import Item from './Item.js';

export class HeartItem extends Item {
    constructor(x, y, width = 16, height = 16, healAmount = 1) {
        super(x, y, width, height, 'heart', null, 'red');
        this.healAmount = healAmount;
    }

    onCollect(player) {
        if (player.health < player.maxHealth) {
            player.heal(this.healAmount);
            this.isCollected = true;
            return true;
        }
        return false; // Não coleta se a vida já estiver cheia
    }
}