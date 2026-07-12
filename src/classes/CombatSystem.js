export default class CombatSystem {
    isWithinAttackRange(attacker, target) {
        if (!attacker || !target) return false;

        // Pegamos os retângulos de ataque e colisão
        const attackRect = attacker.getAttackRect();
        const targetRect = target.getCollisionRect();

        // Lógica AABB: Retorna true se os retângulos se sobrepuserem
        return (
            attackRect.x < targetRect.x + targetRect.width &&
            attackRect.x + attackRect.width > targetRect.x &&
            attackRect.y < targetRect.y + targetRect.height &&
            attackRect.y + attackRect.height > targetRect.y
        );
    }

    resolveAttack(attacker, targets = []) {
        if (!attacker || attacker.isDead?.()) {
            return [];
        }

        const hits = [];

        // O loop processa apenas o que é enviado. 
        // A lógica de filtragem de "já atingidos" deve ser feita no PlayingState.
        for (const target of targets) {
            // 1. Validação defensiva: garantir que o target existe e tem a interface de dano
            if (!target || target.isDead?.() || typeof target.takeDamage !== 'function') {
                continue;
            }

            // 2. Verificação de Cooldown (Atacante não pode atacar se estiver em recarga)
            if (attacker.attackCooldown > 0) {
                continue;
            }

            // 3. Verificação de Alcance (usando a lógica AABB que discutimos)
            const inRange = this.isWithinAttackRange(attacker, target);

            if (inRange) {
                // Aplica o dano
                const damage = attacker.attackDamage ?? 1;
                target.takeDamage(damage);
                
                hits.push(target);
            }
        }

        // 4. Se houve algum acerto, coloca o atacante em estado de ataque e inicia o cooldown
        if (hits.length > 0) {
            attacker.attackCooldown = attacker.attackCooldownFrames ?? 12;
            attacker.state = 'attack';
        }

        return hits;
    }

    resolveContactDamage(attacker, target) {
        if (!attacker || !target || attacker.isDead?.() || target.isDead?.()) {
            return false;
        }

        if (target.invulnerableTimer > 0) {
            return false;
        }

        const attackerRect = typeof attacker.getAttackRect === 'function'
            ? attacker.getAttackRect()
            : { x: attacker.x, y: attacker.y, width: 0, height: 0 };
        const targetRect = typeof target.getCollisionRect === 'function'
            ? target.getCollisionRect()
            : { x: target.x, y: target.y, width: 0, height: 0 };

        const distance = Math.hypot(
            (targetRect.x + targetRect.width / 2) - (attackerRect.x + attackerRect.width / 2),
            (targetRect.y + targetRect.height / 2) - (attackerRect.y + attackerRect.height / 2)
        );

        const contactRange = attacker.contactRange ?? 36;
        if (distance > contactRange) {
            return false;
        }

        if (typeof target.takeDamage === 'function') {
            target.takeDamage(attacker.attackDamage ?? 1);
            return true;
        }

        return false;
    }
}
