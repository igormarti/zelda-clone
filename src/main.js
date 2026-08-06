import AssetManager from './classes/AssetManager.js';
import CombatSystem from './classes/CombatSystem.js';
import DialogManager from './classes/DialogManager.js';
import InputHandler from './classes/InputHandler.js';
import { Inventory } from './classes/Inventory.js';
import NPCManager from './classes/npcs/NPCManager.js';
import Player from './classes/Player.js';
import SaveManager from './classes/persistence/SaveManager.js';
import StateManager from './classes/StateManager.js';
import MenuState from './classes/states/MenuState.js';
import World from './classes/World.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const FRAME_SIZE = 48;

const assetManager = new AssetManager();

const gameContext = {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    FRAME_SIZE,
    canvas,
    ctx,
    assetManager,
    input:null,
    inventory:null,
    player:null, 
    world:null,
    dialogManager:null,
    combatSystem:null,
}

const input = new InputHandler();
const inventory = new Inventory(8, 5);
const world = new World(SCREEN_WIDTH, SCREEN_HEIGHT);
const dialogManager = new DialogManager();
const combatSystem = new CombatSystem();
const saveManager = new SaveManager();
const player = new Player(400, 300, gameContext);

player.inventory = inventory;
world.initWorldMap(gameContext, player);

gameContext.input = input;
gameContext.inventory = inventory;
gameContext.player = player;
gameContext.world = world;
gameContext.dialogManager = dialogManager;
gameContext.combatSystem = combatSystem;
gameContext.saveManager = saveManager;



let spriteSheetImage = assetManager.loadImage('assets/sprites/player/player-sheet-without-sword-sheet_teste.png');

async function init() {
    const npcData = await assetManager.loadJSON('assets/data/npcs.json');
    const npcManager = new NPCManager(world, player, dialogManager, assetManager.loadImage.bind(assetManager), npcData);

    const stateManager = new StateManager({
        ...gameContext,
        spriteSheet: spriteSheetImage,
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

