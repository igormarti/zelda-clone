export default class AnimationComponent {
    constructor(entity) {
        this.entity = entity;
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
        const stateConfig = map[state] || map['idle'];
        return stateConfig[direction] || stateConfig['front'];
    }

    reset() {
        this.currentFrame = 0;
        this.animationTimer = 0;
    }

    update(state, direction) {
        this.animationTimer++;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            const config = this.getAnimationConfig(state, direction);
            this.currentFrame = (this.currentFrame + 1) % config.frames;
        }
    }
}