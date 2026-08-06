import Bow from './Bow.js';
import Sword from './Sword.js';

/**
 * Registro centralizado de "fábricas" para recriar armas a partir do id.
 *
 * Isso é necessário porque ao salvar/carregar o jogo, as instâncias
 * de armas (que contêm referências ao `owner`, ao assetManager, etc.)
 * não podem ser serializadas em JSON. Em vez disso, salvamos apenas
 * o `id` da arma e, no momento do load, reconstruímos a instância
 * usando os mesmos parâmetros que foram usados para criá-la no mundo.
 */
const WEAPON_FACTORIES = {
    // Arco inicial que aparece na Clareira Verdejante (room 0,0)
    'bow_01': (owner, context, assetManager) => new Bow(
        owner,
        { context, assetManager },
        {
            id: 'bow_01',
            name: 'Arco de Madeira',
            description: 'Arco de Madeira que consegue atingir inimigos de uma distância considerável',
            spritePath: 'assets/sprites/weapon/bow-sheet.png',
            icon: 'assets/icons/weapons/bow-icon.png'
        }
    ),
    // Espada de ferro recebida do NPC Sr. Poo
    'iron_sword_01': (owner, context, assetManager) => new Sword(
        owner,
        { context, assetManager },
        {
            id: 'iron_sword_01',
            name: 'Espada de Ferro',
            description: 'Espada de ferro pesada.',
            spritePath: 'assets/sprites/weapon/sword-simple-sheet.png',
            damage: 2,
            scale: 2,
            cooldownFrames: 20,
            offsetPrecision: 10
        }
    )
};

/**
 * Recria uma instância de arma a partir do id.
 * @param {string} id - Identificador único da arma
 * @param {object} owner - Entidade portadora (geralmente o Player)
 * @param {CanvasRenderingContext2D} context - Contexto 2D do canvas
 * @param {Function|object} assetManager - AssetManager (função ou objeto)
 * @returns {object|null} Instância da arma ou null se id desconhecido
 */
export function createWeaponById(id, owner, context, assetManager) {
    if (!id) return null;
    const factory = WEAPON_FACTORIES[id];
    if (!factory) {
        console.warn(`[WEAPON_REGISTRY] Nenhuma factory registrada para arma com id="${id}"`);
        return null;
    }
    return factory(owner, context, assetManager);
}

/**
 * Verifica se um id de arma está registrado no catálogo.
 * @param {string} id
 * @returns {boolean}
 */
export function hasWeaponFactory(id) {
    return Boolean(WEAPON_FACTORIES[id]);
}

export default { createWeaponById, hasWeaponFactory };