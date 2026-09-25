/* Combat, AWS minigame content, and repeatable-action balance checks. */
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const box = { window: {} };
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
const content = box.window.GAME_CONTENT, game = box.window.GameEngine;

/* Builds the right action for whatever challenge the current turn presents. */
function turnAction(level, state, wrong) {
  if (game.mode(level, state) === 'match') {
    return { kind: 'match', matches: game.matchPairs(level, state).questions.map(item => item.best) };
  }
  const q = game.question(level, state), hand = game.hand(level, state);
  const answerId = (wrong && hand.find(id => id !== q.best && id !== q.support)) || q.best;
  const supportId = game.mode(level, state) === 'build' ? hand.find(id => id !== answerId) : null;
  return { kind: 'attack', answerId, supportId };
}
assert.strictEqual(content.levels.length, 6);
let previousAim = 0;
for (const level of content.levels) {
  assert.strictEqual(level.answers.length, 7);
  assert(level.questions.length >= 10);
  assert(game.accuracy(level) > previousAim, 'Bot accuracy must rise by level');
  previousAim = game.accuracy(level);
  assert(level.repair && level.repair.steps.length === 3, `Level ${level.id} repair is missing`);
  assert.strictEqual(new Set(level.repair.steps.map(step => step.id)).size, 3);
  assert(level.repair.options && level.repair.options.length >= 3, `Level ${level.id} repair options are missing`);
  assert(level.repair.options.every(id => content.cards[id]), `Level ${level.id} repair options must be AWS cards`);
  for (const step of level.repair.steps) {
    assert(content.cards[step.id] && step.clue.length > 20, `Invalid AWS repair step in level ${level.id}`);
  }
  assert(level.defense && level.defense.length === 3, `Level ${level.id} defense is missing`);
  for (const wave of level.defense) {
    assert(wave.options.length >= 3 && wave.options.length <= 5, 'Invalid defense option count');
    assert(wave.options.includes(wave.best) && new Set(wave.options).size === wave.options.length, 'Invalid defense options');
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
    state = game.act(level, state, turnAction(level, state, false));
  }
  assert(state.won && state.enemyHp === 0, `Perfect attacks should win level ${level.id}`);
  assert(state.hits >= 7);
  for (let cursor = 0; cursor < 40; cursor++) {
    const preview = { attackIndex: cursor, questionCursor: cursor };
    if (game.mode(level, preview) !== 'match') continue;
    const shown = game.hand(level, preview).slice().sort().join(',');
    const needed = game.matchPairs(level, preview).answers.slice().sort().join(',');
    assert(shown === needed, `Level ${level.id} match turn must show the four answers it asks for`);
  }
}
const boss = content.levels[5];
const initial = game.startLevel(boss);
const guarded = game.act(boss, initial, { kind: 'defend', success: true });
const unguarded = game.act(boss, initial, { kind: 'defend', success: false });
assert(guarded.shieldTurns === 2 && guarded.playerHp === unguarded.playerHp + 1);
assert(!game.canDefend(guarded), 'An active shield must not stack');
let shieldCycle = guarded;
for (let i = 0; i < 2; i++) {
  shieldCycle = game.act(boss, shieldCycle, turnAction(boss, shieldCycle, false));
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
  healCycle = game.act(boss, healCycle, turnAction(boss, healCycle, false));
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
  extended = game.act(content.levels[0], extended, turnAction(content.levels[0], extended, true));
}
assert(extended.status === 'active' && extended.attackIndex === 8, 'No seven-question cap');
function oneMistake(healTurn, defendTurn) {
  let state = game.startLevel(boss), attacks = 0;
  for (let turn = 0; turn < 18 && state.status === 'active'; turn++) {
    let action;
    if (turn === healTurn) action = { kind: 'heal', success: true };
    else if (turn === defendTurn) action = { kind: 'defend', success: true };
    else {
      const matchedTurn = game.mode(boss, state) === 'match';
      const makeMistake = !matchedTurn && attacks === 2;
      if (!matchedTurn) attacks++;
      action = turnAction(boss, state, makeMistake);
    }
    state = game.act(boss, state, action);
  }
  return state;
}
assert(!oneMistake(-1, -1).won, 'Boss mistake without recovery should be risky');
assert(oneMistake(1, 3).won, 'Well-timed repair and defense should recover from one mistake');
process.stdout.write(JSON.stringify({ ok: true, levels: 6, questions: content.levels.reduce((n, l) => n + l.questions.length, 0), checks: ['AWS minigames', 'repeatable healing', 'repeatable defense', 'equal heal', 'accuracy', 'balance'] }));
