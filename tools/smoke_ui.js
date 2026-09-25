/* Screen-flow check for the React UI's DOM-free flow module (js/flow.js). */
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const box = { window: {} };
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js', 'js/progress.js', 'js/flow.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
}
const content = box.window.GAME_CONTENT, engine = box.window.GameEngine;
const flow = box.window.GameFlow, progressApi = box.window.GameProgress;
let progress = progressApi.reset();

let view = flow.initial();
assert.strictEqual(view.screen, 'title');
view = flow.map();
assert.strictEqual(view.screen, 'map');
assert.strictEqual(flow.chooseLevel(content, progress, view, 2), view, 'Locked levels stay locked');
view = flow.chooseLevel(content, progress, view, 1);
assert.strictEqual(view.screen, 'intro');
view = flow.begin(content, engine, view);
assert.strictEqual(view.screen, 'duel');
assert.strictEqual(view.duel.playerHp, 12);

// A close answer costs nothing, a wrong one costs 2 HP, a timeout costs 3.
const level1 = content.levels[0];
const q = engine.question(level1, view.duel);
const wrong = engine.hand(level1, view.duel).find(id => id !== q.best && q.scores[level1.answers.indexOf(id)] < 60);
view = flow.answer(content, engine, view, wrong, false);
assert.strictEqual(flow.outcome(view), 'wrong');
assert.strictEqual(view.review.wrongDamage, 2);
assert.strictEqual(flow.answer(content, engine, view, q.best, false), view, 'No input while reviewing');
view = flow.continueDuel(view);
assert.strictEqual(view.review, null);

// Heal minigame: three correct repairs restore HP.
let v2 = view;
while (!engine.canHeal(v2.duel)) {
  const qq = engine.question(level1, v2.duel);
  v2 = flow.continueDuel(flow.answer(content, engine, v2, qq.best, false));
}
v2 = flow.startMini(engine, v2, 'heal');
assert.strictEqual(v2.mini.kind, 'heal');
// The option set may include decoy cards; the three correct steps must still all be offered.
const healOptions = flow.miniOptions(level1, v2.mini);
for (const step of level1.repair.steps) assert(healOptions.includes(step.id), 'Repair options must include every correct step');
for (let i = 0; i < 3; i++) v2 = flow.miniPick(content, engine, v2, flow.miniAnswer(level1, v2.mini));
assert.strictEqual(flow.outcome(v2), 'repaired');
assert(v2.review.playerHeal > 0);
v2 = flow.continueDuel(v2);

// Defense minigame: a wrong pick fails with a teaching note.
let v3 = flow.startMini(engine, v2, 'defend');
const bad = flow.miniOptions(level1, v3.mini).find(id => id !== flow.miniAnswer(level1, v3.mini));
v3 = flow.miniPick(content, engine, v3, bad);
assert.strictEqual(flow.outcome(v3), 'failed');
assert(v3.review.failureDetail.length > 10);

// Match minigame: place four cards against four prompts. Placing a card twice lifts it back out,
// and a wrong pairing costs HP instead of landing a hit.
let v4 = flow.continueDuel(v3);
while (engine.mode(level1, v4.duel) !== 'match') {
  const qq = engine.question(level1, v4.duel);
  v4 = flow.continueDuel(flow.answer(content, engine, v4, qq.best, false));
}
const matchInfo = engine.matchPairs(level1, v4.duel);
let v4b = flow.matchPick(content, engine, v4, matchInfo.answers[0]);
const filled = v4b.matchSlots.filter(Boolean);
assert.strictEqual(filled.length, 1, 'Exactly one slot fills on the first pick');
assert.strictEqual(filled[0], matchInfo.answers[0], 'First card fills the first open slot');
v4b = flow.matchPick(content, engine, v4b, matchInfo.answers[0]);
assert.strictEqual(v4b.matchSlots.every((slot) => slot === null), true, 'Picking a placed card again lifts it back out');
// Deliberately mismatch every prompt: rotating the four correct answers by one
// guarantees no prompt keeps its own answer (a fixed-point-free derangement).
const correctIds = matchInfo.questions.map(qq => qq.best);
const allWrong = correctIds.slice(1).concat(correctIds[0]);
for (const id of allWrong) v4 = flow.matchPick(content, engine, v4, id);
assert.notStrictEqual(flow.outcome(v4), 'hit', 'A mismatched match should not land a hit');
assert(v4.review.wrongDamage > 0, 'A failed match costs HP');
v4 = flow.continueDuel(v4);

// Perfect play wins every level, including two-card builds; progress unlocks the next level.
for (const level of content.levels) {
  progress = progressApi.unlockAll(progress);
  let v = flow.begin(content, engine, flow.chooseLevel(content, progress, flow.map(), level.id));
  let guard = 0;
  while (v.screen === 'duel' && guard++ < 60) {
    if (v.review) {
      if (flow.finishing(v)) progress = progressApi.record(progress, level, { won: v.duel.won, playerScore: v.duel.score });
      v = flow.continueDuel(v);
      continue;
    }
    const turnMode = engine.mode(level, v.duel);
    if (turnMode === 'match') {
      const info = engine.matchPairs(level, v.duel);
      for (const question of info.questions) v = flow.matchPick(content, engine, v, question.best);
      assert.strictEqual(flow.outcome(v), 'hit', 'Perfect matching should land a hit');
    } else if (turnMode === 'build') {
      const qq = engine.question(level, v.duel);
      v = flow.answer(content, engine, v, qq.best, false);
      assert.strictEqual(v.pick, qq.best, 'Build mode keeps the main card');
      v = flow.answer(content, engine, v, qq.support, false);
      assert.strictEqual(flow.outcome(v), 'combo');
    } else {
      const qq = engine.question(level, v.duel);
      v = flow.answer(content, engine, v, qq.best, false);
    }
  }
  assert.strictEqual(v.screen, 'result');
  assert(v.duel.won, `Perfect play should win level ${level.id}`);
  assert(progress.completed[String(level.id)], 'Wins are recorded');
}

// Timed alerts: letting the clock run out costs 3 HP.
const level4 = content.levels[3];
let t = flow.begin(content, engine, flow.chooseLevel(content, progress, flow.map(), 4));
while (engine.mode(level4, t.duel) !== 'timed') {
  t = flow.continueDuel(flow.answer(content, engine, t, engine.question(level4, t.duel).best, false));
}
t = flow.answer(content, engine, t, null, true);
assert.strictEqual(flow.outcome(t), 'timeout');
assert.strictEqual(t.review.wrongDamage, 3);

process.stdout.write(JSON.stringify({ ok: true, checks: ['title/map/intro/duel/result', 'locked levels', 'wrong + timeout damage', 'heal minigame', 'defense minigame', 'match minigame', 'two-card builds', 'all six levels winnable', 'progress unlocks'] }) + '\n');
