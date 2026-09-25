/* In-memory UI flow; no browser, server, or npm dependency. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const app = { innerHTML: '' }, saved = {}, handlers = {};
let now = 0, nextTimer = 1;
const intervals = new Map();
const toast = { textContent: '', classList: { add() {}, remove() {} } };
const music = { paused: true, volume: 0, playCount: 0, pauseCount: 0,
  play() { this.paused = false; this.playCount++; return Promise.resolve(); },
  pause() { this.paused = true; this.pauseCount++; } };
const document = {
  getElementById(id) {
    if (id === 'app') return app;
    if (id === 'toast') return toast;
    if (id === 'how') return { scrollIntoView() {} };
    if (id === 'background-music') return music;
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
function unesc(text) {
  return text.replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}
function domCards() {
  return [...app.innerHTML.matchAll(/data-action="answer" data-answer="([^"]+)"/g)].map(match => match[1]);
}
function currentQuestion(level) {
  const heading = (app.innerHTML.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1];
  return level.questions.find(item => item.prompt === unesc(heading || ''));
}
/* Drives whatever challenge the duel is showing: deploy, build, timed, or match. */
function attack(level, index, best) {
  const html = app.innerHTML, hand = domCards();
  if (html.includes('match-prompts')) {
    const prompts = [...html.matchAll(/<li[^>]*><span>\d+<\/span><p>([\s\S]*?)<\/p>/g)].map(match => unesc(match[1]));
    check(prompts.length === 4, `Match prompts missing at ${index}.`);
    for (const prompt of prompts) {
      const question = level.questions.find(item => item.prompt === prompt);
      check(question, `Match prompt not found at ${index}: ${prompt}`);
      click('answer', { answer: question.best });
    }
  } else {
    const question = currentQuestion(level);
    check(question, `Question missing at ${index}.`);
    const main = best ? question.best : hand.find(id => id !== question.best && id !== question.support);
    check(main && hand.includes(main), `Attack card missing at ${index}.`);
    click('answer', { answer: main });
    if (html.includes('BUILD A FIX')) {
      const support = best ? question.support : hand.find(id => id !== main);
      check(support && support !== main, `Support card missing at ${index}.`);
      click('answer', { answer: support });
    }
  }
  check(app.innerHTML.includes('feedback-panel'), `Attack feedback missing at ${index}`);
  if (app.innerHTML.includes('Repaired +2 HP')) sawBotHeal = true;
  click('continue');
}
check(app.innerHTML.includes('Learn cloud.'), 'Title missing.');
click('map'); check(app.innerHTML.includes('Cloud Bootcamp'), 'Map missing.');
check(music.playCount > 0 && !music.paused, 'Background music did not start on Play.');
click('sound'); check(music.paused, 'Mute did not pause music.');
click('sound'); check(!music.paused, 'Unmute did not resume music.');
click('level', { level: '1' }); click('begin');
check(app.innerHTML.includes('12/12 HP') && app.innerHTML.includes('action-bar'), 'Three-action HUD missing.');
const first = window.GAME_CONTENT.levels[0];
attack(first, 0, true);
click('heal'); check(app.innerHTML.includes('REBUILD THE SYSTEM'), 'AWS heal minigame missing.');
for (const step of first.repair.steps) click('mini-repair', { answer: step.id });
check(app.innerHTML.includes('SYSTEM RESTORED!'), 'Heal success feedback missing.');
click('continue');
click('defend'); check(app.innerHTML.includes('COUNTER THE THREAT!'), 'AWS defense minigame missing.');
for (const wave of first.defense) click('mini-defense', { answer: wave.best });
check(app.innerHTML.includes('SHIELD ONLINE!'), 'Defense success feedback missing.');
click('continue');
attack(first, 1, true);
attack(first, 2, true);
click('heal'); check(app.innerHTML.includes('REBUILD THE SYSTEM'), 'Heal did not become reusable.');
for (const step of first.repair.steps) click('mini-repair', { answer: step.id });
click('continue');
click('defend'); check(app.innerHTML.includes('COUNTER THE THREAT!'), 'Defense did not become reusable.');
for (const wave of first.defense) click('mini-defense', { answer: wave.best });
click('continue');
for (let i = 3; i < 20 && !app.innerHTML.includes('Enemy defeated!'); i++) attack(first, i, true);
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
const badRepair = boss.repair.steps.find(step => step.id !== boss.repair.steps[0].id);
click('mini-repair', { answer: badRepair.id });
check(app.innerHTML.includes('REPAIR FAILED!'), 'Heal failure feedback missing.');
click('continue');
click('defend');
click('mini-defense', { answer: boss.defense[0].options.find(id => id !== boss.defense[0].best) });
check(app.innerHTML.includes('SHIELD FAILED!'), 'Defense failure feedback missing.');
click('continue');
for (let i = 1; i < 20 && !app.innerHTML.includes('You fell in battle'); i++) attack(boss, i, false);
check(app.innerHTML.includes('You fell in battle'), 'Defeat missing.');
click('retry'); check(app.innerHTML.includes('action-bar'), 'Retry missing.');
attack(boss, 0, true);
attack(boss, 1, true);
click('heal'); tick(18001);
check(app.innerHTML.includes('REPAIR FAILED!'), 'Heal timeout missing.');
click('continue');
click('defend'); tick(16001);
check(app.innerHTML.includes('SHIELD FAILED!'), 'Defense timeout missing.');
click('continue');
tick(12001);
check(app.innerHTML.includes('TIME OUT!'), 'Timed attack timeout missing.');
click('home'); click('reset');
check(window.GameProgress.load().unlocked === 1, 'Reset missing.');
process.stdout.write(JSON.stringify({ ok: true, checked: ['three actions', 'heal game', 'defense game', 'bot accuracy', 'bot heal', 'win', 'loss', 'retry', 'save', 'reset'] }));
