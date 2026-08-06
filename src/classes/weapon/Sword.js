import Weapon from './Weapon.js';

export default class Sword extends Weapon {
    constructor(owner, { context, assetManager }, config = {}) {
        const {
            id = 'sword_01',
            name = 'Espada',
            description = 'Espada Inicial',
            damage = 2,
            range = 70,
            cooldownFrames = 20,
            spritePath = null,
            icon = null,
            scale = 2,
            offsetPrecision = 10
        } = config;

        super(owner, {
            id,
            name,
            damage,
            range,
            cooldownFrames,
            spritePath,
            icon
        });

        // ===================================================
        // RESOLUÇÃO DINÂMICA DO CARREGADOR (Função vs Objeto)
        // ===================================================
        if (typeof assetManager === 'function') {
            // Como no main.js você passou .bind(assetManager),
            // o 'assetManager' aqui é DIRETAMENTE a função loadImage!
            this.sprite = assetManager(spritePath);
        } else if (assetManager && typeof assetManager.loadImage === 'function') {
            // Fallback caso receba o objeto gerenciador completo
            this.sprite = assetManager.loadImage(spritePath);
        } else {
            console.error("[SWORD] Erro: Nenhum carregador de assets válido foi fornecido!");
            this.sprite = null;
        }

        this.frameSize = 48; 
        this.totalAttackFrames = 4; 
        this.scale = scale; 
        this.offsetPrecision = offsetPrecision;

        this.animationMap = {
            front: 0, 
            side: 1,  
            back: 2   
        };
    }

    getAttackRect() {
        const rect = this.owner.movementComponent.getCollisionRect();
        const offset = this.offsetPrecision;
        let offsetX = 0;
        let offsetY = 0;

        const direction = this.owner.stateComponent.direction;
        const facing = this.owner.stateComponent.facing;

        // Se a escala crescer, precisamos empurrar levemente os offsets para compensar o tamanho
        const size = this.frameSize * this.scale;

        if (direction === 'side') {
            offsetX = (facing === 'right' ? offset : -offset - 12);
        } else if (direction === 'back') {
            offsetY = -offset-16;
            offsetX = -12;
        } else {
            offsetY = offset-12;
            offsetX = -5;
        }

        return {
            x: rect.x + offsetX,
            y: rect.y + offsetY,
            width: (size+(offset%2))/2,
            height: (size+(offset%2))/2
        };
    }

    attack() {
        return this.getAttackRect();
    }

    draw(ctx, socketPos, facing, direction) {
        // Só desenha a espada atacando se o jogador estiver no estado de ataque
        if (this.owner.stateComponent.state !== 'attack') {
            return;
        }

        // Garante que o sprite está carregado
        if (!this.sprite || !this.sprite.complete) {
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect(socketPos.x - 4, socketPos.y - 20, 8, 20);
            return;
        }

        const currentFrame = this.owner.animationComponent.currentFrame % this.totalAttackFrames;
        const row = this.animationMap[direction] ?? 0;

        const sx = currentFrame * this.frameSize;
        const sy = row * this.frameSize;

        // Multiplicamos as dimensões de saída pela escala
        const width = this.frameSize * this.scale;
        const height = this.frameSize * this.scale;
        
        const shouldFlip = (direction === 'side' && facing === 'left');

        // ==========================================
        // TABELA DE OFFSETS DE AJUSTE FINO (Ajustados para escala 1.5)
        // ==========================================
        const renderOffsets = {
            front: { x: 0, y: -7 },
            back:  { x: 0, y: 6 },
            side:  { x: -14, y: 0 } 
        };

        const offset = renderOffsets[direction] || { x: 0, y: 0 };

        ctx.save();

        const targetX = socketPos.x + (shouldFlip ? -offset.x : offset.x);
        const targetY = socketPos.y + offset.y;

        if (shouldFlip) {
            ctx.translate(targetX, targetY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.sprite, 
                sx, sy, this.frameSize, this.frameSize, 
                -width / 2, -height / 2, width, height
            );
        } else {
            ctx.translate(targetX, targetY);
            ctx.drawImage(
                this.sprite, 
                sx, sy, this.frameSize, this.frameSize, 
                -width / 2, -height / 2, width, height
            );
        }

        ctx.restore();
    }
}