export default class Player {
    constructor() {
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
    }

    getAnimationConfig(state, direction) {
        if (state === 'die') return { row: 9, frames: 3 };
        const map = {
            'idle':   { 'front': {row: 0, frames: 6}, 'side': {row: 1, frames: 6}, 'back': {row: 2, frames: 6} },
            'move':   { 'front': {row: 3, frames: 6}, 'side': {row: 4, frames: 6}, 'back': {row: 5, frames: 6} },
            'attack': { 'front': {row: 6, frames: 4}, 'side': {row: 7, frames: 4}, 'back': {row: 8, frames: 4} }
        };
        return map[state][direction];
    }

    update(keys) {
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
        if (keys['w'] || keys['ArrowUp'])      { this.y -= this.speed; this.direction = 'back'; isMoving = true; }
        else if (keys['s'] || keys['ArrowDown'])    { this.y += this.speed; this.direction = 'front'; isMoving = true; }
        else if (keys['a'] || keys['ArrowLeft'])    { this.x -= this.speed; this.direction = 'side'; this.facing = 'left'; isMoving = true; }
        else if (keys['d'] || keys['ArrowRight'])   { this.x += this.speed; this.direction = 'side'; this.facing = 'right'; isMoving = true; }

        if (keys[' ']) {
            this.state = 'attack';
            this.currentFrame = 0;
            return;
        }

        this.state = isMoving ? 'move' : 'idle';
        this.animationTimer++;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            const config = this.getAnimationConfig(this.state, this.direction);
            this.currentFrame = (this.currentFrame + 1) % config.frames;
        }
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
        ctx.restore();
    }
}