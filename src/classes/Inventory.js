export class Inventory {
    
    constructor(slots = 16) {
        this.slots = slots;
        this.items = []; // Array de itens armazenados
    }

    addItem(item) {
        if (this.items.length >= this.slots) {
            console.log("Inventário cheio!");
            return false;
        }
        
        // Armazena uma referência simplificada ou as propriedades do item
        this.items.push({
            type: item.type,
            name: item.name,
            spriteIndex: item.spriteIndex
        });
        
        console.log(`Item adicionado ao inventário: ${item.name}`);
        return true;
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }

    hasItem(type) {
        return this.items.some(item => item.type === type);
    }
}