export default class RandomWalkBehavior {
    constructor(params = {}) {
        this.speed = params.speed || 0.8;
        this.moveDuration = params.moveDuration || 90;
        this.pauseDuration = params.pauseDuration || 60;
        this.radius = params.radius || 80;
        this.state = 'pause';
        this.timer = 0;
        this.dx = 0;
        this.dy = 0;
    }

    enter(npc, context) {
        this.state = 'pause';
        this.timer = this.pauseDuration;
        npc.state = 'idle';
    }

    update(npc, context) {
        if (this.state === 'pause') {
            this.timer--;
            if (this.timer <= 0) {
                this.state = 'move';
                this.timer = this.moveDuration;
                const angle = Math.random() * Math.PI * 2;
                this.dx = Math.cos(angle) * this.speed;
                this.dy = Math.sin(angle) * this.speed;
                npc.state = 'move';
            }
        } else {
            const nextX = npc.x + this.dx;
            const nextY = npc.y + this.dy;
            const collisionRect = npc.getCollisionRect(nextX, nextY);
            const withinBounds = collisionRect.x >= 0 && collisionRect.y >= 0 &&
                collisionRect.x + collisionRect.width <= context.world.SCREEN_WIDTH &&
                collisionRect.y + collisionRect.height <= context.world.SCREEN_HEIGHT;

            if (!withinBounds || context.world.isPositionBlocked(collisionRect.x, collisionRect.y, collisionRect.width, collisionRect.height)) {
                this.state = 'pause';
                this.timer = this.pauseDuration;
                npc.state = 'idle';
                return { dx: 0, dy: 0 };
            }

            this.timer--;
            if (this.timer <= 0) {
                this.state = 'pause';
                this.timer = this.pauseDuration;
                npc.state = 'idle';
                return { dx: 0, dy: 0 };
            }

            return { dx: this.dx, dy: this.dy };
        }

        return { dx: 0, dy: 0 };
    }

    exit(npc) {}
}
