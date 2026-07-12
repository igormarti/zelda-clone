import assert from 'node:assert/strict';

import Player from '../src/classes/Player.js';
import World from '../src/classes/World.js';

const world = new World(150, 150);
world.currentRoom = { x: 0, y: 0 };
world.worldMap['0,0'].obstacles = [{ x: 70, y: 80, width: 40, height: 40 }];

const player = new Player();
player.x = 120;
player.y = 100;

const target = {
  x: 80,
  y: 100,
  getCollisionRect() {
    return { x: this.x, y: this.y, width: 32, height: 32 };
  }
};

player.faceTarget(target, world);

const rect = player.getCollisionRect();
assert.ok(rect.x >= 0, 'o personagem não deve ser empurrado para fora do limite esquerdo');
assert.ok(rect.x + rect.width <= world.SCREEN_WIDTH, 'o personagem não deve ultrapassar a borda direita da tela');
assert.equal(world.isPositionBlocked(rect.x, rect.y, rect.width, rect.height), false, 'o personagem não deve ser posicionado sobre um obstáculo');

const farPlayer = new Player();
farPlayer.x = 10;
farPlayer.y = 10;
farPlayer.faceTarget({ x: 140, y: 10, getCollisionRect() { return { x: this.x, y: this.y, width: 32, height: 32 }; } }, world);
const farRect = farPlayer.getCollisionRect();
assert.ok(Math.abs((farRect.x + farRect.width / 2) - 140) < 90, 'o personagem deve ser reposicionado para uma distância de diálogo adequada do alvo');

console.log('dialog spacing tests passed');
