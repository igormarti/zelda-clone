import Item from './Item.js';

export class InventoryItem extends Item {

    constructor(x, y, id,  type,name, healAmount = 1,  spriteIndex, color) {
        super(x, y, 16, 16, type, spriteIndex, color);
        this.id = id;
        this.name = name;
        this.healAmount = healAmount;
    }

    onCollect(player) {
        const added = player.inventory.addItem(this);
        if (added) {
            this.isCollected = true;
            return true;
        }
        return false; // Não coleta se o inventário estiver cheio
    }

    onUse(player){
        if (player.health < player.maxHealth) {
            player.heal(this.healAmount);
            this.isCollected = true;
            return true;
        }
        return false; // Não coleta se a vida já estiver cheia
    }
}