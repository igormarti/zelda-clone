import DialogManager from './classes/DialogManager.js';
import InputHandler from './classes/InputHandler.js';
import NPCManager from './classes/npcs/NPCManager.js';
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
const dialogManager = new DialogManager();

const assetCache = new Map();
function loadImage(path) {
    if (!assetCache.has(path)) {
        const image = new Image();
        image.src = path;
        assetCache.set(path, image);
    }
    return assetCache.get(path);
}

async function loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Falha ao carregar ${path}: ${response.statusText}`);
    }
    return response.json();
}

let spriteSheetImage = loadImage('assets/sprites/player-sheet.png');

async function init() {
    const npcData = await loadJSON('assets/data/npcs.json');
    const npcManager = new NPCManager(world, player, dialogManager, loadImage, npcData);

    const stateManager = new StateManager({
        player,
        world,
        input,
        canvas,
        ctx,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        FRAME_SIZE,
        spriteSheet: spriteSheetImage,
        dialogManager,
        npcManager
    });

    stateManager.changeState(MenuState);

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stateManager.update();
        stateManager.draw(ctx);
        requestAnimationFrame(gameLoop);
    }

    if (spriteSheetImage.complete) {
        gameLoop();
    } else {
        spriteSheetImage.onload = () => {
            gameLoop();
        };
    }
}

init().catch(error => {
    console.error('Erro ao iniciar o jogo', error);
});

