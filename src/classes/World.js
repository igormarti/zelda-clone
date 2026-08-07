import Chest from './Chest.js';
import Door from './Door.js';
import Enemy from './Enemy.js';
import Environment from './Environment.js';
import { TileGenerator } from './generators/TileGenerator.js';
import { HeartItem } from './items/HeartItem.js';
import { InventoryItem } from './items/InventoryItem.js';
import { WeaponItem } from './items/WeaponItem.js';
import SacredTree from './SacredTree.js';
import SignPost from './SignPost.js';
import Bow from './weapon/Bow.js';

export default class World {
    constructor(SCREEN_WIDTH, SCREEN_HEIGHT) {
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;
        this.currentRoom = { x: 0, y: 0 };
        this.progressionState = new Map();
        this.projectiles = [];
        this.worldMap =  null;
        this.locationUI = { active: false, timer: 0, text: "" };

        this.tileGenerator = new TileGenerator();
        // Carrega a folha de blocos baixada (tileset original para sala inicial)
        this.tileset = new Image();
        this.tileset.src = 'assets/tilesets/Legend of Memore Tileset.png';

        // Tileset SVG novo para todas as outras salas
        this.worldTileset = new Image();
        this.worldTileset.src = 'assets/tilesets/world-tileset.svg';

        // Tilesets temáticos por bioma (backgrounds completos 800x600)
        this.caveTileset = new Image();
        this.caveTileset.src = 'assets/tilesets/cave-tileset.svg';
        this.desertTileset = new Image();
        this.desertTileset.src = 'assets/tilesets/desert-tileset.svg';
        this.cemeteryTileset = new Image();
        this.cemeteryTileset.src = 'assets/tilesets/cemetery-tileset.svg';
        this.tileMap = {
            // [Coluna, Linha] baseados na imagem
            'big_grass_0':      [8, 0],
            'dirt_patch':       [12, 6],
            'dirt_patch_1':     [13, 6],
            'dirt_patch_2':     [12, 7],
            'dirt_patch_3':     [13, 7],
            'flower_red_top_left':     [15, 4, 0, 0, 8],
            'flower_blue_top_right':    [15, 4, 8, 0, 8],
            'flower_pink_bottom_left':  [15, 4, 0, 8, 8],
            'mushroom_bottom_right': [15, 4, 8, 8, 8],
            'flower_set':       [15, 4],
            'flower_set_1':      [15, 3],
            'signpost':         [16, 4],
            'fence_v':          [14, 1],
            'fence_h':          [16, 0],
            'fence_r':          [15, 1],
            'water':            [12, 2],
            'grass_border_with_soil_y': [8, 5],
            'grass_border_x': [1, 3],
            'grass_border_y': [0, 0],
            
            // Elementos maiores (definimos a coluna e linha onde começam)
            'tree_trunk':       [14, 9],
            'tree_top_green':   [16, 5],
            'tree_top_orange':  [14, 5],
            'chest_closed_green':     [17, 13],
            'chest_open_green':     [17, 14],
            'chest_closed_red':     [17, 15],
            'chest_open_red':     [17, 16],
            'chest_closed_blue':     [17, 17],
            'chest_open_blue':     [17, 18],
        };
        
        this.TILE_SIZE = 16; // Tamanho original do asset pack
    }

