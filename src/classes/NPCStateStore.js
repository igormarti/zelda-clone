export default class NPCStateStore {
    constructor(storage = window.localStorage) {
        this.storage = storage;
    }

    load(key) {
        if (!key) return null;
        const raw = this.storage.getItem(key);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch (error) {
            console.warn(`NPCStateStore: falha ao desserializar ${key}`, error);
            return null;
        }
    }

    save(key, state) {
        if (!key) return;
        try {
            this.storage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`NPCStateStore: falha ao salvar ${key}`, error);
        }
    }

    remove(key) {
        if (!key) return;
        this.storage.removeItem(key);
    }
}
