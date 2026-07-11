export default class Character {

    faceTarget(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;

        // 1. Determina o eixo dominante
        if (Math.abs(dx) > Math.abs(dy)) {
            // Estamos no eixo horizontal
            this.direction = 'side'; 
            this.facing = dx > 0 ? 'right' : 'left';
        } else {
            // Estamos no eixo vertical
            this.direction = dy > 0 ? 'front' : 'back';
        }
    }
}   