/* Screens, animation hooks, and generated sound effects. Rules live in engine.js. */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var audioContext = null;
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  }); }
  function shell(progress, body) {
    app.innerHTML = '<div class="shell"><header class="topbar"><button class="brand" data-action="home">✦ QUESTION<span class="brand-accent">DUEL</span></button><nav class="topnav"><button class="nav-link" data-action="map">Level map</button><span class="xp-pill">✦ ' + window.GameProgress.xp(progress) + ' XP</span><button class="sound-button" data-action="sound" aria-label="' + (progress.sound ? "Mute sounds" : "Enable sounds") + '">' + (progress.sound ? "🔊" : "🔇") + '</button></nav></header><main id="main-content">' + body + '</main><div id="toast" class="toast" role="status" aria-live="polite"></div></div>';
  }
  function card(id, index, content, disabled, selected, best) {
    var c = content.cards[id];
    return '<button class="answer-card type-' + esc(c.type) + (selected ? ' picked' : '') + (best ? ' best' : '') + '" data-action="answer" data-answer="' + esc(id) + '" ' + (disabled ? 'disabled' : '') + ' title="' + esc(c.tip) + '" aria-label="Answer ' + (index + 1) + ': ' + esc(c.name) + '. ' + esc(c.tip) + '"><span class="card-num">' + (index + 1) + '</span><span class="card-icon" aria-hidden="true">' + esc(c.icon) + '</span><span class="card-name">' + esc(c.name) + '</span><span class="card-type">' + esc(c.type) + '</span></button>';
  }
  function renderTitle(progress, content) {
    shell(progress, '<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="pulse-dot"></span> SINGLE-PLAYER AWS ARCADE</div><h1>Learn cloud.<br><span>Fight back.</span><br>Level up.</h1><p>Choose AWS services to defeat cloud threats. Find seven best-fit answers before your health runs out. Every move teaches you why it works.</p><div class="hero-actions"><button class="primary-button" data-action="map">Play the game →</button><button class="ghost-button" data-action="how">How it works</button></div><div class="hero-stats"><div><strong>6</strong><small>levels</small></div><div><strong>4</strong><small>cards per turn</small></div><div><strong>7</strong><small>hits to win</small></div></div></div><div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="floating-card float-one"><span>☁️</span><b>Cloud</b><small>BEST FIT</small></div><div class="floating-card float-two"><span>🛡️</span><b>Defend</b><small>STAY ALIVE</small></div><div class="hero-bot">🤖<span>PATCHBOT<br><b>READY TO FIGHT</b></span></div></div></section><section class="how-panel" id="how"><div><span class="step-index">01</span><h2>Read the threat</h2><p>Each turn presents a short AWS problem and a visible enemy intent.</p></div><div><span class="step-index">02</span><h2>Play your cards</h2><p>Choose from four answers. Later levels add timed alerts and two-card builds.</p></div><div><span class="step-index">03</span><h2>Survive and learn</h2><p>A best-fit answer hits the enemy. Wrong answers cost health. Seven hits win.</p></div></section><footer class="title-footer"><span>A beginner-friendly AWS adventure.</span><button data-action="reset" class="text-button">Reset progress</button></footer>');
  }
  function renderMap(progress, content) {
    var nodes = content.levels.map(function (level) {
      var locked = level.id > progress.unlocked;
      var done = Boolean(progress.completed[String(level.id)]);
      return '<button class="level-node ' + (locked ? 'locked' : '') + (done ? ' completed' : '') + '" data-action="level" data-level="' + level.id + '" ' + (locked ? 'disabled' : '') + '><span class="level-line"></span><span class="level-icon">' + esc(level.icon) + '</span><span class="level-kicker">LEVEL 0' + level.id + ' · ' + esc(level.theme) + '</span><span class="level-name">' + esc(level.name) + '</span><span class="level-meta">' + (locked ? 'LOCKED' : done ? 'CLEARED · BEST ' + (Number(progress.best[String(level.id)]) || 0) : 'READY TO PLAY') + '</span><span class="level-arrow">' + (locked ? '🔒' : '↗') + '</span></button>';
    }).join('');
    shell(progress, '<section class="page-heading"><div class="eyebrow">YOUR AWS ADVENTURE</div><h1>Level <span>map</span></h1><p>Defeat each enemy with seven best-fit answers. Survive as long as you need; every mistake costs health.</p></section><section class="map-status"><div><small>LEVELS CLEARED</small><strong>' + Object.keys(progress.completed).filter(function (id) { return progress.completed[id]; }).length + ' / 6</strong></div><div><small>KNOWLEDGE XP</small><strong>' + window.GameProgress.xp(progress) + '</strong></div><div><small>MISSION</small><strong>Seven hits to win</strong></div></section><section class="level-grid" aria-label="Choose a level">' + nodes + '</section><p class="map-tip">Demo shortcut: press <kbd>D</kbd> here to unlock all six levels.</p>');
  }
  function renderIntro(progress, content, level) {
    var deck = level.answers.map(function (id) { var c = content.cards[id]; return '<div class="deck-chip type-' + esc(c.type) + '"><span>' + esc(c.icon) + '</span>' + esc(c.name) + '</div>'; }).join('');
    shell(progress, '<section class="intro-screen"><div class="intro-symbol">' + esc(level.icon) + '</div><div class="eyebrow">LEVEL 0' + level.id + ' · ' + esc(level.theme) + '</div><h1>' + esc(level.name) + '</h1><p class="intro-text">' + esc(level.intro) + '</p><div class="versus-strip"><div><span class="versus-avatar">🧠</span><strong>YOU</strong><small>Choose seven best fits</small></div><span class="versus-word">VS</span><div><span class="versus-avatar">' + esc(level.enemyIcon) + '</span><strong>' + esc(level.enemy) + '</strong><small>Scripted enemy</small></div></div><div class="intro-deck"><h2>Cards in this level</h2><div>' + deck + '</div></div><p class="intro-text">Four cards appear each turn. There is no question limit: fight until the enemy falls or your health reaches zero.</p><div class="intro-actions"><button class="primary-button" data-action="begin">Start battle →</button><button class="ghost-button" data-action="map">Back to map</button></div></section>');
  }
  function feedback(level, content, state, turn) {
    var q = level.questions[turn.questionIndex];
    var best = content.cards[q.best];
    var chosen = turn.answerId ? content.cards[turn.answerId].name : 'No card (time expired)';
    var title = turn.timedOut ? 'TIME OUT!' : turn.hit ? (turn.combo ? 'COMBO STRIKE!' : 'DIRECT HIT!') : turn.quality >= 60 ? 'CLOSE CALL!' : 'COUNTERATTACK!';
    var docs = best.docs ? '<a class="docs-link" href="' + esc(best.docs) + '" target="_blank" rel="noopener noreferrer">Read AWS docs ↗</a>' : '';
    return '<div class="feedback-backdrop"><section class="feedback-panel tone-' + (turn.hit ? 'perfect' : turn.quality >= 60 ? 'partial' : 'miss') + '" role="dialog" aria-modal="true" aria-labelledby="feedback-title"><div class="feedback-sparks" aria-hidden="true">✦ ✦ ✦</div><div class="feedback-eyebrow">TURN ' + (turn.turn + 1) + ' · ' + esc(q.topic) + '</div><h2 id="feedback-title">' + title + '</h2><div class="point-race"><div><small>YOUR MOVE</small><strong>' + esc(chosen) + '</strong><span>' + (turn.hit ? '⚡ ENEMY −1 HP' : '✕ NO HIT') + '</span></div><div><small>ENEMY MOVE</small><strong>' + esc(turn.intent.label) + (turn.guarded ? ' · DODGED −2' : '') + '</strong><span>' + (turn.damage ? '❤️ YOU −' + turn.damage + ' HP' : 'MISSED') + '</span></div></div><p class="learning-line"><b>Best fit: ' + esc(best.name) + '.</b> ' + esc(q.why) + '</p><p class="tip-line"><b>Card fact:</b> ' + esc(best.tip) + '</p><div class="feedback-actions">' + docs + '<button class="primary-button" data-action="continue">' + (state.status === 'complete' ? 'See results' : 'Next turn') + ' →</button></div></section></div>';
  }
  function renderDuel(progress, content, level, state, review, pick, pending) {
    var q = review ? level.questions[review.questionIndex] : window.GameEngine.question(level, state);
    var hand = review ? window.GameEngine.hand(level, { turn: review.turn }) : window.GameEngine.hand(level, state);
    var mode = review ? review.mode : window.GameEngine.mode(level, state);
    var intent = review ? review.intent : window.GameEngine.intent(level, state);
    var cards = hand.map(function (id, i) { return card(id, i, content, Boolean(review || pending), review && review.answerId === id || pick === id || pending && pending.answerId === id, review && review.bestId === id); }).join('');
    var instruction = mode === 'build' ? (pick ? 'Now choose a supporting service' : 'Choose the main service, then a supporting service') : mode === 'timed' ? 'INCIDENT ALERT: answer before the timer ends' : 'Choose the best-fit service';
    var timer = mode === 'timed' && !review ? '<div class="timer-wrap" aria-label="Time remaining"><div id="timer-bar" class="timer-bar"></div><strong id="timer-text">12s</strong></div>' : '';
    var dodge = '';
    if (pending) {
      var danger = (state.turn + level.id) % 3;
      dodge = '<div class="feedback-backdrop"><section class="dodge-panel" role="dialog" aria-modal="true" aria-labelledby="dodge-title"><div class="feedback-eyebrow">ENEMY SURGE · DEFENSE PHASE</div><h2 id="dodge-title">DODGE THE ATTACK!</h2><p>One lane is flashing red. Move to a safe lane before time runs out to block 2 damage.</p><div class="dodge-countdown" id="dodge-time">5.0s</div><div class="dodge-lanes">' + [0, 1, 2].map(function (lane) { return '<button class="dodge-lane ' + (lane === danger ? 'danger' : 'safe') + '" data-action="dodge" data-lane="' + lane + '" aria-label="Lane ' + (lane + 1) + (lane === danger ? ', danger' : ', safe') + '"><span>' + (lane === danger ? '⚠️' : '◇') + '</span><b>LANE ' + (lane + 1) + '</b></button>'; }).join('') + '</div><small>Click a lane or press 1–3</small></section></div>';
    }
    shell(progress, '<section class="duel-screen ' + (review ? (review.hit ? 'impact-hit' : 'impact-hurt') : '') + '"><div class="duel-head"><div class="duel-level"><span>' + esc(level.icon) + '</span><div><small>LEVEL 0' + level.id + '</small><strong>' + esc(level.name) + '</strong></div></div><div class="round-counter"><small>TURN</small><strong>' + (review ? review.turn + 1 : state.turn + 1) + '</strong></div><button class="quit-button" data-action="map">Leave battle ✕</button></div><div class="battle-hud"><div class="health-unit"><div class="health-label">🧠 YOU <b>' + state.playerHp + '/' + state.maxHp + ' HP</b></div><div class="health-track"><span class="player-health" style="width:' + (state.playerHp / state.maxHp * 100) + '%"></span></div></div><div class="versus-mini">⚔️</div><div class="health-unit"><div class="health-label">' + esc(level.enemyIcon) + ' ' + esc(level.enemy).toUpperCase() + ' <b>' + state.enemyHp + '/7 HP</b></div><div class="health-track"><span class="enemy-health" style="width:' + (state.enemyHp / 7 * 100) + '%"></span></div></div></div><div class="question-arena"><article class="question-card"><div class="question-top"><span>' + (mode === 'timed' ? '⚠ INCIDENT ALERT' : mode === 'build' ? '🔗 BUILD A FIX' : '⚔ AWS CHALLENGE') + '</span><span>' + esc(q.topic) + '</span></div><div class="question-mark">?</div><h1>' + esc(q.prompt) + '</h1><p>' + esc(instruction) + '</p>' + timer + '</article><aside class="rival-card"><div class="rival-face">' + esc(level.enemyIcon) + '</div><small>NEXT ENEMY MOVE</small><h2>' + esc(intent.label) + '</h2><p>' + (intent.damage ? 'A wrong answer adds 2 more damage.' : 'Take advantage of this safe turn.') + '</p><div class="streak-pill">⚡ HIT STREAK <b>' + state.streak + '</b></div></aside></div><div class="hand-heading"><div><small>YOUR HAND · FOUR CARDS</small><h2>' + esc(instruction) + '</h2></div><span>Keys <kbd>1</kbd>–<kbd>4</kbd></span></div><div class="answer-grid battle-hand" role="group" aria-label="Four answer cards">' + cards + '</div><div class="battle-foot">Best-fit answers damage the enemy. Wrong answers cost health. The battle continues until one of you falls.</div></section>' + (review ? feedback(level, content, state, review) : dodge));
  }
  function renderResult(progress, content, level, state) {
    var stars = window.GameEngine.stars(level, state);
    var finalWin = state.won && level.id === content.levels.length;
    var rows = state.history.map(function (turn) {
      var q = level.questions[turn.questionIndex];
      return '<li><span class="review-num">' + (turn.turn + 1) + '</span><div><strong>' + esc(q.topic) + '</strong><small>' + (turn.hit ? 'Hit' : 'Miss') + ' · Best: ' + esc(content.cards[q.best].name) + '</small></div><b class="review-score">' + (turn.hit ? '⚡' : '✕') + '</b></li>';
    }).join('');
    shell(progress, '<section class="result-screen ' + (state.won ? 'won' : 'lost') + (finalWin ? ' final-win' : '') + '">' + (state.won ? '<div class="result-confetti" aria-hidden="true"><i>✦</i><i>★</i><i>✦</i><i>★</i><i>✦</i><i>★</i></div>' : '') + '<div class="result-icon">' + (state.won ? '🏆' : '💔') + '</div><div class="eyebrow">LEVEL 0' + level.id + ' · ' + esc(level.name) + '</div><h1>' + (finalWin ? 'You mastered the cloud!' : state.won ? 'Enemy defeated!' : 'You fell in battle') + '</h1><p>' + (state.won ? 'Seven smart answers defeated the threat. The next level is open.' : 'The enemy got you this time. Review the best fits and try again.') + '</p><div class="result-scores"><div><small>SUCCESSFUL HITS</small><strong>' + state.hits + '/7</strong></div><span>⚔</span><div><small>HEALTH LEFT</small><strong>' + state.playerHp + '/' + state.maxHp + '</strong></div></div><div class="result-stars" aria-label="' + stars + ' of 3 stars">' + [0, 1, 2].map(function (i) { return '<span class="' + (i < stars ? 'earned' : '') + '">★</span>'; }).join('') + '</div><div class="result-actions"><button class="primary-button" data-action="' + (state.won ? (finalWin ? 'map' : 'next-level') : 'retry') + '">' + (state.won ? (finalWin ? 'View your journey' : 'Next level') : 'Try again') + ' →</button><button class="ghost-button" data-action="' + (state.won ? 'retry' : 'map') + '">' + (state.won ? 'Replay level' : 'Level map') + '</button></div><div class="review-panel"><h2>Battle recap</h2><ol>' + rows + '</ol></div></section>');
  }
  function toast(message) { var n = document.getElementById('toast'); if (!n) return; n.textContent = message; n.classList.add('show'); window.setTimeout(function () { n.classList.remove('show'); }, 2600); }
  function sound(kind, enabled) {
    if (!enabled) return;
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioContext = audioContext || new Context();
      if (audioContext.state === 'suspended') audioContext.resume();
      var patterns = { start: [330, 440, 660], pick: [480], build: [392, 523], hit: [523, 784, 1047], combo: [523, 659, 784, 1175], hurt: [220, 165], timeout: [400, 280, 180], win: [392, 523, 659, 784, 1047], lose: [330, 250, 180] };
      var notes = patterns[kind] || [440];
      notes.forEach(function (frequency, i) {
        var o = audioContext.createOscillator(), g = audioContext.createGain();
        var t = audioContext.currentTime + i * .085;
        o.type = kind === 'hurt' || kind === 'lose' || kind === 'timeout' ? 'sawtooth' : 'triangle';
        o.frequency.setValueAtTime(frequency, t);
        if (kind === 'hurt') o.frequency.exponentialRampToValueAtTime(Math.max(60, frequency * .6), t + .16);
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.14, t + .012);
        g.gain.exponentialRampToValueAtTime(.0001, t + .22);
        o.connect(g); g.connect(audioContext.destination); o.start(t); o.stop(t + .23);
      });
    } catch (_) { /* Gameplay works without audio. */ }
  }
  window.GameUI = { renderTitle: renderTitle, renderMap: renderMap, renderIntro: renderIntro,
    renderDuel: renderDuel, renderResult: renderResult, toast: toast, sound: sound };
}());
