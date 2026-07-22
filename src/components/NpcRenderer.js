export default class NpcRenderer {
    constructor(entity) {
        this.entity = entity;
    }

    draw(ctx) {
        const width = this.entity.frameSize * this.entity.scale;
        const height = this.entity.frameSize * this.entity.scale;
        
        const state = this.entity.state;
        const direction = this.entity.direction;
        const facing = this.entity.facing;
        const currentFrame = this.entity.animationComponent.currentFrame;

        const config = this.entity.animationComponent.getAnimationConfig(state, direction);
        const sx = currentFrame * this.entity.frameSize;
        const sy = config.row * this.entity.frameSize;
        const shouldFlip = direction === 'side' && facing === 'left';
        if (this.entity.sprite && this.entity.sprite.complete) {
            ctx.save();
            if (shouldFlip) {
                ctx.translate(this.entity.x + width, this.entity.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this.entity.sprite, sx, sy, this.entity.frameSize, this.entity.frameSize, 0, 0, width, height);
            } else {
                ctx.drawImage(this.entity.sprite, sx, sy, this.entity.frameSize, this.entity.frameSize, this.entity.x, this.entity.y, width, height);
            }
            ctx.restore();
        } else {
            // Fallback geométrico se a sprite não carregar
            ctx.fillStyle = '#d1b17d';
            ctx.fillRect(this.entity.x, this.entity.y, width, height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.entity.x, this.entity.y, width, height);
            ctx.fillStyle = '#000';
            ctx.fillText(this.entity.name, this.entity.x, this.entity.y - 6);
        }
    }
}