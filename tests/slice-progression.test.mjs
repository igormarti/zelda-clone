import assert from 'node:assert/strict';

import Player from '../src/classes/Player.js';
import World from '../src/classes/World.js';

const world = new World(800, 600);
world.currentRoom = { x: 0, y: -1 };

const player = new Player();
player.x = 350;
player.y = 560;
player.doorCooldown = 0;

world.update(player);
assert.equal(world.currentRoom.y, -1, 'a porta da sala inicial não deve abrir antes da interação');

world.completeProgression('0,-1', 'cemiterio_srpoo_01');
player.x = 350;
player.y = 560;
player.doorCooldown = 0;
world.update(player);
assert.equal(world.currentRoom.y, 0, 'a porta deve abrir após a interação mínima com o NPC');

console.log('slice progression tests passed');
