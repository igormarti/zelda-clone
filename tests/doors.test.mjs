import assert from 'node:assert/strict';
import Player from '../src/classes/Player.js';
import World from '../src/classes/World.js';
import Door from '../src/classes/Door.js';

const world = new World(800, 600);
world.currentRoom = { x: 0, y: 0 };
world.worldMap['0,0'].doors = [new Door(740, 220, 30, 100, '1,0', { x: 20, y: 240 })];

const player = new Player();
player.x = 740;
player.y = 220;

world.update(player);

assert.equal(world.currentRoom.x, 1, 'o jogador deve ser teleportado para a sala destino ao entrar na porta');
assert.equal(player.x, 20, 'o jogador deve aparecer no ponto de entrada da nova sala');
assert.equal(player.y, 240, 'a posição vertical de entrada deve ser preservada');

world.currentRoom = { x: 0, y: 0 };
player.x = 740;
player.y = 220;
player.doorCooldown = 0;
world.update(player);
world.update(player);
assert.equal(world.currentRoom.x, 1, 'a mesma porta não deve disparar duas vezes em frames consecutivos');

world.currentRoom = { x: 0, y: -1 };
player.x = 350;
player.y = 570;
player.doorCooldown = 0;
world.update(player);
assert.equal(world.currentRoom.y, 0, 'a porta do cemitério deve levar de volta para a sala inicial');
assert.equal(player.x, 370, 'o jogador deve aparecer no ponto de spawn da sala de destino');

const transitionWorld = new World(800, 600);
transitionWorld.currentRoom = { x: 0, y: 0 };
transitionWorld.worldMap['0,0'].doors = [
    new Door(360, 0, 80, 30, '0,-1', { x: 350, y: 480 })
];
const transitionPlayer = new Player();
transitionPlayer.x = 360;
transitionPlayer.y = -20;
transitionWorld.update(transitionPlayer);
transitionPlayer.doorCooldown = 0;
transitionWorld.update(transitionPlayer);
assert.equal(transitionWorld.currentRoom.y, 0, 'o jogador deve permanecer na sala do cemitério após entrar pela porta da floresta');

console.log('door tests passed');
