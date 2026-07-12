import Character from './Character.js';
import Environment from './Enviroment.js';

export default class Player extends Character {

    constructor() {
        super();
        this.id = 'player';
        this.name = 'Joaquim';
        this.x = 400;
        this.y = 300;
        this.width = 48 * 2; // FRAME_SIZE * SCALE_FACTOR
        this.height = 48 * 2;
        this.speed = 1.5;
        this.state = 'idle';
        this.direction = 'front';
        this.facing = 'right';
        this.currentFrame = 0;
        this.animationSpeed = 10;
        this.animationTimer = 0;
        this.collisionBox = { x: 32, y: 58, width: 32, height: 30 };
        this.doorCooldown = 0;
    }

    getAnimationConfig(state, direction) {
        if (state === 'die') return { row: 9, frames: 3 };
        const map = {
            'idle':   { 'front': {row: 0, frames: 6}, 'side': {row: 1, frames: 6}, 'back': {row: 2, frames: 6} },
            'move':   { 'front': {row: 3, frames: 6}, 'side': {row: 4, frames: 6}, 'back': {row: 5, frames: 6} },
            'attack': { 'front': {row: 6, frames: 4}, 'side': {row: 7, frames: 4}, 'back': {row: 8, frames: 4} }
        };
        const stateConfig = map[state] || map['idle'];
        const directionConfig = stateConfig[direction] || stateConfig['front'];
        return directionConfig;
    }

    getCollisionRect(x = this.x, y = this.y) {
        const FRAME_SIZE = 48;
        return {
            x: x,
            y: y,
            width: FRAME_SIZE,
            height: FRAME_SIZE
        };
    }

    faceTarget(target, world) {
        if (!target) {
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDistance = 60;
        const isEixoHorizontal = Math.abs(dx) > Math.abs(dy);

        if (isEixoHorizontal) {
            this.direction = 'side';
            this.facing = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'front' : 'back';
        }

        // Sempre tenta reposicionar o jogador para uma distância adequada de diálogo,
        // seja vindo de perto ou de longe. A função `findSafePositionNearTarget` já
        // valida limites e obstáculos.
        const safePosition = this.findSafePositionNearTarget(target, world, minDistance);
        if (safePosition) {
            this.x = safePosition.x;
            this.y = safePosition.y;
        }
    }

    update(keys, world = null) {
        if (this.state === 'die') return;

        if (this.state === 'attack') {
            this.animationTimer++;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.currentFrame++;
                const config = this.getAnimationConfig('attack', this.direction);
                if (this.currentFrame >= config.frames) {
                    this.state = 'idle';
                    this.currentFrame = 0;
                }
            }
            return;
        }

        let isMoving = false;
        let moveX = 0;
        let moveY = 0;

        if (keys['w'] || keys['ArrowUp'])      { moveY -= this.speed; this.direction = 'back'; isMoving = true; }
        else if (keys['s'] || keys['ArrowDown'])    { moveY += this.speed; this.direction = 'front'; isMoving = true; }

        if (keys['a'] || keys['ArrowLeft'])    { moveX -= this.speed; this.direction = 'side'; this.facing = 'left'; isMoving = true; }
        else if (keys['d'] || keys['ArrowRight'])   { moveX += this.speed; this.direction = 'side'; this.facing = 'right'; isMoving = true; }

        if (keys[' ']) {
            this.state = 'attack';
            this.currentFrame = 0;
            return;
        }

        const nextX = this.x + moveX;
        const nextY = this.y + moveY;
        const collisionRectX = this.getCollisionRect(nextX, this.y);
        const collisionRectY = this.getCollisionRect(this.x, nextY);

        const canMoveX = !world || (
            !world.isPositionBlocked(collisionRectX.x, collisionRectX.y, collisionRectX.width, collisionRectX.height) &&
            collisionRectX.x >= 0 && (collisionRectX.x + collisionRectX.width) <= world.SCREEN_WIDTH
        );

        const canMoveY = !world || (
            !world.isPositionBlocked(collisionRectY.x, collisionRectY.y, collisionRectY.width, collisionRectY.height) &&
            collisionRectY.y >= 0 && (collisionRectY.y + collisionRectY.height) <= world.SCREEN_HEIGHT
        );

        if (moveX !== 0 && canMoveX) {
            this.x = nextX;
        }

        if (moveY !== 0 && canMoveY) {
            this.y = nextY;
        }

        if(Environment.isDeveloperMode()){
            console.log(`Sala atual: (${world.currentRoom.x}, ${world.currentRoom.y})`);
            console.log(`Player em: x=${Math.floor(this.x)}, y=${Math.floor(this.y)}`);
        }
        this.state = isMoving ? 'move' : 'idle';
        this.animationTimer++;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            const config = this.getAnimationConfig(this.state, this.direction);
            this.currentFrame = (this.currentFrame + 1) % config.frames;
        }

    }

    drawHitbox(ctx) {
        const rect = this.getCollisionRect();
        ctx.strokeStyle = 'red'; // Cor visível para debug
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    draw(ctx, spriteSheetImage, FRAME_SIZE) {
        const config = this.getAnimationConfig(this.state, this.direction);
        const sx = this.currentFrame * FRAME_SIZE;
        const sy = config.row * FRAME_SIZE;
        const shouldFlip = (this.direction === 'side' && this.facing === 'left');


        ctx.save();
        if (shouldFlip) {
            ctx.scale(-1, 1);
            ctx.drawImage(spriteSheetImage, sx, sy, FRAME_SIZE, FRAME_SIZE, -(this.x + this.width), this.y, this.width, this.height);
        } else {
            ctx.drawImage(spriteSheetImage, sx, sy, FRAME_SIZE, FRAME_SIZE, this.x, this.y, this.width, this.height);
        }
        Environment.isDeveloperMode() && this.drawHitbox(ctx);
        ctx.restore();
    }
}