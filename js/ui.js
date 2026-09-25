/* Screens, animation hooks, and generated sound effects. Rules live in engine.js. */
(function () {
  "use strict";
  var app = document.getElementById('app');
  var backgroundMusic = document.getElementById('background-music');
  var audioContext = null;
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function shell(progress, body) {
    app.innerHTML = '<div class="shell"><header class="topbar"><button class="brand" data-action="home">✦ QUESTION<span class="brand-accent">DUEL</span></button><nav class="topnav"><button class="nav-link" data-action="map">Level map</button><span class="xp-pill">✦ ' + window.GameProgress.xp(progress) + ' XP</span><button class="sound-button" data-action="sound" aria-label="' + (progress.sound ? 'Mute music and effects' : 'Enable music and effects') + '" title="Music and sound effects">' + (progress.sound ? '🔊' : '🔇') + '</button></nav></header><main id="main-content">' + body + '</main><div id="toast" class="toast" role="status" aria-live="polite"></div></div>';
  }
  function card(id, index, content, disabled, selected, best) {
    var c = content.cards[id];
    return '<button class="answer-card type-' + esc(c.type) + (selected ? ' picked' : '') + (best ? ' best' : '') + '" data-action="answer" data-answer="' + esc(id) + '" ' + (disabled ? 'disabled' : '') + ' title="' + esc(c.tip) + '" aria-label="Answer ' + (index + 1) + ': ' + esc(c.name) + '. ' + esc(c.tip) + '"><span class="card-num">' + (index + 1) + '</span><span class="card-icon" aria-hidden="true">' + esc(c.icon) + '</span><span class="card-name">' + esc(c.name) + '</span><span class="card-type">' + esc(c.type) + '</span><span class="card-note">' + esc(c.tip) + '</span></button>';
  }
  function renderTitle(progress) {
    shell(progress, '<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="pulse-dot"></span> SINGLE-PLAYER AWS ARCADE</div><h1>Learn cloud.<br><span>Fight back.</span><br>Level up.</h1><p>Attack with AWS answers, rebuild your systems, and raise a shield against a cleverer enemy each level.</p><div class="hero-actions"><button class="primary-button" data-action="map">Play the game →</button></div><div class="hero-stats"><div><strong>6</strong><small>levels</small></div><div><strong>3</strong><small>AWS actions</small></div><div><strong>7</strong><small>enemy HP</small></div></div></div><div class="hero-visual" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="floating-card float-one"><span>⚔️</span><b>Attack</b><small>LEARN AWS</small></div><div class="floating-card float-two"><span>🛡️</span><b>Defend</b><small>STAY ALIVE</small></div><div class="hero-bot">🤖<span>PATCHBOT<br><b>READY TO FIGHT</b></span></div></div></section><section class="how-panel" id="how"><div><span class="step-index">01</span><h2>Attack</h2><p>Pick the best AWS service from four answer cards to damage the enemy.</p></div><div><span class="step-index">02</span><h2>Heal</h2><p>Put three real AWS services in the right order to restore 2 HP.</p></div><div><span class="step-index">03</span><h2>Defend</h2><p>Counter three AWS threats to reduce damage from the next three attacks.</p></div></section><footer class="title-footer"><span>Music starts when you play. Use 🔊 to mute.</span><button data-action="reset" class="text-button">Reset progress</button></footer>');
  }
  function renderMap(progress, content) {
    var nodes = content.levels.map(function (level) {
      var locked = level.id > progress.unlocked, done = Boolean(progress.completed[String(level.id)]);
      return '<button class="level-node ' + (locked ? 'locked' : '') + (done ? ' completed' : '') + '" data-action="level" data-level="' + level.id + '" ' + (locked ? 'disabled' : '') + '><span class="level-line"></span><span class="level-icon">' + esc(level.icon) + '</span><span class="level-kicker">LEVEL 0' + level.id + ' · ' + esc(level.theme) + '</span><span class="level-name">' + esc(level.name) + '</span><span class="level-meta">' + (locked ? 'LOCKED' : done ? 'CLEARED · BEST ' + (Number(progress.best[String(level.id)]) || 0) : 'READY TO PLAY') + '</span><span class="level-arrow">' + (locked ? '🔒' : '↗') + '</span></button>';
    }).join('');
    shell(progress, '<section class="page-heading"><div class="eyebrow">YOUR AWS ADVENTURE</div><h1>Level <span>map</span></h1><p>Both sides start with the same healing power. Higher-level enemies aim more accurately.</p></section><section class="map-status"><div><small>LEVELS CLEARED</small><strong>' + Object.keys(progress.completed).filter(function (id) { return progress.completed[id]; }).length + ' / 6</strong></div><div><small>KNOWLEDGE XP</small><strong>' + window.GameProgress.xp(progress) + '</strong></div><div><small>MISSION</small><strong>Reduce enemy HP to 0</strong></div></section><section class="level-grid" aria-label="Choose a level">' + nodes + '</section><p class="map-tip">Demo shortcut: press <kbd>D</kbd> here to unlock all six levels.</p>');
  }
  function renderIntro(progress, content, level) {
    var deck = level.answers.map(function (id) { var c = content.cards[id]; return '<article class="study-note type-' + esc(c.type) + '"><div><span>' + esc(c.icon) + '</span><b>' + esc(c.name) + '</b></div><p>' + esc(c.tip) + '</p>' + (c.docs ? '<a href="' + esc(c.docs) + '" target="_blank" rel="noopener noreferrer">AWS docs ↗</a>' : '') + '</article>'; }).join('');
    shell(progress, '<section class="intro-screen"><div class="intro-symbol">' + esc(level.icon) + '</div><div class="eyebrow">LEVEL 0' + level.id + ' · ' + esc(level.theme) + '</div><h1>' + esc(level.name) + '</h1><p class="intro-text">' + esc(level.intro) + '</p><div class="versus-strip"><div><span class="versus-avatar">🧑‍🚀</span><strong>YOU</strong><small>12 HP · repeatable +2 heal</small></div><span class="versus-word">VS</span><div><span class="versus-avatar">' + esc(level.enemyIcon) + '</span><strong>' + esc(level.enemy) + '</strong><small>7 HP · same +2 heal</small></div></div><div class="intro-deck"><h2>Study the seven answer cards</h2><p class="study-intro">Read these notes before battle. This level has ' + level.questions.length + ' questions; unseen ones appear first on later attempts.</p><div class="study-grid">' + deck + '</div></div><p class="intro-text">Every action uses a turn. Heal has a three-turn cooldown for both sides; defense can be raised again after its shield expires. This enemy lands ' + window.GameEngine.accuracy(level) + '% of its attacks.</p><div class="intro-actions"><button class="primary-button" data-action="begin">Start battle →</button><button class="ghost-button" data-action="map">Back to map</button></div></section>');
  }
  function botLine(turn) {
    if (!turn.botActed) return 'Stopped before acting';
    if (turn.enemyHeal) return 'Repaired +' + turn.enemyHeal + ' HP';
    if (!turn.botHit) return 'Attack missed';
    return 'You lost ' + turn.botDamage + ' HP' + (turn.blocked ? ' · shield blocked 1' : '');
  }
  function feedback(level, content, state, turn) {
    var title, tone, move, result, explanation = '', docs = '', symbol = '⚡';
    if (turn.kind === 'attack') {
      var q = level.questions[turn.questionIndex], best = content.cards[q.best];
      title = turn.timedOut ? 'TIME OUT!' : turn.hit ? (turn.combo ? 'COMBO STRIKE!' : 'DIRECT HIT!') : turn.quality >= 60 ? 'CLOSE CALL!' : 'COUNTERATTACK!';
      tone = turn.hit ? 'perfect' : turn.quality >= 60 ? 'partial' : 'miss';
      move = turn.answerId ? content.cards[turn.answerId].name : 'No card (time expired)';
      symbol = turn.answerId ? content.cards[turn.answerId].icon : '⚠️';
      result = turn.hit ? 'ENEMY −1 HP' : turn.wrongDamage ? 'YOU −' + turn.wrongDamage + ' HP' : 'NO HIT';
      explanation = '<p class="learning-line"><b>Best fit: ' + esc(best.name) + '.</b> ' + esc(q.why) + '</p><p class="tip-line"><b>Card fact:</b> ' + esc(best.tip) + '</p>';
      docs = best.docs ? '<a class="docs-link" href="' + esc(best.docs) + '" target="_blank" rel="noopener noreferrer">Read AWS docs ↗</a>' : '';
    } else if (turn.kind === 'match') {
      title = turn.hit ? 'FOUR-PAIR COMBO!' : 'LINKS BROKEN!'; tone = turn.hit ? 'perfect' : 'miss';
      move = 'Matched ' + turn.matchCorrect + ' / 4'; symbol = '🧩';
      result = turn.hit ? 'ENEMY −1 HP' : 'YOU −' + turn.wrongDamage + ' HP';
      explanation = '<div class="match-review"><b>Study the four links:</b><ol>' + turn.matchIds.map(function (id, i) {
        var item = level.questions.filter(function (q) { return q.id === id; })[0];
        return '<li>' + esc(item.prompt) + ' <strong>→ ' + esc(content.cards[item.best].name) + '</strong>' + (turn.matchAnswers[i] === item.best ? ' ✓' : ' · you chose ' + esc(content.cards[turn.matchAnswers[i]].name)) + '</li>';
      }).join('') + '</ol></div>';
    } else if (turn.kind === 'heal') {
      title = turn.success ? 'SYSTEM RESTORED!' : 'REPAIR FAILED!'; tone = turn.success ? 'perfect' : 'miss';
      move = 'AWS repair sequence'; symbol = '💚';
      result = turn.success ? 'YOU +' + turn.playerHeal + ' HP' : 'NO HEAL';
      explanation = '<p class="learning-line">Both sides can repair 2 HP after a three-turn cooldown. ' + esc(turn.failureDetail || 'You connected the AWS services in the right order.') + '</p>';
    } else {
      title = turn.success ? 'SHIELD ONLINE!' : 'SHIELD FAILED!'; tone = turn.success ? 'perfect' : 'miss';
      move = 'AWS threat defense'; symbol = '🛡️';
      result = turn.success ? 'GUARD FOR 3 ATTACKS' : 'NO GUARD';
      explanation = '<p class="learning-line">A successful guard blocks 1 damage from each of the next three enemy attacks. ' + esc(turn.failureDetail || 'You matched all three threats to useful AWS services.') + '</p>';
    }
    var scene = '<div class="event-animation ' + (turn.botDamage ? 'scene-bot-attack ' : '') + (turn.blocked || turn.kind === 'defend' && turn.success ? 'scene-player-block ' : '') + (turn.playerHeal ? 'scene-player-heal ' : '') + (turn.enemyHeal ? 'scene-bot-heal ' : '') + (turn.kind === 'attack' || turn.kind === 'match' ? 'scene-card-select' : '') + '" aria-hidden="true"><span class="combat-avatar avatar-player">🧑‍🚀</span><span class="combat-payload">' + esc(symbol) + '</span>' + (turn.supportId ? '<span class="support-payload">' + esc(content.cards[turn.supportId].icon) + '</span>' : '') + '<span class="combat-avatar avatar-bot">' + esc(level.enemyIcon) + '</span>' + (turn.botDamage ? '<span class="bot-projectile">⚡</span>' : '') + (turn.blocked ? '<span class="shield-spark">🛡️</span>' : '') + (turn.playerHeal ? '<span class="heal-spark">💚</span>' : '') + (turn.enemyHeal ? '<span class="bot-heal-spark">💚</span>' : '') + '</div>';
    return '<div class="feedback-backdrop"><section class="feedback-panel tone-' + tone + '" role="dialog" aria-modal="true" aria-labelledby="feedback-title"><div class="feedback-sparks" aria-hidden="true">✦ ✦ ✦</div><div class="feedback-eyebrow">TURN ' + (turn.turn + 1) + ' · ' + esc(turn.kind.toUpperCase()) + '</div><h2 id="feedback-title">' + title + '</h2>' + scene + '<div class="point-race"><div><small>YOUR MOVE</small><strong>' + esc(move) + '</strong><span>' + esc(result) + '</span></div><div><small>ENEMY MOVE</small><strong>' + esc(turn.intent.label) + '</strong><span>' + esc(botLine(turn)) + '</span></div></div>' + explanation + '<div class="feedback-actions">' + docs + '<button class="primary-button" data-action="continue">' + (state.status === 'complete' ? 'See results' : 'Next turn') + ' →</button></div></section></div>';
  }
  function minigame(level, state, mini) {
    if (!mini) return '';
    if (mini.kind === 'heal') {
      var steps = level.repair.steps, current = steps[mini.step];
      var options = level.repair.options;
      var used = steps.slice(0, mini.step).map(function (step) { return step.id; });
      return '<div class="feedback-backdrop"><section class="dodge-panel repair-panel" role="dialog" aria-modal="true" aria-labelledby="mini-title"><div class="feedback-eyebrow">AWS REPAIR · REPEATABLE AFTER COOLDOWN</div><h2 id="mini-title">REBUILD THE SYSTEM</h2><p>' + esc(level.repair.title) + '</p><div class="mini-progress">STEP ' + (mini.step + 1) + ' / 3</div><p class="mini-clue">' + esc(current.clue) + '</p><div class="dodge-countdown" id="mini-time">18.0s</div><div class="repair-options">' + options.map(function (id, i) { var card = window.GAME_CONTENT.cards[id]; return '<button class="repair-tile type-' + esc(card.type) + '" data-action="mini-repair" data-answer="' + esc(id) + '" ' + (used.indexOf(id) >= 0 ? 'disabled' : '') + ' aria-label="' + esc(card.name) + ', key ' + (i + 1) + '"><span>' + esc(card.icon) + '</span><b>' + esc(card.name) + '</b><small>' + (i + 1) + '</small></button>'; }).join('') + '</div><small>Pick the AWS service for each step. Keys 1–5 work too.</small></section></div>';
    }
    var wave = level.defense[mini.step];
    return '<div class="feedback-backdrop"><section class="dodge-panel defense-panel" role="dialog" aria-modal="true" aria-labelledby="mini-title"><div class="feedback-eyebrow">AWS DEFENSE · REPEATABLE AFTER SHIELD EXPIRES</div><h2 id="mini-title">COUNTER THE THREAT!</h2><p>Choose the AWS service that stops each incoming problem. Three correct waves raise your shield.</p><div class="mini-progress">THREAT ' + (mini.step + 1) + ' / 3</div><p class="mini-clue">⚠ ' + esc(wave.prompt) + '</p><div class="dodge-countdown" id="mini-time">16.0s</div><div class="dodge-lanes">' + wave.options.map(function (id, i) { var card = window.GAME_CONTENT.cards[id]; return '<button class="dodge-lane aws-defense-card" data-action="mini-defense" data-answer="' + esc(id) + '" aria-label="' + esc(card.name) + ', key ' + (i + 1) + '"><span>' + esc(card.icon) + '</span><b>' + esc(card.name) + '</b><small>' + (i + 1) + '</small></button>'; }).join('') + '</div><small>Pick a counter before the timer ends. Keys 1–5 work too.</small></section></div>';
  }
  function renderDuel(progress, content, level, state, review, pick, mini, matchPick) {
    matchPick = matchPick || [];
    var attackIndex = review && (review.kind === 'attack' || review.kind === 'match') ? state.attackIndex - 1 : state.attackIndex;
    var snapshot = { attackIndex: attackIndex, questionCursor: review ? state.questionCursor - (review.kind === 'match' ? review.matchIds.length : review.kind === 'attack' ? 1 : 0) : state.questionCursor,
      questionOrder: state.questionOrder, turn: state.turn };
    var q = window.GameEngine.question(level, snapshot);
    var mode = window.GameEngine.mode(level, snapshot);
    var pairs = mode === 'match' ? window.GameEngine.matchPairs(level, snapshot) : null;
    var hand = pairs ? pairs.answers : window.GameEngine.hand(level, snapshot);
    var intent = review ? review.intent : window.GameEngine.intent(level, state);
    var cards = hand.map(function (id, i) { return card(id, i, content, Boolean(review || mini || pairs && matchPick.indexOf(id) >= 0), pick === id || matchPick.indexOf(id) >= 0 || review && review.answerId === id, review && review.kind === 'attack' && review.bestId === id); }).join('');
    var instruction = mode === 'match' ? 'Match all four situations to their correct AWS services' : mode === 'build' ? (pick ? 'Choose a supporting service' : 'Choose the main service, then a supporting service') : mode === 'timed' ? 'INCIDENT ALERT: answer before the timer ends' : 'Choose the best-fit service';
    var matchList = pairs ? '<ol class="match-prompts">' + pairs.questions.map(function (item, i) {
      var chosen = matchPick[i];
      return '<li class="' + (chosen ? 'linked' : i === matchPick.length ? 'active' : '') + '"><span>' + (i + 1) + '</span><p>' + esc(item.prompt) + '</p><b>' + (chosen ? esc(content.cards[chosen].name) : i === matchPick.length ? 'SELECT AN ANSWER BELOW' : 'WAITING') + '</b></li>';
    }).join('') + '</ol>' : '';
    var timer = mode === 'timed' && !review && !mini ? '<div class="timer-wrap" aria-label="Time remaining"><div id="timer-bar" class="timer-bar"></div><strong id="timer-text">12s</strong></div>' : '';
    var healWait = window.GameEngine.healCooldown(state);
    var healStatus = state.playerHp === state.playerMaxHp ? 'HP FULL' : healWait ? 'READY IN ' + healWait : 'READY';
    var defendStatus = state.shieldTurns ? 'SHIELD ACTIVE' : 'READY';
    var actionBar = '<div class="action-bar"><div class="action-caption"><b>CHOOSE YOUR ACTION</b><small>Every action uses one turn</small></div><div class="action-options"><span class="attack-action">⚔ ATTACK · play a card below</span><button data-action="heal" class="action-button heal-action" ' + (!window.GameEngine.canHeal(state) || review || mini ? 'disabled' : '') + '>💚 HEAL <small>+' + window.GameEngine.HEAL + ' HP · ' + healStatus + '</small></button><button data-action="defend" class="action-button defend-action" ' + (!window.GameEngine.canDefend(state) || review || mini ? 'disabled' : '') + '>🛡️ DEFEND <small>3 ATTACKS · ' + defendStatus + '</small></button></div></div>';
    var effect = review ? review.enemyHeal ? 'impact-enemy-heal' :
      review.kind === 'heal' && review.success ? 'impact-player-heal' :
      review.kind === 'defend' && review.success ? 'impact-shield' :
      (review.kind === 'attack' || review.kind === 'match') && review.hit ? 'impact-hit' :
      review.botDamage || review.wrongDamage ? 'impact-hurt' : '' : '';
    var body = '<section class="duel-screen ' + effect + '"><div class="duel-head"><div class="duel-level"><span>' + esc(level.icon) + '</span><div><small>LEVEL 0' + level.id + '</small><strong>' + esc(level.name) + '</strong></div></div><div class="round-counter"><small>TURN</small><strong>' + (review ? review.turn + 1 : state.turn + 1) + '</strong></div><button class="quit-button" data-action="map">Leave battle ✕</button></div>' +
      '<div class="battle-hud"><div class="health-unit"><div class="health-label">🧑‍🚀 YOU <b>' + state.playerHp + '/' + state.playerMaxHp + ' HP</b></div><div class="health-track"><span class="player-health" style="width:' + (state.playerHp / state.playerMaxHp * 100) + '%"></span></div><small class="hud-note">' + (state.shieldTurns ? '🛡 Shield: ' + state.shieldTurns + ' attacks left' : 'No shield') + '</small></div><div class="versus-mini">⚔️</div><div class="health-unit"><div class="health-label">' + esc(level.enemyIcon) + ' ' + esc(level.enemy).toUpperCase() + ' <b>' + state.enemyHp + '/7 HP</b></div><div class="health-track"><span class="enemy-health" style="width:' + (state.enemyHp / 7 * 100) + '%"></span></div><small class="hud-note">Enemy accuracy ' + window.GameEngine.accuracy(level) + '% · heal every 3 turns</small></div></div>' +
      '<div class="question-arena"><article class="question-card ' + (pairs ? 'question-match' : '') + '"><div class="question-top"><span>' + (mode === 'match' ? '🧩 MATCH FOUR' : mode === 'timed' ? '⚠ INCIDENT ALERT' : mode === 'build' ? '🔗 BUILD A FIX' : '⚔ AWS CHALLENGE') + '</span><span>' + (pairs ? 'FOUR AWS SITUATIONS' : esc(q.topic)) + '</span></div><div class="question-mark">?</div><h1>' + (pairs ? 'Connect each problem to a service' : esc(q.prompt)) + '</h1><p>' + esc(instruction) + '</p>' + matchList + timer + '</article><aside class="rival-card"><div class="rival-face">' + esc(level.enemyIcon) + '</div><small>NEXT ENEMY MOVE</small><h2>' + esc(intent.label) + '</h2><p>' + (intent.kind === 'heal' ? 'The enemy may restore the same 2 HP you can.' : 'Every enemy attack deals 2 HP if it lands. Higher levels aim better.') + '</p><div class="streak-pill">🎯 AIM ' + window.GameEngine.accuracy(level) + '%</div></aside></div>' + actionBar +
      '<div class="hand-heading"><div><small>' + (pairs ? 'MATCH · FOUR CARDS' : 'ATTACK · FOUR CARDS') + '</small><h2>' + esc(instruction) + '</h2></div><span>Keys <kbd>1</kbd>–<kbd>4</kbd></span></div><div class="answer-grid battle-hand" role="group" aria-label="Four answer cards">' + cards + '</div><div class="battle-foot">' + (pairs ? 'Match every pair for one hit. Used cards lock in until the turn resolves.' : 'Best-fit cards deal 1 damage.') + ' Heal and defense can be reused after their cooldown or shield ends.</div></section>' + (review ? feedback(level, content, state, review) : minigame(level, state, mini));
    shell(progress, body);
  }
  function renderResult(progress, content, level, state) {
    var stars = window.GameEngine.stars(level, state);
    var finalWin = state.won && level.id === content.levels.length;
    var rows = state.history.map(function (turn) {
      var topic = turn.kind === 'attack' ? level.questions[turn.questionIndex].topic : turn.kind === 'match' ? 'Four-pair match' : turn.kind === 'heal' ? 'AWS repair sequence' : 'AWS threat defense';
      var detail = turn.kind === 'attack' ? (turn.hit ? 'Hit' : 'Miss') + ' · Best: ' + content.cards[turn.bestId].name : turn.kind === 'match' ? turn.matchCorrect + '/4 correct' : (turn.success ? 'Success' : 'Failed');
      return '<li><span class="review-num">' + (turn.turn + 1) + '</span><div><strong>' + esc(topic) + '</strong><small>' + esc(detail) + '</small></div><b class="review-score">' + (turn.hit || turn.success ? '⚡' : '✕') + '</b></li>';
    }).join('');
    shell(progress, '<section class="result-screen ' + (state.won ? 'won' : 'lost') + (finalWin ? ' final-win' : '') + '">' + (state.won ? '<div class="result-confetti" aria-hidden="true"><i>✦</i><i>★</i><i>✦</i><i>★</i><i>✦</i><i>★</i></div>' : '') + '<div class="result-icon">' + (state.won ? '🏆' : '💔') + '</div><div class="eyebrow">LEVEL 0' + level.id + ' · ' + esc(level.name) + '</div><h1>' + (finalWin ? 'You mastered the cloud!' : state.won ? 'Enemy defeated!' : 'You fell in battle') + '</h1><p>' + (state.won ? 'Your AWS choices brought the enemy to zero HP. The next level is open.' : 'Review the battle, then try a better attack and defense rhythm.') + '</p><div class="result-scores"><div><small>SUCCESSFUL HITS</small><strong>' + state.hits + '</strong></div><span>⚔</span><div><small>HEALTH LEFT</small><strong>' + state.playerHp + '/' + state.playerMaxHp + '</strong></div></div><div class="result-stars" aria-label="' + stars + ' of 3 stars">' + [0, 1, 2].map(function (i) { return '<span class="' + (i < stars ? 'earned' : '') + '">★</span>'; }).join('') + '</div><div class="result-actions"><button class="primary-button" data-action="' + (state.won ? (finalWin ? 'map' : 'next-level') : 'retry') + '">' + (state.won ? (finalWin ? 'View your journey' : 'Next level') : 'Try again') + ' →</button><button class="ghost-button" data-action="' + (state.won ? 'retry' : 'map') + '">' + (state.won ? 'Replay level' : 'Level map') + '</button></div><div class="review-panel"><h2>Battle recap</h2><ol>' + rows + '</ol></div></section>');
  }
  function toast(message) { var n = document.getElementById('toast'); if (!n) return; n.textContent = message; n.classList.add('show'); window.setTimeout(function () { n.classList.remove('show'); }, 2600); }
  function sound(kind, enabled) {
    if (!enabled) return;
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioContext = audioContext || new Context();
      if (audioContext.state === 'suspended') audioContext.resume();
      var patterns = { start: [330, 440, 660], pick: [480], hit: [523, 784, 1047], combo: [523, 659, 784, 1175], hurt: [220, 165], timeout: [400, 280, 180], heal: [349, 523, 698, 880], shield: [294, 440, 587], win: [392, 523, 659, 784, 1047], lose: [330, 250, 180] };
      (patterns[kind] || [440]).forEach(function (frequency, i) {
        var o = audioContext.createOscillator(), g = audioContext.createGain();
        var t = audioContext.currentTime + i * .085;
        o.type = kind === 'hurt' || kind === 'lose' || kind === 'timeout' ? 'sawtooth' : 'triangle';
        o.frequency.setValueAtTime(frequency, t);
        if (kind === 'hurt') o.frequency.exponentialRampToValueAtTime(Math.max(60, frequency * .6), t + .16);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.14, t + .012);
        g.gain.exponentialRampToValueAtTime(.0001, t + .22);
        o.connect(g); g.connect(audioContext.destination); o.start(t); o.stop(t + .23);
      });
    } catch (_) { /* Gameplay works without audio. */ }
  }
  function music(enabled) {
    if (!backgroundMusic) return;
    backgroundMusic.volume = 0.16;
    if (!enabled) { backgroundMusic.pause(); return; }
    if (backgroundMusic.paused) {
      try {
        var started = backgroundMusic.play();
        if (started && started.catch) started.catch(function () { /* Browser may wait for another click. */ });
      } catch (_) { /* Audio never blocks play. */ }
    }
  }
  window.GameUI = { renderTitle: renderTitle, renderMap: renderMap, renderIntro: renderIntro,
    renderDuel: renderDuel, renderResult: renderResult, toast: toast, sound: sound, music: music };
}());
