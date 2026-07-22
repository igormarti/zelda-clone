import InventoryUi from '../ui/InventoryUI.js';
import PlayingState from './PlayingState.js';
import State from './State.js';

export default class InventoryState extends State {
    
    inventory = null;
    active = false;
    inventoryUi = null;

    columns = 4;
    selectedIndex = 0;

    contextMenuOpen = false;
    contextMenuIndex = 0;

    enter() {
        const { player, world } = this.context;
        this.inventory = player.inventory;
        console.log("Instancia de inventoryState", this);
        this.inventoryUi = new InventoryUi(this, world.SCREEN_WIDTH, world.SCREEN_HEIGHT);
        this.toggle();
    }
    
    update() {
        this.handleInput(this.context.input.keys, this.context.player);
        
        if (this.context.input.keys['i'] || this.context.input.keys['I'] || this.context.input.keys['Escape']) {
            this.context.input.keys['i'] = this.context.input.keys['I'] = this.context.input.keys['Escape'] = false;
            
            if (this.contextMenuOpen) {
                this.contextMenuOpen = false;
            } else {
                this.stateManager.changeState(PlayingState);
            }
        }
    }
    
    draw(ctx) {
        this.inventoryUi.draw(ctx);
    }
    
    exit() {
        this.toggle();
        this.inventoryUi = null;
        this.contextMenuOpen = false;
    }

    get maxSlots() {
        return this.inventory.slotsItems + this.inventory.slotsWeapons;
    }

    toggle() {
        this.active = !this.active;
        return this.active;
    }

    getSlotContent(index) {
        if (index < this.inventory.slotsWeapons) {
            return this.inventory.weapons[index] || null;
        }
        const itemIndex = index - this.inventory.slotsWeapons;
        return this.inventory.items[itemIndex] || null;
    }

    getSelectedItem() {
        return this.getSlotContent(this.selectedIndex);
    }

    /**
     * Auxiliar para checar se a arma fornecida está equipada
     */
    isWeaponEquipped(item) {
        if (!item) return false;
        const player = this.context.player;
        if (player && player.equipmentComponent && player.equipmentComponent.equippedWeapon) {
            return player.equipmentComponent.equippedWeapon.id === item.id || player.equipmentComponent.equippedWeapon === item;
        }
        return false;
    }

    getContextMenuOptions() {
        const isWeapon = this.selectedIndex < this.inventory.slotsWeapons;
        return isWeapon ? ['Equipar', 'Cancelar'] : ['Usar', 'Descartar', 'Cancelar'];
    }

    handleInput(inputKeys, player) {
        if (!this.active) return;

        // 1. Navegação no Menu Contextual (Popup)
        if (this.contextMenuOpen) {
            const options = this.getContextMenuOptions();

            if (inputKeys['ArrowUp'] || inputKeys['w']) {
                inputKeys['ArrowUp'] = inputKeys['w'] = false;
                this.contextMenuIndex = (this.contextMenuIndex - 1 + options.length) % options.length;
            }
            if (inputKeys['ArrowDown'] || inputKeys['s']) {
                inputKeys['ArrowDown'] = inputKeys['s'] = false;
                this.contextMenuIndex = (this.contextMenuIndex + 1) % options.length;
            }

            if (inputKeys['Enter'] || inputKeys['e']) {
                inputKeys['Enter'] = inputKeys['e'] = false;
                this.executeContextMenuAction(player, options[this.contextMenuIndex]);
            }
            return;
        }

        // 2. Navegação Normal na Grade
        const row = Math.floor(this.selectedIndex / this.columns);
        const col = this.selectedIndex % this.columns;

        if (inputKeys['ArrowUp'] || inputKeys['w']) {
            inputKeys['ArrowUp'] = inputKeys['w'] = false;
            if (row > 0) this.selectedIndex -= this.columns;
        }

        if (inputKeys['ArrowDown'] || inputKeys['s']) {
            inputKeys['ArrowDown'] = inputKeys['s'] = false;
            if (this.selectedIndex + this.columns < this.maxSlots) {
                this.selectedIndex += this.columns;
            }
        }

        if (inputKeys['ArrowLeft'] || inputKeys['a']) {
            inputKeys['ArrowLeft'] = inputKeys['a'] = false;
            if (col > 0) this.selectedIndex -= 1;
        }

        if (inputKeys['ArrowRight'] || inputKeys['d']) {
            inputKeys['ArrowRight'] = inputKeys['d'] = false;
            if (col < this.columns - 1 && this.selectedIndex + 1 < this.maxSlots) {
                this.selectedIndex += 1;
            }
        }

        // Pressionar Enter / E nos Slots
        if (inputKeys['Enter'] || inputKeys['e']) {
            inputKeys['Enter'] = inputKeys['e'] = false;
            const item = this.getSelectedItem();
            
            // SE A ARMA JÁ ESTIVER EQUIPADA, NÃO FAZ NADA
            if (this.isWeaponEquipped(item)) {
                console.log("[INVENTORY] Arma já equipada. Ação ignorada.");
                return;
            }

            if (item) {
                this.contextMenuOpen = true;
                this.contextMenuIndex = 0;
            }
        }
    }

