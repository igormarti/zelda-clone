import Environment from '../classes/Environment.js';

// Renderizador Exclusivo do Inimigo (Simples)
export default class EnemyRenderer {
    constructor(entity) {
        this.entity = entity;
    }

    draw(ctx) {
        ctx.fillStyle = this.entity.color;
        ctx.fillRect(this.entity.x, this.entity.y, this.entity.width, this.entity.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`${this.entity.stateComponent.health}`, this.entity.x, this.entity.y - 6);
         this.drawHitbox(ctx);
        if (Environment.isDeveloperMode()) {
            this.drawHitbox(ctx);
            this.drawHitboxAttack(ctx);
        }
    }

    drawHitbox(ctx) {
        const rect = this.entity.getCollisionRect();
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    drawHitboxAttack(ctx) {
        const rect = this.entity.getAttackRect();
        ctx.strokeStyle = 'pink';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
}