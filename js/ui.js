/* Presentation and small sound effects. Gameplay rules live in engine.js. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var audioContext = null;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (match) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[match];
    });
  }

  function chrome(progress, content, active) {
    return '<header class="topbar">' +
      '<button class="brand" data-action="home" aria-label="Go to title"><span class="brand-mark">✦</span><span>QUESTION<span class="brand-accent">DUEL</span></span></button>' +
      '<nav class="topnav" aria-label="Main navigation">' +
      '<button class="nav-link ' + (active === "map" ? "is-active" : "") + '" data-action="map">Level map</button>' +
      '<span class="xp-pill" title="Best scores across your levels">✦ ' + esc(window.GameProgress.xp(progress)) + ' XP</span>' +
      '<button class="sound-button" data-action="sound" aria-label="' + (progress.sound ? "Mute sounds" : "Enable sounds") + '" title="Toggle sounds">' + (progress.sound ? "🔊" : "🔇") + '</button>' +
      '</nav></header>';
  }

  function shell(progress, content, active, body) {
    app.innerHTML = '<div class="shell">' + chrome(progress, content, active) + '<main id="main-content">' + body + '</main><div id="toast" class="toast" role="status" aria-live="polite"></div></div>';
  }

  function answerCard(id, index, content, options) {
    var card = content.cards[id];
    var selected = options && options.selected === id;
    var best = options && options.best === id;
    var rival = options && options.rival === id;
    var disabled = options && options.disabled;
    var classes = "answer-card type-" + esc(card.type) + (selected ? " picked" : "") + (best ? " best" : "") + (rival ? " rival-pick" : "");
    return '<button class="' + classes + '" data-action="answer" data-answer="' + esc(id) + '" ' + (disabled ? "disabled" : "") + ' title="' + esc(card.tip) + '" aria-label="Answer ' + (index + 1) + ': ' + esc(card.name) + '. ' + esc(card.tip) + '">' +
      '<span class="card-num">' + (index + 1) + '</span><span class="card-icon" aria-hidden="true">' + esc(card.icon) + '</span>' +
      '<span class="card-name">' + esc(card.name) + '</span><span class="card-type">' + esc(card.type) + '</span>' +
      '</button>';
  }

  function renderTitle(progress, content) {
    var body = '<section class="hero">' +
      '<div class="hero-copy"><div class="eyebrow"><span class="pulse-dot"></span> SINGLE-PLAYER AWS ARCADE</div>' +
      '<h1>Think fast.<br><span>Choose wisely.</span><br>Learn cloud.</h1>' +
      '<p>Seven answer cards. Seven real-world questions. Beat a scripted bot by picking the service that fits the problem <em>best</em>.</p>' +
      '<div class="hero-actions"><button class="primary-button" data-action="map">Play the game <span aria-hidden="true">→</span></button>' +
      '<button class="ghost-button" data-action="how">How it works</button></div>' +
      '<div class="hero-stats"><div><strong>6</strong><small>tech eras</small></div><div><strong>42</strong><small>scenarios</small></div><div><strong>7</strong><small>choices per duel</small></div></div></div>' +
      '<div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>' +
      '<div class="floating-card float-one"><span>☁️</span><b>Cloud</b><small>BEST FIT</small></div>' +
      '<div class="floating-card float-two"><span>💽</span><b>Hard drive</b><small>WORKS, BUT...</small></div>' +
      '<div class="hero-bot">🤖<span>PATCHBOT<br><b>READY TO DUEL</b></span></div></div></section>' +
      '<section class="how-panel" id="how"><div><span class="step-index">01</span><h2>Read the problem</h2><p>Every question describes a real technology need.</p></div>' +
      '<div><span class="step-index">02</span><h2>Play an answer</h2><p>One card can work for several problems, with different trade-offs.</p></div>' +
      '<div><span class="step-index">03</span><h2>Learn the reason</h2><p>See the best fit, earn points, and outscore PatchBot.</p></div></section>' +
      '<footer class="title-footer"><span>Built to learn AWS services through play.</span><button data-action="reset" class="text-button">Reset progress</button></footer>';
    shell(progress, content, "title", body);
  }

  function renderMap(progress, content) {
    var nodes = content.levels.map(function (level) {
      var locked = level.id > progress.unlocked;
      var done = Boolean(progress.completed[String(level.id)]);
      var best = Number(progress.best[String(level.id)]) || 0;
      return '<button class="level-node ' + (locked ? "locked" : "") + (done ? " completed" : "") + '" data-action="level" data-level="' + level.id + '" ' + (locked ? "disabled" : "") + ' aria-label="Level ' + level.id + ': ' + esc(level.name) + (locked ? ", locked" : "") + '">' +
        '<span class="level-line"></span><span class="level-icon" aria-hidden="true">' + esc(level.icon) + '</span>' +
        '<span class="level-kicker">LEVEL 0' + level.id + ' · ' + esc(level.theme) + '</span><span class="level-name">' + esc(level.name) + '</span>' +
        '<span class="level-meta">' + (locked ? "LOCKED" : done ? "CLEARED · BEST " + best : "READY TO PLAY") + '</span>' +
        '<span class="level-arrow">' + (locked ? "🔒" : "↗") + '</span></button>';
    }).join("");
    var body = '<section class="page-heading"><div class="eyebrow">YOUR JOURNEY THROUGH TECH</div><h1>Level <span>map</span></h1>' +
      '<p>From physical disks to a global AWS architecture. Win each seven-question duel to unlock the next era.</p></section>' +
      '<section class="map-status"><div><small>LEVELS CLEARED</small><strong>' + Object.keys(progress.completed).filter(function (id) { return progress.completed[id]; }).length + ' / 6</strong></div>' +
      '<div><small>KNOWLEDGE XP</small><strong>' + esc(window.GameProgress.xp(progress)) + '</strong></div>' +
      '<div><small>CHALLENGE</small><strong>Beat PatchBot</strong></div></section>' +
      '<section class="level-grid" aria-label="Choose a level">' + nodes + '</section>' +
      '<p class="map-tip">Demo shortcut: press <kbd>D</kbd> here to unlock all six levels.</p>';
    shell(progress, content, "map", body);
  }

  function renderIntro(progress, content, level) {
    var deck = level.answers.map(function (id) {
      var card = content.cards[id];
      return '<div class="deck-chip type-' + esc(card.type) + '"><span>' + esc(card.icon) + '</span>' + esc(card.name) + '</div>';
    }).join("");
    var body = '<section class="intro-screen"><div class="intro-symbol">' + esc(level.icon) + '</div><div class="eyebrow">LEVEL 0' + level.id + ' · ' + esc(level.theme) + '</div>' +
      '<h1>' + esc(level.name) + '</h1><p class="intro-text">' + esc(level.intro) + '</p>' +
      '<div class="versus-strip"><div><span class="versus-avatar">🧠</span><strong>YOU</strong><small>Choose the best fit</small></div><span class="versus-word">VS</span>' +
      '<div><span class="versus-avatar">' + esc(level.enemyIcon) + '</span><strong>' + esc(level.enemy) + '</strong><small>Scripted by PatchBot</small></div></div>' +
      '<div class="intro-deck"><h2>Your seven answer cards</h2><div>' + deck + '</div></div>' +
      '<div class="intro-actions"><button class="primary-button" data-action="begin">Start duel <span aria-hidden="true">→</span></button>' +
      '<button class="ghost-button" data-action="map">Back to map</button></div></section>';
    shell(progress, content, "intro", body);
  }

  function feedbackMarkup(level, content, turn) {
    var q = level.questions[turn.questionIndex];
    var answer = content.cards[turn.answerId];
    var best = content.cards[turn.bestId];
    var rival = content.cards[turn.rivalId];
    var docs = best.docs ? '<a class="docs-link" href="' + esc(best.docs) + '" target="_blank" rel="noopener noreferrer">Read AWS docs ↗</a>' : "";
    return '<div class="feedback-backdrop"><section class="feedback-panel tone-' + esc(turn.grade.tone) + '" role="dialog" aria-modal="true" aria-labelledby="feedback-title">' +
      '<div class="feedback-sparks" aria-hidden="true">✦ ✦ ✦</div><div class="feedback-eyebrow">' + esc(q.topic) + ' · ROUND ' + (turn.questionIndex + 1) + '</div>' +
      '<h2 id="feedback-title">' + esc(turn.grade.label) + '</h2>' +
      '<div class="point-race"><div><small>YOU PLAYED</small><strong>' + esc(answer.icon) + ' ' + esc(answer.name) + '</strong><span>+' + turn.playerPoints + (turn.bonus ? ' <em>includes +' + turn.bonus + ' streak</em>' : "") + '</span></div>' +
      '<div><small>PATCHBOT PLAYED</small><strong>' + esc(rival.icon) + ' ' + esc(rival.name) + '</strong><span>+' + turn.rivalQuality + '</span></div></div>' +
      '<p class="learning-line"><b>Best fit: ' + esc(best.name) + '.</b> ' + esc(q.why) + '</p>' +
      '<p class="tip-line"><b>Your card:</b> ' + esc(answer.tip) + '</p>' +
      '<div class="feedback-actions">' + docs + '<button class="primary-button" data-action="continue">' + (turn.questionIndex === level.questions.length - 1 ? "See results" : "Next question") + ' <span aria-hidden="true">→</span></button></div>' +
      '</section></div>';
  }

  function renderDuel(progress, content, level, state, review) {
    var index = review ? review.questionIndex : state.round;
    var q = level.questions[index];
    var dots = level.questions.map(function (_, i) {
      return '<span class="round-dot ' + (i < state.round ? "done" : "") + (i === index ? "current" : "") + '"></span>';
    }).join("");
    var max = Math.max(window.GameEngine.maxScore(level), state.playerScore, state.rivalScore);
    var playerWidth = Math.min(100, Math.round(state.playerScore / max * 100));
    var rivalWidth = Math.min(100, Math.round(state.rivalScore / max * 100));
    var cards = level.answers.map(function (id, i) {
      return answerCard(id, i, content, review ? { selected: review.answerId, best: review.bestId, rival: review.rivalId, disabled: true } : null);
    }).join("");
    var body = '<section class="duel-screen"><div class="duel-head"><div class="duel-level"><span>' + esc(level.icon) + '</span><div><small>LEVEL 0' + level.id + '</small><strong>' + esc(level.name) + '</strong></div></div>' +
      '<div class="round-counter"><small>QUESTION</small><strong>' + (index + 1) + ' <span>/ 7</span></strong></div><button class="quit-button" data-action="map">Leave duel ✕</button></div>' +
      '<div class="scoreboard" aria-live="polite"><div class="score-side"><span class="score-avatar">🧠</span><div><small>YOU</small><strong>' + state.playerScore + '</strong></div></div>' +
      '<div class="score-center"><div class="score-bars"><span style="width:' + playerWidth + '%"></span><span style="width:' + rivalWidth + '%"></span></div><div class="round-dots" aria-label="' + state.round + ' of 7 answered">' + dots + '</div></div>' +
      '<div class="score-side rival-side"><div><small>PATCHBOT</small><strong>' + state.rivalScore + '</strong></div><span class="score-avatar">🤖</span></div></div>' +
      '<div class="question-arena"><article class="question-card"><div class="question-top"><span>QUESTION CARD 0' + (index + 1) + '</span><span>' + esc(q.topic) + '</span></div>' +
      '<div class="question-mark">?</div><h1>' + esc(q.prompt) + '</h1><p>Choose the answer that fits <b>best</b>. More than one may work.</p></article>' +
      '<aside class="rival-card"><div class="rival-face">' + esc(level.enemyIcon) + '</div><small>SCRIPTED RIVAL</small><h2>' + esc(level.enemy) + '</h2>' +
      '<p>PatchBot has already chosen a card. Play yours to reveal both picks.</p><div class="streak-pill">⚡ STREAK <b>' + state.streak + '</b></div></aside></div>' +
      '<div class="hand-heading"><div><small>YOUR HAND</small><h2>Pick an answer card</h2></div><span>Keys <kbd>1</kbd>–<kbd>7</kbd> work too</span></div>' +
      '<div class="answer-grid" role="group" aria-label="Seven answer cards">' + cards + '</div></section>' +
      (review ? feedbackMarkup(level, content, review) : "");
    shell(progress, content, "duel", body);
  }

  function renderResult(progress, content, level, state) {
    var stars = window.GameEngine.stars(level, state);
    var finalWin = state.won && level.id === content.levels.length;
    var primaryAction = state.won ? (finalWin ? "map" : "next-level") : "retry";
    var primaryLabel = state.won ? (finalWin ? "View your journey" : "Next level") : "Try again";
    var secondaryAction = state.won ? "retry" : "map";
    var secondaryLabel = state.won ? "Replay level" : "Level map";
    var summary = state.history.map(function (turn, i) {
      var q = level.questions[i];
      var answer = content.cards[turn.answerId];
      var best = content.cards[turn.bestId];
      return '<li><span class="review-num">0' + (i + 1) + '</span><div><strong>' + esc(q.topic) + '</strong><small>You chose ' + esc(answer.name) + ' · Best: ' + esc(best.name) + '</small></div><b class="review-score">+' + turn.playerPoints + '</b></li>';
    }).join("");
    var body = '<section class="result-screen ' + (state.won ? "won" : "lost") + (finalWin ? " final-win" : "") + '">' +
      (state.won ? '<div class="result-confetti" aria-hidden="true"><i>✦</i><i>★</i><i>✦</i><i>★</i><i>✦</i><i>★</i></div>' : "") +
      '<div class="result-icon">' + (state.won ? "🏆" : "🔁") + '</div>' +
      '<div class="eyebrow">LEVEL 0' + level.id + ' · ' + esc(level.name) + '</div><h1>' + (finalWin ? "You mastered the cloud!" : state.won ? "You beat PatchBot!" : "PatchBot wins this round") + '</h1>' +
      '<p>' + (finalWin ? "Six eras conquered. You can explain why a service fits, not just name it." : state.won ? "Smart choices built a stronger solution. Your next tech era is open." : "Review the best fits, then try a new route through the questions.") + '</p>' +
      '<div class="result-scores"><div><small>YOUR SCORE</small><strong>' + state.playerScore + '</strong></div><span>VS</span><div><small>PATCHBOT</small><strong>' + state.rivalScore + '</strong></div></div>' +
      '<div class="result-stars" aria-label="' + stars + ' of 3 stars">' + [0, 1, 2].map(function (i) { return '<span class="' + (i < stars ? "earned" : "") + '">★</span>'; }).join("") + '</div>' +
      '<div class="result-actions"><button class="primary-button" data-action="' + primaryAction + '">' + primaryLabel + ' <span aria-hidden="true">→</span></button>' +
      '<button class="ghost-button" data-action="' + secondaryAction + '">' + secondaryLabel + '</button></div>' +
      '<div class="review-panel"><h2>Question recap</h2><ol>' + summary + '</ol></div></section>';
    shell(progress, content, "result", body);
  }

  function toast(message) {
    var node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    window.setTimeout(function () { if (node) node.classList.remove("show"); }, 2600);
  }

  function sound(kind, enabled) {
    if (!enabled) return;
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioContext = audioContext || new Context();
      if (audioContext.state === "suspended") audioContext.resume();
      var notes = kind === "perfect" ? [523, 659, 784] : kind === "win" ? [392, 523, 659, 784] : kind === "miss" ? [220, 185] : kind === "lose" ? [330, 262] : [392, 523];
      notes.forEach(function (frequency, index) {
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        var start = audioContext.currentTime + index * 0.075;
        oscillator.type = kind === "miss" || kind === "lose" ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.20);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.21);
      });
    } catch (_) { /* Silent play is always allowed. */ }
  }

  window.GameUI = {
    renderTitle: renderTitle,
    renderMap: renderMap,
    renderIntro: renderIntro,
    renderDuel: renderDuel,
    renderResult: renderResult,
    toast: toast,
    sound: sound
  };
}());
