/* Combat and balance checks for attack, heal, defense, and deterministic bot aim. */
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const box = { window: {} };
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
const content = box.window.GAME_CONTENT, game = box.window.GameEngine;
assert.strictEqual(content.levels.length, 6);
let lastAim = 0;
for (const level of content.levels) {
  assert.strictEqual(level.answers.length, 7);
  assert(level.questions.length >= 10);
  assert(game.accuracy(level) > lastAim, 'Higher levels must have higher bot accuracy');
  lastAim = game.accuracy(level);
  let state = game.startLevel(level);
  assert.strictEqual(state.playerHp, 12, 'Player health must be equally low across levels');
  while (state.status === 'active' && state.turn < 20) {
    const q = game.question(level, state), hand = game.hand(level, state);
    assert.strictEqual(hand.length, 4);
    assert(hand.includes(q.best), `Best card missing at level ${level.id}`);
    const support = game.mode(level, state) === 'build' ? q.support : null;
    if (support) assert(hand.includes(support));
    state = game.act(level, state, { kind: 'attack', answerId: q.best, supportId: support });
  }
  assert(state.won && state.enemyHp === 0, `Perfect attacks should win level ${level.id}`);
  assert(state.hits >= 7, 'Enemy heal may require more than seven total hits');
  for (const q of level.questions) {
    assert(level.answers.includes(q.best) && q.why.length >= 25, `Bad question ${q.id}`);
  }
}
const boss = content.levels[5];
const initial = game.startLevel(boss);
const guarded = game.act(boss, initial, { kind: 'defend', success: true });
const unguarded = game.act(boss, initial, { kind: 'defend', success: false });
assert(guarded.defendUsed && guarded.shieldTurns === 2, 'Defense should cover three attack rounds including this turn');
assert(guarded.playerHp === unguarded.playerHp + 1, 'Shield should block one damage on a hit');
assert.throws(() => game.act(boss, guarded, { kind: 'defend', success: true }), /already used/);
const healSetup = { ...initial, turn: 1, playerHp: 5 };
const healed = game.act(boss, healSetup, { kind: 'heal', success: true });
assert(healed.playerHealUsed && healed.history[0].playerHeal === game.HEAL);
assert.throws(() => game.act(boss, healed, { kind: 'heal', success: true }), /already used/);
const botHealSetup = { ...initial, enemyHp: 2, turn: 1 };
const botHealed = game.act(boss, botHealSetup, { kind: 'defend', success: false });
assert.strictEqual(botHealed.history[0].enemyHeal, game.HEAL, 'Bot and player must heal the same amount');
assert(botHealed.enemyHealUsed);
const longFight = { ...game.startLevel(content.levels[0]), playerHp: 100, playerMaxHp: 100 };
let extended = longFight;
for (let n = 0; n < 8; n++) {
  const q = game.question(content.levels[0], extended);
  const wrong = game.hand(content.levels[0], extended).find(id => id !== q.best);
  extended = game.act(content.levels[0], extended, { kind: 'attack', answerId: wrong });
}
assert.strictEqual(extended.status, 'active', 'Fight must continue past seven questions');
assert.strictEqual(extended.attackIndex, 8);
let doomed = game.startLevel(boss);
for (let n = 0; n < 30 && doomed.status === 'active'; n++) {
  const q = game.question(boss, doomed);
  const wrong = game.hand(boss, doomed).find(id => id !== q.best && id !== q.support);
  const support = game.mode(boss, doomed) === 'build' ? game.hand(boss, doomed).find(id => id !== wrong) : null;
  doomed = game.act(boss, doomed, { kind: 'attack', answerId: wrong, supportId: support });
}
assert(doomed.status === 'complete' && !doomed.won && doomed.playerHp === 0, 'Poor answers must cause a real loss');
function oneMistake(healTurn, defendTurn) {
  let state = game.startLevel(boss), attacks = 0;
  for (let turn = 0; turn < 18 && state.status === 'active'; turn++) {
    let action;
    if (turn === healTurn) action = { kind: 'heal', success: true };
    else if (turn === defendTurn) action = { kind: 'defend', success: true };
    else {
      const q = game.question(boss, state);
      const wrong = game.hand(boss, state).find(id => id !== q.best && id !== q.support);
      const answerId = attacks++ === 2 ? wrong : q.best;
      action = { kind: 'attack', answerId,
        supportId: game.mode(boss, state) === 'build' ? game.hand(boss, state).find(id => id !== answerId) : null };
    }
    state = game.act(boss, state, action);
  }
  return state;
}
assert(!oneMistake(-1, -1).won, 'A boss mistake without recovery should be risky');
assert(oneMistake(1, 3).won, 'A well-timed heal and defense should recover from one boss mistake');
process.stdout.write(JSON.stringify({ ok: true, levels: 6, questions: content.levels.reduce((n, l) => n + l.questions.length, 0), checks: ['same heal', 'lower health', 'three-round defense', 'higher bot aim', 'unlimited questions', 'win and loss'] }));
