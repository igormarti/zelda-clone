export default class EquipmentComponent {

    

    constructor(entity, {ctx, assetManager}) {
        this.entity = entity;
        this.equippedWeapon = null;
        this.attackDamage = 2;
        this.attackRange = 70;
        this.contactRange = 36;
        this.attackCooldown = 0;
        this.attackCooldownFrames = 20;
    }

    /**
     * Permite trocar as armas em tempo de execução
     */
    equipWeapon(weaponInstance) {
        this.equippedWeapon = weaponInstance;
        this.attackDamage = weaponInstance.damage;
        this.attackRange = weaponInstance.range;
        this.attackCooldownFrames = weaponInstance.cooldownFrames;
        console.log(`[EQUIPMENT] Arma equipada com sucesso: ${weaponInstance.name}`);
    }

    getAttackRect() {
        const rect = this.entity.movementComponent.getCollisionRect();
        const offset = 20;
        const FRAME_SIZE = 48;

        let offsetX = 0;
        let offsetY = 0;

        const direction = this.entity.stateComponent.direction;
        const facing = this.entity.stateComponent.facing;

        if (direction === 'side') {
            offsetX = (facing === 'right' ? offset : -offset);
        } else if (direction === 'back') {
            offsetY = -offset + 15;
        }

        return {
            x: (rect.x - 10) + offsetX,
            y: (rect.y - 20) + offsetY,
            width: FRAME_SIZE * 1.2,
            height: FRAME_SIZE * 1.2
        };
    }

    triggerAttack() {
        if (this.attackCooldown <= 0) {
            this.entity.stateComponent.setState('attack');
            this.entity.animationComponent.reset();

            // Delegação do efeito de ataque específico
            if (this.equippedWeapon) {
                this.equippedWeapon.attack();
            }

            this.attackCooldown = this.attackCooldownFrames;
            return true;
        }
        return false;
    }

    update() {
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        // Atualiza a física/comportamento ativa da arma (ex: bumerangue)
        if (this.equippedWeapon) {
            this.equippedWeapon.update();
        }
    }

    /**
     * Conecta a renderização da arma ao socket dinâmico do personagem
     */
    drawWeapon(ctx) {
        if (!this.equippedWeapon) return;

        const socketPos = this.entity.socketComponent.getHandSocketPosition();
        const facing = this.entity.stateComponent.facing;
        const direction = this.entity.stateComponent.direction;

        this.equippedWeapon.draw(ctx, socketPos, facing, direction);
    }
}