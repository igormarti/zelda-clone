import CombatSystem from '../CombatSystem.js';
import GameOverState from './GameOverState.js';
import InventoryState from './InventoryState.js';
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
        const { player, world, input, npcManager, dialogManager, inventory} = this.context;

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

            dialogManager?.isActive()? enemy?.pause() : enemy.resume();

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

        if(!dialogManager?.isActive() && (input.keys['i'] || input.keys['I'])){
            input.keys['i'] = input.keys['I'] = false;
            this.stateManager.changeState(InventoryState);
        }

        if (!dialogManager?.isActive() && (input.keys['X'] || input.keys['x'])) {
            input.keys['X'] = input.keys['x'] = false;

            if(!world.hasObjectForInteractInCurrentRoom()) return;
            console.log("Tem objeto")
            // Tenta interagir com baús próximos
            const opened = world.interactWithChests(player);
            if (typeof opened === 'object' && opened !== null) {
                dialogManager.showInfo(opened.text ?? '', { player });
            }

            // Tenta interagir com placas de informações próximas
            const hasSignPostMessage = world.interactWithSignPost(player);
            if(typeof hasSignPostMessage === 'string' || Array.isArray(hasSignPostMessage)){
                dialogManager.showInfo(hasSignPostMessage ?? '...', { player });
            }
            
        }
    }

    draw(ctx) {
        const { world, player, spriteSheet, FRAME_SIZE, npcManager, dialogManager, canvas } = this.context;

        world.draw(ctx, player, spriteSheet, FRAME_SIZE,  npcManager);

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
