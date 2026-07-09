export default class World {
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT) {
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;
        this.currentRoom = { x: 0, y: 0 };
        this.worldMap = {
            "0,0": { name: "Floresta Inicial", color: "#4a543b" },
            "1,0": { name: "Caverna Sombria", color: "#2e3b4e" },
            "0,1": { name: "Deserto do Sul", color: "#6e3a3a" },
            "0,-1": { name: "Cemitério", color: "#5a3a6e" }
        };
        this.locationUI = { active: false, timer: 0, text: "" };
    }

    update(player) {
        // Transição de salas
        if (player.x > this.SCREEN_WIDTH) {
            this.currentRoom.x++;
            player.x = 5;
            this.triggerLocationUI();
        } else if (player.x < -player.width) {
            this.currentRoom.x--;
            player.x = this.SCREEN_WIDTH - player.width - 5;
            this.triggerLocationUI();
        } else if (player.y > this.SCREEN_HEIGHT) {
            this.currentRoom.y++;
            player.y = 5;
            this.triggerLocationUI();
        } else if (player.y < -player.height) {
            this.currentRoom.y--;
            player.y = this.SCREEN_HEIGHT - player.height - 5;
            this.triggerLocationUI();
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
            this.locationUI.text = room.name;
        } else {
            this.locationUI.text = "Entrou no além, cuidado!";
        }
        this.locationUI.timer = 300;
        this.locationUI.active = true;
    }

    draw(ctx) {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey] || { color: "#000" };
        
        // Desenha Fundo
        ctx.fillStyle = room.color;
        ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

        // Desenha UI
        if (this.locationUI.active) {
            ctx.fillStyle = this.worldMap[roomKey] ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.6)";
            ctx.fillRect(this.SCREEN_WIDTH / 2 - 150, 50, 300, 50);
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText(this.locationUI.text, this.SCREEN_WIDTH / 2, 85);
        }
    }
}