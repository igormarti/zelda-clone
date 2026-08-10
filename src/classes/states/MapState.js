import PlayingState from './PlayingState.js';
import State from './State.js';

/**
 * Estado do Mapa do Mundo
 *
 * Exibe a imagem assets/map-world.png em tela cheia com:
 * - Marcador pulsante na sala atual do jogador
 * - Nome da sala/região
 * - Zoom (+/-) e pan (WASD/setas)
 * - Mundo pausado enquanto aberto
 *
 * Ao abrir o mapa, a câmera (pan) é automaticamente centralizada no
 * marcador da sala atual do jogador. Como a imagem do mapa é carregada
 * de forma assíncrona via AssetManager, a centralização acontece:
 *  - Imediatamente no enter() se a imagem já estiver em cache
 *  - No evento `onload` da imagem (caso ainda esteja carregando)
 *  - Como fallback no primeiro draw() com a imagem pronta
 */
export default class MapState extends State {
    constructor(stateManager, context) {
        super(stateManager, context);

        // Carrega a imagem do mapa via AssetManager (cache automático)
        this.mapImage = context.assetManager.loadImage('assets/map-world.png');

        // Estado de visualização
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.5;
        this.zoomStep = 0.1;

        // Pan (deslocamento da câmera)
        this.panX = 0;
        this.panY = 0;
        this.panSpeed = 8;

        // Animação do marcador
        this.pulseTimer = 0;
        this.pulseSpeed = 0.05;

        // Flag de controle: indica se o mapa já foi centralizado na sala atual.
        // Usado para evitar re-centralizações após o usuário mover o pan com WASD
        // e para garantir a centralização quando a imagem terminar de carregar
        // após a abertura do mapa.
        this._centered = false;

        // Coordenadas normalizadas (0..1) de cada sala na imagem 1536x1024
        // Baseado no layout visual do map-world.png
        this.ROOM_GRID = {
            // Campos Verdejante
            '0,0':  { x: 0.10, y: 0.18, label: 'Clareira Verdejante', region: 'Campos Verdejante' },
            '1,0':  { x: 0.22, y: 0.15, label: 'Campo com Cercas', region: 'Campos Verdejante' },
            '0,1':  { x: 0.10, y: 0.28, label: 'Campo Sul', region: 'Campos Verdejante' },
            '1,1':  { x: 0.22, y: 0.30, label: 'Campo Sudeste', region: 'Campos Verdejante' },

            // Floresta Princesa das Matas
            '2,0':  { x: 0.36, y: 0.15, label: 'Entrada da Floresta', region: 'Floresta Princesa das Matas' },
            '3,0':  { x: 0.46, y: 0.15, label: 'Coração da Floresta', region: 'Floresta Princesa das Matas' },
            '4,0':  { x: 0.53, y: 0.15, label: 'Clareira da Princesa', region: 'Floresta Princesa das Matas' },
            '2,1':  { x: 0.38, y: 0.28, label: 'Trilha Sul da Floresta', region: 'Floresta Princesa das Matas' },
            '3,1':  { x: 0.51, y: 0.28, label: 'Passagem para a Vila', region: 'Floresta Princesa das Matas' },

            // Cemitério
            '5,0':  { x: 0.61, y: 0.15, label: 'Entrada do Cemitério', region: 'Cemitério' },
            '6,0':  { x: 0.69, y: 0.15, label: 'Ala Leste do Cemitério', region: 'Cemitério' },
            '5,1':  { x: 0.61, y: 0.26, label: 'Catacumbas Superiores', region: 'Cemitério' },
            '6,1':  { x: 0.69, y: 0.26, label: 'Cripta Central', region: 'Cemitério' },
            '5,2':  { x: 0.65, y: 0.35, label: 'Profundezas do Cemitério', region: 'Cemitério' },

            // Floresta Assombrada
            '7,0':  { x: 0.78, y: 0.18, label: 'Entrada Sombria', region: 'Floresta Assombrada' },
            '8,0':  { x: 0.86, y: 0.18, label: 'Trilha Nebulosa', region: 'Floresta Assombrada' },
            '9,0':  { x: 0.95, y: 0.18, label: 'Altar Corrompido', region: 'Floresta Assombrada' },
            '7,1':  { x: 0.84, y: 0.28, label: 'Bosque Interior', region: 'Floresta Assombrada' },
            '8,1':  { x: 0.94, y: 0.28, label: 'Coração da Maldição', region: 'Floresta Assombrada' },

            // Vila Águas Vermelhas
            '3,2':  { x: 0.38, y: 0.48, label: 'Entrada Oeste da Vila', region: 'Vila Águas Vermelhas' },
            '4,2':  { x: 0.47, y: 0.48, label: 'Praça Central', region: 'Vila Águas Vermelhas' },
            '6,2':  { x: 0.58, y: 0.48, label: 'Entrada Leste da Vila', region: 'Vila Águas Vermelhas' },

            // Deserto do Sul
            '0,3':  { x: 0.08, y: 0.73, label: 'Oásis Abandonado', region: 'Deserto do Sul' },
            '1,3':  { x: 0.19, y: 0.71, label: 'Lago do Deserto', region: 'Deserto do Sul' },
            '2,3':  { x: 0.3, y: 0.71, label: 'Desfiladeiro', region: 'Deserto do Sul' },
            '3,3':  { x: 0.38, y: 0.71, label: 'Passagem para Montanhas', region: 'Deserto do Sul' },
            '0,4':  { x: 0.09, y: 0.84, label: 'Ruínas Sul', region: 'Deserto do Sul' },
            '1,4':  { x: 0.21, y: 0.85, label: 'Vila do Deserto do Sul', region: 'Deserto do Sul' },
            '2,4':  { x: 0.36, y: 0.85, label: 'Portal para Montanhas', region: 'Deserto do Sul' },

            // Montanhas Cajumas
            '5,3':  { x: 0.53, y: 0.72, label: 'Vila das Montanhas', region: 'Montanhas Cajumas' },
            '6,3':  { x: 0.65, y: 0.72, label: 'Passo Rochoso', region: 'Montanhas Cajumas' },
            '7,3':  { x: 0.77, y: 0.72, label: 'Caverna de Cristal', region: 'Montanhas Cajumas' },
            '8,3':  { x: 0.90, y: 0.72, label: 'Pico Nevado', region: 'Montanhas Cajumas' },
            '5,4':  { x: 0.54, y: 0.85, label: 'Base da Cachoeira', region: 'Montanhas Cajumas' },
            '6,4':  { x: 0.65, y: 0.85, label: 'Ravina Profunda', region: 'Montanhas Cajumas' },
            '7,4':  { x: 0.78, y: 0.85, label: 'Passagem Secreta', region: 'Montanhas Cajumas' },
            '8,4':  { x: 0.90, y: 0.85, label: 'Santuário da Montanha', region: 'Montanhas Cajumas' },
        };

        // Garante centralização quando a imagem terminar de carregar
        // (caso ela ainda não esteja pronta no momento do enter()).
        // Usa um flag para não duplicar handlers se o estado for reativado.
        if (this.mapImage && !this.mapImage.complete && !this._onLoadBound) {
            this._onLoadBound = () => {
                this._centerOnCurrentRoom();
            };
            this.mapImage.addEventListener('load', this._onLoadBound);
        }
    }

