/* Pure duel rules: no DOM, storage, timers, or randomness. */
(function () {
  "use strict";

  function assertLevel(level) {
    if (!level || !Array.isArray(level.answers) || !Array.isArray(level.questions)) {
      throw new Error("A valid level is required.");
    }
  }

  function startLevel(level) {
    assertLevel(level);
    return {
      levelId: level.id,
      round: 0,
      playerScore: 0,
      rivalScore: 0,
      streak: 0,
      bestStreak: 0,
      history: [],
      status: "active",
      won: false
    };
  }

  function gradeFor(score) {
    if (score >= 90) return { label: "Perfect fit", tone: "perfect" };
    if (score >= 70) return { label: "Strong fit", tone: "strong" };
    if (score >= 40) return { label: "Works, with trade-offs", tone: "partial" };
    if (score > 0) return { label: "Weak fit", tone: "weak" };
    return { label: "Wrong tool", tone: "miss" };
  }

  function answer(level, state, answerId) {
    assertLevel(level);
    if (!state || state.status !== "active" || state.levelId !== level.id) {
      throw new Error("This duel is not ready for an answer.");
    }
    var selectedIndex = level.answers.indexOf(answerId);
    if (selectedIndex < 0) throw new Error("That answer is not in this level.");

    var q = level.questions[state.round];
    var rivalIndex = level.answers.indexOf(q.rival);
    var quality = q.scores[selectedIndex];
    var rivalQuality = q.scores[rivalIndex];
    var streak = quality >= 70 ? state.streak + 1 : 0;
    var bonus = quality >= 70 ? Math.min(state.streak, 3) * 10 : 0;
    var playerPoints = quality + bonus;
    var nextRound = state.round + 1;
    var playerScore = state.playerScore + playerPoints;
    var rivalScore = state.rivalScore + rivalQuality;
    var complete = nextRound === level.questions.length;
    var turn = {
      questionId: q.id,
      questionIndex: state.round,
      answerId: answerId,
      bestId: q.best,
      rivalId: q.rival,
      quality: quality,
      rivalQuality: rivalQuality,
      bonus: bonus,
      playerPoints: playerPoints,
      grade: gradeFor(quality)
    };

    return {
      levelId: state.levelId,
      round: nextRound,
      playerScore: playerScore,
      rivalScore: rivalScore,
      streak: streak,
      bestStreak: Math.max(state.bestStreak, streak),
      history: state.history.concat([turn]),
      status: complete ? "complete" : "active",
      won: complete ? playerScore >= rivalScore : false
    };
  }

  function maxScore(level) {
    assertLevel(level);
    var total = 0;
    level.questions.forEach(function (_, index) {
      total += 100 + Math.min(index, 3) * 10;
    });
    return total;
  }

  function stars(level, state) {
    if (!state.won) return 0;
    var share = state.playerScore / maxScore(level);
    if (share >= 0.9) return 3;
    if (share >= 0.75) return 2;
    return 1;
  }

  window.GameEngine = { startLevel: startLevel, answer: answer, gradeFor: gradeFor, maxScore: maxScore, stars: stars };
}());
