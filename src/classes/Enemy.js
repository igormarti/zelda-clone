import Character from './Character.js';
import Environment from './Enviroment.js';

export default class Enemy extends Character {
    constructor({ x = 0, y = 0, maxHealth = 3, attackDamage = 1, speed = 0.8, collisionBox = { x: 12, y: 20, width: 24, height: 24 }} = {}) {
        super();
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 48;
        this.collisionBox = collisionBox;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.attackDamage = attackDamage;
        this.speed = speed;
        this.state = 'idle';
        this.direction = 'front';
        this.attackCooldown = 0;
        this.attackCooldownFrames = 40;
        this.invulnerableTimer = 0;
        this.alive = true;
        this.contactRange = 36;
        this.color = '#ff4d4d';
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
        return { x: this.x-2, y: this.y-2, width: this.width+5, height: this.height+5 };
    }

    update(player, world = null) {
        if (this.isDead()) {
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
        }

        if (!player || !world) {
            return;
        }

        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        if (distance < 90) {
            this.state = 'move';
            const moveX = player.x > this.x ? this.speed : -this.speed;
            const moveY = player.y > this.y ? this.speed : -this.speed;
            const nextX = this.x + moveX;
            const nextY = this.y + moveY;
            const collisionRect = this.getCollisionRect();
            const canMoveX = !world.isPositionBlocked?.(nextX + this.collisionBox.x, this.y + this.collisionBox.y, this.collisionBox.width, this.collisionBox.height);
            const canMoveY = !world.isPositionBlocked?.(this.x + this.collisionBox.x, nextY + this.collisionBox.y, this.collisionBox.width, this.collisionBox.height);
            if (canMoveX) this.x = nextX;
            if (canMoveY) this.y = nextY;
            this.direction = Math.abs(player.x - this.x) > Math.abs(player.y - this.y) ? 'side' : 'front';
        } else {
            this.state = 'idle';
        }
    }

    takeDamage(amount) {
        if (this.isDead()) {
            return false;
        }

        this.health = Math.max(0, this.health - amount);
        this.state = 'hit';
        this.invulnerableTimer = 8;
        console.log(`[ENEMY] Took ${amount} damage! Health: ${this.health}`);
        return true;
    }

    isDead() {
        return this.health <= 0;
    }

    drawHitbox(ctx) {
        const rect = this.getCollisionRect();
        ctx.strokeStyle = 'lime'; // Cor visível para debug
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

     drawHitboxAttack(ctx) {
        const rect = this.getAttackRect();
        console.log(`[DEBUG] Attack Rect: x=${rect.x}, y=${rect.y}, width=${rect.width}, height=${rect.height}`);
        ctx.strokeStyle = 'pink'; // Cor visível para debug
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }

    draw(ctx) {
        if (this.isDead()) {
            return;
        }

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`${this.health}`, this.x, this.y - 6);

        
        if(Environment.isDeveloperMode()){
            this.drawHitbox(ctx);
            this.drawHitboxAttack(ctx);
        }
    }
}
