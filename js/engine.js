/* Deterministic battle rules. No DOM, timers, storage, or randomness. */
(function () {
  "use strict";
  var ACCURACY = [0, 35, 42, 49, 56, 63, 70];
  var HEAL = 2;

  function startLevel(level) {
    if (!level || !level.questions || !level.answers) throw new Error('A level is required.');
    return { levelId: level.id, turn: 0, attackIndex: 0, hits: 0,
      enemyHp: 7, enemyMaxHp: 7, enemyHealUsed: false,
      playerHp: 12, playerMaxHp: 12, playerHealUsed: false,
      defendUsed: false, shieldTurns: 0, score: 0, streak: 0,
      history: [], status: 'active', won: false };
  }
  function question(level, state) {
    return level.questions[state.attackIndex % level.questions.length];
  }
  function hand(level, state) {
    var q = question(level, state), chosen = [q.best];
    if (q.support && q.support !== q.best) chosen.push(q.support);
    var start = (state.attackIndex * 3 + level.id) % level.answers.length;
    for (var i = 0; chosen.length < 4 && i < level.answers.length; i++) {
      var id = level.answers[(start + i) % level.answers.length];
      if (chosen.indexOf(id) < 0) chosen.push(id);
    }
    var shift = state.attackIndex % 4;
    return chosen.slice(shift).concat(chosen.slice(0, shift));
  }
  function mode(level, state) {
    if (level.id >= 5 && state.attackIndex % 4 === 3 && question(level, state).support) return 'build';
    if (level.id >= 4 && state.attackIndex % 4 === 2) return 'timed';
    return 'deploy';
  }
  function accuracy(level) { return ACCURACY[level.id] || 80; }
  function intent(level, state) {
    if (state.enemyHp <= 2 && !state.enemyHealUsed) {
      return { kind: 'heal', label: 'Repair +2 HP', accuracy: accuracy(level) };
    }
    var hit = (state.turn * 37 + 17) % 100 < accuracy(level);
    return { kind: 'attack', label: 'Attack: up to 2 HP', accuracy: accuracy(level), hit: hit };
  }
  function healPattern(level, state) {
    var colors = ['orange', 'cyan', 'violet', 'lime'];
    var base = (state.turn * 3 + level.id) % 4;
    return [colors[base], colors[(base + 2) % 4], colors[(base + 1) % 4]];
  }
  function dangerLane(level, state, wave) { return (state.turn + level.id + wave * 2) % 3; }

  function act(level, state, action) {
    if (!state || state.status !== 'active' || state.levelId !== level.id) throw new Error('Battle is not active.');
    if (!action || ['attack', 'heal', 'defend'].indexOf(action.kind) < 0) throw new Error('Choose an action.');
    if (action.kind === 'heal' && state.playerHealUsed) throw new Error('Heal already used.');
    if (action.kind === 'defend' && state.defendUsed) throw new Error('Defense already used.');
    var q = question(level, state), bot = intent(level, state), challenge = mode(level, state);
    var hp = state.playerHp, enemyHp = state.enemyHp, shield = state.shieldTurns;
    var hits = state.hits, attackIndex = state.attackIndex;
    var score = state.score, streak = state.streak;
    var quality = 0, best = false, combo = false, wrongDamage = 0;
    var playerHeal = 0, enemyHeal = 0, blocked = 0, botDamage = 0;
    if (action.kind === 'attack') {
      var visible = hand(level, state);
      if (!action.timedOut && visible.indexOf(action.answerId) < 0) throw new Error('Card is not in this hand.');
      if (challenge === 'build' && !action.timedOut &&
          (visible.indexOf(action.supportId) < 0 || action.supportId === action.answerId)) {
        throw new Error('Choose a different supporting card.');
      }
      quality = action.timedOut ? 0 : q.scores[level.answers.indexOf(action.answerId)];
      best = !action.timedOut && action.answerId === q.best;
      combo = best && challenge === 'build' && action.supportId === q.support;
      if (best) { enemyHp--; hits++; score += 100 + (combo ? 30 : 0); streak++; }
      else { wrongDamage = action.timedOut ? 3 : quality >= 60 ? 0 : 2; hp -= wrongDamage; streak = 0; }
      attackIndex++;
    } else if (action.kind === 'heal') {
      if (action.success) { playerHeal = Math.min(HEAL, state.playerMaxHp - hp); hp += playerHeal; }
    } else if (action.success) shield = 3;

    var botActed = false;
    if (hp > 0 && enemyHp > 0) {
      botActed = true;
      if (bot.kind === 'heal') {
        enemyHeal = Math.min(HEAL, state.enemyMaxHp - enemyHp);
        enemyHp += enemyHeal;
      } else {
        if (bot.hit) {
          blocked = shield > 0 ? 1 : 0;
          botDamage = 2 - blocked;
          hp -= botDamage;
        }
        if (shield > 0) shield--;
      }
    }
    hp = Math.max(0, hp);
    var won = enemyHp === 0 && hp > 0;
    var finished = won || hp === 0;
    var result = { turn: state.turn, kind: action.kind,
      questionIndex: action.kind === 'attack' ? state.attackIndex % level.questions.length : null,
      answerId: action.answerId || null, supportId: action.supportId || null,
      bestId: action.kind === 'attack' ? q.best : null, mode: challenge,
      hit: best, combo: combo, quality: quality, timedOut: Boolean(action.timedOut),
      success: Boolean(action.success), wrongDamage: wrongDamage,
      playerHeal: playerHeal, enemyHeal: enemyHeal, blocked: blocked,
      botDamage: botDamage, botHit: botActed && bot.kind === 'attack' && bot.hit,
      botActed: botActed, intent: bot };
    return { levelId: state.levelId, turn: state.turn + 1, attackIndex: attackIndex,
      hits: hits, enemyHp: enemyHp, enemyMaxHp: state.enemyMaxHp,
      enemyHealUsed: state.enemyHealUsed || enemyHeal > 0,
      playerHp: hp, playerMaxHp: state.playerMaxHp,
      playerHealUsed: state.playerHealUsed || action.kind === 'heal',
      defendUsed: state.defendUsed || action.kind === 'defend',
      shieldTurns: shield, score: score, streak: streak,
      history: state.history.concat([result]),
      status: finished ? 'complete' : 'active', won: won };
  }
  function stars(level, state) {
    if (!state.won) return 0;
    if (state.playerHp >= 9) return 3;
    if (state.playerHp >= 5) return 2;
    return 1;
  }
  window.GameEngine = { startLevel: startLevel, question: question, hand: hand,
    mode: mode, intent: intent, accuracy: accuracy, healPattern: healPattern,
    dangerLane: dangerLane, act: act, stars: stars, HEAL: HEAL };
}());
