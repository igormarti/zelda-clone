const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Desativa suavização para manter o aspecto Pixel Art nítido
ctx.imageSmoothingEnabled = false;

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const FRAME_SIZE = 48;
const SCALE_FACTOR = 2; // Tamanho final do sprite: 96px
const IS_DEVELOPMENT = true; // Ative para ver logs detalhados

const player = {
    x: 400, y: 300,
    width: FRAME_SIZE * SCALE_FACTOR,
    height: FRAME_SIZE * SCALE_FACTOR,
    speed: 1.5,
    state: 'idle',      // 'idle', 'move', 'attack', 'die'
    direction: 'front', // 'front', 'back', 'side'
    facing: 'right',    // 'right', 'left' (usado para espelhar)
    currentFrame: 0,
    animationSpeed: 10,
    animationTimer: 0
};

// ---- CONFIGURAÇÃO DO MUNDO ----
let currentRoom = { x: 0, y: 0 };

const worldMap = {
    "0,0": { name: "Floresta Inicial", color: "#4a543b" },
    "1,0": { name: "Caverna Sombria", color: "#2e3b4e" },
    "0,1": { name: "Deserto do Sul", color: "#6e3a3a" },
    "0,-1": { name: "Cemitério", color: "#5a3a6e" }
};

// Gerenciador da UI de Localização
const locationUI = {
    active: false,
    timer: 0,
    text: ""
};

// Mapeamento exato das linhas do seu Sprite Sheet
// Linhas: 0-2 (Idle), 3-5 (Move), 6-8 (Attack), 9 (Death)
function getAnimationConfig(state, direction) {
    if (state === 'die') return { row: 9, frames: 3 };

    const map = {
        'idle':   { 'front': {row: 0, frames: 6}, 'side': {row: 1, frames: 6}, 'back': {row: 2, frames: 6} },
        'move':   { 'front': {row: 3, frames: 6}, 'side': {row: 4, frames: 6}, 'back': {row: 5, frames: 6} },
        'attack': { 'front': {row: 6, frames: 4}, 'side': {row: 7, frames: 4}, 'back': {row: 8, frames: 4} }
    };
    
    return map[state][direction];
}

const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function update() {
    if (player.state === 'die') return;

    // Se estiver atacando, trava o estado até terminar a animação
    if (player.state === 'attack') {
        player.animationTimer++;
        if (player.animationTimer >= player.animationSpeed) {
            player.animationTimer = 0;
            player.currentFrame++;
            const config = getAnimationConfig('attack', player.direction);
            if (player.currentFrame >= config.frames) {
                player.state = 'idle';
                player.currentFrame = 0;
            }
        }
        return;
    }

    // Lógica de Movimento
    let isMoving = false;
    if (keys['w'] || keys['ArrowUp'])    { player.y -= player.speed; player.direction = 'back'; isMoving = true; }
    else if (keys['s'] || keys['ArrowDown'])  { player.y += player.speed; player.direction = 'front'; isMoving = true; }
    else if (keys['a'] || keys['ArrowLeft'])  { player.x -= player.speed; player.direction = 'side'; player.facing = 'left'; isMoving = true; }
    else if (keys['d'] || keys['ArrowRight']) { player.x += player.speed; player.direction = 'side'; player.facing = 'right'; isMoving = true; }

    // Gatilho de Ataque
    if (keys[' ']) {
        player.state = 'attack';
        player.currentFrame = 0;
        return;
    }

    player.state = isMoving ? 'move' : 'idle';

    // Timer de Animação
    player.animationTimer++;
    if (player.animationTimer >= player.animationSpeed) {
        player.animationTimer = 0;
        const config = getAnimationConfig(player.state, player.direction);
        player.currentFrame = (player.currentFrame + 1) % config.frames;
    }

    // --- NOVA LÓGICA DE TRANSIÇÃO DE SALA ---
    if (player.x > SCREEN_WIDTH) { // Saiu pela direita
        currentRoom.x++;
        player.x = 5; // Aparece no lado esquerdo da nova tela
        triggerLocationUI();
    } else if (player.x < -player.width) { // Saiu pela esquerda
        currentRoom.x--;
        player.x = SCREEN_WIDTH - player.width - 5;
        triggerLocationUI();
    } else if (player.y > SCREEN_HEIGHT) { // Saiu por baixo
        currentRoom.y++;
        player.y = 5;
        triggerLocationUI();
    } else if (player.y < -player.height) { // Saiu por cima
        currentRoom.y--;
        player.y = SCREEN_HEIGHT - player.height - 5;
        triggerLocationUI();
    }

    // --- LÓGICA DA UI DE LOCALIZAÇÃO ---
    if (locationUI.active) {
        locationUI.timer--;
        if (locationUI.timer <= 0) locationUI.active = false;
    }

    function triggerLocationUI() {
        const roomKey = `${currentRoom.x},${currentRoom.y}`;
        const room = worldMap[roomKey];
        
        if (room) {
            locationUI.text = room.name;
            locationUI.timer = 300; // 5 segundos (60 FPS * 5)
            locationUI.active = true;
        }else{
            locationUI.text = "Entrou no além, cuidado!";
            locationUI.timer = 300;
            locationUI.active = true;
        }
    }
}

let spriteSheetImage;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Limpa e desenha o fundo da sala atual
    const roomKey = `${currentRoom.x},${currentRoom.y}`;
    const room = worldMap[roomKey] || { color: "#000" }; // Preto caso caia no além
    ctx.fillStyle = room.color;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (!spriteSheetImage || !spriteSheetImage.complete) return;

    const config = getAnimationConfig(player.state, player.direction);
    const sx = player.currentFrame * FRAME_SIZE; 
    const sy = config.row * FRAME_SIZE; 

    if (IS_DEVELOPMENT) {
        console.log(`Desenhando frame: ${player.currentFrame}, linha: ${config.row}, estado: ${player.state}, direção: ${player.direction}, olhando para: ${player.facing}`);
        console.log('sx:', sx, 'sy:', sy, 'player.x:', player.x, 'player.y:', player.y);
    }
    // Espelha apenas se estiver na direção 'side' e olhando para a esquerda
    const shouldFlip = (player.direction === 'side' && player.facing === 'left');

    ctx.save();
    if (shouldFlip) {
        // Inverte o eixo X
        ctx.scale(-1, 1);
        ctx.drawImage(
            spriteSheetImage, sx, sy, FRAME_SIZE, FRAME_SIZE,
            -(player.x + player.width), player.y, player.width, player.height
        );
    } else {
        ctx.drawImage(
            spriteSheetImage, sx, sy, FRAME_SIZE, FRAME_SIZE,
            player.x, player.y, player.width, player.height
        );
    }
    ctx.restore();

    // 2. Desenha a UI de localização (Se estiver ativa)
    if (locationUI.active) {
        ctx.fillStyle = worldMap[roomKey] ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.6)"; // Fundo semi-transparente
        ctx.fillRect(SCREEN_WIDTH / 2 - 150, 50, 300, 50);
        
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(locationUI.text, SCREEN_WIDTH / 2, 85);
    }
}

function loadAssets(callback) {
    spriteSheetImage = new Image();
    spriteSheetImage.src = 'sprites/player-sheet.png';
    spriteSheetImage.onload = callback;
}

loadAssets(() => {
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
});