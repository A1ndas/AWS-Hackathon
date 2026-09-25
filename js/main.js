/* Navigation, attack cards, and the heal/defense minigames. */
(function () {
  "use strict";
  var content = window.GAME_CONTENT, engine = window.GameEngine;
  var progressApi = window.GameProgress, ui = window.GameUI;
  var progress = progressApi.load();
  var screen = 'title', level = null, duel = null, review = null, pick = null, mini = null;
  var timer = null, deadline = 0;

  function stopTimer() { if (timer !== null) window.clearInterval(timer); timer = null; }
  function draw() {
    if (screen === 'title') ui.renderTitle(progress, content);
    if (screen === 'map') ui.renderMap(progress, content);
    if (screen === 'intro') ui.renderIntro(progress, content, level);
    if (screen === 'duel') ui.renderDuel(progress, content, level, duel, review, pick, mini);
    if (screen === 'result') ui.renderResult(progress, content, level, duel);
  }
  function startAttackTimer() {
    stopTimer();
    if (screen !== 'duel' || review || mini || engine.mode(level, duel) !== 'timed') return;
    deadline = Date.now() + 12000;
    timer = window.setInterval(function () {
      var left = Math.max(0, deadline - Date.now());
      var bar = document.getElementById('timer-bar'), label = document.getElementById('timer-text');
      if (bar) bar.style.width = Math.round(left / 120) + '%';
      if (label) label.textContent = Math.ceil(left / 1000) + 's';
      if (left <= 0) playAnswer(null, true);
    }, 100);
  }
  function startMiniTimer() {
    stopTimer(); deadline = Date.now() + (mini.kind === 'heal' ? 9000 : 7000);
    timer = window.setInterval(function () {
      var left = Math.max(0, deadline - Date.now());
      var label = document.getElementById('mini-time');
      if (label) label.textContent = (left / 1000).toFixed(1) + 's';
      if (left <= 0) finishMini(false);
    }, 100);
  }
  function map() { stopTimer(); screen = 'map'; review = null; pick = null; mini = null; draw(); }
  function chooseLevel(id) {
    if (id < 1 || id > progress.unlocked) return;
    stopTimer(); level = content.levels[id - 1]; duel = null; review = null;
    pick = null; mini = null; screen = 'intro'; draw();
  }
  function begin() {
    stopTimer(); duel = engine.startLevel(level); review = null; pick = null; mini = null;
    screen = 'duel'; draw(); ui.sound('start', progress.sound); startAttackTimer();
  }
  function resolve(action) {
    stopTimer(); mini = null; pick = null;
    duel = engine.act(level, duel, action);
    review = duel.history[duel.history.length - 1];
    var cue = action.kind === 'heal' ? (action.success ? 'heal' : 'hurt') :
      action.kind === 'defend' ? (action.success ? 'shield' : 'hurt') :
      review.timedOut ? 'timeout' : review.combo ? 'combo' : review.hit ? 'hit' :
      review.quality >= 60 ? 'pick' : 'hurt';
    ui.sound(cue, progress.sound);
    if (review.enemyHeal || review.botDamage) {
      var enemyCue = review.enemyHeal ? 'heal' : 'hurt';
      window.setTimeout(function () { ui.sound(enemyCue, progress.sound); }, 260);
    }
    draw();
    var next = document.querySelector('[data-action="continue"]');
    if (next) next.focus();
  }
  function playAnswer(answerId, timedOut) {
    if (screen !== 'duel' || review || mini || duel.status !== 'active') return;
    var mode = engine.mode(level, duel);
    if (mode === 'build' && !timedOut && !pick) {
      pick = answerId; ui.sound('pick', progress.sound); draw(); return;
    }
    if (mode === 'build' && !timedOut && pick === answerId) {
      ui.toast('Choose a different supporting card.'); return;
    }
    resolve({ kind: 'attack', answerId: mode === 'build' ? pick : answerId,
      supportId: mode === 'build' ? answerId : null, timedOut: Boolean(timedOut) });
  }
  function startMini(kind) {
    if (screen !== 'duel' || review || mini || duel.status !== 'active') return;
    if (kind === 'heal' && duel.playerHealUsed || kind === 'defend' && duel.defendUsed) return;
    stopTimer(); pick = null;
    mini = kind === 'heal' ? { kind: kind, step: 0, sequence: engine.healPattern(level, duel) } :
      { kind: kind, step: 0 };
    draw(); ui.sound('start', progress.sound); startMiniTimer();
  }
  function finishMini(success) {
    if (!mini) return;
    var kind = mini.kind;
    resolve({ kind: kind, success: Boolean(success) });
  }
  function miniColor(color) {
    if (!mini || mini.kind !== 'heal') return;
    if (color !== mini.sequence[mini.step]) { finishMini(false); return; }
    mini.step++;
    if (mini.step === 3) { finishMini(true); return; }
    ui.sound('pick', progress.sound); draw();
  }
  function miniLane(lane) {
    if (!mini || mini.kind !== 'defend') return;
    if (lane === engine.dangerLane(level, duel, mini.step)) { finishMini(false); return; }
    mini.step++;
    if (mini.step === 3) { finishMini(true); return; }
    ui.sound('shield', progress.sound); draw();
  }
  function continueDuel() {
    if (screen !== 'duel' || !review) return;
    review = null;
    if (duel.status === 'complete') {
      progress = progressApi.record(progress, level, { won: duel.won, playerScore: duel.score });
      screen = 'result'; ui.sound(duel.won ? 'win' : 'lose', progress.sound);
    }
    draw(); startAttackTimer();
  }
  document.addEventListener('click', function (event) {
    var control = event.target.closest('[data-action]');
    if (!control || control.disabled) return;
    var action = control.dataset.action;
    if (action === 'home') { stopTimer(); screen = 'title'; review = null; mini = null; draw(); }
    else if (action === 'map') map();
    else if (action === 'how') document.getElementById('how').scrollIntoView({ behavior: 'smooth' });
    else if (action === 'level') chooseLevel(Number(control.dataset.level));
    else if (action === 'begin' || action === 'retry') begin();
    else if (action === 'answer') playAnswer(control.dataset.answer, false);
    else if (action === 'heal' || action === 'defend') startMini(action);
    else if (action === 'mini-color') miniColor(control.dataset.color);
    else if (action === 'mini-lane') miniLane(Number(control.dataset.lane));
    else if (action === 'continue') continueDuel();
    else if (action === 'next-level') chooseLevel(level.id + 1);
    else if (action === 'sound') { progress = progressApi.setSound(progress, !progress.sound); draw(); }
    else if (action === 'reset' && window.confirm('Reset all saved Question Duel progress?')) {
      stopTimer(); progress = progressApi.reset(); screen = 'title'; draw(); ui.toast('Progress reset.');
    }
  });
  document.addEventListener('keydown', function (event) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (screen === 'map' && event.key.toLowerCase() === 'd') {
      progress = progressApi.unlockAll(progress); draw(); ui.toast('Demo mode: all levels unlocked!'); return;
    }
    if (screen === 'duel' && review && event.key === 'Enter') {
      event.preventDefault(); continueDuel(); return;
    }
    if (screen === 'duel' && mini && /^[1-4]$/.test(event.key)) {
      event.preventDefault();
      if (mini.kind === 'heal') miniColor(['orange', 'cyan', 'violet', 'lime'][Number(event.key) - 1]);
      else if (Number(event.key) <= 3) miniLane(Number(event.key) - 1);
      return;
    }
    if (screen === 'duel' && !review && !mini && /^[1-4]$/.test(event.key)) {
      event.preventDefault(); playAnswer(engine.hand(level, duel)[Number(event.key) - 1], false);
    }
  });
  draw();
}());
