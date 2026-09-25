/* Deterministic combat rules. No DOM, storage, timers, or randomness. */
(function () {
  "use strict";

  function startLevel(level) {
    if (!level || !level.questions || !level.answers) throw new Error("A level is required.");
    return { levelId: level.id, turn: 0, hits: 0, enemyHp: 7,
      playerHp: 26 - level.id, maxHp: 26 - level.id,
      score: 0, streak: 0, history: [], status: "active", won: false };
  }

  function question(level, state) {
    return level.questions[state.turn % level.questions.length];
  }

  function hand(level, state) {
    var q = question(level, state);
    var selected = [q.best];
    if (q.support && q.support !== q.best) selected.push(q.support);
    var rotation = (state.turn * 3 + level.id) % level.answers.length;
    for (var offset = 0; selected.length < 4 && offset < level.answers.length; offset++) {
      var id = level.answers[(rotation + offset) % level.answers.length];
      if (selected.indexOf(id) < 0) selected.push(id);
    }
    var shift = state.turn % 4;
    return selected.slice(shift).concat(selected.slice(0, shift));
  }

  function mode(level, state) {
    if (level.id < 3) return "deploy";
    if (level.id >= 4 && state.turn % 4 === 2) return "timed";
    if (level.id >= 5 && state.turn % 4 === 3 && question(level, state).support) return "build";
    return "deploy";
  }

  function intent(level, state) {
    var kinds = ["attack", "charge", "attack", "surge"];
    var kind = kinds[state.turn % kinds.length];
    var damage = Math.max(1, Math.min(4, Math.floor((level.id + 1) / 2)));
    if (kind === "charge") return { kind: kind, damage: 0, label: "Charging: no damage this turn" };
    if (kind === "surge") damage += 1;
    return { kind: kind, damage: damage, label: (kind === "surge" ? "Surge" : "Attack") + ": " + damage + " HP" };
  }

  function answer(level, state, answerId, supportId, timedOut, guarded) {
    if (!state || state.status !== "active" || state.levelId !== level.id) throw new Error("Battle is not active.");
    var q = question(level, state);
    var visible = hand(level, state);
    if (!timedOut && visible.indexOf(answerId) < 0) throw new Error("Card is not in this hand.");
    var challenge = mode(level, state);
    if (challenge === "build" && !timedOut && (visible.indexOf(supportId) < 0 || supportId === answerId)) {
      throw new Error("Choose a different supporting card.");
    }
    var best = !timedOut && answerId === q.best;
    var combo = challenge === "build" && best && supportId === q.support;
    var enemy = intent(level, state);
    var quality = timedOut ? 0 : q.scores[level.answers.indexOf(answerId)];
    var wrongDamage = best ? 0 : timedOut ? 3 : quality >= 60 ? 0 : 2;
    var attackDamage = guarded && enemy.kind === "surge" ? Math.max(0, enemy.damage - 2) : enemy.damage;
    var playerHp = Math.max(0, state.playerHp - wrongDamage - attackDamage);
    var hits = state.hits + (best ? 1 : 0);
    var won = hits >= 7 && playerHp > 0;
    var turn = { questionId: q.id, questionIndex: state.turn % level.questions.length,
      turn: state.turn, answerId: answerId || null, supportId: supportId || null,
      bestId: q.best, hit: best, combo: combo, quality: quality, timedOut: Boolean(timedOut),
      wrongDamage: wrongDamage, attackDamage: attackDamage, guarded: Boolean(guarded),
      damage: wrongDamage + attackDamage, intent: enemy, mode: challenge };
    return { levelId: state.levelId, turn: state.turn + 1, hits: hits,
      enemyHp: Math.max(0, 7 - hits), playerHp: playerHp, maxHp: state.maxHp,
      score: state.score + (best ? 100 : 0) + (combo ? 30 : 0),
      streak: best ? state.streak + 1 : 0,
      history: state.history.concat([turn]),
      status: won || playerHp === 0 ? "complete" : "active", won: won };
  }

  function stars(level, state) {
    if (!state.won) return 0;
    if (state.playerHp >= state.maxHp * .7) return 3;
    if (state.playerHp >= state.maxHp * .35) return 2;
    return 1;
  }

  window.GameEngine = { startLevel: startLevel, question: question, hand: hand,
    mode: mode, intent: intent, answer: answer, stars: stars };
}());
