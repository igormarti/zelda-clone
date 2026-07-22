export default class StateComponent {
    constructor(entity) {
        this.entity = entity;
        this.state = 'idle';
        this.direction = 'front';
        this.facing = 'right';
        
        this.maxHealth = 5;
        this.health = this.maxHealth;
        this.invulnerableTimer = 0;
        this.doorCooldown = 0;
    }

    setDirection(dir) {
        this.direction = dir;
    }

    setFacing(face) {
        this.facing = face;
    }

    setState(newState) {
        if (this.state === 'die') return;
        this.state = newState;
    }

    takeDamage(amount) {
        if (this.isDead() || this.invulnerableTimer > 0) {
            return false;
        }

        this.health = Math.max(0, this.health - amount);
        this.invulnerableTimer = 40;
        this.setState('hit');
        console.log(`[PLAYER] Took ${amount} damage! Health: ${this.health}`);
        
        if (this.health <= 0) {
            this.setState('die');
            console.log(`[PLAYER] Player died!`);
        }
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        console.log(`Player curado! Vida atual: ${this.health}/${this.maxHealth}`);
    }

    isDead() {
        return this.health <= 0;
    }

    update() {
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
        }
    }
}