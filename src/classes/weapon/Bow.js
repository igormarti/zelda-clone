import Arrow
  from './Arrow.js'; // Importamos a classe da flecha que criaremos a seguir
import Weapon from './Weapon.js';

export default class Bow extends Weapon {
    constructor(owner, { context, assetManager }, config = {}) {
        const {
            id = 'bow_00',
            name = 'Arco',
            description = "Arco Inicial",
            damage = 1,
            range = 300, // O alcance máximo ou tempo de vida do projétil
            cooldownFrames = 35, // Arcos geralmente possuem cooldown maior que espadas
            spritePath = null,
            scale = 2,
            arrowSpeed = 2 // Velocidade da flecha
        } = config;

        super(owner, {
            id,
            name,
            description,
            damage,
            range,
            cooldownFrames
        });

        // Resolução dinâmica do carregador (Função vs Objeto) igual à Sword
        if (typeof assetManager === 'function') {
            this.sprite = spritePath ? assetManager(spritePath) : null;
        } else if (assetManager && typeof assetManager.loadImage === 'function') {
            this.sprite = spritePath ? assetManager.loadImage(spritePath) : null;
        } else {
            this.sprite = null;
        }

        this.assetManagerReference = assetManager; // Guardamos para repassar para as flechas
        this.scale = scale;
        this.arrowSpeed = arrowSpeed;
        this.frameSize = 48; // Suposição padrão de tamanho de frame quando houver sprite
        this.totalAttackFrames = 4; 

        this.animationMap = {
            front: 0,
            side: 1,
            back: 2
        };
    }

    /**
     * O ataque do arco gera uma nova instância de Flecha baseada na posição e direção do dono
     */
    attack() {
        const direction = this.owner.stateComponent.direction; // 'front', 'back', 'side'
        const facing = this.owner.stateComponent.facing;       // 'left', 'right'
        
        // Pega a posição central do jogador para disparar a flecha
        const ownerRect = this.owner.movementComponent.getCollisionRect();
        const startX = ownerRect.x + ownerRect.width / 2;
        const startY = ownerRect.y + ownerRect.height / 2;

        // Instancia a flecha
        const arrow = new Arrow(
            { x: startX, y: startY },
            direction,
            facing,
            { 
                damage: this.damage, 
                speed: this.arrowSpeed, 
                range: this.range,
                assetManager: this.assetManagerReference
            }
        );

        // Se o seu World ou Sala gerencia uma lista global de projéteis ativos, 
        // nós injetamos a flecha nela para que seja atualizada no jogo.
        if (this.owner.world && typeof this.owner.world.addProjectile === 'function') {
            this.owner.world.addProjectile(arrow);
        } else if (this.owner.room && typeof this.owner.room.addProjectile === 'function') {
            this.owner.room.addProjectile(arrow);
        } else {
            // Fallback: Se não houver gerenciador global configurado ainda, o arco pode guardar no owner
            if (!this.owner.activeProjectiles) this.owner.activeProjectiles = [];
            this.owner.activeProjectiles.push(arrow);
        }

        // Retorna um rect vazio ou nulo porque o arco não causa dano "corpo a corpo" imediato
        return null; 
    }

    draw(ctx, socketPos, facing, direction) {
        if (this.owner.stateComponent.state !== 'attack') {
            return;
        }

        // ==========================================
        // FLUXO A: RENDERIZAR COM SPRITE (Se existir)
        // ==========================================
        if (this.sprite && this.sprite.complete) {
            const currentFrame = this.owner.animationComponent.currentFrame % this.totalAttackFrames;
            const row = this.animationMap[direction] ?? 0;
            const sx = currentFrame * this.frameSize;
            const sy = row * this.frameSize;
            const width = this.frameSize * this.scale;
            const height = this.frameSize * this.scale;
            const shouldFlip = (direction === 'side' && facing === 'left');

            ctx.save();
            ctx.translate(socketPos.x, socketPos.y);
            if (shouldFlip) ctx.scale(-1, 1);
            ctx.drawImage(this.sprite, sx, sy, this.frameSize, this.frameSize, -width/2, -height/2, width, height);
            ctx.restore();
            return;
        }

        // ==========================================
        // FLUXO B: RENDERIZAR COMO "BOX" (Fallback provisório)
        // ==========================================
        ctx.save();
        ctx.fillStyle = '#b5651d'; // Marrom para o arco de madeira
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff'; // Linha da corda do arco

        // Desenha uma representação de arco simples baseado na direção
        if (direction === 'side') {
            const mod = (facing === 'right') ? 1 : -1;
            // Corpo do arco (D)
            ctx.beginPath();
            ctx.arc(socketPos.x + (10 * mod), socketPos.y, 16, -Math.PI/2, Math.PI/2, facing === 'left');
            ctx.stroke();
            // Caixa simulando a empunhadura
            ctx.fillRect(socketPos.x + (5 * mod) - 2, socketPos.y - 6, 4, 12);
        } else if (direction === 'back') {
            // Olhando para cima: arco horizontal atrás da cabeça
            ctx.beginPath();
            ctx.arc(socketPos.x, socketPos.y - 10, 16, 0, Math.PI, true);
            ctx.stroke();
            ctx.fillRect(socketPos.x - 6, socketPos.y - 12, 12, 4);
        } else {
            // Olhando para frente (baixo): arco horizontal na frente do corpo
            ctx.beginPath();
            ctx.arc(socketPos.x, socketPos.y + 10, 16, 0, Math.PI, false);
            ctx.stroke();
            ctx.fillRect(socketPos.x - 6, socketPos.y + 8, 12, 4);
        }

        ctx.restore();
    }
}