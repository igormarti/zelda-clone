/**
 * Gerenciador de persistência de saves em localStorage
 * Suporta 3 slots de save com metadados e thumbnails
 */
export default class SaveManager {
    static SLOT_COUNT = 3;
    static SLOT_KEY_PREFIX = 'zelda-save-slot-';
    static META_KEY = 'zelda-save-meta';

    constructor(storage = window.localStorage) {
        this.storage = storage;
        this.initializeMeta();
    }

    /**
     * Inicializa metadados se não existirem
     */
    initializeMeta() {
        const existing = this.storage.getItem(SaveManager.META_KEY);
        if (!existing) {
            const initialMeta = {
                slots: Array(SaveManager.SLOT_COUNT).fill(null).map((_, i) => ({
                    index: i,
                    exists: false,
                    timestamp: null,
                    playerName: null,
                    roomName: null,
                    hp: null,
                    hasThumbnail: false
                }))
            };
            this.storage.setItem(SaveManager.META_KEY, JSON.stringify(initialMeta));
        }
    }

    /**
     * Salva snapshot no slot (0-2)
     * @param {number} slotIndex - 0, 1 ou 2
     * @param {object} snapshot - Snapshot com versão, player, world, thumbnail
     * @returns {boolean} Sucesso
     */
    save(slotIndex, snapshot) {
        if (slotIndex < 0 || slotIndex >= SaveManager.SLOT_COUNT) {
            console.error('[SAVE] Índice de slot inválido:', slotIndex);
            return false;
        }

        if (!snapshot) {
            console.error('[SAVE] Snapshot vazio');
            return false;
        }

        try {
            snapshot.slotIndex = slotIndex;
            const key = this.getSlotKey(slotIndex);
            this.storage.setItem(key, JSON.stringify(snapshot));
            this.updateMeta();
            console.log(`[SAVE] Slot ${slotIndex + 1} salvo com sucesso`);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('[SAVE] localStorage cheio');
            } else {
                console.error('[SAVE] Erro ao salvar:', error);
            }
            return false;
        }
    }

    /**
     * Carrega snapshot do slot
     * @param {number} slotIndex - 0, 1 ou 2
     * @returns {object|null} Snapshot ou null se vazio/inválido
     */
    load(slotIndex) {
        if (slotIndex < 0 || slotIndex >= SaveManager.SLOT_COUNT) {
            console.error('[LOAD] Índice de slot inválido:', slotIndex);
            return null;
        }

        try {
            const key = this.getSlotKey(slotIndex);
            const raw = this.storage.getItem(key);
            if (!raw) {
                console.log(`[LOAD] Slot ${slotIndex + 1} está vazio`);
                return null;
            }

            const snapshot = JSON.parse(raw);
            console.log(`[LOAD] Slot ${slotIndex + 1} carregado com sucesso`);
            return snapshot;
        } catch (error) {
            console.error(`[LOAD] Erro ao carregar slot ${slotIndex}:`, error);
            return null;
        }
    }

    /**
     * Verifica se slot tem save
     * @param {number} slotIndex
     * @returns {boolean}
     */
    exists(slotIndex) {
        if (slotIndex < 0 || slotIndex >= SaveManager.SLOT_COUNT) return false;
        const key = this.getSlotKey(slotIndex);
        return this.storage.getItem(key) !== null;
    }

    /**
     * Apaga um slot
     * @param {number} slotIndex
     * @returns {boolean} Sucesso
     */
    delete(slotIndex) {
        if (slotIndex < 0 || slotIndex >= SaveManager.SLOT_COUNT) {
            console.error('[DELETE] Índice de slot inválido:', slotIndex);
            return false;
        }

        try {
            const key = this.getSlotKey(slotIndex);
            this.storage.removeItem(key);
            this.updateMeta();
            console.log(`[DELETE] Slot ${slotIndex + 1} apagado`);
            return true;
        } catch (error) {
            console.error('[DELETE] Erro ao apagar:', error);
            return false;
        }
    }

    /**
     * Apaga todos os saves
     */
    clearAll() {
        try {
            for (let i = 0; i < SaveManager.SLOT_COUNT; i++) {
                const key = this.getSlotKey(i);
                this.storage.removeItem(key);
            }
            this.storage.removeItem(SaveManager.META_KEY);
            console.log('[DELETE] Todos os saves apagados');
            return true;
        } catch (error) {
            console.error('[DELETE] Erro ao apagar tudo:', error);
            return false;
        }
    }

    /**
     * Lista todos os slots com metadados
     * @returns {array} Array de metadados dos slots
     */
    listSlots() {
        try {
            const raw = this.storage.getItem(SaveManager.META_KEY);
            if (!raw) {
                this.initializeMeta();
                return this.listSlots();
            }

            const meta = JSON.parse(raw);
            return meta.slots || [];
        } catch (error) {
            console.warn('[LIST] Erro ao listar slots:', error);
            return [];
        }
    }

    /**
     * Atualiza metadados de todos os slots
     * Chamado automaticamente após save/delete
     */
    updateMeta() {
        const slots = [];
        for (let i = 0; i < SaveManager.SLOT_COUNT; i++) {
            const snapshot = this.load(i);
            slots.push({
                index: i,
                exists: !!snapshot,
                timestamp: snapshot ? snapshot.timestamp : null,
                playerName: snapshot ? snapshot.player.name : null,
                roomName: snapshot ? snapshot.world.roomName : null,
                hp: snapshot ? `${snapshot.player.health}/${snapshot.player.maxHealth}` : null,
                hasThumbnail: snapshot ? !!snapshot.thumbnail : false
            });
        }

        try {
            this.storage.setItem(SaveManager.META_KEY, JSON.stringify({ slots }));
        } catch (error) {
            console.warn('[META] Erro ao atualizar metadados:', error);
        }
    }

    /**
     * Retorna a chave de storage para um slot
     * @private
     */
    getSlotKey(index) {
        return `${SaveManager.SLOT_KEY_PREFIX}${index}`;
    }
}
