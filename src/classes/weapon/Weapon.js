export default class Weapon {
    constructor(owner, config = {}) {
        this.owner = owner; // Entidade portadora (ex: Player)
        this.id = config.id || null;
        this.name = config.name || 'Arma Base';
        this.description = config.description || "Arma Descrição"
        this.damage = config.damage || 1;
        this.range = config.range || 50;
        this.cooldownFrames = config.cooldownFrames || 20;
        this.sprite = config.sprite || null;
    }

    // Calcula a área física de colisão do golpe
    getAttackRect() {
        return null;
    }

    // Lógica executada no momento do ataque
    attack() {
        // Sobrescrito pelas subclasses
    }

    // Atualização física/framerates específicos da arma (ex: bumerangue voando)
    update() {
        // Sobrescrito se necessário pelas subclasses
    }

    // Renderização individual do sprite/vetor da arma
    draw(ctx, socketPos, facing, direction) {
        // Sobrescrito pelas subclasses
    }
}