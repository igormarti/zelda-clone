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
            icon = null,
            scale = 2,
            arrowSpeed = 2 // Velocidade da flecha
        } = config;

        super(owner, {
            id,
            name,
            description,
            damage,
            range,
            cooldownFrames,
            spritePath,
            icon
        });

        // Resolução dinâmica do carregador (Função vs Objeto) igual à Sword
        if (typeof assetManager === 'function') {
            console.log("icon",icon)
            this.sprite = spritePath ? assetManager(spritePath) : null;
            this.icon = icon ? assetManager(icon) : null;
        } else if (assetManager && typeof assetManager.loadImage === 'function') {
                        console.log("icon",icon)

            this.sprite = spritePath ? assetManager.loadImage(spritePath) : null;
            this.icon = icon ? assetManager.loadImage(icon) : null;
        } else {
            this.sprite = null;
            this.icon = null;
        }

        this.assetManagerReference = assetManager; // Guardamos para repassar para as flechas
        this.scale = scale;
        this.arrowSpeed = arrowSpeed;
        this.frameSize = 32; // Suposição padrão de tamanho de frame quando houver sprite
        
        // --- MAPA DE COLUNAS DA LINHA 0 ---
        // Configura quais colunas [início, fim] da Linha 0 pertencem a cada direção
        this.frameRanges = {
            front: [0, 3], // Coluna 0
            side: [4, 6],  // Colunas 1 até 3 (Inverte no 'left')
            back: [7, 10]   // Coluna 4
        };
    }

    /**
     * O ataque do arco gera uma nova instância de Flecha baseada na posição e direção do dono
     */
    attack() {
        const direction = this.owner.stateComponent.direction; // 'front', 'back', 'side'
        const facing = this.owner.stateComponent.facing;       // 'left', 'right'
        
       // Pega a posição central do jogador
        const ownerRect = this.owner.movementComponent.getCollisionRect();
        let startX = ownerRect.x + ownerRect.width / 2;
        let startY = ownerRect.y + ownerRect.height / 2;

        // Offsets para ajustar onde a flecha nasce em cada direção
        if (direction === 'back') {
            startY -= 24; // Sobe a flecha para nascer acima da cabeça do player
        } else if (direction === 'front') {
            startY += 8;  // Opcional: desce ligeiramente quando atira pra baixo
        }
        //else if (direction === 'side') {
        //     const mod = (facing === 'right') ? 12 : -12;
        //     startX += mod; // Desloca para o lado da mão do arco
        // }

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

        if (this.owner.world && typeof this.owner.world.addProjectile === 'function') {
            this.owner.world.addProjectile(arrow);
        } else if (this.owner.room && typeof this.owner.room.addProjectile === 'function') {
            this.owner.room.addProjectile(arrow);
        } else {
            if (!this.owner.activeProjectiles) this.owner.activeProjectiles = [];
            this.owner.activeProjectiles.push(arrow);
        }

        return null; 
    }

    draw(ctx, socketPos, facing, direction) {
        if (this.owner.stateComponent.state !== 'attack') {
            return;
        }

        // ==========================================
        // FLUXO A: RENDERIZAR COM SPRITE (LINHA 0)
        // ==========================================
        if (this.sprite && this.sprite.complete) {
            const [startCol, endCol] = this.frameRanges[direction] || [0, 0];
            const rangeLength = (endCol - startCol) + 1;

            // Calcula o frame atual dentro do intervalo daquela direção na linha 0
            const currentAnimFrame = (this.owner.animationComponent?.currentFrame || 0) % rangeLength;
            const targetColumn = startCol + currentAnimFrame;

            const sx = targetColumn * this.frameSize;
            const sy = 0; // Sempre linha 0!

            const width = this.frameSize * this.scale;
            const height = this.frameSize * this.scale;

            // Inverte o sprite na horizontal apenas quando atacando de lado para a esquerda
            const shouldFlip = (direction === 'side' && facing === 'left');

            ctx.save();
            ctx.translate(socketPos.x, socketPos.y);

            if (shouldFlip) {
                ctx.scale(-1, 1);
            }

            const offsets = {
                front: { x: -3, y: 10 },  // Desce 12px virado pra frente
                side:  { x: -15, y: 22 },   // Desce 8px virado pro lado
                back:  { x: 0 , y: 32 }   // Sobe 4px virado pra trás
            };

        const currentOffset = offsets[direction] || { x: 0, y: 0 };

        ctx.drawImage(
            this.sprite, 
            sx, sy, 
            this.frameSize, this.frameSize, 
            -width / 2 + currentOffset.x, 
            -height / 2 + currentOffset.y, // Aplica o ajuste de Y por direção
            width, height
        );

            ctx.restore();
            return;
        }

        // ==========================================
        // FLUXO B: RENDERIZAR COMO "BOX" (Fallback provisório)
        // ==========================================
        ctx.save();
        ctx.fillStyle = '#b5651d';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';

        if (direction === 'side') {
            const mod = (facing === 'right') ? 1 : -1;
            ctx.beginPath();
            ctx.arc(socketPos.x + (10 * mod), socketPos.y, 16, -Math.PI / 2, Math.PI / 2, facing === 'left');
            ctx.stroke();
            ctx.fillRect(socketPos.x + (5 * mod) - 2, socketPos.y - 6, 4, 12);
        } else if (direction === 'back') {
            ctx.beginPath();
            ctx.arc(socketPos.x, socketPos.y - 10, 16, 0, Math.PI, true);
            ctx.stroke();
            ctx.fillRect(socketPos.x - 6, socketPos.y - 12, 12, 4);
        } else {
            ctx.beginPath();
            ctx.arc(socketPos.x, socketPos.y + 10, 16, 0, Math.PI, false);
            ctx.stroke();
            ctx.fillRect(socketPos.x - 6, socketPos.y + 8, 12, 4);
        }

        ctx.restore();
    }
}