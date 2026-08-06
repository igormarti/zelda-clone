import Environment from '../classes/Environment.js';

// Renderizador Exclusivo do Inimigo (com suporte a Sprite Sheet)
export default class EnemyRenderer {
    constructor(entity) {
        this.entity = entity;
    }

    draw(ctx) {
        const e = this.entity;

        // Se tem sprite sheet carregado e pronto, usa o sprite animado
        if (e.spriteSheet && e.spriteSheet.complete && e.spriteSheet.naturalWidth > 0) {
            const srcX = e.spriteCurrentFrame * e.spriteFrameWidth;
            const srcY = 0;

            // Flash branco quando invulnerável (pisca)
            if (e.invulnerableTimer > 0 && Math.floor(e.invulnerableTimer / 2) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }

            ctx.drawImage(
                e.spriteSheet,
                srcX, srcY, e.spriteFrameWidth, e.spriteFrameHeight,
                e.x, e.y, e.width, e.height
            );

            ctx.globalAlpha = 1;
        } else {
            // Fallback: bloco colorido (comportamento original)
            if (e.invulnerableTimer > 0 && Math.floor(e.invulnerableTimer / 2) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.globalAlpha = 1;
        }

        // Barra de vida acima do inimigo
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`${e.stateComponent.health}`, e.x, e.y - 6);

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
