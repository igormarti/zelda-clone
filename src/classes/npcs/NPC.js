import Character from '../Character.js';
import BehaviorFactory from './BehaviorFactory.js';

export default class NPC extends Character {
    constructor(config, context, savedState = {}) {
        super();
        this.id = config.id;
        this.name = config.name || 'NPC';
        this.spritePath = config.sprite;
        this.sprite = context.spriteSheetLoader ? context.spriteSheetLoader(config.sprite) : null;
        this.frameSize = config.frameSize || 48;
        this.scale = config.scale || 1;
        const position = config.position || { x: 0, y: 0 };
        this.x = typeof savedState?.x === 'number' ? savedState.x : (typeof position.x === 'number' ? position.x : 0);
        this.y = typeof savedState?.y === 'number' ? savedState.y : (typeof position.y === 'number' ? position.y : 0);
        this.collisionBox = config.collisionBox || { x: 16, y: 34, width: 32, height: 28 };
        this.behavior = BehaviorFactory.createBehavior(config.behavior?.type || 'static', config.behavior?.params || {});
        this.dialogueId = config.dialogueId || null;
        this.persistentKey = config.persistentKey || null;
        this.state = 'idle';
        this.direction = 'front';
        this.facing = 'right';
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = config.animationSpeed || 12;
        this.frameCount = config.frameCount || 6;
        this.animationMap = config.animationMap || {
            idle: { front: 0, side: 1, back: 2 },
            move: { front: 3, side: 4, back: 5 }
        };
        this.paused = false;
        this.zOrder = config.zOrder || 'auto';

        this.behavior.enter(this, context);
    }

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

    update(context) {
        if (this.paused || context.dialogManager.isActive()) {
            return;
        }

        const movement = this.behavior.update(this, context);
        if (!movement) {
            return;
        }

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

        this.animationTimer++;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            if (isMoving) {
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            } else {
                this.currentFrame = 0;
            }
        }
    }

    draw(ctx) {
        const width = this.frameSize * this.scale;
        const height = this.frameSize * this.scale;
        const animationConfig = this.animationMap[this.state] || this.animationMap.idle;
        const row = animationConfig[this.direction] ?? animationConfig.front ?? 0;
        const frame = this.currentFrame % this.frameCount;
        const sx = frame * this.frameSize;
        const sy = row * this.frameSize;
        const shouldFlip = this.direction === 'side' && this.facing === 'left';

        if (this.sprite && this.sprite.complete) {
            ctx.save();
            if (shouldFlip) {
                ctx.translate(this.x + width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.sprite, sx, sy, this.frameSize, this.frameSize, 0, 0, width, height);
            } else {
                ctx.drawImage(this.sprite, sx, sy, this.frameSize, this.frameSize, this.x, this.y, width, height);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = '#d1b17d';
            ctx.fillRect(this.x, this.y, width, height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, width, height);
            ctx.fillStyle = '#000';
            ctx.fillText(this.name, this.x, this.y - 6);
        }
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    serializeState() {
        return {
            x: this.x,
            y: this.y
        };
    }
}