    executeContextMenuAction(player, action) {
        const item = this.getSelectedItem();
        if (!item) {
            this.contextMenuOpen = false;
            return;
        }

        switch (action) {
            case 'Equipar':
                if (player && player.equipmentComponent) {
                    player.equipmentComponent.equipWeapon(item);
                    console.log(`[INVENTORY] Arma equipada: ${item.name}`);
                }
                break;

            case 'Usar':
                console.log("[INVENTORY] Usando item:", item);
                let wasUsed = true;
                
                // Se possuir função no item, executa
                if (typeof item.onUse === 'function') {
                    wasUsed = item.onUse(player);
                }

                // Se o item foi consumido/usado, remove do inventário
                if (wasUsed !== false) {
                    this._removeItemFromInventory(item, wasUsed);
                }
                break;

            case 'Descartar':
                console.log(`[INVENTORY] Item descartado: ${item.name}`);
                this._removeItemFromInventory(item);
                break;

            case 'Cancelar':
            default:
                break;
        }

        this.contextMenuOpen = false;
    }

    /**
     * Remove o item do array correspondente no inventário
     */
    _removeItemFromInventory(item, wasUsed = false) {
        
        const {world, player} = this.context

        if (!player.inventory) return;

        // Se estiver na lista de itens comuns
        if (Array.isArray(player.inventory.items)) {
            const index = player.inventory.items.findIndex(i => i && i.id === item.id);
            if (index !== -1) {
                this.inventory.items.splice(index, 1);
                if(!wasUsed) this.throwItemInRoom(item, player, world);
                return;
            }
        }
        // Se possuir método genérico de remoção
        if (typeof player.inventory.removeItem === 'function') {
            player.inventory.removeItem(item.id);
            if(!wasUsed) this.throwItemInRoom(item, player, world);
        }


    }

    throwItemInRoom(item, player, world) {
        if (!world || !item || !player) return;

        const roomKey = `${world.currentRoom.x},${world.currentRoom.y}`;
        const currentRoom = world.worldMap[roomKey];

        if (currentRoom) {
            if (!currentRoom.items) {
                currentRoom.items = [];
            }

            // Coloca o item à frente do player (ex: 40px para baixo/frente) 
            // para que não haja colisão instantânea no mesmo frame
            item.x = player.x + 40;
            item.y = player.y + 40; 

            // Garante dimensão mínima caso o objeto vindo do inventário não tenha width/height
            item.width = item.width || 16;
            item.height = item.height || 16;
            item.isCollected = false;

            currentRoom.items.push(item);
        }
    }
}