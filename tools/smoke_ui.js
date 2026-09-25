/* In-memory screen-flow smoke test; no browser, server, or npm dependency. */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const app = { innerHTML: "" };
const toast = { textContent: "", classList: { add() {}, remove() {} } };
const handlers = {};
const saved = {};
const document = {
  getElementById(id) {
    if (id === "app") return app;
    if (id === "toast") return toast;
    if (id === "how") return { scrollIntoView() {} };
    return null;
  },
  querySelector(selector) {
    return selector === '[data-action="continue"]' ? { focus() {} } : null;
  },
  addEventListener(type, handler) { handlers[type] = handler; },
  activeElement: { tagName: "BODY" }
};
const window = {
  localStorage: {
    getItem(key) { return saved[key] || null; },
    setItem(key, value) { saved[key] = value; },
    removeItem(key) { delete saved[key]; }
  },
  setTimeout() {},
  confirm() { return true; }
};
const box = { window, document, console };
vm.createContext(box);
for (const file of ["data/content.js", "js/engine.js", "js/progress.js", "js/ui.js", "js/main.js"]) {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), file), "utf8"), box, { filename: file });
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}
function click(action, data = {}) {
  handlers.click({ target: { closest() { return { disabled: false, dataset: { action, ...data } }; } } });
}
function key(value) {
  handlers.keydown({ key: value, preventDefault() {} });
}

check(app.innerHTML.includes("Think fast."), "Title did not render.");
click("map");
check(app.innerHTML.includes("The CD Era"), "Level map did not render.");
click("level", { level: "1" });
check(app.innerHTML.includes("Your seven answer cards"), "Level introduction did not render.");
click("begin");
check(!app.innerHTML.includes('class="intro-screen"'), "Intro remained on screen.");
check(app.innerHTML.includes("answer-grid"), "Seven-card hand did not render.");
for (const q of window.GAME_CONTENT.levels[0].questions) {
  click("answer", { answer: q.best });
  check(app.innerHTML.includes("feedback-panel"), `Feedback did not render for ${q.id}.`);
  check(app.innerHTML.includes(q.why), `Learning explanation was not shown for ${q.id}.`);
  click("continue");
}
check(app.innerHTML.includes("You beat PatchBot!"), "Victory result did not render.");
check(app.innerHTML.includes("Question recap"), "Question recap did not render.");
check(window.GameProgress.load().unlocked === 2, "Victory did not unlock level two.");
click("map");
key("d");
check(window.GameProgress.load().unlocked === 6, "Demo key did not unlock all levels.");
click("level", { level: "6" });
click("begin");
for (const q of window.GAME_CONTENT.levels[5].questions) {
  const level = window.GAME_CONTENT.levels[5];
  const minimum = Math.min(...q.scores);
  click("answer", { answer: level.answers[q.scores.indexOf(minimum)] });
  click("continue");
}
check(app.innerHTML.includes("PatchBot wins this round"), "Defeat result did not render.");
click("retry");
check(app.innerHTML.includes("answer-grid"), "Retry did not restart combat.");
for (const q of window.GAME_CONTENT.levels[5].questions) {
  click("answer", { answer: q.best });
  click("continue");
}
check(app.innerHTML.includes("You mastered the cloud!"), "Final victory did not render.");
check(window.GameProgress.load().completed["6"], "Final level completion was not saved.");
click("home");
click("reset");
check(window.GameProgress.load().unlocked === 1, "Reset did not clear unlocks.");
process.stdout.write(JSON.stringify({ ok: true, checked: ["title", "map", "intro", "duel", "feedback", "victory", "save", "demo", "defeat", "retry", "final victory", "reset"] }));