    enter() {
        this.pulseTimer = 0;
        // Reseta a flag para forçar nova centralização a cada abertura
        this._centered = false;
        // Tenta centralizar imediatamente (caso a imagem já esteja em cache)
        this._centerOnCurrentRoom();
    }

    _centerOnCurrentRoom() {
        const { world, SCREEN_WIDTH, SCREEN_HEIGHT } = this.context;
        const roomKey = `${world.currentRoom.x},${world.currentRoom.y}`;
        const roomInfo = this.ROOM_GRID[roomKey];

        // Só centraliza se a imagem já está pronta e ainda não centralizamos
        if (this._centered) return;

        if (roomInfo && this.mapImage && this.mapImage.complete && this.mapImage.naturalWidth > 0) {
            const imgW = this.mapImage.naturalWidth * this.zoom;
            const imgH = this.mapImage.naturalHeight * this.zoom;

            // Posição do marcador no espaço da imagem escalada
            const markerX = roomInfo.x * imgW;
            const markerY = roomInfo.y * imgH;

            // Pan para centralizar o marcador na tela
            this.panX = SCREEN_WIDTH / 2 - markerX;
            this.panY = SCREEN_HEIGHT / 2 - markerY;

            this._centered = true;
        }
    }

    update() {
        const { input } = this.context;

        // Fechar mapa
        if (input.keys['m'] || input.keys['Escape']) {
            input.keys['m'] = input.keys['M'] = input.keys['Escape'] = false;
            this.stateManager.changeState(PlayingState);
            return;
        }

        // Zoom in
        if (input.keys['='] || input.keys['+']) {
            input.keys['='] = input.keys['+'] = false;
            this.zoom = Math.min(this.maxZoom, this.zoom + this.zoomStep);
        }

        // Zoom out
        if (input.keys['-']) {
            input.keys['-'] = false;
            this.zoom = Math.max(this.minZoom, this.zoom - this.zoomStep);
        }

        // Pan
        if (input.keys['w'] || input.keys['ArrowUp']) {
            this.panY += this.panSpeed;
        }
        if (input.keys['s'] || input.keys['ArrowDown']) {
            this.panY -= this.panSpeed;
        }
        if (input.keys['a'] || input.keys['ArrowLeft']) {
            this.panX += this.panSpeed;
        }
        if (input.keys['d'] || input.keys['ArrowRight']) {
            this.panX -= this.panSpeed;
        }

        // Animação do marcador
        this.pulseTimer += this.pulseSpeed;
    }

