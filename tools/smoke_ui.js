/* In-memory UI flow; no browser, server, or npm dependency. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const app = { innerHTML: '' }, saved = {}, handlers = {};
let now = 0, nextTimer = 1;
const intervals = new Map();
const toast = { textContent: '', classList: { add() {}, remove() {} } };
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
  setTimeout() {},
  setInterval(callback) { const id = nextTimer++; intervals.set(id, callback); return id; },
  clearInterval(id) { intervals.delete(id); },
  confirm() { return true; }
};
const box = { window, document, console, Date: { now() { return now; } } };
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js', 'js/progress.js', 'js/ui.js', 'js/main.js']) {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), file), 'utf8'), box, { filename: file });
}
function check(value, message) { if (!value) throw new Error(message); }
function click(action, data = {}) {
  handlers.click({ target: { closest() { return { disabled: false, dataset: { action, ...data } }; } } });
}
function key(value) { handlers.keydown({ key: value, preventDefault() {} }); }
function tick(milliseconds) { now += milliseconds; for (const callback of [...intervals.values()]) callback(); }
let sawBotHeal = false;
function attack(level, index, best) {
  const snapshot = { attackIndex: index };
  const q = level.questions[index % level.questions.length];
  const hand = window.GameEngine.hand(level, snapshot);
  const main = best ? q.best : hand.find(id => id !== q.best && id !== q.support);
  click('answer', { answer: main });
  if (window.GameEngine.mode(level, snapshot) === 'build') {
    click('answer', { answer: best ? q.support : hand.find(id => id !== main) });
  }
  check(app.innerHTML.includes('feedback-panel'), `Attack feedback missing at ${index}`);
  if (app.innerHTML.includes('Repaired +2 HP')) sawBotHeal = true;
  click('continue');
}
check(app.innerHTML.includes('Learn cloud.'), 'Title missing.');
click('map'); check(app.innerHTML.includes('Cloud Bootcamp'), 'Map missing.');
click('level', { level: '1' }); click('begin');
check(app.innerHTML.includes('12/12 HP') && app.innerHTML.includes('action-bar'), 'Three-action HUD missing.');
const first = window.GAME_CONTENT.levels[0];
attack(first, 0, true);
click('heal'); check(app.innerHTML.includes('REPAIR THE CIRCUIT'), 'Heal minigame missing.');
for (const color of window.GameEngine.healPattern(first, { turn: 1 })) click('mini-color', { color });
check(app.innerHTML.includes('SYSTEM RESTORED!'), 'Heal success feedback missing.');
click('continue');
click('defend'); check(app.innerHTML.includes('RAISE THE SHIELD!'), 'Defense minigame missing.');
for (let wave = 0; wave < 3; wave++) {
  const danger = window.GameEngine.dangerLane(first, { turn: 2 }, wave);
  click('mini-lane', { lane: String((danger + 1) % 3) });
}
check(app.innerHTML.includes('SHIELD ONLINE!'), 'Defense success feedback missing.');
click('continue');
for (let i = 1; i < 15 && !app.innerHTML.includes('Enemy defeated!'); i++) attack(first, i, true);
check(app.innerHTML.includes('Enemy defeated!'), 'Level one victory missing.');
check(sawBotHeal, 'Enemy did not use the same two-HP heal.');
check(window.GameProgress.load().unlocked === 2, 'Level unlock missing.');
click('map'); key('d');
check(window.GameProgress.load().unlocked === 6, 'Demo key missing.');
const boss = window.GAME_CONTENT.levels[5];
click('level', { level: '6' }); click('begin');
check(app.innerHTML.includes('70%'), 'Higher bot accuracy missing.');
for (let i = 0; i < 15 && !app.innerHTML.includes('You mastered the cloud!'); i++) attack(boss, i, true);
check(app.innerHTML.includes('You mastered the cloud!'), 'Final victory missing.');
check(window.GameProgress.load().completed['6'], 'Final save missing.');
click('retry');
attack(boss, 0, false);
click('heal');
const badColor = ['orange', 'cyan', 'violet', 'lime'].find(color => color !== window.GameEngine.healPattern(boss, { turn: 1 })[0]);
click('mini-color', { color: badColor });
check(app.innerHTML.includes('REPAIR FAILED!'), 'Heal failure feedback missing.');
click('continue');
click('defend');
click('mini-lane', { lane: String(window.GameEngine.dangerLane(boss, { turn: 2 }, 0)) });
check(app.innerHTML.includes('SHIELD FAILED!'), 'Defense failure feedback missing.');
click('continue');
for (let i = 1; i < 20 && !app.innerHTML.includes('You fell in battle'); i++) attack(boss, i, false);
check(app.innerHTML.includes('You fell in battle'), 'Defeat missing.');
click('retry'); check(app.innerHTML.includes('action-bar'), 'Retry missing.');
attack(boss, 0, true);
click('heal'); tick(9001);
check(app.innerHTML.includes('REPAIR FAILED!'), 'Heal timeout missing.');
click('continue');
click('defend'); tick(7001);
check(app.innerHTML.includes('SHIELD FAILED!'), 'Defense timeout missing.');
click('continue');
attack(boss, 1, true);
tick(12001);
check(app.innerHTML.includes('TIME OUT!'), 'Timed attack timeout missing.');
click('home'); click('reset');
check(window.GameProgress.load().unlocked === 1, 'Reset missing.');
process.stdout.write(JSON.stringify({ ok: true, checked: ['three actions', 'heal game', 'defense game', 'bot accuracy', 'bot heal', 'win', 'loss', 'retry', 'save', 'reset'] }));