    initWorldMap(gameContext, player){
        this.worldMap = {
            "0,0": {
                name: "Clareira Verdejante",
                color: "#548a3c", // Cor de fundo verde-grama correspondente à paleta

                // Detalhes estéticos do chão pelos quais o player passa livremente por cima
                floorDecorations: [
                    {type: 'grass', x: 0, y:0, width: 800, height: 600},
                    this.tileGenerator.generate(
                        {   
                            config: { type: 'big_grass_0', x: 120, y:400, width: 64, height: 64, drawMode:'x'},
                            quantity: 1
                        }
                    ),
                    ...this.tileGenerator.generate(
                        {   
                            config: { type: 'dirt_patch', x: 375, y: 0, width: 70, height: 60, drawMode:'y'},
                            quantity: 10
                        }
                    ),
                    ...this.tileGenerator.generate(
                        {   
                            config: { type: 'dirt_patch', x: 120, y: 240, width: 100, height: 60},
                            quantity: 7
                        }
                    ),
                    {type: 'dirt_patch_1', x: 125, y: 240, width: 32, height: 32},
                    {type: 'dirt_patch_2', x: 125, y: 245, width: 32, height: 32},
                    {type: 'dirt_patch_3', x: 405, y: 245, width: 32, height: 32},
                    {type: 'dirt_patch_1', x: 405, y: 248, width: 32, height: 32},
                    {type: 'dirt_patch_2', x: 400, y: 248, width: 32, height: 32},
                    {type: 'dirt_patch_1', x: 410, y: 250, width: 32, height: 32},
                    { type: 'flower_set', x: 120, y: 150 },
                    { type: 'flower_set_1', x: 140, y: 160 },
                    { type: 'flower_blue_top_right', x: 300, y: 160 },
                    { type: 'water', x: 0, y: 0 , width: 70, height: 600 },
                    ...this.tileGenerator.generate(
                        {   
                            config: { type: 'grass_border_with_soil_y',  x: 60, y: 0,  width: 16, height: 16, drawMode: 'y' },
                            quantity: 38
                        }
                    ),
                ],

                // Objetos físicos. O player vai colidir contra estas coordenadas!
                obstacles: [
                    // Tronco da árvore sólida no chão
                    { type: 'tree_trunk', x: 200, y: 120, width: 64, height: 48 , collisionBox:{x: 210, y: 130, width: 48, height: 32}}, 
                    { type: 'tree_trunk', x: 615, y: 38, width: 32, height: 32 , drawMode: 'y',  collisionBox:{x: 615, y: 38, width: 32, height: 32}},
                    { type: 'tree_trunk', x: 680, y: 38, width: 32, height: 32 , drawMode: 'y',  collisionBox:{x: 680, y: 38, width: 32, height: 32}},
                    { type: 'tree_trunk', x: 745, y: 38, width: 32, height: 32 , drawMode: 'y',  collisionBox:{ x: 745, y: 38, width: 32, height: 32}},
                    { type: 'tree_trunk', x: 615, y: 80, width: 32, height: 32 , drawMode: 'y',  collisionBox:{x: 615, y: 80, width: 32, height: 32}},
                    { type: 'tree_trunk', x: 615, y: 130, width: 32, height: 32 , drawMode: 'y',  collisionBox:{x: 615, y: 130, width: 32, height: 32}},
                    { type: 'tree_trunk', x: 745, y: 78, width: 32, height: 32 , drawMode: 'y',  collisionBox:{x: 745, y: 78, width: 32, height: 32}},
                    { type: 'tree_trunk', x: 748, y: 136, width: 32, height: 32 , drawMode: 'y',  collisionBox:{x: 748, y: 136, width: 32, height: 32}},
                    ...this.tileGenerator.generate(
                        {   
                            config: { type: 'grass_border_x',  x: 120, y: 300,  width: 64, height: 32, drawMode: 'x' },
                            quantity: 4,
                            collisionBox:{ x: 10, y: 10,  width: 40, height: 16}
                        }
                    ),
                    // Cerca fechando uma área de perigo
                     ...this.tileGenerator.generate(
                        {   
                            config: { type: 'fence_h', x: 118, y: 200, width: 32, height: 32 },
                            collisionBox: {x:5, y: 5,  width: 28, height: 12 },
                            quantity: 8
                        }
                    ),
                     ...this.tileGenerator.generate(
                        {   
                            config: { type: 'fence_h', x: 450, y: 200, width: 32, height: 32 },
                            collisionBox: {x:5, y: 5, width: 28, height: 12 },
                            quantity: 11
                        }
                    ),
                    ...this.tileGenerator.generate(
                        {   
                            config: { type: 'fence_r', x: 75, y: 0, drawMode: 'y' },
                            collisionBox: {x:5, y: 5, width: 12, height: 26 },
                            quantity: 19
                        }
                    ),
                    new SignPost(700,280, 32, 32 , [
                        ' Seguindo para o Norte - Cemitério',
                        ' Seguindo para o Sul - Deserto de MassaLand',
                    ]),
                    new Chest(680, 65, 32, 32, 'red', { type: 'gold', amount: 10 }),
                ],

                // Copas projetadas. Ficam desenhadas acima do Player e dos inimigos!
                overlays: [
                    // Posicionadas ligeiramente acima do tronco (Y menor) para cobrir o topo
                    { type: 'tree_top_green', x: 192, y: 70, width: 80, height: 100 },
                    { type: 'tree_top_orange', x: 592, y: 0, width: 80, height: 80 },
                    { type: 'tree_top_orange', x: 655, y: 0, width: 80, height: 80 },
                    { type: 'tree_top_orange', x: 725, y: 0, width: 80, height: 80 },
                    { type: 'tree_top_orange', x: 592, y: 45, width: 80, height: 80 },
                    { type: 'tree_top_orange', x: 592, y: 95, width: 80, height: 80 },
                    { type: 'tree_top_orange', x: 725, y: 48, width: 80, height: 80 },
                    { type: 'tree_top_orange', x: 725, y: 100, width: 80, height: 80 },
                ],
                doors: [
                    new Door(790, 220, 10, 100, "1,0", { x: 0, y: 200 }, { requiresProgression: [
                    { type: 'equipped', id: 'received_iron_sword_from_srpoo', EquippedID:'iron_sword_01' },
                    { type: 'flag', id: 'conversed_srpoo_01' }
                 ]}),
                    new Door(360, 0, 100, 10, "0,-1", { x: 350, y: 504 }),
                    new Door(360, 590, 100, 10, "0,1", { x: 350, y: 0 }, { requiresProgression: [
                    { type: 'equipped', id: 'received_iron_sword_from_srpoo', EquippedID:'iron_sword_01' },
                    { type: 'flag', id: 'conversed_srpoo_01' }
                 ]})
                ],
                enemies: [
                ],
                items: [
                    new InventoryItem(745, 10,'health_potion_01', "health_potion", "Poção de Saúde", 3, null, "#ff0000"),
                    new WeaponItem(540, 25, 32, 32, 
                        new Bow(player, {context:gameContext.ctx, assetManager: gameContext.assetManager}, 
                            {
                                id: 'bow_01',
                                name: 'Arco de Madeira',
                                description: "Arco de Madeira que consegue atingir inimigos de uma distância considerável",
                                spritePath: 'assets/sprites/weapon/bow-sheet.png',
                                icon: 'assets/icons/weapons/bow-icon.png'
                            }
                        )
                    )
                ]
            },
            "1,0": { name: "Caverna Sombria", color: "#2e3b4e", backgroundTileset: this.caveTileset, obstacles: [
                new SacredTree(400, 280, 48, 64, [
                    "A Árvore Sagrada pulsa com uma energia ancestral.",
                    "Pressione X para registrar seu progresso aqui."
                ])
            ], doors: [
                new Door(0, 220, 10, 100, "0,0", { x: 725, y: 220 })
            ], enemies: [
                new Enemy({
                    x: 450, y: 300,
                    maxHealth: 4, attackDamage: 1,
                    collisionBox: { x: 32, y: 58, width: 32, height: 30 },
                    aiType: 'patrol_random',
                    speed: 0.7,
                    detectionRange: 100,
                    spriteSheet: 'assets/sprites/enemies/slime.svg',
                    spriteFrames: 4,
                    gameContext
                }),
                new Enemy({
                    x: 680, y: 150,
                    maxHealth: 5, attackDamage: 2,
                    collisionBox: { x: 32, y: 58, width: 32, height: 30 },
                    aiType: 'patrol_linear',
                    patrolAxis: 'horizontal',
                    speed: 0.9,
                    detectionRange: 110,
                    spriteSheet: 'assets/sprites/enemies/red-skeleton.svg',
                    spriteFrames: 4,
                    gameContext
                })
            ],
             items: [
                new InventoryItem(200, 200, 'mana_potion_01', "mana_potion", "Poção de Mana", 2, null, "#0000ff"),
                new HeartItem(300, 300, 16, 16, 1)
             ]
        },
            "0,1": { name: "Deserto do Sul", color: "#6e3a3a", backgroundTileset: this.desertTileset, obstacles: [], doors: [
                new Door(350, 0, 100, 10, "0,0", { x: 350, y: 485 })
            ], enemies: [
                new Enemy({
                    x: 200, y: 350,
                    maxHealth: 3, attackDamage: 1,
                    collisionBox: { x: 32, y: 58, width: 32, height: 30 },
                    aiType: 'patrol_linear',
                    patrolAxis: 'horizontal',
                    speed: 1,
                    detectionRange: 90,
                    spriteSheet: 'assets/sprites/enemies/slime.svg',
                    spriteFrames: 4,
                    gameContext
                }),
                new Enemy({
                    x: 550, y: 450,
                    maxHealth: 4, attackDamage: 2,
                    collisionBox: { x: 32, y: 58, width: 32, height: 30 },
                    aiType: 'patrol_random',
                    speed: 0.8,
                    detectionRange: 100,
                    spriteSheet: 'assets/sprites/enemies/red-skeleton.svg',
                    spriteFrames: 4,
                    gameContext
                })
            ], items: []},
            "0,-1": { name: "Cemitério", color: "#5a3a6e", backgroundTileset: this.cemeteryTileset, obstacles: [
                 { x: 120, y: 100, width: 80, height: 80 },
                 { x: 600, y: 100, width: 80, height: 80 },
                 { x: 120, y: 400, width: 80, height: 80 },
                 { x: 600, y: 400, width: 80, height: 80 }
            ], doors: [
                new Door(350, 590, 100, 10, "0,0", { x: 370, y: 0 }),
            ], enemies: [
                new Enemy({
                    x: 350, y: 250,
                    maxHealth: 5, attackDamage: 2,
                    collisionBox: { x: 32, y: 58, width: 32, height: 30 },
                    aiType: 'patrol_random',
                    speed: 0.6,
                    detectionRange: 130,
                    spriteSheet: 'assets/sprites/enemies/red-skeleton.svg',
                    spriteFrames: 4,
                    gameContext
                }),
                new Enemy({
                    x: 500, y: 300,
                    maxHealth: 3, attackDamage: 1,
                    collisionBox: { x: 32, y: 58, width: 32, height: 30 },
                    aiType: 'patrol_linear',
                    patrolAxis: 'vertical',
                    speed: 0.8,
                    detectionRange: 90,
                    spriteSheet: 'assets/sprites/enemies/slime.svg',
                    spriteFrames: 4,
                    gameContext
                }),

                  // 1. Inimigo Estático (Tipo Padrão) - RENASCE SEMPRE
                    new Enemy({
                        x: 200, y: 40,
                        maxHealth: 3, attackDamage: 1 ,
                        collisionBox:{ x: 32, y: 58, width: 32, height: 30 },
                        aiType: 'stationary', 
                        gameContext,
                        spriteSheet: 'assets/sprites/enemies/slime.svg',
                        spriteFrames: 4,
                        persistent: false
                    }),

                    // 2. Inimigo de Patrulha Horizontal - PERSISTENTE (chefe local)
                    // Uma vez derrotado, permanece morto mesmo após save/load.
                    new Enemy({
                        x: 460, y: 300,
                        maxHealth: 3, attackDamage: 1 ,
                        collisionBox:{ x: 32, y: 58, width: 32, height: 30 },
                        aiType: 'patrol_linear', 
                        patrolAxis: 'horizontal', 
                        speed: 1, 
                        gameContext,
                        spriteSheet: 'assets/sprites/enemies/slime.svg',
                        spriteFrames: 4,
                        persistent: true
                    }),

                    // 2b. Inimigo de Patrulha Vertical (em um corredor por exemplo) - RENASCE SEMPRE
                    new Enemy({
                        x: 500, y: 550,
                        maxHealth: 3, attackDamage: 1 ,
                        collisionBox:{ x: 32, y: 58, width: 32, height: 30 },
                        aiType: 'patrol_linear', 
                        patrolAxis: 'vertical', 
                        speed: 1, 
                        gameContext,
                        detectionRange: 110,
                        spriteSheet: 'assets/sprites/enemies/red-skeleton.svg',
                        spriteFrames: 4,
                        persistent: false
                    }),

                    // 3. Inimigo Vagante/Aleatório - PERSISTENTE (chefe local)
                    // Uma vez derrotado, permanece morto mesmo após save/load.
                    new Enemy({
                        x: 550, y: 250,
                        maxHealth: 3, attackDamage: 1 ,
                        collisionBox:{ x: 32, y: 58, width: 32, height: 30 },
                        aiType: 'patrol_random',
                        speed: 0.8,
                        detectionRange: 120, // Raio de visão maior!
                        gameContext ,
                        spriteSheet: 'assets/sprites/enemies/red-skeleton.svg',
                        spriteFrames: 4,
                        persistent: true
                    })
            ], items: [
                new InventoryItem(200, 200, 'soul_gem_01', "soul_gem", "Gema da Alma", 2, null, "#00ff00")
            ]}
        };
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }


