import assert from 'node:assert/strict';

import CombatSystem from '../src/classes/CombatSystem.js';
import Enemy from '../src/classes/Enemy.js';
import Player from '../src/classes/Player.js';

const combatSystem = new CombatSystem();

const player = new Player();
player.x = 100;
player.y = 100;
player.attackDamage = 2;
player.attackRange = 60;

const enemy = new Enemy({ x: 120, y: 100, maxHealth: 4, attackDamage: 1 });
combatSystem.resolveAttack(player, [enemy]);
assert.equal(enemy.health, 2, 'o ataque do jogador deve reduzir a vida do inimigo');
assert.equal(enemy.state, 'hit', 'o inimigo deve entrar no estado de hit ao receber dano');

const secondEnemy = new Enemy({ x: 160, y: 100, maxHealth: 2, attackDamage: 1 });
combatSystem.resolveAttack(player, [secondEnemy]);
assert.equal(secondEnemy.health, 2, 'ataques fora de alcance devem ser ignorados');

const farEnemy = new Enemy({ x: 300, y: 100, maxHealth: 2, attackDamage: 1 });
farEnemy.contactRange = 20;
const farPlayer = new Player();
farPlayer.x = 100;
farPlayer.y = 100;
assert.equal(combatSystem.resolveContactDamage(farEnemy, farPlayer), false, 'inimigos distantes não devem causar dano por contato');

const vulnerablePlayer = new Player();
vulnerablePlayer.takeDamage(2);
assert.equal(vulnerablePlayer.health, 3, 'o jogador deve perder vida ao receber dano');
assert.ok(vulnerablePlayer.invulnerableTimer > 0, 'o jogador deve ficar invulnerável após levar dano');

const deadEnemy = new Enemy({ x: 200, y: 200, maxHealth: 2, attackDamage: 1 });
deadEnemy.takeDamage(3);
assert.equal(deadEnemy.isDead(), true, 'o inimigo deve ser marcado como morto ao perder toda a vida');

console.log('combat tests passed');
