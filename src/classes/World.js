import Door from './Door.js';
import Enemy from './Enemy.js';
import Environment from './Environment.js';
import { HeartItem } from './items/HeartItem.js';
import { InventoryItem } from './items/InventoryItem.js';

export default class World {
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT) {
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;
        this.currentRoom = { x: 0, y: 0 };
        this.progressionState = new Map();
        this.worldMap = {
            "0,0": {
                name: "Floresta Inicial",
                color: "#4a543b",
                obstacles: [
                    { x: 120, y: 100, width: 80, height: 80 },
                    { x: 520, y: 300, width: 110, height: 90 }
                ],
                doors: [
                    new Door(790, 220, 10, 100, "1,0", { x: 0, y: 200 }),
                    new Door(360, 0, 100, 10, "0,-1", { x: 350, y: 504 }),
                    new Door(360, 590, 100, 10, "0,1", { x: 350, y: 0 })
                ],
                enemies: [
                    new Enemy({ x: 240, y: 220, maxHealth: 3, attackDamage: 1 , collisionBox:{ x: 32, y: 58, width: 32, height: 30 }}),
                ], 
                items: [
                    new InventoryItem(100, 100, "health_potion", "Poção de Saúde", null, "#ff0000")
                ]
            },
            "1,0": { name: "Caverna Sombria", color: "#2e3b4e", obstacles: [], doors: [
                new Door(0, 220, 10, 100, "0,0", { x: 725, y: 220 })
            ], enemies: [],
             items: [
                new InventoryItem(200, 200, "mana_potion", "Poção de Mana", null, "#0000ff"),
                new HeartItem(300, 300, 16, 16, 1)
             ]
        },
            "0,1": { name: "Deserto do Sul", color: "#6e3a3a", obstacles: [], doors: [
                new Door(350, 0, 100, 10, "0,0", { x: 350, y: 485 })
            ], enemies: [], items: []},
            "0,-1": { name: "Cemitério", color: "#5a3a6e", obstacles: [
                 { x: 120, y: 100, width: 80, height: 80 },
                 { x: 600, y: 100, width: 80, height: 80 },
                 { x: 120, y: 400, width: 80, height: 80 },
                 { x: 600, y: 400, width: 80, height: 80 }
            ], doors: [
                new Door(350, 590, 100, 10, "0,0", { x: 370, y: 0 }, {
                    requiresProgression: { roomKey: '0,-1', interactionId: 'cemiterio_srpoo_01' }
                }),
            ], enemies: [], items: [
                new InventoryItem(200, 200, "soul_gem", "Gema da Alma", null, "#00ff00")
            ]}
        };
        this.locationUI = { active: false, timer: 0, text: "" };
    }

    update(player) {
        if (player.doorCooldown > 0) {
            player.doorCooldown--;
        } else {
            const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
            const room = this.worldMap[roomKey] || { doors: [] };

            for (const door of room.doors) {
                if (door.requiresProgression && !this.isProgressionCompleted(door.requiresProgression)) {
                    continue;
                }

                if (door.intersects(player, this)) {
                    const [targetX, targetY] = door.targetRoomKey.split(',').map(Number);
                    this.currentRoom.x = targetX;
                    this.currentRoom.y = targetY;
                    player.x = door.spawnPoint.x;
                    player.y = door.spawnPoint.y;
                    player.doorCooldown = 20;

                    if(Environment.isDeveloperMode()){
                        console.log(`Transição de sala para ${door.targetRoomKey}`);
                        console.log(`Posição do jogador após a transição: (${player.x}, ${player.y})`);
                    }

                    this.triggerLocationUI();
                    return;
                }
            }

            for(const item of room.items || []) {
                room.items = room.items.filter(item => this.updateItems(player, item));
            }

            
        }

        // Timer da UI
        if (this.locationUI.active) {
            this.locationUI.timer--;
            if (this.locationUI.timer <= 0) this.locationUI.active = false;
        }
    }

    getRoomEnemies() {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey] || { enemies: [] };
        return room.enemies || [];
    }

    completeProgression(roomKey, interactionId) {
        if (!roomKey || !interactionId) {
            return;
        }

        this.progressionState.set(`${roomKey}:${interactionId}`, true);
    }

    isProgressionCompleted(requirement) {
        if (!requirement) {
            return true;
        }

        const roomKey = typeof requirement === 'string' ? requirement : requirement.roomKey;
        const interactionId = typeof requirement === 'string' ? null : requirement.interactionId;

        if (!roomKey || !interactionId) {
            return true;
        }

        return this.progressionState.has(`${roomKey}:${interactionId}`);
    }

    reset() {
        this.currentRoom = { x: 0, y: 0 };
        this.progressionState.clear();
        this.locationUI = { active: false, timer: 0, text: "" };
    }

    triggerLocationUI() {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey];
        if (room) {
            this.locationUI.text = `${room.name} - região ${this.currentRoom.x} | ${this.currentRoom.y}`;
        } else {
            this.locationUI.text = "Entrou no além, cuidado!";
        }
        this.locationUI.timer = 300;
        this.locationUI.active = true;
    }

    isPositionBlocked(x, y, width, height) {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey] || { obstacles: [] };

        if(Environment.isDeveloperMode()){
            const collision = room.obstacles.some(obstacle => this.rectsOverlap(x, y, width, height, obstacle.x, obstacle.y, obstacle.width, obstacle.height));
            if(collision){
                console.log(`Colisão detectada com um obstáculo na sala ${roomKey} para retângulo (${x}, ${y}, ${width}, ${height})`);
            }
            return collision;
        } 
        return room.obstacles.some(obstacle => this.rectsOverlap(x, y, width, height, obstacle.x, obstacle.y, obstacle.width, obstacle.height)); 
    }

    rectsOverlap(x1, y1, width1, height1, x2, y2, width2, height2) {
        return x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && y1 + height1 > y2;
    }

    // Dentro do método de atualização/colisão do cenário ou loop principal:
    updateItems(player, item) {

        if (this.rectsOverlap(player.x, player.y, player.width, player.height, item.x, item.y, item.width, item.height)) {
            // Delegação polimórfica: o item decide o que fazer com o player
            const collected = item.onCollect(player);
            // Se coletou com sucesso, retorna false para remover do array do mapa
            return !collected;
        }
        return true;
        
    }

    draw(ctx) {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey] || { color: "#000", obstacles: [], doors: [] };
        
        // Desenha Fundo
        ctx.fillStyle = room.color;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Desenha obstáculos
        ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
        (room.obstacles || []).forEach(obstacle => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        // Desenha itens
        (room.items || []).forEach(item => {
            if (item && typeof item.draw === 'function') {
                item.draw(ctx);
            }
        });

        // Desenha portas
        (room.doors || []).forEach(door => {
            const isLocked = Boolean(door.requiresProgression) && !this.isProgressionCompleted(door.requiresProgression);
            ctx.fillStyle = isLocked ? '#4f3b2a' : '#7c4a1d';
            ctx.fillRect(door.x, door.y, door.width, door.height);
        });

        // Desenha inimigos
        (room.enemies || []).forEach(enemy => {
            if (enemy && typeof enemy.draw === 'function') {
                enemy.draw(ctx);
            }
        });

        // Desenha UI
        if (this.locationUI.active) {
            ctx.fillStyle = this.worldMap[roomKey] ? "rgba(159, 157, 157, 0.4)" : "rgba(235, 233, 233, 0.4)";
            ctx.fillRect(this.SCREEN_WIDTH / 2 - 390, 10, 300, 50);
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText(this.locationUI.text, this.SCREEN_WIDTH / 2 -250, 40);
        }
    }
}