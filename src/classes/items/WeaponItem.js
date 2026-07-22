import Item from './Item.js';

export class WeaponItem extends Item {

    constructor(x, y, width = 32, height = 32, weapon = null, spritePath = null) {
        super(x, y, width, height, 'weapon', null, '#b5651d');
        this.weapon = weapon;
    }

    onCollect(player) {

        if (player && player.inventory && player.inventory.slotsWeapons === player.inventory.weapons.length){
            console.log("Inventório está cheio");
            return false;
        }

        player.inventory.addWeapon(this.weapon);
        this.isCollected = true;
        if(player.equipmentComponent.equippedWeapon === null){
            player.equipmentComponent.equipWeapon(this.weapon)
            console.log(`[EQUIPMENT] ${this.weapon.name} está equipada com sucesso!!!`);
        }else {
            console.log(`[EQUIPMENT] ${this.weapon.name} está no inventario, equipe quando quiser!!!`);
        }

        return true;
    }
}