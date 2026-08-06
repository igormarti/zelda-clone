import ThumbnailCapture from './ThumbnailCapture.js';
import { createWeaponById } from '../weapon/WeaponRegistry.js';

/**
 * Factory para serializar e desserializar o estado completo do jogo
 * Captura e restaura: player, world, inventário, progresso, thumbnails
 */
export default class GameSnapshot {
    static VERSION = 1;

    /**
     * Captura um snapshot do estado atual do jogo
     */
    static capture(context) {
        const { player, world, canvas, ctx } = context;

        if (!player || !world) {
            console.warn('[SNAPSHOT] Contexto incompleto para capturar');
            return null;
        }

        // Captura thumbnail
        const thumbnail = ThumbnailCapture.capture(ctx, canvas);

        // Serializa estado do player
        const playerData = {
            x: player.x,
            y: player.y,
            name: player.name,
            gold: player.gold,
            health: player.stateComponent.health,
            maxHealth: player.stateComponent.maxHealth,
            state: player.stateComponent.state,
            direction: player.stateComponent.direction,
            facing: player.stateComponent.facing,
            inventory: player.inventory ? this._serializeInventory(player.inventory) : null,
            equippedWeapon: player.equipmentComponent && player.equipmentComponent.equippedWeapon
                ? this._serializeWeapon(player.equipmentComponent.equippedWeapon)
                : null
        };

        // Serializa estado do world
        const roomKey = `${world.currentRoom.x},${world.currentRoom.y}`;
        const worldData = {
            currentRoom: { ...world.currentRoom },
            roomName: (world.worldMap && world.worldMap[roomKey] && world.worldMap[roomKey].name) || 'Unknown',
            progressionFlags: Array.from(world.progressionState.entries()),
            collectedItems: this._captureCollectedItems(world),
            enemiesDefeated: this._captureEnemiesState(world)
        };

        return {
            version: this.VERSION,
            slotIndex: null,
            timestamp: Date.now(),
            thumbnail: thumbnail,
            player: playerData,
            world: worldData
        };
    }

    /**
     * Aplica um snapshot ao estado do jogo
     */
    static apply(snapshot, context) {
        if (!snapshot || snapshot.version !== this.VERSION) {
            console.warn('[SNAPSHOT] Snapshot inválido ou versão incompatível');
            return false;
        }

        try {
            const { player, world, ctx, assetManager } = context;

            // Restaura posição e estado do player
            player.x = snapshot.player.x;
            player.y = snapshot.player.y;
            player.gold = snapshot.player.gold;
            player.stateComponent.health = snapshot.player.health;
            player.stateComponent.state = snapshot.player.state;
            player.stateComponent.direction = snapshot.player.direction;
            player.stateComponent.facing = snapshot.player.facing;

            // Restaura inventário (itens e armas)
            if (snapshot.player.inventory) {
                this._restoreInventory(player.inventory, snapshot.player.inventory, player, ctx, assetManager);
            }

            // Restaura arma equipada como instância real
            if (snapshot.player.equippedWeapon && snapshot.player.equippedWeapon.id) {
                const weaponInstance = createWeaponById(
                    snapshot.player.equippedWeapon.id,
                    player,
                    ctx,
                    assetManager
                );
                if (weaponInstance) {
                    player.equipmentComponent.equipWeapon(weaponInstance);
                } else {
                    player.equipmentComponent.equippedWeapon = null;
                }
            } else {
                player.equipmentComponent.equippedWeapon = null;
            }

            // Restaura posição na world
            world.currentRoom = { ...snapshot.world.currentRoom };

            // Restaura progression flags
            world.progressionState.clear();
            snapshot.world.progressionFlags.forEach(([key, value]) => {
                world.progressionState.set(key, value);
            });

            // Restaura estado de items coletados (marca isCollected = true)
            this._restoreCollectedItems(world, snapshot.world.collectedItems);

            // Restaura estado de inimigos derrotados
            this._restoreEnemiesState(world, snapshot.world.enemiesDefeated);

            console.log('[SNAPSHOT] Restore concluído com sucesso');
            return true;
        } catch (error) {
            console.error('[SNAPSHOT] Erro ao restaurar snapshot:', error);
            return false;
        }
    }

