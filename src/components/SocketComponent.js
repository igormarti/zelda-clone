export default class SocketComponent {
    constructor(entity) {
        this.entity = entity;
    }

    // Calcula a posição dinâmica da mão do personagem com base no estado e na direção
    getHandSocketPosition() {
        const state = this.entity.stateComponent.state;
        const direction = this.entity.stateComponent.direction;
        const facing = this.entity.stateComponent.facing;
        const frame = this.entity.animationComponent.currentFrame;

        let socketX = this.entity.x + this.entity.width / 2;
        let socketY = this.entity.y + this.entity.height / 2;

        // Desvios baseados na direção que o personagem está olhando
        if (direction === 'side') {
            const offset = facing === 'right' ? 16 : -16;
            socketX += offset;
        } else if (direction === 'back') {
            socketY -= 10;
        } else if (direction === 'front') {
            socketY += 10;
        }

        // Exemplo de oscilação baseada no frame atual da animação
        if (state === 'move') {
            socketY += (frame % 2 === 0) ? 2 : -2;
        }

        return { x: socketX, y: socketY };
    }
}