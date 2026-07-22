export default class NpcAnimationComponent {
    
    constructor(entity, config = {}) {
        this.entity = entity;
        this.currentFrame = 0;
        this.animationTimer = 0;
        
        // Configurações padrão customizáveis pelo arquivo de configuração do NPC
        this.animationSpeed = config.animationSpeed || 12;
        this.frameCount = config.frameCount || 6;
        
        // Mapeamento flexível de animações (com suporte a rows personalizadas)
        this.animationMap = config.animationMap || {
            idle: { front: 0, side: 1, back: 2 },
            move: { front: 3, side: 4, back: 5 },
            talking: { front: 0, side: 1, back: 2 } // Fallback para idle se não configurado
        };

        // Controle de estados de reprodução única (ex: expressões faciais ou sustos)
        this.isOneShot = false;
        this.onCompleteCallback = null;
    }

    /**
     * Retorna a linha (row) da spritesheet com base no estado e direção do NPC
     */
    getAnimationConfig(state, direction) {
        const stateConfig = this.animationMap[state] || this.animationMap['idle'];
        const row = typeof stateConfig === 'number' ? stateConfig : (stateConfig[direction] ?? stateConfig['front'] ?? 0);
        return {
            row: row,
            frames: this.frameCount
        };
    }

    /**
     * Executa uma animação de ciclo único (non-looping) e executa um callback ao finalizar
     */
    playOneShot(state, onComplete = null) {
        this.entity.state = state;
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.isOneShot = true;
        this.onCompleteCallback = onComplete;
    }

    reset() {
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.isOneShot = false;
        this.onCompleteCallback = null;
    }

    update(state, direction, isMoving = true) {
        this.animationTimer++;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            const config = this.getAnimationConfig(state, direction);

            if (isMoving || this.isOneShot || state === 'talking') {
                const nextFrame = this.currentFrame + 1;

                if (nextFrame >= config.frames) {
                    if (this.isOneShot) {
                        this.isOneShot = false;
                        this.currentFrame = 0;
                        if (this.onCompleteCallback) {
                            this.onCompleteCallback();
                        }
                    } else {
                        this.currentFrame = 0;
                    }
                } else {
                    this.currentFrame = nextFrame;
                }
            } else {
                this.currentFrame = 0;
            }
        }
    }
}