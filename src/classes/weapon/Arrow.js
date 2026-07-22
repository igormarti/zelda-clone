export default class Arrow {
    constructor(startPos, direction, facing, options = {}) {
        this.x = startPos.x;
        this.y = startPos.y;
        this.direction = direction; // 'front', 'back', 'side'
        this.facing = facing;       // 'left', 'right'
        
        this.damage = options.damage || 1;
        this.speed = options.speed || 8;
        this.maxRange = options.range || 300;
        
        this.distanceTraveled = 0;
        this.isDead = false; // Flag para o loop remover a flecha quando colidir ou sumir

        // Inicializa velocidades cartesianas baseadas na direção
        this.vx = 0;
        this.vy = 0;

        if (this.direction === 'side') {
            this.vx = (this.facing === 'right') ? this.speed : -this.speed;
            this.width = 24;
            this.height = 6;
        } else if (this.direction === 'back') {
            this.vy = -this.speed; // Cima
            this.width = 6;
            this.height = 24;
        } else {
            this.vy = this.speed;  // Baixo
            this.width = 6;
            this.height = 24;
        }

        // Preparação de Sprites Futuras para a Flecha
        const assetManager = options.assetManager;
        const spritePath = options.spritePath || null; // Pode passar futuramente
        if (typeof assetManager === 'function') {
            this.sprite = spritePath ? assetManager(spritePath) : null;
        } else if (assetManager && typeof assetManager.loadImage === 'function') {
            this.sprite = spritePath ? assetManager.loadImage(spritePath) : null;
        } else {
            this.sprite = null;
        }
    }

    /**
     * Retorna o retângulo atual de colisão da flecha para checar contra inimigos/paredes
     */
    getCollisionRect() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Atualiza o movimento a cada frame do game loop
     */
    update(worldObstacles = []) {
        if (this.isDead) return;

        // Move a flecha
        this.x += this.vx;
        this.y += this.vy;

        // Acumula distância percorrida para sumir se atingir o limite de alcance
        this.distanceTraveled += this.speed;
        if (this.distanceTraveled >= this.maxRange) {
            this.isDead = true;
        }

        // Exemplo opcional de checagem contra paredes/obstáculos sólidos da sala:
        const myRect = this.getCollisionRect();
        for (const obstacle of worldObstacles) {
            if (this.checkCollision(myRect, obstacle)) {
                this.isDead = true; // Quebra a flecha na parede
                break;
            }
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(ctx) {
        if (this.isDead) return;

        // ==========================================
        // FLUXO A: SE JÁ EXISTIR SPRITE DA FLECHA
        // ==========================================
        if (this.sprite && this.sprite.complete) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Rotaciona o desenho baseado para onde ela voa
            if (this.direction === 'back') ctx.rotate(-Math.PI / 2);
            else if (this.direction === 'front') ctx.rotate(Math.PI / 2);
            else if (this.direction === 'side' && this.facing === 'left') ctx.rotate(Math.PI);
            
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
            return;
        }

        // ==========================================
        // FLUXO B: DESENHO EM BOX (Fallback provisório)
        // ==========================================
        ctx.save();
        const rect = this.getCollisionRect();

        // Corpo da flecha (madeira clara)
        ctx.fillStyle = '#fff34a'; 
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        // Ponta da flecha (caixa cinza metálica na extremidade dianteira)
        ctx.fillStyle = '#a9a9a9';
        if (this.direction === 'side') {
            const tipX = (this.facing === 'right') ? (rect.x + rect.width - 6) : rect.x;
            ctx.fillRect(tipX, rect.y, 6, rect.height);
        } else if (this.direction === 'back') {
            ctx.fillRect(rect.x, rect.y, rect.width, 6); // Ponta em cima
        } else {
            ctx.fillRect(rect.x, rect.y + rect.height - 6, rect.width, 6); // Ponta embaixo
        }

        ctx.restore();

    }

    drawHitbox(ctx) {
        const rect = this.getCollisionRect();
        ctx.strokeStyle = 'pink';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
}