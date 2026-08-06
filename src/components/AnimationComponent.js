export default class AnimationComponent {
    constructor(entity) {
        this.entity = entity;
        this.currentFrame = 0;
        this.animationSpeed = 10;
        this.animationTimer = 0;
    }

    /**
     * Retorna a configuração de linha (row) e quantidade de frames do spritesheet
     * com base no estado, direção e arma equipada.
     */
    getAnimationConfig(state, direction) {
        if (state === 'die') return { row: 9, frames: 3 };

        // Se estiver atacando e a arma for um arco, utiliza as linhas de ataque de arco (10, 11 e 12)
        if (state === 'attack' && this._isBowEquipped()) {
            const bowAttackMap = {
                'front': { row: 10, frames: 5 },
                'side':  { row: 11, frames: 4 },
                'back':  { row: 12, frames: 4 }
            };

            return bowAttackMap[direction] || bowAttackMap['front'];
        }

        // Tabela padrão para idle, move e ataque genérico / espada
        const map = {
            'idle':   { 'front': { row: 0, frames: 6 }, 'side': { row: 1, frames: 6 }, 'back': { row: 2, frames: 6 } },
            'move':   { 'front': { row: 3, frames: 6 }, 'side': { row: 4, frames: 6 }, 'back': { row: 5, frames: 6 } },
            'attack': { 'front': { row: 6, frames: 4 }, 'side': { row: 7, frames: 4 }, 'back': { row: 8, frames: 4 } }
        };

        const stateConfig = map[state] || map['idle'];
        return stateConfig[direction] || stateConfig['front'];
    }

    /**
     * Verifica no 'equipmentComponent' da entidade se a arma equipada é um arco,
     * procurando pelas palavras 'bow' ou 'arco' no seu nome ou ID.
     */
    _isBowEquipped() {
        const equipped = this.entity?.equipmentComponent?.equippedWeapon;
        if (!equipped) return false;

        const name = equipped.name ? equipped.name.toLowerCase() : '';
        const id = equipped.id ? equipped.id.toLowerCase() : '';

        return name.includes('bow') || name.includes('arco') || id.includes('bow') || id.includes('arco');
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