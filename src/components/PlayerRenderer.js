import Environment from '../classes/Environment.js';

export default class PlayerRenderer {
    constructor(entity) {
        this.entity = entity;
    }

    draw(ctx, spriteSheetImage, FRAME_SIZE) {
        const state = this.entity.stateComponent.state;
        const direction = this.entity.stateComponent.direction;
        const facing = this.entity.stateComponent.facing;
        const currentFrame = this.entity.animationComponent.currentFrame;

        const config = this.entity.animationComponent.getAnimationConfig(state, direction);
        const sx = currentFrame * FRAME_SIZE;
        const sy = config.row * FRAME_SIZE;
        const shouldFlip = (direction === 'side' && facing === 'left');

        // Ordem de Profundidade: Desenha a arma ATRÁS do jogador se ele estiver olhando de costas
        if (direction === 'back') {
            this.entity.equipmentComponent.drawWeapon(ctx);
        }

        ctx.save();
        if (shouldFlip) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                spriteSheetImage, 
                sx, sy, FRAME_SIZE, FRAME_SIZE, 
                -(this.entity.x + this.entity.width), this.entity.y, 
                this.entity.width, this.entity.height
            );
        } else {
            ctx.drawImage(
                spriteSheetImage, 
                sx, sy, FRAME_SIZE, FRAME_SIZE, 
                this.entity.x, this.entity.y, 
                this.entity.width, this.entity.height
            );
        }
        ctx.restore();

        // Ordem de Profundidade: Desenha a arma na FRENTE do jogador se ele estiver olhando para frente ou lado
        if (direction !== 'back') {
            this.entity.equipmentComponent.drawWeapon(ctx);
        }

        if (Environment.isDeveloperMode()) {
            this.drawHitbox(ctx);
            this.drawHitboxAttack(ctx);
        }
    }

    drawHitbox(ctx) {
        const rect = this.entity.movementComponent.getVisualCollisionRect();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    drawHitboxAttack(ctx) {
        const rect = this.entity.equipmentComponent.getAttackRect();
        console.log(`[DEBUG] Attack Rect: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
}