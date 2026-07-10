import Door from './Door.js';
import Environment from './Enviroment.js';

export default class World {
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT) {
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;
        this.currentRoom = { x: 0, y: 0 };
        this.worldMap = {
            "0,0": {
                name: "Floresta Inicial",
                color: "#4a543b",
                obstacles: [
                    { x: 120, y: 100, width: 80, height: 80 },
                    { x: 520, y: 300, width: 110, height: 90 }
                ],
                doors: [
                    new Door(790, 220, 10, 100, "1,0", { x: -18, y: 200 }),
                    new Door(360, 0, 100, 10, "0,-1", { x: 350, y: 504 }),
                    new Door(360, 590, 100, 10, "0,1", { x: 350, y: -45 })
                ]
            },
            "1,0": { name: "Caverna Sombria", color: "#2e3b4e", obstacles: [], doors: [
                new Door(0, 220, 10, 100, "0,0", { x: 725, y: 220 })
            ] },
            "0,1": { name: "Deserto do Sul", color: "#6e3a3a", obstacles: [], doors: [
                new Door(350, 0, 100, 10, "0,0", { x: 350, y: 496 })
            ] },
            "0,-1": { name: "Cemitério", color: "#5a3a6e", obstacles: [], doors: [
                new Door(350, 590, 100, 10, "0,0", { x: 370, y: -41 }),
            ] }
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
                if (door.intersects(player)) {
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
        }

        // Timer da UI
        if (this.locationUI.active) {
            this.locationUI.timer--;
            if (this.locationUI.timer <= 0) this.locationUI.active = false;
        }
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

        // Desenha portas
        ctx.fillStyle = "#7c4a1d";
        (room.doors || []).forEach(door => {
            ctx.fillRect(door.x, door.y, door.width, door.height);
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