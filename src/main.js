import Player from './classes/Player.js';
import InputHandler from './classes/InputHandler.js';
import World from './classes/World.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const FRAME_SIZE = 48;

const input = new InputHandler();
const player = new Player();
const world = new World(SCREEN_WIDTH, SCREEN_HEIGHT);

let spriteSheetImage = new Image();
spriteSheetImage.src = 'assets/sprites/player-sheet.png';

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Atualização
    player.update(input.keys);
    world.update(player);
    
    // Desenho
    world.draw(ctx);
    if (spriteSheetImage.complete) {
        player.draw(ctx, spriteSheetImage, FRAME_SIZE);
    }
    
    requestAnimationFrame(gameLoop);
}

spriteSheetImage.onload = () => {
    gameLoop();
};