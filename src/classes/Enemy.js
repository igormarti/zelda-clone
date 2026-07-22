import EnemyRenderer from '../components/EnemyRenderer.js';
import EquipmentComponent from '../components/EquipmentComponent.js';
import StateComponent from '../components/StateComponent.js';
import { Entity } from './Entity.js';

export default class Enemy extends Entity {
    constructor({ 
        x = 0, 
        y = 0, 
        maxHealth = 3, 
        attackDamage = 1, 
        speed = 0.8, 
        collisionBox = { x: 12, y: 20, width: 24, height: 24 }, 
        color = '#ff4d4d',
        gameContext,
        
        // --- NOVOS PARÂMETROS DE COMPORTAMENTO ---
        aiType = 'stationary',      // Options: 'stationary', 'patrol_linear', 'patrol_random'
        patrolAxis = 'horizontal',  // Options: 'horizontal', 'vertical' (usado apenas no 'patrol_linear')
        detectionRange = 90
    } = {}) {
        super(x, y);

        this.id = "Enemy_00";
        this.name = "Enemy 00";
        this.width = 48;
        this.height = 48;
        this.color = color;
        
        this.speed = speed;
        this.collisionBox = collisionBox;
        this.contactRange = 36;
        this.detectionRange = detectionRange;

        this.paused = false;

        // Configurações de IA
        this.aiType = aiType; 
        this.patrolAxis = patrolAxis;
        
        // Estado Interno para Patrulha
        this.patrolDirection = 1; // 1 = Direita/Baixo, -1 = Esquerda/Cima
        this.randomMoveTimer = 0;
        this.randomDir = { x: 0, y: 0 };

        // Composição de Componentes
        this.stateComponent = new StateComponent(this);
        this.stateComponent.maxHealth = maxHealth;
        this.stateComponent.health = maxHealth;

        this.equipmentComponent = new EquipmentComponent(this, {
            ctx: gameContext.ctx, 
            assetManager: gameContext.assetManager
        });
        this.equipmentComponent.attackDamage = attackDamage;
        this.equipmentComponent.attackCooldownFrames = 40;
        this.equipmentComponent.contactRange = 36;

        this.renderer = new EnemyRenderer(this);
    }

    // --- Getters de Compatibilidade ---
    get state() { return this.stateComponent.state; }
    set state(val) { this.stateComponent.setState(val); }

    get direction() { return this.stateComponent.direction; }
    set direction(val) { this.stateComponent.setDirection(val); }

    get health() { return this.stateComponent.health; }
    get invulnerableTimer() { return this.stateComponent.invulnerableTimer; }

    isDead() {
        return this.stateComponent.isDead();
    }

    getCollisionRect(x = this.x, y = this.y) {
        return {
            x: x,
            y: y,
            width: this.width,
            height: this.height
        };
    }

    getAttackRect() {
        return { 
            x: this.x - 2, 
            y: this.y - 2, 
            width: this.width + 5, 
            height: this.height + 5 
        };
    }

    takeDamage(amount) {
        const took = this.stateComponent.takeDamage(amount);
        if (took) {
            this.stateComponent.invulnerableTimer = 8;
        }
        return took;
    }

    /**
     * Valida se a próxima posição (x, y) é permitida:
     * 1. Não colide com obstáculos da sala
     * 2. Respeita as bordas da tela (0, SCREEN_WIDTH, SCREEN_HEIGHT)
     */
    _canMoveTo(targetX, targetY, world) {
        if (!world) return true;

        const rect = this.getCollisionRect(targetX, targetY);

        const isObstacleBlocked = world.isPositionBlocked?.(
            rect.x, rect.y, rect.width, rect.height
        );

        const isWithinScreenWidth = rect.x >= 0 && (rect.x + rect.width) <= world.SCREEN_WIDTH;
        const isWithinScreenHeight = rect.y >= 0 && (rect.y + rect.height) <= world.SCREEN_HEIGHT;

        return !isObstacleBlocked && isWithinScreenWidth && isWithinScreenHeight;
    }

