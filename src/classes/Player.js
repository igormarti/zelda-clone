import AnimationComponent from '../components/AnimationComponent.js';
import EquipmentComponent from '../components/EquipmentComponent.js';
// Importação dos novos componentes
import MovementComponent from '../components/MovementComponent.js';
import PlayerRenderer from '../components/PlayerRenderer.js';
import SocketComponent from '../components/SocketComponent.js';
import StateComponent from '../components/StateComponent.js';
import { Entity } from './Entity.js';
import Environment from './Environment.js';

export default class Player extends Entity {
    constructor(x = 400, y = 300, ctxGame = null) {
        super(x, y); // Inicializa a posição do player
        this.ctxGame = ctxGame;
        
        this.id = 'player';
        this.name = 'Joaquim';
        this.gold = 0;
    
        this.width = 48 * 2;  // FRAME_SIZE * SCALE_FACTOR
        this.height = 48 * 2;

        // Inicialização dos Componentes dedicados
        this.stateComponent = new StateComponent(this);
        this.movementComponent = new MovementComponent(this);
        this.animationComponent = new AnimationComponent(this);
        this.socketComponent = new SocketComponent(this);
        this.equipmentComponent = new EquipmentComponent(this, {ctx:this.ctxGame.ctx, assetManager: this.ctxGame.assetManager});
        this.renderer = new PlayerRenderer(this);
        
        this.world = null; // Será definido quando o player for adicionado ao mundo
    }

    // --- Getters e Setters de Compatibilidade de API Externa ---
    get state() { return this.stateComponent.state; }
    set state(value) { this.stateComponent.setState(value); }
    
    get direction() { return this.stateComponent.direction; }
    set direction(value) { this.stateComponent.setDirection(value); }
    
    get facing() { return this.stateComponent.facing; }
    set facing(value) { this.stateComponent.setFacing(value); }

    get health() { return this.stateComponent.health; }
    get maxHealth() { return this.stateComponent.maxHealth; }
    get invulnerableTimer() { return this.stateComponent.invulnerableTimer; }
    
    get inventory() { return this.equipmentComponent.inventory; }
    set inventory(value) { this.equipmentComponent.inventory = value; }

    // --- Delegações de Métodos Públicos ---
    getCollisionRect(x, y) {
        return this.movementComponent.getCollisionRect(x, y);
    }

    getVisualCollisionRect(x, y) {
        return this.movementComponent.getVisualCollisionRect(x, y);
    }

    getAttackRect() {
        return this.equipmentComponent.getAttackRect();
    }

    heal(amount) {
        this.stateComponent.heal(amount);
    }

    takeDamage(amount) {
        return this.stateComponent.takeDamage(amount);
    }

    isDead() {
        return this.stateComponent.isDead();
    }

    // --- Lógicas de Coordenação e Fluxo ---
    faceTarget(target, world) {
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const minDistance = 60;
        const isEixoHorizontal = Math.abs(dx) > Math.abs(dy);

        if (isEixoHorizontal) {
            this.stateComponent.setDirection('side');
            this.stateComponent.setFacing(dx > 0 ? 'right' : 'left');
        } else {
            this.stateComponent.setDirection(dy > 0 ? 'front' : 'back');
        }

        const safePosition = this.findSafePositionNearTarget(target, world, minDistance);
        if (safePosition) {
            this.x = safePosition.x;
            this.y = safePosition.y;
        }
    }

    update(keys, world = null) {
        if (this.stateComponent.isDead()) return;

        // Atualiza timers internos e cooldown de equipamentos
        this.stateComponent.update();
        this.equipmentComponent.update();

        const hasWeaponEquipped = this.inventory.hasWeaponEquipped();
        // Se o estado atual for de ataque
        if (this.stateComponent.state === 'attack' && hasWeaponEquipped) {
            const config = this.animationComponent.getAnimationConfig('attack', this.stateComponent.direction);
            this.animationComponent.update('attack', this.stateComponent.direction);
            
            // Fim do frame do ataque retorna ao estado ocioso
            if (this.animationComponent.currentFrame >= config.frames - 1) {
                this.stateComponent.setState('idle');
                this.animationComponent.reset();
            }
            return;
        }

        // Processa entrada de ataque prioritário
        if (keys[' '] && this.equipmentComponent.attackCooldown <= 0 && hasWeaponEquipped) {
            this.world = world; // Atualiza a referência do mundo antes de atacar
            this.equipmentComponent.triggerAttack();
            return;
        }

        // Executa física e movimentação
        const isMoving = this.movementComponent.update(keys, world);
        
        // Define estado de movimento ou idle
        this.stateComponent.setState(isMoving ? 'move' : 'idle');

        // Atualiza as animações de ciclo
        this.animationComponent.update(this.stateComponent.state, this.stateComponent.direction);

        // Logs em modo desenvolvedor
        if (Environment.isDeveloperMode() && world) {
            console.log(`Sala atual: (${world.currentRoom.x}, ${world.currentRoom.y})`);
            console.log(`Player em: x=${Math.floor(this.x)}, y=${Math.floor(this.y)}`);
        }
    }

    draw(ctx, spriteSheetImage, FRAME_SIZE) {
        this.renderer.draw(ctx, spriteSheetImage, FRAME_SIZE);
    }
}