    /**
     *  Sala tem objetos para o player interagir
    */
    hasObjectForInteractInCurrentRoom(){
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey];
        if (!room) return false;

        const objects = room.obstacles.filter((o) => 
            o instanceof Chest || o instanceof SignPost || o instanceof SacredTree
        );

        return objects.length > 0;
    }

    /**
     * Procura por baús próximos ao jogador ao pressionar Interagir (E / Enter)
     */
    interactWithChests(player) {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey];
        if (!room) return false;

        const cheests = room.obstacles.filter((o) => o instanceof Chest);

        if(cheests.length < 1) return false;

        for (const chest of cheests) {
            if (chest.isPlayerNearby(player) && !chest.isOpen) {
                return chest.open(player);
            }
        }
        return false;
    }

    /**
     * Procura por placas próximas ao jogador ao pressionar Interagir (E / Enter)
     */
    interactWithSignPost(player) {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey];
        if (!room) return false;

        const signposts = room.obstacles.filter((o) => o instanceof SignPost);

        if(signposts.length < 1) return false;

        for (const signpost of signposts) {
            if (signpost.isPlayerNearby(player)) {
                return signpost.message;
            }
        }
        return false;
    }

    /**
     * Procura por Árvore Sagrada próxima ao jogador
     * Retorna true se encontrou e o player está perto
     */
    interactWithSacredTree(player) {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey];
        if (!room) return false;

        const trees = room.obstacles.filter((o) => o instanceof SacredTree);

        if(trees.length < 1) return false;

        for (const tree of trees) {
            if (tree.isPlayerNearby(player)) {
                return true;
            }
        }
        return false;
    }

    getRoomEnemies() {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey] || { enemies: [] };
        return room.enemies || [];
    }

    /**
     * Reseta todos os inimigos de uma sala.
     *
     * Chamado automaticamente quando o player entra em uma sala.
     * Respeita a flag `persistent` de cada inimigo:
     *  - persistent: false → Sempre renasce com vida cheia
     *  - persistent: true  → Se já morreu, permanece morto
     *
     * @param {string} roomKey - Chave da sala (ex: "0,0")
     */
    resetRoomEnemies(roomKey) {
        const room = this.worldMap[roomKey];
        if (!room || !room.enemies || room.enemies.length === 0) return;

        room.enemies.forEach(enemy => {
            if (enemy && typeof enemy.reset === 'function') {
                enemy.reset();
            }
        });
    }

   /**
     * Marca uma flag de progresso/conquista como verdadeira
     */
    completeProgression(flagId) {
        if (!flagId) return;
        this.progressionState.set(flagId, true);
        console.log(`[PROGRESSION] Flag conquistada: ${flagId}`);
    }

    /**
     * Valida se uma ou múltiplas condições foram atendidas
     */
    isProgressionCompleted(requirement, player) {
        if (!requirement) return true;

        // Se for um array de requisitos, avalia como AND (todos precisam ser verdadeiros)
        if (Array.isArray(requirement)) {
            return requirement.every(req => this._evaluateCondition(req, player));
        }

        return this._evaluateCondition(requirement, player);
    }

    /**
     * Avalia uma única condição baseada em seu tipo
     */
    _evaluateCondition(condition, player) {

        if (!condition || !condition.type) return true;



        switch (condition.type) {
            case 'flag':
                // Verifica se a flag global foi conquistada (ex: conversas com NPCs, chefes mortos)

                return this.progressionState.has(condition.id);

            case 'item':
                // Verifica se o jogador possui o item ativo no inventário
                if (player && player.inventoryComponent) {
                    // Verifica se há algum item com o id correspondente no inventário
                    return (player.inventory.hasItem(condition.ItemID) || player.inventory.hasWeapon(condition.WeaponID));
                }
                return false;

            case 'equipped':

                // Verifica se o jogador está com uma arma/equipamento específico ativo
                if (player && player.equipmentComponent && player.equipmentComponent.equippedWeapon) {
                    return player.equipmentComponent.equippedWeapon.id === condition.EquippedID;
                }
                return false;

            default:
                console.warn(`[PROGRESSION] Tipo de condição desconhecido: ${condition.type}`);
                return true;
        }
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

    return room.obstacles.some(obstacle => {
        // Pega a caixa de colisão do obstáculo se ela existir, ou o próprio retângulo do obstáculo
        const rectObstacle = obstacle.collisionBox 
            ? obstacle.collisionBox 
            : { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };

        return this.rectsOverlap(
            x, y, width, height, 
            rectObstacle.x, rectObstacle.y, rectObstacle.width, rectObstacle.height
        );
    }); 
}

    rectsOverlap(x1, y1, width1, height1, x2, y2, width2, height2) {
        return x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && y1 + height1 > y2;
    }

    // Dentro do método de atualização/colisão do cenário ou loop principal:
    updateItems(player, item) {

        const rectPlayer = player.getCollisionRect();

        if (this.rectsOverlap(rectPlayer.x, rectPlayer.y, rectPlayer.width, rectPlayer.height, item.x, item.y, item.width, item.height)) {
            // Delegação polimórfica: o item decide o que fazer com o player
            const collected = item.onCollect(player);
            // Se coletou com sucesso, marca o item como coletado.
            // IMPORTANTE: NÃO removemos o item do array room.items,
            // pois isso impede o sistema de save/load de saber quais
            // itens já foram coletados (o array ficaria vazio para itens
            // já coletados). O Item.draw() já verifica isCollected
            // e não renderiza itens coletados.
            if (collected) {
                item.isCollected = true;
            }
        }
        return item.isCollected;
        
    }

    update(player) {
        if (player.doorCooldown > 0) {
            player.doorCooldown--;
        } else {
            const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
            const room = this.worldMap[roomKey] || { doors: [] };

            for (const door of room.doors) {
 
                if (door.requiresProgression && !this.isProgressionCompleted(door.requiresProgression, player)) {
                    continue;
                }

                door.requiresProgression = null;

                if (door.intersects(player, this)) {
                    const [targetX, targetY] = door.targetRoomKey.split(',').map(Number);
                    const newRoomKey = `${targetX},${targetY}`;
                    
                    this.currentRoom.x = targetX;
                    this.currentRoom.y = targetY;
                    player.x = door.spawnPoint.x;
                    player.y = door.spawnPoint.y;
                    player.doorCooldown = 20;

                    // Reseta todos os inimigos da nova sala,
                    // respeitando a flag `persistent` de cada um.
                    this.resetRoomEnemies(newRoomKey);

                    if(Environment.isDeveloperMode()){
                        console.log(`Transição de sala para ${door.targetRoomKey}`);
                        console.log(`Posição do jogador após a transição: (${player.x}, ${player.y})`);
                    }

                    this.triggerLocationUI();
                    return;
                }
            }

            // Atualiza os itens da sala (verifica colisão e coleta)
            if (room.items && room.items.length > 0) {
                room.items.forEach(item => {
                    if (!item.isCollected) {
                        this.updateItems(player, item);
                    }
                });
            }


            // ATUALIZA TODAS AS FLECHAS VOANDO
            this.projectiles.length > 0 && this.projectiles.forEach(projectile => {
                    projectile.update(room.obstacles); // Passa os obstáculos para a flecha checar colisão
                    
                    if (projectile.isDead) return;

                    // Aqui você pode checar se a flecha bateu em algum inimigo da sala!
                    room.enemies.forEach(enemy => {

                        if(enemy?.isDead()) return;

                        const rectProject = projectile.getCollisionRect();
                        const rectEnemy = enemy.getCollisionRect();
                        
                        if(projectile.checkCollision(rectProject, rectEnemy)){
                            projectile.isDead = true;
                            enemy.takeDamage(projectile.damage);
                        }
                    });
            });

            
        }

        // Timer da UI
        if (this.locationUI.active) {
            this.locationUI.timer--;
            if (this.locationUI.timer <= 0) this.locationUI.active = false;
        }
    }
    
  draw(ctx, player, spriteSheet, FRAME_SIZE, npcManager) {
        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        const room = this.worldMap[roomKey] || { color: "#000", obstacles: [], doors: [] };
        
        // Desenha Fundo: se a sala tem um backgroundTileset SVG temático, usa ele.
        // Senão, usa o sistema antigo (cor sólida + floorDecorations via tileset PNG).
        if (room.backgroundTileset && room.backgroundTileset.complete && room.backgroundTileset.naturalWidth > 0) {
            ctx.drawImage(room.backgroundTileset, 0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        } else {
            ctx.fillStyle = room.color;
            ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);

            (room.floorDecorations || []).forEach(decor => {
                this._drawFloorElement(ctx, decor);
            });
        }

        // Desenha portas
        (room.doors || []).forEach(door => {
            const isLocked = Boolean(door.requiresProgression) && !this.isProgressionCompleted(door.requiresProgression, player);
            ctx.fillStyle = isLocked ? '#523a24' : '#7c4a1d';
            ctx.fillRect(door.x, door.y, door.width, door.height);
        });

        // Desenha itens
        (room.items || []).forEach(item => {
            if (item && typeof item.draw === 'function') {
                item.draw(ctx);
            }
        });

        // -----------------------------------------------------------------
        // 2. CAMADA DO MEIO: Obstáculos Sólidos (Pedras, Troncos)
        // -----------------------------------------------------------------
        (room.obstacles || []).forEach(obstacle => {
            this._drawSolidElement(ctx, obstacle);
        });

        // Desenha inimigos
        (room.enemies || []).forEach(enemy => {
            if (enemy && typeof enemy.draw === 'function') {
                enemy.draw(ctx);
            }
        });

        if (npcManager) {
            npcManager.draw(ctx);
        }

        // =================================================================
        // CORREÇÃO: O ponto e vírgula aqui impede o interpretador de bugar
        // =================================================================
        if (spriteSheet && spriteSheet.complete) {
            player.draw(ctx, spriteSheet, FRAME_SIZE);
        }; // <--- Ponto e vírgula explícito de segurança

        // Desenha Projéteis
        (this.projectiles || []).forEach(project => {
            if (project && typeof project.draw === 'function') {
                project.draw(ctx);
            }
        });

        // -----------------------------------------------------------------
        // 4. CAMADA SUPERIOR: Telhados e Copas de Árvores (Efeito Estiloso X-Ray)
        // -----------------------------------------------------------------
        (room.overlays || []).forEach(overlay => {
            ctx.save();
            
            // Se o jogador estiver passando por trás/baixo deste telhado ou árvore, 
            // deixa o objeto semi-transparente para o jogador não se perder!
            const playerRect = player.getCollisionRect();
            const playerX = playerRect ? playerRect.x : 0;
            const playerY = playerRect ? playerRect.y : 0;
            const playerW = playerRect ? playerRect.width : 32;
            const playerH = playerRect ? playerRect.height : 32;

            const isPlayerUnder = this.rectsOverlap(playerX, playerY, playerW, playerH, overlay.x, overlay.y, overlay.width, overlay.height);
            
            if (isPlayerUnder) {
                ctx.globalAlpha = 0.4; // Transparência fantasma de 40%
            }

            this._drawOverlayElement(ctx, overlay);
            ctx.restore();
        });

        // Desenha UI
        if (this.locationUI.active) {
            ctx.fillStyle = this.worldMap[roomKey] ? "rgba(159, 157, 157, 0.4)" : "rgba(235, 233, 233, 0.4)";
            ctx.fillRect(this.SCREEN_WIDTH / 2 - 390, 10, 300, 50);
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText(this.locationUI.text, this.SCREEN_WIDTH / 2 - 250, 40);
        }
    }


    /**
     * CAMADA 1: Elementos Decorativos do Chão (Flores, caminhos, placas)
     */
    _drawFloorElement(ctx, decor) {
        if (!this.tileset.complete) return;

        // Busca a coordenada [coluna, linha, offsetX, offsetY, cropSize] na tabela centralizada
        const coords = this.tileMap[decor.type];
        
        // Se esquecer de mapear o tipo, usa a grama base padrão [coluna 9, linha 6]
        const fallback = [9, 6];
        const [col, row, offsetX = 0, offsetY = 0, customCropSize = null] = coords || fallback;

        // Calcula a posição no PNG considerando os deslocamentos de pixel (offsets)
        const srcX = (col * this.TILE_SIZE) + offsetX;
        const srcY = (row * this.TILE_SIZE) + offsetY;

        // Define os tamanhos de recorte
        let sWidth = customCropSize || this.TILE_SIZE;
        let sHeight = customCropSize || this.TILE_SIZE;

        // Ajustes para blocos maiores do chão
        if (decor.type === 'big_grass_0') {
            sWidth = 64;
            sHeight = 64;
        }

        ctx.drawImage(
            this.tileset,
            srcX, srcY, sWidth, sHeight,
            decor.x, decor.y, decor.width || (sWidth * 2), decor.height || (sHeight * 2)
        );
    }

    /**
     * CAMADA 2: Obstáculos Sólidos (Troncos, Cercas, Baús)
     */
    _drawSolidElement(ctx, solid) {
        if (!this.tileset.complete) return;

        // Busca as coordenadas na nossa tabela
        const coords = this.tileMap[solid.type];
        
        // Se não mapeou o objeto ainda, desenha um bloco temporário para não quebrar
        if (!coords) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
            return;
        }

        // Calcula dinamicamente a posição do recorte no PNG
        const srcX = coords[0] * this.TILE_SIZE;
        const srcY = coords[1] * this.TILE_SIZE;

        // Define tamanhos especiais para objetos grandes (ex: árvores/baús)
        let sWidth = this.TILE_SIZE;
        let sHeight = this.TILE_SIZE;
        
        if (solid.type === 'tree_trunk' || solid.type === 'chest_closed') {
            sWidth = 32; 
            sHeight = 32;
        }

        
        if (solid.type === 'grass_border_x') {
            sWidth = 48;
        }

        if (solid.type === 'grass_border_y') {
            sHeight = 48;
        }

        const configRect = solid.collisionBox ? solid.collisionBox : {x:solid.x, y: solid.y, width: solid.width, height: solid.height}; 

        ctx.drawImage(
            this.tileset,
            srcX, srcY, sWidth, sHeight,
            solid.x, solid.y, solid.width, solid.height
        );
    }

   /**
     * CAMADA 4: Copas e Sobreposições superiores (Passam por cima do Player)
     */
    _drawOverlayElement(ctx, overlay) {
        if (!this.tileset.complete) return;

        const coords = this.tileMap[overlay.type];
        
        if (!coords) {
            // Desenha um bloco verde fantasma se não encontrar o mapeamento
            ctx.fillStyle = "rgba(46, 92, 30, 0.5)";
            ctx.fillRect(overlay.x, overlay.y, overlay.width, overlay.height);
            return;
        }

        const srcX = coords[0] * this.TILE_SIZE;
        const srcY = coords[1] * this.TILE_SIZE;

        // Define os tamanhos de recorte específicos para as copas das árvores
        let sWidth = this.TILE_SIZE;
        let sHeight = this.TILE_SIZE;

        if (overlay.type === 'tree_top_green') {
            sWidth = 32;  // Ocupa 2 blocos de largura na folha
            sHeight = 48; // Ocupa 3 blocos de altura na folha
        } else if (overlay.type === 'tree_top_orange') {
            sWidth = 32;  // Ocupa 2 blocos de largura
            sHeight = 32; // Ocupa 2 blocos de altura
        }

        ctx.drawImage(
            this.tileset,
            srcX, srcY, sWidth, sHeight,
            overlay.x, overlay.y, overlay.width, overlay.height
        );
    }
}