import NPCStateStore from '../NPCStateStore.js';
import Sword from '../weapon/Sword.js';
import NPC from './NPC.js';

// Registro de armas para resolução e instanciação dinâmica via string
const WEAPONS_REGISTRY = {
    Sword: Sword
    // Exemplo para o futuro: Bow: Bow, Axe: Axe
};

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
        this.activeNpc = null;
        
        this.onDialogEnd = this.onDialogEnd.bind(this);
        this.dialogManager.onEnd(this.onDialogEnd);
    }

    /**
     * Carrega assincronamente os NPCs da sala especificada.
     * Pré-carrega os spritesheets antes de instanciar os objetos para evitar "flicker" ou delay.
     */
    async loadForRoom(roomKey) {
        if (this.currentRoomKey === roomKey) {
            return;
        }

        this.unloadRoom();
        this.currentRoomKey = roomKey;

        const npcsConfig = this.roomData[roomKey];
        if (!Array.isArray(npcsConfig) || npcsConfig.length === 0) {
            return;
        }

        // 1. Pré-carrega as imagens dos spritesheets em paralelo antes da renderização
        const loadPromises = npcsConfig.map(config => {
            if (config && config.spriteSheet) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = () => resolve(); // Continua se a imagem falhar
                    img.src = config.spriteSheet;
                });
            }
            return Promise.resolve();
        });

        await Promise.all(loadPromises);

        // 2. Instancia os NPCs com os assets salvos no cache do navegador
        this.npcs = npcsConfig.reduce((result, config, index) => {
            if (!config || typeof config !== 'object') {
                console.warn(`NPCManager: configuração de NPC inválida na sala ${roomKey} no índice ${index}`, config);
                return result;
            }

            if (!config.id) {
                console.warn(`NPCManager: NPC sem id ignorado na sala ${roomKey} no índice ${index}`, config);
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

    /**
     * Salva o estado dos NPCs e limpa o array ao sair de uma sala
     */
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

    /**
     * Atualização contínua do comportamento e interação com os NPCs
     */
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

        // Interagir com NPC ao apertar a tecla X
        if (context.input.keys['x']) {
            const interactableNpc = this.npcs.find(npc => npc.isInteractable(this.player));
            if (interactableNpc) {
                context.input.keys['x'] = false;
                this.startDialogueWithNpc(interactableNpc);
            }
        }
    }

    /**
     * Renderiza todos os NPCs ordenados pelo eixo Y (profundidade / ordenação z-index)
     */
    draw(ctx) {
        const ordered = [...this.npcs].sort((a, b) => a.y - b.y);
        ordered.forEach(npc => npc.draw(ctx));
    }

    /**
     * Inicia a sequência de diálogo com o NPC e alinha o olhar dos personagens
     */
    startDialogueWithNpc(npc) {
        const configDialog = { npc, player: this.player, hasAlreadyReward: false };

        if (typeof npc.faceTarget === 'function') {
            npc.faceTarget(this.player, this.world);
        }

        if (typeof this.player.faceTarget === 'function') {
            this.player.faceTarget(npc, this.world);
        }

        this.npcs.forEach(item => item.pause());

        if (npc.reward) {
            const hasAlreadyReward = this.world?.progressionState.has(`conversed_${npc.id}`);
            configDialog.hasAlreadyReward = hasAlreadyReward;
        }

        this.activeNpc = npc;
        this.dialogManager.start(npc.dialogueId, configDialog);
    }

    /**
     * Callback executado quando um diálogo é finalizado
     */
    onDialogEnd() {
        this.npcs.forEach(npc => npc.resume());

        if (this.activeNpc) {
            // 1. Marca a flag padrão de conversa realizada
            const flagConversa = `conversed_${this.activeNpc.id}`;
            if (!this.world?.progressionState.has(flagConversa)) {
                this.world?.completeProgression(flagConversa);
            }

            // 2. Processa e concede a recompensa se houver uma configurada
            if (this.activeNpc.reward) {
                this.executeReward(this.activeNpc.reward, this.activeNpc.id);
            }
        }

        this.activeNpc = null;
    }

    /**
     * Motor genérico para entrega de recompensas (Armas, Itens, Gold)
     */
    executeReward(reward, npcId) {
        const rewardFlag = `reward_claimed_${npcId}`;
        if (this.world?.progressionState.has(rewardFlag)) {
            return; 
        }

        switch (reward.type) {
            case 'weapon':
                const WeaponClass = WEAPONS_REGISTRY[reward.className];
                if (WeaponClass && this.player.equipmentComponent) {
                    const weaponInstance = new WeaponClass(
                        this.player, 
                        { context: this.world?.gameContext || null, assetManager: this.assetLoader }, 
                        reward.config
                    );

                    console.log(`[REWARD] Jogador recebeu a arma: ${weaponInstance.name}`);
                    this.player.equipmentComponent.equipWeapon(weaponInstance);
                    if (this.player.inventory) {
                        this.player.inventory.addWeapon(weaponInstance);
                    }
                }
                break;

            case 'item':
                if (this.player.inventory && reward.item) {
                    this.player.inventory.addItem(reward.item);
                }
                break;

            case 'gold':
                if (typeof this.player.addGold === 'function') {
                    this.player.addGold(reward.amount || 0);
                } else {
                    this.player.gold = (this.player.gold || 0) + (reward.amount || 0);
                }
                break;

            default:
                console.warn(`[REWARD] Tipo de recompensa desconhecido: ${reward.type}`);
                return;
        }

        // Registra a recompensa resgatada
        this.world?.completeProgression(rewardFlag);

        // Se houver uma flag de desbloqueio associada à recompensa
        if (reward.flagToUnlock) {
            this.world?.completeProgression(reward.flagToUnlock);
        }
    }
}