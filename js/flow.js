/* Screen flow for the React UI: title, map, intro, duel, result, and the heal/defend
   minigames. Pure transitions only: no DOM, timers, storage, or sound. Mirrors the
   rules of the original js/main.js so GameEngine stays the single source of truth. */
(function () {
"use strict";

function initial() {
  return { screen: "title", levelId: null, duel: null, before: null, review: null, pick: null, mini: null, matchSlots: null, notice: null };
}
function levelOf(content, view) { return view.levelId ? content.levels[view.levelId - 1] : null; }
function canPlay(view) {
  return view.screen === "duel" && !view.review && !view.mini && view.duel && view.duel.status === "active";
}
function title() { return initial(); }
function map() { var v = initial(); v.screen = "map"; return v; }
function chooseLevel(content, progress, view, id) {
  if (!content.levels[id - 1] || id > progress.unlocked) return view;
  var v = initial(); v.screen = "intro"; v.levelId = id; return v;
}
function begin(content, engine, view) {
  var level = levelOf(content, view);
  if (!level) return view;
  var v = initial(); v.screen = "duel"; v.levelId = level.id; v.duel = engine.startLevel(level);
  return v;
}
function resolve(content, engine, view, action) {
  var level = levelOf(content, view);
  var duel = engine.act(level, view.duel, action);
  return { screen: "duel", levelId: view.levelId, duel: duel, before: view.duel,
    review: duel.history[duel.history.length - 1], pick: null, mini: null, matchSlots: null, notice: null };
}
function answer(content, engine, view, answerId, timedOut) {
  if (!canPlay(view)) return view;
  var level = levelOf(content, view), mode = engine.mode(level, view.duel);
  if (mode === "build" && !timedOut) {
    if (!view.pick) return Object.assign({}, view, { pick: answerId, notice: null });
    if (view.pick === answerId) return Object.assign({}, view, { pick: null, notice: "Main card cleared. Pick the main service again." });
  }
  return resolve(content, engine, view, { kind: "attack",
    answerId: mode === "build" ? view.pick : answerId,
    supportId: mode === "build" ? answerId : null, timedOut: Boolean(timedOut) });
}
function startMini(engine, view, kind) {
  if (!canPlay(view)) return view;
  if (kind === "heal" && !engine.canHeal(view.duel)) return view;
  if (kind === "defend" && !engine.canDefend(view.duel)) return view;
  return Object.assign({}, view, { pick: null, notice: null, mini: { kind: kind, step: 0, cleared: [] } });
}
function repairOptions(level) {
  /* Newer content ships an explicit five-card option set (with decoys) for the repair
     minigame. Older content only lists the three correct steps, so fall back to those. */
  if (level.repair.options) return level.repair.options;
  var steps = level.repair.steps;
  return [steps[1].id, steps[2].id, steps[0].id];
}
function miniOptions(level, mini) {
  return mini.kind === "heal" ? repairOptions(level) : level.defense[mini.step].options;
}
function miniAnswer(level, mini) {
  return mini.kind === "heal" ? level.repair.steps[mini.step].id : level.defense[mini.step].best;
}
function finishMini(content, engine, view, success) {
  if (!view.mini) return view;
  var level = levelOf(content, view), kind = view.mini.kind, detail = "";
  if (!success) {
    if (kind === "heal") {
      var step = level.repair.steps[view.mini.step];
      detail = step.clue + " Best: " + content.cards[step.id].name + ".";
    } else detail = level.defense[view.mini.step].why;
  }
  return resolve(content, engine, view, { kind: kind, success: Boolean(success), failureDetail: detail });
}
function miniPick(content, engine, view, id) {
  if (!view.mini) return view;
  var level = levelOf(content, view);
  if (id !== miniAnswer(level, view.mini)) return finishMini(content, engine, view, false);
  var step = view.mini.step + 1;
  if (step === 3) return finishMini(content, engine, view, true);
  return Object.assign({}, view, { mini: { kind: view.mini.kind, step: step, cleared: view.mini.cleared.concat([id]) } });
}
function matchPick(content, engine, view, cardId) {
  /* Match turns ask for four services placed against four prompts. Clicking a card
     drops it into the next open slot; clicking a placed card lifts it back out.
     Filling the last slot submits the turn immediately, no confirm step needed. */
  if (!canPlay(view)) return view;
  var level = levelOf(content, view);
  if (engine.mode(level, view.duel) !== "match") return view;
  var current = view.matchSlots || [null, null, null, null];
  var placedAt = current.indexOf(cardId);
  var next = current.slice();
  if (placedAt >= 0) {
    next[placedAt] = null;
    return Object.assign({}, view, { matchSlots: next, notice: null });
  }
  var empty = next.indexOf(null);
  if (empty < 0) return view;
  next[empty] = cardId;
  if (next.indexOf(null) < 0) return resolve(content, engine, view, { kind: "match", matches: next });
  return Object.assign({}, view, { matchSlots: next, notice: null });
}
function finishing(view) { return Boolean(view.screen === "duel" && view.review && view.duel.status === "complete"); }
function continueDuel(view) {
  if (view.screen !== "duel" || !view.review) return view;
  if (view.duel.status === "complete") return Object.assign({}, view, { screen: "result", review: null });
  return Object.assign({}, view, { review: null, before: null });
}
function outcome(view) {
  var r = view.review;
  if (!r) return null;
  if (r.kind === "heal") return r.success ? "repaired" : "failed";
  if (r.kind === "defend") return r.success ? "shielded" : "failed";
  if (r.timedOut) return "timeout";
  if (r.combo) return "combo";
  if (r.hit) return "hit";
  return r.quality >= 60 ? "close" : "wrong";
}

window.GameFlow = { initial: initial, title: title, map: map, chooseLevel: chooseLevel, begin: begin,
  canPlay: canPlay, answer: answer, matchPick: matchPick, startMini: startMini, repairOptions: repairOptions,
  miniOptions: miniOptions, miniAnswer: miniAnswer, miniPick: miniPick, finishMini: finishMini,
  finishing: finishing, continueDuel: continueDuel, outcome: outcome, levelOf: levelOf };
}());
