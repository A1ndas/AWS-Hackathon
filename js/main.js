/* Navigation, card input, and the timed-alert clock. */
(function () {
  "use strict";
  var content = window.GAME_CONTENT;
  var engine = window.GameEngine;
  var progressApi = window.GameProgress;
  var ui = window.GameUI;
  var progress = progressApi.load();
  var screen = 'title', level = null, duel = null, review = null, pick = null, pending = null;
  var timer = null, deadline = 0;

  function stopTimer() { if (timer !== null) window.clearInterval(timer); timer = null; }
  function draw() {
    if (screen === 'title') ui.renderTitle(progress, content);
    if (screen === 'map') ui.renderMap(progress, content);
    if (screen === 'intro') ui.renderIntro(progress, content, level);
    if (screen === 'duel') ui.renderDuel(progress, content, level, duel, review, pick, pending);
    if (screen === 'result') ui.renderResult(progress, content, level, duel);
  }
  function startTimer() {
    stopTimer();
    if (screen !== 'duel' || review || engine.mode(level, duel) !== 'timed') return;
    deadline = Date.now() + 12000;
    timer = window.setInterval(function () {
      var left = Math.max(0, deadline - Date.now());
      var bar = document.getElementById('timer-bar');
      var label = document.getElementById('timer-text');
      if (bar) bar.style.width = Math.round(left / 120) + '%';
      if (label) label.textContent = Math.ceil(left / 1000) + 's';
      if (left <= 0) playAnswer(null, true);
    }, 100);
  }
  function startDodgeTimer() {
    stopTimer(); deadline = Date.now() + 5000;
    timer = window.setInterval(function () {
      var left = Math.max(0, deadline - Date.now());
      var label = document.getElementById('dodge-time');
      if (label) label.textContent = (left / 1000).toFixed(1) + 's';
      if (left <= 0) resolveDodge(null);
    }, 100);
  }
  function map() { stopTimer(); screen = 'map'; review = null; pick = null; pending = null; draw(); }
  function chooseLevel(id) {
    if (id < 1 || id > progress.unlocked) return;
    stopTimer(); level = content.levels[id - 1]; duel = null; review = null;
    pick = null; pending = null; screen = 'intro'; draw();
  }
  function begin() {
    stopTimer(); duel = engine.startLevel(level); review = null; pick = null; pending = null;
    screen = 'duel'; draw(); ui.sound('start', progress.sound); startTimer();
  }
  function playAnswer(answerId, timedOut) {
    if (screen !== 'duel' || review || pending || duel.status !== 'active') return;
    var mode = engine.mode(level, duel);
    if (mode === 'build' && !timedOut && !pick) {
      pick = answerId; ui.sound('pick', progress.sound); draw(); return;
    }
    if (mode === 'build' && !timedOut && pick === answerId) {
      ui.toast('Choose a different supporting card.'); return;
    }
    stopTimer();
    var move = { answerId: mode === 'build' ? pick : answerId,
      supportId: mode === 'build' ? answerId : null, timedOut: Boolean(timedOut) };
    pick = null;
    if (level.id >= 2 && engine.intent(level, duel).kind === 'surge') {
      pending = move; draw(); ui.sound('start', progress.sound); startDodgeTimer(); return;
    }
    resolveMove(move, false);
  }
  function resolveMove(move, guarded) {
    duel = engine.answer(level, duel, move.answerId, move.supportId, move.timedOut, guarded);
    review = duel.history[duel.history.length - 1];
    ui.sound(review.timedOut ? 'timeout' : review.combo ? 'combo' : review.hit ? 'hit' : review.quality >= 60 ? 'pick' : 'hurt', progress.sound);
    draw();
    var next = document.querySelector('[data-action="continue"]');
    if (next) next.focus();
  }
  function resolveDodge(lane) {
    if (!pending || screen !== 'duel') return;
    stopTimer();
    var danger = (duel.turn + level.id) % 3;
    var guarded = lane !== null && lane !== danger;
    var move = pending; pending = null;
    ui.sound(guarded ? 'build' : 'hurt', progress.sound);
    resolveMove(move, guarded);
  }
  function continueDuel() {
    if (screen !== 'duel' || !review) return;
    review = null;
    if (duel.status === 'complete') {
      progress = progressApi.record(progress, level, { won: duel.won, playerScore: duel.score });
      screen = 'result'; ui.sound(duel.won ? 'win' : 'lose', progress.sound);
    }
    draw(); startTimer();
  }
  document.addEventListener('click', function (event) {
    var control = event.target.closest('[data-action]');
    if (!control || control.disabled) return;
    var action = control.dataset.action;
    if (action === 'home') { stopTimer(); screen = 'title'; review = null; pending = null; draw(); }
    else if (action === 'map') map();
    else if (action === 'how') document.getElementById('how').scrollIntoView({ behavior: 'smooth' });
    else if (action === 'level') chooseLevel(Number(control.dataset.level));
    else if (action === 'begin' || action === 'retry') begin();
    else if (action === 'answer') playAnswer(control.dataset.answer, false);
    else if (action === 'dodge') resolveDodge(Number(control.dataset.lane));
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
    if (screen === 'duel' && pending && /^[1-3]$/.test(event.key)) {
      event.preventDefault(); resolveDodge(Number(event.key) - 1); return;
    }
    if (screen === 'duel' && !review && /^[1-4]$/.test(event.key)) {
      event.preventDefault(); playAnswer(engine.hand(level, duel)[Number(event.key) - 1], false);
    }
  });
  draw();
}());
