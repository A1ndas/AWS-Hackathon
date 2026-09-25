/* Combat, AWS minigame content, and repeatable-action balance checks. */
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const box = { window: {} };
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
const content = box.window.GAME_CONTENT, game = box.window.GameEngine;
assert.strictEqual(content.levels.length, 6);
let previousAim = 0;
for (const level of content.levels) {
  assert.strictEqual(level.answers.length, 7);
  assert(level.questions.length >= 10);
  assert(game.accuracy(level) > previousAim, 'Bot accuracy must rise by level');
  previousAim = game.accuracy(level);
  assert(level.repair && level.repair.steps.length === 3, `Level ${level.id} repair is missing`);
  assert.strictEqual(new Set(level.repair.steps.map(step => step.id)).size, 3);
  for (const step of level.repair.steps) {
    assert(content.cards[step.id] && step.clue.length > 20, `Invalid AWS repair step in level ${level.id}`);
  }
  assert(level.defense && level.defense.length === 3, `Level ${level.id} defense is missing`);
  for (const wave of level.defense) {
    assert(wave.options.length === 3 && wave.options.includes(wave.best), 'Invalid defense options');
    assert(wave.options.every(id => content.cards[id]) && wave.why.length > 15, 'Defense must teach real AWS cards');
  }
  let state = game.startLevel(level);
  assert.strictEqual(state.playerHp, 12);
  while (state.status === 'active' && state.turn < 25) {
    const q = game.question(level, state), hand = game.hand(level, state);
    assert.strictEqual(hand.length, 4);
    assert(hand.includes(q.best));
    const supportId = game.mode(level, state) === 'build' ? q.support : null;
    if (supportId) assert(hand.includes(supportId));
    state = game.act(level, state, { kind: 'attack', answerId: q.best, supportId });
  }
  assert(state.won && state.enemyHp === 0, `Perfect attacks should win level ${level.id}`);
  assert(state.hits >= 7);
}
const boss = content.levels[5];
const initial = game.startLevel(boss);
const guarded = game.act(boss, initial, { kind: 'defend', success: true });
const unguarded = game.act(boss, initial, { kind: 'defend', success: false });
assert(guarded.shieldTurns === 2 && guarded.playerHp === unguarded.playerHp + 1);
assert(!game.canDefend(guarded), 'An active shield must not stack');
let shieldCycle = guarded;
for (let i = 0; i < 2; i++) {
  const q = game.question(boss, shieldCycle);
  shieldCycle = game.act(boss, shieldCycle, { kind: 'attack', answerId: q.best });
}
assert(game.canDefend(shieldCycle), 'Defense must become reusable after three attacks');
const raisedAgain = game.act(boss, shieldCycle, { kind: 'defend', success: true });
assert(raisedAgain.history.filter(turn => turn.kind === 'defend').length === 2);
const healSetup = { ...initial, turn: 1, playerHp: 5 };
const healed = game.act(boss, healSetup, { kind: 'heal', success: true });
assert.strictEqual(healed.history[0].playerHeal, game.HEAL);
assert(!game.canHeal(healed), 'Heal cooldown must prevent immediate repetition');
let healCycle = healed;
for (let i = 0; i < 2; i++) {
  const q = game.question(boss, healCycle);
  healCycle = game.act(boss, healCycle, { kind: 'attack', answerId: q.best });
}
assert(game.canHeal(healCycle), 'Healing must be reusable after three turns');
const healedAgain = game.act(boss, healCycle, { kind: 'heal', success: true });
assert(healedAgain.history.filter(turn => turn.kind === 'heal').length === 2);
const botHealSetup = { ...initial, enemyHp: 2, turn: 1 };
const botHealed = game.act(boss, botHealSetup, { kind: 'defend', success: false });
assert.strictEqual(botHealed.history[0].enemyHeal, game.HEAL, 'Both sides must heal the same amount');
const botHealedAgainSetup = { ...botHealed, enemyHp: 2, turn: botHealed.turn + 2 };
const botHealedAgain = game.act(boss, botHealedAgainSetup, { kind: 'defend', success: false });
assert.strictEqual(botHealedAgain.history.at(-1).enemyHeal, game.HEAL, 'Bot heal must also be repeatable after cooldown');
let extended = { ...game.startLevel(content.levels[0]), playerHp: 100, playerMaxHp: 100 };
for (let i = 0; i < 8; i++) {
  const q = game.question(content.levels[0], extended);
  extended = game.act(content.levels[0], extended, { kind: 'attack', answerId: game.hand(content.levels[0], extended).find(id => id !== q.best) });
}
assert(extended.status === 'active' && extended.attackIndex === 8, 'No seven-question cap');
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
assert(!oneMistake(-1, -1).won, 'Boss mistake without recovery should be risky');
assert(oneMistake(1, 3).won, 'Well-timed repair and defense should recover from one mistake');
process.stdout.write(JSON.stringify({ ok: true, levels: 6, questions: content.levels.reduce((n, l) => n + l.questions.length, 0), checks: ['AWS minigames', 'repeatable healing', 'repeatable defense', 'equal heal', 'accuracy', 'balance'] }));
