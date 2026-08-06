export default class Chest {
    constructor(x, y, width = 32, height = 32, typeChest='green' , reward = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.typeChest = typeChest;
        this.type = `chest_closed_${typeChest}`; // Tipo para desenhar o sprite
        this.isOpen = false;
        this.reward = reward; // Objeto recompensa: { type: 'gold', amount: 50 } ou uma instância de Item

        // Raio de interação (quantos pixels de distância o jogador precisa estar)
        this.interactionRange = 40;
    }

    /**
     * Retorna o retângulo de colisão física sólida
     */
    get collisionBox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Verifica se o jogador está perto o suficiente para interagir
     */
    isPlayerNearby(player) {
        const playerCenterX = player.x + (player.width || 32) / 2;
        const playerCenterY = player.y + (player.height || 32) / 2;
        const chestCenterX = this.x + this.width / 2;
        const chestCenterY = this.y + this.height / 2;

        const distance = Math.hypot(playerCenterX - chestCenterX, playerCenterY - chestCenterY);
        return distance <= this.interactionRange;
    }

    /**
     * Tenta abrir o baú e entrega a recompensa
     */
    open(player) {
        if (this.isOpen) {
            console.log("[CHEST] Este baú já foi aberto!");
            return {open: false, text:"Este baú já foi aberto!"};
        }

        this.isOpen = true;
        this.type = `chest_open_${this.typeChest}`; // Muda o sprite para aberto
        console.log("[CHEST] Baú aberto!");

        if (!this.reward) return {open: true, text:"Este baú está vázio!"};

        // Trata os diferentes tipos de recompensa:
        if (this.reward.type === 'gold' || this.reward.type === 'money') {
            player.gold = (player.gold || 0) + this.reward.amount;
            console.log(`[CHEST] Recebeu $${this.reward.amount} de moedas!`);
            return {open: true, text: `Recebeu $${this.reward.amount} de moedas!`};
        } 
        else if (typeof this.reward.onCollect === 'function') {
            // Se a recompensa for uma classe de Item (InventoryItem, WeaponItem, etc.)
            if(this.reward.onCollect(player)){
                 return {open: true, text: `Você encontrou $${this.reward.name}!`};
            }else{
                this.isOpen = false;
                this.type = `chest_closed_${this.typeChest}`; 
                return {open: false, text: `O inventório está cheio!`};
            }
        } 
        else if (player.inventory) {
            // Se for um item comum de inventário
           if(player.inventory.addItem(this.reward)){
                return {open: true, text: `Você pegou $${this.reward.name}!`};
           }else{
                this.isOpen = false;
                this.type = `chest_closed_${this.typeChest}`; 
                return {open: false, text: `O inventório está cheio!`};
           }
        }

        return true;
    }
}