    update(player, world = null) {
        if (this.isDead() || this.paused) return;

        this.stateComponent.update();
        this.equipmentComponent.update();

        if (!player || !world) return;

        const distance = Math.hypot(player.x - this.x, player.y - this.y);

        // SE O JOGADOR ESTIVER DENTRO DO RAIO DE DETECÇÃO -> PERSEGUE E ATACA!
        if (distance < this.detectionRange) {
            this._chasePlayer(player, world);
        } else {
            // FORA DO RAIO DE VISÃO -> EXECUTA O COMPORTAMENTO DE IA PADRÃO
            this._executePatrolBehavior(world);
        }
    }

    /**
     * Comportamento Padrão de Perseguição ao Jogador
     */
    _chasePlayer(player, world) {
        this.stateComponent.setState('move');

        const moveX = player.x > this.x ? this.speed : -this.speed;
        const moveY = player.y > this.y ? this.speed : -this.speed;

        const nextX = this.x + moveX;
        const nextY = this.y + moveY;

        const canMoveX = this._canMoveTo(nextX, this.y, world);
        const canMoveY = this._canMoveTo(this.x, nextY, world);

        if (canMoveX) this.x = nextX;
        if (canMoveY) this.y = nextY;

        this.stateComponent.setDirection(
            Math.abs(player.x - this.x) > Math.abs(player.y - this.y) ? 'side' : 'front'
        );
    }

    /**
     * Executa o comportamento passivo de patrulha quando o Player não está perto
     */
    _executePatrolBehavior(world) {
        switch (this.aiType) {

            // 1. COMPORTAMENTO ESTÁTICO (Espera o player se aproximar)
            case 'stationary':
                this.stateComponent.setState('idle');
                break;

            // 2. COMPORTAMENTO LINEAR (Patrulha Horizontal ou Vertical)
            case 'patrol_linear': {
                this.stateComponent.setState('move');
                const isHoriz = this.patrolAxis === 'horizontal';

                const step = this.speed * 0.6 * this.patrolDirection;
                const nextX = isHoriz ? this.x + step : this.x;
                const nextY = isHoriz ? this.y : this.y + step;

                const canMove = this._canMoveTo(nextX, nextY, world);

                if (canMove) {
                    this.x = nextX;
                    this.y = nextY;
                } else {
                    // Bateu em uma parede/obstáculo OU na borda da tela -> Inverte a direção!
                    this.patrolDirection *= -1;
                }

                this.stateComponent.setDirection(isHoriz ? 'side' : 'front');
                break;
            }

            // 3. COMPORTAMENTO RANDÔMICO (Vaga aleatoriamente pela sala)
            case 'patrol_random': {
                this.randomMoveTimer--;

                if (this.randomMoveTimer <= 0) {
                    this.randomMoveTimer = Math.floor(Math.random() * 90) + 90;
                    
                    const dirs = [-1, 0, 1];
                    this.randomDir.x = dirs[Math.floor(Math.random() * dirs.length)];
                    this.randomDir.y = dirs[Math.floor(Math.random() * dirs.length)];
                }

                if (this.randomDir.x === 0 && this.randomDir.y === 0) {
                    this.stateComponent.setState('idle');
                    return;
                }

                this.stateComponent.setState('move');
                const nextX = this.x + (this.randomDir.x * this.speed * 0.5);
                const nextY = this.y + (this.randomDir.y * this.speed * 0.5);

                const canMoveX = this._canMoveTo(nextX, this.y, world);
                const canMoveY = this._canMoveTo(this.x, nextY, world);

                if (canMoveX) this.x = nextX; else this.randomDir.x *= -1; // Inverte direção ao rebater
                if (canMoveY) this.y = nextY; else this.randomDir.y *= -1;

                this.stateComponent.setDirection(
                    Math.abs(this.randomDir.x) > Math.abs(this.randomDir.y) ? 'side' : 'front'
                );
                break;
            }
        }
    }

    pause() { this.paused = true; }
    resume() { this.paused = false; }

    draw(ctx) {
        if (this.isDead()) return;
        this.renderer.draw(ctx);
    }
}