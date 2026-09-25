/* Combat and content checks for the current seven-hit rules. */
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const box = { window: {} };
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
}
const content = box.window.GAME_CONTENT;
const game = box.window.GameEngine;
assert.strictEqual(content.levels.length, 6);
for (const level of content.levels) {
  assert.strictEqual(level.answers.length, 7, `Level ${level.id} deck size`);
  assert(level.questions.length >= 10, `Level ${level.id} needs a varied question bank`);
  let state = game.startLevel(level);
  for (let turn = 0; turn < 7; turn++) {
    const q = game.question(level, state);
    const hand = game.hand(level, state);
    assert.strictEqual(hand.length, 4);
    assert(hand.includes(q.best), `Best card missing at level ${level.id} turn ${turn}`);
    if (game.mode(level, state) === 'build') assert(hand.includes(q.support));
    state = game.answer(level, state, q.best, game.mode(level, state) === 'build' ? q.support : null, false, true);
    assert.strictEqual(state.hits, turn + 1);
    if (turn < 6) assert.strictEqual(state.status, 'active');
  }
  assert(state.won && state.status === 'complete', `Perfect route failed level ${level.id}`);
  let bad = game.startLevel(level);
  for (let turns = 0; turns < 30 && bad.status === 'active'; turns++) {
    const q = game.question(level, bad);
    const wrong = game.hand(level, bad).find(id => id !== q.best && id !== q.support);
    const support = game.mode(level, bad) === 'build' ? game.hand(level, bad).find(id => id !== wrong) : null;
    bad = game.answer(level, bad, wrong, support, false, false);
    if (level.id === 1 && turns === 6) {
      assert.strictEqual(bad.status, 'active', 'Combat must continue past seven questions');
      assert.strictEqual(bad.turn, 7);
    }
  }
  assert(bad.status === 'complete' && !bad.won && bad.playerHp === 0, `Miss route failed level ${level.id}`);
  for (const q of level.questions) {
    assert(level.answers.includes(q.best), `Missing best card in ${q.id}`);
    assert(q.why.length >= 25, `Missing explanation in ${q.id}`);
  }
}
const boss = content.levels[5];
const brink = { ...game.startLevel(boss), hits: 6, enemyHp: 1, playerHp: 3 };
const doubleKnockout = game.answer(boss, brink, game.question(boss, brink).best, null, false, false);
assert(doubleKnockout.playerHp === 0 && !doubleKnockout.won, 'Zero health must count as defeat even on the seventh hit');
const timeoutState = { ...game.startLevel(boss), turn: 2 };
const timedOut = game.answer(boss, timeoutState, null, null, true, false);
assert(timedOut.hits === 0 && timedOut.playerHp < timeoutState.playerHp, 'A timed-out alert must damage the player');
const surgeState = { ...game.startLevel(boss), turn: 3 };
const surgeQuestion = game.question(boss, surgeState);
const dodged = game.answer(boss, surgeState, surgeQuestion.best, surgeQuestion.support, false, true);
const struck = game.answer(boss, surgeState, surgeQuestion.best, surgeQuestion.support, false, false);
assert(dodged.playerHp === struck.playerHp + 2, 'A successful dodge must block two damage');
process.stdout.write(JSON.stringify({ ok: true, levels: 6, questions: content.levels.reduce((n, l) => n + l.questions.length, 0), checks: ['four-card hands', 'seven hits', 'unlimited turns', 'loss risk', 'build cards'] }));
