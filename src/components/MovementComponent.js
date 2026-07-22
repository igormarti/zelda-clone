export default class MovementComponent {
    constructor(entity) {
        this.entity = entity;
        this.speed = 1.5;
        this.collisionBox = { x: 35, y: 58, width: 26, height: 26 };
    }

    getCollisionRect(x = this.entity.x, y = this.entity.y) {
        return {
            x: x + this.collisionBox.x,
            y: y + this.collisionBox.y,
            width: this.collisionBox.width,
            height: this.collisionBox.height
        };
    }

    getVisualCollisionRect(x = this.entity.x, y = this.entity.y) {
        return this.getCollisionRect(x, y);
    }

    update(keys, world) {
        let isMoving = false;
        let moveX = 0;
        let moveY = 0;

        if (keys['w'] || keys['ArrowUp']) { 
            moveY -= this.speed; 
            this.entity.stateComponent.setDirection('back'); 
            isMoving = true; 
        }
        else if (keys['s'] || keys['ArrowDown']) { 
            moveY += this.speed; 
            this.entity.stateComponent.setDirection('front'); 
            isMoving = true; 
        }

        if (keys['a'] || keys['ArrowLeft']) { 
            moveX -= this.speed; 
            this.entity.stateComponent.setDirection('side'); 
            this.entity.stateComponent.setFacing('left'); 
            isMoving = true; 
        }
        else if (keys['d'] || keys['ArrowRight']) { 
            moveX += this.speed; 
            this.entity.stateComponent.setDirection('side'); 
            this.entity.stateComponent.setFacing('right'); 
            isMoving = true; 
        }

        const nextX = this.entity.x + moveX;
        const nextY = this.entity.y + moveY;
        const collisionRectX = this.getCollisionRect(nextX, this.entity.y);
        const collisionRectY = this.getCollisionRect(this.entity.x, nextY);

        const canMoveX = !world || (
            !world.isPositionBlocked(collisionRectX.x, collisionRectX.y, collisionRectX.width, collisionRectX.height) &&
            collisionRectX.x >= 0 && (collisionRectX.x + collisionRectX.width) <= world.SCREEN_WIDTH
        );

        const canMoveY = !world || (
            !world.isPositionBlocked(collisionRectY.x, collisionRectY.y, collisionRectY.width, collisionRectY.height) &&
            collisionRectY.y >= 0 && (collisionRectY.y + collisionRectY.height) <= world.SCREEN_HEIGHT
        );

        if (moveX !== 0 && canMoveX) {
            this.entity.x = nextX;
        }

        if (moveY !== 0 && canMoveY) {
            this.entity.y = nextY;
        }

        return isMoving;
    }
}