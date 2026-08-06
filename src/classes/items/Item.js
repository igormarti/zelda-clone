
export default class Item {

    static _nextAutoId = 1;

    constructor(x, y, width, height, type, spriteIndex=0, color='yellow') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // Ex: 'heart', 'key', 'potion', 'weapon'
        this.spriteIndex = spriteIndex;
        this.color = color;
        this.isCollected = false;
        // Gera um id único se não for definido pela subclasse
        this.id = this.id || `${type}_auto_${Item._nextAutoId++}`;
    }

    // Método abstrato que será sobrescrito pelas subclasses
    onCollect(player) {
        throw new Error("O método onCollect() deve ser implementado pela subclasse.");
    }

    draw(ctx, spritesheet=null) {
        if (this.isCollected) return;
        // Exemplo genérico de renderização usando a Canvas API baseada em spritesheet
        if (spritesheet !== null || this.spriteIndex !== null) {
            ctx.drawImage(
                spritesheet,
                this.spriteIndex * this.width, 0, this.width, this.height,
                this.x, this.y, this.width, this.height
            );
        }else{
            // Renderização genérica se não houver spriteIndex definido
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    onUse(player){

    }
}