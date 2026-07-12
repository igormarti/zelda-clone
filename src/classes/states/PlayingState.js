import CombatSystem from '../CombatSystem.js';
import GameOverState from './GameOverState.js';
import PausedState from './PausedState.js';
import State from './State.js';

export default class PlayingState extends State {
    constructor(stateManager, context) {
        super(stateManager, context);
        this.combatSystem = context.combatSystem || new CombatSystem();
        this.attackedEnemies = new Set();
        this.lastAttackState = null;
    }

    enter() {
        const roomKey = `${this.context.world.currentRoom.x},${this.context.world.currentRoom.y}`;
        if (this.context.npcManager) {
            this.context.npcManager.loadForRoom(roomKey);
        }
        this.currentRoomKey = roomKey;
    }

    update() {
        const { player, world, input, npcManager, dialogManager, inventory } = this.context;

        const isDialogActive = dialogManager?.isActive();

        if (isDialogActive) {
            dialogManager.update(input);
        } else {
            player.update(input.keys, world);
            world.update(player);
        }

        const roomKey = `${world.currentRoom.x},${world.currentRoom.y}`;
        if (npcManager) {
            if (roomKey !== this.currentRoomKey) {
                npcManager.loadForRoom(roomKey);
                this.currentRoomKey = roomKey;
            }
            npcManager.update({ input });
        }

        const enemies = world.getRoomEnemies?.() || [];
        
        // Dentro do update do PlayingState.js
        if (!isDialogActive && player.state === 'attack') {
            if (this.lastAttackState !== 'attack') {
                this.attackedEnemies.clear();
                this.lastAttackState = 'attack';
            }

            for (const enemy of enemies) {
                // Apenas verifique se ele já foi atacado neste ciclo
                if (!this.attackedEnemies.has(enemy)) {
                    // Passe o array de inimigos apenas se eles estiverem vivos
                    const hits = this.combatSystem.resolveAttack(player, [enemy]);
                    if (hits.length > 0) {
                        this.attackedEnemies.add(enemy);
                    }
                }
            }
        } else {
            this.lastAttackState = player.state;
        }

        for (const enemy of enemies) {
            if (enemy && typeof enemy.update === 'function' && !enemy.isDead?.()) {
                enemy.update(player, world);
                if (!enemy.isDead?.() && this.combatSystem.resolveContactDamage(enemy, player)) {
                    console.log(`[COMBAT] Enemy contact damage! Player health: ${player.health}`);
                    player.state = player.state === 'die' ? player.state : 'hit';
                }
            }
        }

        if (player.state === 'die') {
            this.stateManager.changeState(GameOverState);
            return;
        }

        if (!dialogManager?.isActive() && input.keys['Escape']) {
            input.keys['Escape'] = false;
            this.stateManager.changeState(PausedState);
        }
    }

    draw(ctx) {
        const { world, player, spriteSheet, FRAME_SIZE, npcManager, dialogManager, canvas } = this.context;

        world.draw(ctx);

        if (npcManager) {
            npcManager.draw(ctx);
        }

        if (spriteSheet.complete) {
            player.draw(ctx, spriteSheet, FRAME_SIZE);
        }

        if (dialogManager) {
            dialogManager.draw(ctx, canvas);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(580, 16, 180, 48);
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`Vida: ${Math.max(player.health, 0)}/${player.maxHealth}`, 640, 42);
    }

    exit() {}
}
