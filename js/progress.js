/* Versioned local progress with a safe in-memory fallback for file: URLs. */
(function () {
  "use strict";

  var KEY = "aws-question-duel-v1";
  var memory = null;

  function fresh() {
    return { unlocked: 1, best: {}, completed: {}, seenQuestions: {}, sound: true };
  }

  function normalize(value) {
    var clean = fresh();
    if (!value || typeof value !== "object") return clean;
    clean.unlocked = Math.max(1, Math.min(6, Number(value.unlocked) || 1));
    clean.best = value.best && typeof value.best === "object" ? value.best : {};
    clean.completed = value.completed && typeof value.completed === "object" ? value.completed : {};
    if (value.seenQuestions && typeof value.seenQuestions === "object") {
      Object.keys(value.seenQuestions).forEach(function (id) {
        if (Array.isArray(value.seenQuestions[id])) {
          clean.seenQuestions[id] = value.seenQuestions[id].filter(function (q) { return typeof q === "string"; });
        }
      });
    }
    clean.sound = value.sound !== false;
    return clean;
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (_) { /* Some browsers restrict localStorage for file: pages. */ }
    return normalize(memory);
  }

  function save(progress) {
    memory = normalize(progress);
    try { window.localStorage.setItem(KEY, JSON.stringify(memory)); } catch (_) { /* Session-only progress still works. */ }
    return memory;
  }

  function record(progress, level, state) {
    var next = normalize(progress);
    var id = String(level.id);
    next.best[id] = Math.max(Number(next.best[id]) || 0, state.playerScore);
    if (state.won) {
      next.completed[id] = true;
      next.unlocked = Math.max(next.unlocked, Math.min(6, level.id + 1));
    }
    return save(next);
  }

  function xp(progress) {
    return Object.keys(progress.best).reduce(function (sum, id) {
      return sum + (Number(progress.best[id]) || 0);
    }, 0);
  }
  function markSeen(progress, level, ids) {
    var next = normalize(progress), key = String(level.id);
    var valid = level.questions.map(function (q) { return q.id; });
    var seen = (next.seenQuestions[key] || []).filter(function (id) { return valid.indexOf(id) >= 0; });
    if (seen.length === valid.length) seen = [];
    ids.forEach(function (id) {
      if (valid.indexOf(id) < 0 || seen.indexOf(id) >= 0) return;
      if (seen.length === valid.length) seen = [];
      seen.push(id);
    });
    next.seenQuestions[key] = seen;
    return save(next);
  }

  function setSound(progress, enabled) {
    var next = normalize(progress);
    next.sound = Boolean(enabled);
    return save(next);
  }

  function unlockAll(progress) {
    var next = normalize(progress);
    next.unlocked = 6;
    return save(next);
  }

  function reset() {
    memory = fresh();
    try { window.localStorage.removeItem(KEY); } catch (_) { /* Memory is already reset. */ }
    return fresh();
  }

  window.GameProgress = { load: load, save: save, record: record, markSeen: markSeen, xp: xp, setSound: setSound, unlockAll: unlockAll, reset: reset };
}());
