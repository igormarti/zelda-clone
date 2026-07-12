import Item from './Item.js';

export class InventoryItem extends Item {

    constructor(x, y, type,name,  spriteIndex, color) {
        super(x, y, 16, 16, type, spriteIndex, color);
        this.name = name;
    }

    onCollect(player) {
        const added = player.inventory.addItem(this);
        if (added) {
            this.isCollected = true;
            return true;
        }
        return false; // Não coleta se o inventário estiver cheio
    }
}