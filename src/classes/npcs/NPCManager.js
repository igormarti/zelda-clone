import NPCStateStore from '../NPCStateStore.js';
import NPC from './NPC.js';

export default class NPCManager {
    constructor(world, player, dialogManager, assetLoader, roomData = {}) {
        this.world = world;
        this.player = player;
        this.dialogManager = dialogManager;
        this.assetLoader = assetLoader;
        this.roomData = roomData;
        this.npcs = [];
        this.stateStore = new NPCStateStore();
        this.currentRoomKey = null;
        this.onDialogEnd = this.onDialogEnd.bind(this);
        this.dialogManager.onEnd(this.onDialogEnd);
    }

    loadForRoom(roomKey) {
        if (this.currentRoomKey === roomKey) {
            return;
        }

        this.unloadRoom();
        this.currentRoomKey = roomKey;

        const npcsConfig = this.roomData[roomKey];
        if (!Array.isArray(npcsConfig)) {
            return;
        }

        this.npcs = npcsConfig.reduce((result, config, index) => {
            if (!config || typeof config !== 'object') {
                console.warn(`NPCManager: configuração de NPC inválida na sala ${roomKey} índice ${index}`, config);
                return result;
            }

            if (!config.id) {
                console.warn(`NPCManager: NPC sem id ignorado na sala ${roomKey} índice ${index}`, config);
                return result;
            }

            const savedState = config.persistentKey ? this.stateStore.load(config.persistentKey) : null;
            try {
                const npc = new NPC(config, {
                    world: this.world,
                    player: this.player,
                    dialogManager: this.dialogManager,
                    spriteSheetLoader: this.assetLoader
                }, savedState);
                result.push(npc);
            } catch (error) {
                console.warn(`NPCManager: falha ao criar NPC '${config.id}' na sala ${roomKey}`, error);
            }
            return result;
        }, []);
    }

    unloadRoom() {
        if (!this.npcs.length) return;
        this.npcs.forEach(npc => {
            if (npc.persistentKey) {
                this.stateStore.save(npc.persistentKey, npc.serializeState());
            }
        });
        this.npcs = [];
        this.currentRoomKey = null;
    }

    update(context) {
        const execContext = {
            world: this.world,
            player: this.player,
            input: context.input,
            dialogManager: this.dialogManager
        };

        this.npcs.forEach(npc => npc.update(execContext));

        if (this.dialogManager.isActive()) {
            return;
        }

        if (context.input.keys['x']) {
            const interactableNpc = this.npcs.find(npc => npc.isInteractable(this.player));
            if (interactableNpc) {
                context.input.keys['x'] = false;
                this.startDialogueWithNpc(interactableNpc);
            }
        }
    }

    draw(ctx) {
        const ordered = [...this.npcs].sort((a, b) => a.y - b.y);
        ordered.forEach(npc => npc.draw(ctx));
    }

    startDialogueWithNpc(npc) {
        // 1. Faz o NPC olhar para o Player
        if (typeof npc.faceTarget === 'function') {
            npc.faceTarget(this.player);
        }

        // 2. Faz o Player olhar para o NPC
        if (typeof this.player.faceTarget === 'function') {
            this.player.faceTarget(npc);
        }
        this.npcs.forEach(item => item.pause());
        this.dialogManager.start(npc.dialogueId, { npc });
    }

    onDialogEnd() {
        this.npcs.forEach(npc => npc.resume());
    }

}