    draw(ctx) {
        const { SCREEN_WIDTH, SCREEN_HEIGHT, world } = this.context;

        // Fundo escuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Fallback de centralização: garante que o foco da câmera é aplicado
        // mesmo se enter() rodou antes da imagem carregar (e o onload ainda
        // não disparou por algum motivo). Só executa uma vez.
        if (!this._centered && this.mapImage && this.mapImage.complete && this.mapImage.naturalWidth > 0) {
            this._centerOnCurrentRoom();
        }

        // Desenha a imagem do mapa se já carregou
        if (this.mapImage.complete && this.mapImage.naturalWidth > 0) {
            const imgW = this.mapImage.naturalWidth * this.zoom;
            const imgH = this.mapImage.naturalHeight * this.zoom;

            ctx.save();
            ctx.drawImage(this.mapImage, this.panX, this.panY, imgW, imgH);

            // Desenha marcador na sala atual
            const roomKey = `${world.currentRoom.x},${world.currentRoom.y}`;
            const roomInfo = this.ROOM_GRID[roomKey];

            if (roomInfo) {
                const markerX = this.panX + roomInfo.x * imgW;
                const markerY = this.panY + roomInfo.y * imgH;

                // Efeito pulsante
                const pulse = Math.sin(this.pulseTimer) * 0.3 + 1.0;
                const radius = 10 * pulse;

                // Círculo externo (outline)
                ctx.beginPath();
                ctx.arc(markerX, markerY, radius + 3, 0, Math.PI * 2);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Círculo principal (amarelo brilhante)
                ctx.beginPath();
                ctx.arc(markerX, markerY, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd700';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Ponto central
                ctx.beginPath();
                ctx.arc(markerX, markerY, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#8b0000';
                ctx.fill();

                // Nome da sala (acima do marcador)
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000';
                ctx.fillText(roomInfo.label, markerX + 1, markerY - radius - 9);
                ctx.fillStyle = '#fff';
                ctx.fillText(roomInfo.label, markerX, markerY - radius - 10);
            }

            ctx.restore();
        } else {
            // Fallback se a imagem não carregou
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Carregando mapa...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        }

        // Header com nome da região atual
        const roomKey = `${world.currentRoom.x},${world.currentRoom.y}`;
        const roomInfo = this.ROOM_GRID[roomKey];
        const regionName = roomInfo ? roomInfo.region : 'Desconhecido';
        const roomLabel = roomInfo ? roomInfo.label : `Sala ${roomKey}`;

        // Barra superior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, 50);
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`🗺️ ${regionName}`, SCREEN_WIDTH / 2, 22);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText(roomLabel, SCREEN_WIDTH / 2, 42);

        // Barra inferior com instruções
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, SCREEN_HEIGHT - 40, SCREEN_WIDTH, 40);
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.fillText('M/Esc - Fechar  |  +/- Zoom  |  WASD/Setas - Mover', SCREEN_WIDTH / 2, SCREEN_HEIGHT - 16);

        // Indicador de zoom (canto superior direito)
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#888';
        ctx.fillText(`Zoom: ${Math.round(this.zoom * 100)}%`, SCREEN_WIDTH - 15, 70);
    }

    exit() {
        // Nada a limpar
    }
}