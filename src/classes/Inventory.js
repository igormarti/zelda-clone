export class Inventory {
    
    constructor(slotsItems = 16, slotsWeapons = 2) {
        this.slotsItems = slotsItems;
        this.slotsWeapons = slotsWeapons;
        this.items = []; // Array de itens armazenados
        this.weapons = []; // Array de armas armazenadas
    }

    addItem(item) {
        if (this.items.length >= this.slotsItems) {
            console.log("Inventário cheio!");
            return false;
        }
        
        // Armazena uma referência simplificada ou as propriedades do item
        this.items.push(item);
        
        console.log(`Item adicionado ao inventário: ${item.name}`);
        return true;
    }

    addWeapon(weapon) {
        if (this.weapons.length >= this.slotsWeapons) {
            console.log("Slots de armas cheios!");
            return false;
        }  

        this.weapons.push(weapon);
        console.log(`Arma adicionada ao inventário: ${weapon.name}`);
        return true;
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        return this.items;
    }

    removeWeapon(id) {
        this.weapons = this.weapons.filter(weapon => weapon.id !== id);
        return this.weapons;
    }

    hasItem(id) {
        return this.items.some(item => item.id === id);
    }

    hasWeapon(id) {
        return this.weapons.some(weapon => weapon.id === id);
    }

    hasWeaponEquipped() {
        return this.weapons.length > 0;
    }

    hasSwordEquipped() {
        if (this.weapons.length === 0) {
            return false;
        }
        return this.weapons.some(weapon => weapon.name.toLowerCase().includes('sword'));
    }
}