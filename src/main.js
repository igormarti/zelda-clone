import InputHandler from './classes/InputHandler.js';
import Player from './classes/Player.js';
import StateManager from './classes/StateManager.js';
import MenuState from './classes/states/MenuState.js';
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

// Instancia o StateManager com contexto compartilhado
const stateManager = new StateManager({
    player,
    world,
    input,
    canvas,
    ctx,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    FRAME_SIZE,
    spriteSheet: spriteSheetImage
});

// Inicia no MenuState
stateManager.changeState(MenuState);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Delegação para o StateManager
    stateManager.update();
    stateManager.draw(ctx);
    
    requestAnimationFrame(gameLoop);
}

spriteSheetImage.onload = () => {
    gameLoop();
};