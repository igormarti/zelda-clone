import assert from 'node:assert/strict';
import Player from '../src/classes/Player.js';
import World from '../src/classes/World.js';

const world = new World(800, 600);
world.currentRoom = { x: 0, y: 0 };

const player = new Player();
player.x = 140;
player.y = 130;
player.update({ d: true }, world);
assert.equal(player.x, 140, 'movimento bloqueado por obstáculo deve manter a posição atual');

const freePlayer = new Player();
freePlayer.x = 10;
freePlayer.y = 10;
freePlayer.update({ d: true }, world);
assert.ok(freePlayer.x > 10, 'movimento sem colisão deve avançar a posição');

world.worldMap['0,0'].obstacles = [{ x: 100, y: 100, width: 20, height: 20 }];
const nearTouchPlayer = new Player();
nearTouchPlayer.x = 24;
nearTouchPlayer.y = 100;
nearTouchPlayer.update({ d: true }, world);
assert.ok(nearTouchPlayer.x > 24, 'movimento deve ser permitido quando o personagem ainda não encostou no obstáculo');

assert.equal(world.isPositionBlocked(100, 100, 48, 48), true, 'obstáculo deve ser detectado corretamente');

console.log('collision tests passed');