    // ============= Helpers de Serialização =============

    static _serializeInventory(inventory) {
        return {
            items: inventory.items.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                healAmount: item.healAmount
            })),
            weapons: inventory.weapons.map(weapon => ({
                id: weapon.id,
                name: weapon.name,
                type: weapon.type,
                damage: weapon.damage
            }))
        };
    }

    static _serializeWeapon(weapon) {
        return {
            id: weapon.id,
            name: weapon.name,
            type: weapon.type,
            damage: weapon.damage
        };
    }

    static _captureCollectedItems(world) {
        const collected = [];
        const map = world.worldMap || {};
        Object.keys(map).forEach((roomKey) => {
            const room = map[roomKey];
            if (room && room.items) {
                room.items.forEach((item) => {
                    if (item.isCollected) {
                        collected.push({ roomKey: roomKey, itemId: item.id });
                    }
                });
            }
        });
        return collected;
    }

    static _captureEnemiesState(world) {
        const defeated = [];
        const map = world.worldMap || {};
        Object.keys(map).forEach((roomKey) => {
            const room = map[roomKey];
            if (room && room.enemies) {
                room.enemies.forEach((enemy) => {
                    // Captura apenas inimigos persistentes que foram derrotados.
                    // Inimigos comuns (persistent: false) são sempre resetados
                    // quando o player entra na sala, então não precisam ser salvos.
                    if (enemy.persistent && enemy.isDead && enemy.isDead()) {
                        defeated.push({ roomKey: roomKey, enemyId: enemy.id });
                    }
                });
            }
        });
        return defeated;
    }

    // ============= Helpers de Restauração =============

    static _restoreInventory(inventory, saved, player, ctx, assetManager) {
        if (!saved) return;
        // Restaura itens normais com funcionalidade onUse reconstruída
        inventory.items = (saved.items || []).map(itemData => ({
            ...itemData,
            onUse(playerRef) {
                // Reconstrói a funcionalidade de uso baseado no healAmount salvo
                if (itemData.healAmount && playerRef.health < playerRef.maxHealth) {
                    playerRef.heal(itemData.healAmount);
                    return true;
                }
                return itemData.healAmount ? false : true;
            }
        }));

        // Restaura armas como instâncias reais usando o WeaponRegistry
        const restoredWeapons = [];
        (saved.weapons || []).forEach(weaponData => {
            const weaponInstance = createWeaponById(
                weaponData.id,
                player,
                ctx,
                assetManager
            );
            if (weaponInstance) {
                restoredWeapons.push(weaponInstance);
            } else {
                // Fallback: mantém os dados brutos para não perder referência
                console.warn(`[SNAPSHOT] Não foi possível recriar arma id=${weaponData.id}`);
                restoredWeapons.push(weaponData);
            }
        });
        inventory.weapons = restoredWeapons;
    }

    static _restoreCollectedItems(world, collected) {
        if (!collected || !collected.length) return;

        const map = world.worldMap || {};
        Object.keys(map).forEach((roomKey) => {
            const room = map[roomKey];
            if (!room || !room.items) return;

            // Marca itens coletados com isCollected = true
            // Os itens permanecem no array para que o sistema de save
            // consiga detectá-los em futuras capturas, mas o Item.draw()
            // já verifica isCollected e não renderiza itens coletados.
            room.items.forEach((item) => {
                const wasCollected = collected.some(
                    (entry) => entry.roomKey === roomKey && entry.itemId === item.id
                );
                if (wasCollected) {
                    item.isCollected = true;
                }
            });
        });
    }

    static _restoreEnemiesState(world, defeated) {
        if (!defeated) return;
        const map = world.worldMap || {};

        Object.keys(map).forEach((roomKey) => {
            const room = map[roomKey];
            if (!room || !room.enemies) return;

            // Marca inimigos derrotados como mortos
            room.enemies.forEach((enemy) => {
                const wasDefeated = defeated.some(
                    (entry) => entry.roomKey === roomKey && entry.enemyId === enemy.id
                );
                if (wasDefeated) {
                    enemy.stateComponent.health = 0;
                    enemy.stateComponent.setState('die');
                }
            });
        });
    }
}