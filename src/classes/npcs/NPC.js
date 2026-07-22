import NpcAnimationComponent from '../../components/NpcAnimationComponent.js';
import NpcRenderer from '../../components/NpcRenderer.js';
import { Entity } from '../Entity.js';
import BehaviorFactory from './BehaviorFactory.js';

export default class NPC extends Entity {
    constructor(config, context, savedState = {}) {
        const x = typeof savedState?.x === 'number' ? savedState.x : (typeof config.position?.x === 'number' ? config.position.x : 0);
        const y = typeof savedState?.y === 'number' ? savedState.y : (typeof config.position?.y === 'number' ? config.position.y : 0);
        super(x, y);
        
        this.id = config.id;
        this.name = config.name || 'NPC';
        this.spritePath = config.sprite;
        this.sprite = context.spriteSheetLoader ? context.spriteSheetLoader(config.sprite) : null;
        this.frameSize = config.frameSize || 48;
        this.scale = config.scale || 1;
        this.collisionBox = config.collisionBox || { x: 16, y: 34, width: 32, height: 28 };
        this.reward = config.reward || null;
        this.dialogueId = config.dialogueId || null;
        this.persistentKey = config.persistentKey || null;

        this.dialogueId = config.dialogueId || null;
        this.persistentKey = config.persistentKey || null;
        this.paused = false;
        this.zOrder = config.zOrder || 'auto';

        // Estados dinâmicos do NPC
        this.state = 'idle';
        this.direction = 'front';
        this.facing = 'right';

        // Comportamento de IA externa
        this.behavior = BehaviorFactory.createBehavior(config.behavior?.type || 'static', config.behavior?.params || {});

        // Instanciação do componente de animação dedicado do NPC
        this.animationComponent = new NpcAnimationComponent(this, {
            animationSpeed: config.animationSpeed || 12,
            frameCount: config.frameCount || 6,
            animationMap: config.animationMap || {
                idle: { front: 0, side: 1, back: 2 },
                move: { front: 3, side: 4, back: 5 },
                talking: config.animationMap?.talking || { front: 0, side: 1, back: 2 } // Suporta sprites de conversa customizadas
            }
        });
        
        this.renderer = new NpcRenderer(this);

        this.behavior.enter(this, context);
    }

    get currentFrame() { return this.animationComponent.currentFrame; }

    getCollisionRect(x = this.x, y = this.y) {
        return {
            x: x + this.collisionBox.x,
            y: y + this.collisionBox.y,
            width: this.collisionBox.width,
            height: this.collisionBox.height
        };
    }

    isNearPlayer(player, threshold = 60) {
        const playerRect = player.getCollisionRect();
        const npcRect = this.getCollisionRect();
        const dx = (npcRect.x + npcRect.width / 2) - (playerRect.x + playerRect.width / 2);
        const dy = (npcRect.y + npcRect.height / 2) - (playerRect.y + playerRect.height / 2);
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
    }

    isInteractable(player) {
        return !this.paused && this.dialogueId && this.isNearPlayer(player);
    }

    faceTarget(target, world) {
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = 'side';
            this.facing = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'front' : 'back';
        }

        const minDistance = 60;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
            const safePosition = this.findSafePositionNearTarget(target, world, minDistance);
            if (safePosition) {
                this.x = safePosition.x;
                this.y = safePosition.y;
            }
        }
    }

    update(context) {
        // Se o diálogo estiver ativo, o NPC entra em modo de conversação olhando para o player
        if (context.dialogManager && context.dialogManager.isActive() && this.isNearPlayer(context.player)) {
            this.state = 'talking';
            this.faceTarget(context.player, context.world);
            this.animationComponent.update(this.state, this.direction, false);
            return;
        }

        if (this.paused) {
            return;
        }

        const movement = this.behavior.update(this, context);
        if (!movement) return;

        const isMoving = movement.dx !== 0 || movement.dy !== 0;
        
        if (isMoving) {
            this.direction = Math.abs(movement.dx) > Math.abs(movement.dy) ? 'side' : (movement.dy > 0 ? 'front' : 'back');
            if (Math.abs(movement.dx) > Math.abs(movement.dy)) {
                this.facing = movement.dx < 0 ? 'left' : 'right';
            }
            this.state = 'move';
        } else {
            this.state = 'idle';
        }

        const nextX = this.x + movement.dx;
        const nextY = this.y + movement.dy;
        const rect = this.getCollisionRect(nextX, nextY);
        
        const canMove = !context.world.isPositionBlocked(rect.x, rect.y, rect.width, rect.height) &&
            rect.x >= 0 && rect.y >= 0 &&
            rect.x + rect.width <= context.world.SCREEN_WIDTH &&
            rect.y + rect.height <= context.world.SCREEN_HEIGHT;

        if (canMove) {
            this.x = nextX;
            this.y = nextY;
        }

        // Atualiza a animação com base no estado atualizado
        this.animationComponent.update(this.state, this.direction, isMoving);
    }

    draw(ctx) {
        this.renderer.draw(ctx);
    }

    pause() { this.paused = true; }
    resume() { this.paused = false; }

    serializeState() {
        return {
            x: this.x,
            y: this.y
        };
    }
}