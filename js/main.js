/* Screen navigation and event handling. */
(function () {
  "use strict";

  var content = window.GAME_CONTENT;
  var engine = window.GameEngine;
  var progressApi = window.GameProgress;
  var ui = window.GameUI;
  var progress = progressApi.load();
  var screen = "title";
  var level = null;
  var duel = null;
  var review = null;

  function draw() {
    if (screen === "title") ui.renderTitle(progress, content);
    if (screen === "map") ui.renderMap(progress, content);
    if (screen === "intro") ui.renderIntro(progress, content, level);
    if (screen === "duel") ui.renderDuel(progress, content, level, duel, review);
    if (screen === "result") ui.renderResult(progress, content, level, duel);
  }

  function goMap() {
    screen = "map";
    review = null;
    draw();
  }

  function chooseLevel(id) {
    if (id < 1 || id > progress.unlocked) return;
    level = content.levels[id - 1];
    duel = null;
    review = null;
    screen = "intro";
    draw();
  }

  function begin() {
    duel = engine.startLevel(level);
    review = null;
    screen = "duel";
    draw();
  }

  function playAnswer(answerId) {
    if (screen !== "duel" || review || duel.status !== "active") return;
    duel = engine.answer(level, duel, answerId);
    review = duel.history[duel.history.length - 1];
    ui.sound(review.grade.tone, progress.sound);
    draw();
    var next = document.querySelector('[data-action="continue"]');
    if (next) next.focus();
  }

  function continueDuel() {
    if (screen !== "duel" || !review) return;
    review = null;
    if (duel.status === "complete") {
      progress = progressApi.record(progress, level, duel);
      screen = "result";
      ui.sound(duel.won ? "win" : "lose", progress.sound);
    }
    draw();
  }

  document.addEventListener("click", function (event) {
    var control = event.target.closest("[data-action]");
    if (!control || control.disabled) return;
    var action = control.dataset.action;
    if (action === "home") { screen = "title"; review = null; draw(); }
    else if (action === "map") goMap();
    else if (action === "how") document.getElementById("how").scrollIntoView({ behavior: "smooth" });
    else if (action === "level") chooseLevel(Number(control.dataset.level));
    else if (action === "begin") begin();
    else if (action === "answer") playAnswer(control.dataset.answer);
    else if (action === "continue") continueDuel();
    else if (action === "retry") begin();
    else if (action === "next-level") chooseLevel(level.id + 1);
    else if (action === "sound") { progress = progressApi.setSound(progress, !progress.sound); draw(); }
    else if (action === "reset") {
      if (window.confirm("Reset all saved Question Duel progress?")) {
        progress = progressApi.reset();
        screen = "title";
        draw();
        ui.toast("Progress reset.");
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (screen === "map" && event.key.toLowerCase() === "d") {
      progress = progressApi.unlockAll(progress);
      draw();
      ui.toast("Demo mode: all levels unlocked!");
      return;
    }
    if (screen === "duel" && review && event.key === "Enter") {
      event.preventDefault();
      continueDuel();
      return;
    }
    if (screen === "duel" && !review && /^[1-7]$/.test(event.key)) {
      event.preventDefault();
      playAnswer(level.answers[Number(event.key) - 1]);
    }
  });

  draw();
}());
