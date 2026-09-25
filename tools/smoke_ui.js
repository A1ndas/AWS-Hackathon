/* In-memory screen flow; no browser, server, or npm dependency. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const app = { innerHTML: '' };
const toast = { textContent: '', classList: { add() {}, remove() {} } };
const handlers = {}, saved = {};
const document = {
  getElementById(id) {
    if (id === 'app') return app;
    if (id === 'toast') return toast;
    if (id === 'how') return { scrollIntoView() {} };
    return null;
  },
  querySelector(selector) { return selector === '[data-action="continue"]' ? { focus() {} } : null; },
  addEventListener(type, callback) { handlers[type] = callback; },
  activeElement: { tagName: 'BODY' }
};
const window = {
  localStorage: {
    getItem(key) { return saved[key] || null; },
    setItem(key, value) { saved[key] = value; },
    removeItem(key) { delete saved[key]; }
  },
  setTimeout() {}, setInterval() { return 1; }, clearInterval() {},
  confirm() { return true; }
};
const box = { window, document, console };
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js', 'js/progress.js', 'js/ui.js', 'js/main.js']) {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), file), 'utf8'), box, { filename: file });
}
function check(ok, message) { if (!ok) throw new Error(message); }
function click(action, data = {}) {
  handlers.click({ target: { closest() { return { disabled: false, dataset: { action, ...data } }; } } });
}
function key(value) { handlers.keydown({ key: value, preventDefault() {} }); }
function move(level, turn, best) {
  const state = { turn };
  const q = level.questions[turn % level.questions.length];
  const hand = window.GameEngine.hand(level, state);
  const answer = best ? q.best : hand.find(id => id !== q.best && id !== q.support);
  const mode = window.GameEngine.mode(level, state);
  click('answer', { answer });
  if (mode === 'build') click('answer', { answer: best ? q.support : hand.find(id => id !== answer) });
  if (turn % 4 === 3 && level.id >= 2) {
    check(app.innerHTML.includes('DODGE THE ATTACK'), 'Dodge phase missing.');
    const danger = (turn + level.id) % 3;
    click('dodge', { lane: String(best ? (danger + 1) % 3 : danger) });
  }
  check(app.innerHTML.includes('feedback-panel'), `Feedback missing on turn ${turn}.`);
  click('continue');
}
check(app.innerHTML.includes('Learn cloud.'), 'Title missing.');
click('map');
check(app.innerHTML.includes('Cloud Bootcamp'), 'Map missing.');
click('level', { level: '1' });
click('begin');
check(app.innerHTML.includes('battle-hud'), 'Combat HUD missing.');
for (let i = 0; i < 7; i++) move(window.GAME_CONTENT.levels[0], i, true);
check(app.innerHTML.includes('Enemy defeated!'), 'Victory missing.');
check(window.GameProgress.load().unlocked === 2, 'Level unlock missing.');
click('map'); key('d');
check(window.GameProgress.load().unlocked === 6, 'Demo key missing.');
click('level', { level: '6' }); click('begin');
for (let i = 0; i < 7; i++) move(window.GAME_CONTENT.levels[5], i, true);
check(app.innerHTML.includes('You mastered the cloud!'), 'Final victory missing.');
check(window.GameProgress.load().completed['6'], 'Final save missing.');
click('retry');
for (let i = 0; i < 20 && !app.innerHTML.includes('You fell in battle'); i++) {
  move(window.GAME_CONTENT.levels[5], i, false);
}
check(app.innerHTML.includes('You fell in battle'), 'Defeat missing.');
click('retry'); check(app.innerHTML.includes('battle-hud'), 'Retry missing.');
click('home'); click('reset');
check(window.GameProgress.load().unlocked === 1, 'Reset missing.');
process.stdout.write(JSON.stringify({ ok: true, checked: ['title', 'map', 'battle', 'dodge', 'build', 'timed', 'victory', 'defeat', 'retry', 'save', 'reset'] }));
