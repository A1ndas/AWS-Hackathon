"""Independent, dependency-free quality gate for Question Duel.

Usage: python tools/evaluate_game.py --run 1
The two scores are evidence-based proxies. Enjoyment still needs a human playtest.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    "index.html",
    "css/style.css",
    "data/content.js",
    "js/engine.js",
    "js/progress.js",
    "js/ui.js",
    "js/main.js",
    "tools/smoke_ui.js",
    "aws/deploy.py",
]

JS_HARNESS = r"""
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = process.cwd();
const box = {window: {}, console};
vm.createContext(box);
for (const file of ['data/content.js', 'js/engine.js', 'js/progress.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), box, {filename: file});
}
const content = box.window.GAME_CONTENT;
const engine = box.window.GameEngine;
const progressApi = box.window.GameProgress;
const issues = [];
const stats = {levels: 0, questions: 0, answersPerLevel: [], winningPaths: 0, losingPaths: 0, repeatableAnswers: 0};
if (!content || !engine || !progressApi) issues.push('A required game global did not load.');
if (content) {
  stats.levels = content.levels.length;
  if (content.levels.length !== 6) issues.push('Expected exactly six levels.');
  for (const level of content.levels) {
    const ids = level.answers;
    stats.answersPerLevel.push(ids.length);
    stats.questions += level.questions.length;
    if (ids.length !== 7 || new Set(ids).size !== 7) issues.push(`Level ${level.id}: expected seven distinct answers.`);
    if (level.questions.length !== 7) issues.push(`Level ${level.id}: expected seven questions.`);
    for (const id of ids) if (!content.cards[id]) issues.push(`Level ${level.id}: missing card ${id}.`);
    const bestIds = new Set();
    for (const q of level.questions) {
      if (q.scores.length !== 7) issues.push(`${q.id}: expected seven fit scores.`);
      if (q.scores.some(n => !Number.isInteger(n) || n < 0 || n > 100)) issues.push(`${q.id}: fit scores must be integers from 0 to 100.`);
      if (!ids.includes(q.best) || !ids.includes(q.rival)) issues.push(`${q.id}: best or rival answer is missing from the hand.`);
      if (q.scores[ids.indexOf(q.best)] !== 100) issues.push(`${q.id}: best answer must score 100.`);
      if (q.scores.filter(n => n === 100).length !== 1) issues.push(`${q.id}: expected one best answer.`);
      if (!q.why || q.why.length < 35) issues.push(`${q.id}: learning explanation is too short.`);
      bestIds.add(q.best);
    }
    if (bestIds.size !== 7) issues.push(`Level ${level.id}: every answer should be the best fit once.`);
    for (let i = 0; i < ids.length; i++) {
      const values = level.questions.map(q => q.scores[i]);
      if (values.filter(n => n > 0).length >= 2 && new Set(values).size >= 3) stats.repeatableAnswers++;
      else issues.push(`Level ${level.id}: ${ids[i]} needs distinct degrees of fit across questions.`);
    }
    if (engine) {
      let perfect = engine.startLevel(level);
      let poor = engine.startLevel(level);
      for (const q of level.questions) {
        perfect = engine.answer(level, perfect, q.best);
        const minimum = Math.min(...q.scores);
        poor = engine.answer(level, poor, ids[q.scores.indexOf(minimum)]);
      }
      if (perfect.status === 'complete' && perfect.won && perfect.history.length === 7) stats.winningPaths++;
      else issues.push(`Level ${level.id}: a perfect route did not win and finish.`);
      if (poor.status === 'complete' && !poor.won) stats.losingPaths++;
      else issues.push(`Level ${level.id}: low-fit choices should lose to the bot.`);
      const again = level.questions.reduce((s, q) => engine.answer(level, s, q.best), engine.startLevel(level));
      if (JSON.stringify(again) !== JSON.stringify(perfect)) issues.push(`Level ${level.id}: the bot is not deterministic.`);
    }
  }
}
try {
  box.window.localStorage = {
    getItem() { throw new Error('storage denied'); },
    setItem() { throw new Error('storage denied'); },
    removeItem() { throw new Error('storage denied'); }
  };
  let progress = progressApi.load();
  const level = content.levels[0];
  let game = engine.startLevel(level);
  for (const q of level.questions) game = engine.answer(level, game, q.best);
  progress = progressApi.record(progress, level, game);
  if (progress.unlocked !== 2 || !progress.completed['1'] || progressApi.xp(progress) <= 0) {
    issues.push('Progress did not work when localStorage was unavailable.');
  }
  if (progressApi.load().unlocked !== 2) issues.push('In-memory save did not survive a reload call.');
  if (progressApi.reset().unlocked !== 1) issues.push('Progress reset failed.');
} catch (error) { issues.push('Progress test failed: ' + error.message); }
process.stdout.write(JSON.stringify({issues, stats}));
"""


def quality_gate(run_number: int) -> dict:
    issues: list[str] = []
    for filename in REQUIRED:
        if not (ROOT / filename).is_file():
            issues.append(f"Missing {filename}.")

    syntax_ok = True
    for filename in REQUIRED:
        if filename.endswith(".js") and (ROOT / filename).is_file():
            check = subprocess.run(["node", "--check", filename], cwd=ROOT, capture_output=True, text=True)
            if check.returncode:
                syntax_ok = False
                issues.append(f"JavaScript syntax failed in {filename}: {check.stderr.strip()}")

    mechanics = {"issues": ["Game scripts could not run."], "stats": {}}
    if syntax_ok and all((ROOT / filename).is_file() for filename in REQUIRED):
        check = subprocess.run(["node", "-e", JS_HARNESS], cwd=ROOT, capture_output=True, text=True)
        if check.returncode:
            issues.append("Engine simulation crashed: " + check.stderr.strip())
        else:
            mechanics = json.loads(check.stdout)
            issues.extend(mechanics["issues"])

    html = (ROOT / "index.html").read_text(encoding="utf-8") if (ROOT / "index.html").exists() else ""
    css = (ROOT / "css/style.css").read_text(encoding="utf-8") if (ROOT / "css/style.css").exists() else ""
    ui = (ROOT / "js/ui.js").read_text(encoding="utf-8") if (ROOT / "js/ui.js").exists() else ""
    main = (ROOT / "js/main.js").read_text(encoding="utf-8") if (ROOT / "js/main.js").exists() else ""
    engine = (ROOT / "js/engine.js").read_text(encoding="utf-8") if (ROOT / "js/engine.js").exists() else ""
    progress = (ROOT / "js/progress.js").read_text(encoding="utf-8") if (ROOT / "js/progress.js").exists() else ""

    expected_scripts = ["data/content.js", "js/engine.js", "js/progress.js", "js/ui.js", "js/main.js"]
    scripts_in_order = all(script in html for script in expected_scripts) and [html.index(s) for s in expected_scripts] == sorted(html.index(s) for s in expected_scripts)
    if not scripts_in_order:
        issues.append("Script tags are missing or in the wrong order.")
    if re.search(r'type\s*=\s*["\']module["\']|\bfetch\s*\(', html + ui + main):
        issues.append("The game uses modules or fetch, breaking direct file opening.")
    if "data-action=\"continue\"" not in ui or "data-action=\"answer\"" not in ui:
        issues.append("The UI is missing the answer or continue interaction.")

    smoke = subprocess.run(["node", "tools/smoke_ui.js"], cwd=ROOT, capture_output=True, text=True)
    ui_smoke_ok = smoke.returncode == 0
    if not ui_smoke_ok:
        issues.append("Screen-flow smoke test failed: " + smoke.stderr.strip())
    deploy = subprocess.run(
        [sys.executable, "aws/deploy.py", "--bucket", "example-question-duel", "--region", "eu-west-2", "--dry-run"],
        cwd=ROOT, capture_output=True, text=True,
    )
    deploy_ok = deploy.returncode == 0 and deploy.stdout.count("DRY RUN:") == 7
    if not deploy_ok:
        issues.append("The S3 deployment dry run did not list the seven site files.")

    stats = mechanics.get("stats", {})
    completeness = 0.0
    completeness += 1.0 if all((ROOT / f).is_file() for f in REQUIRED) else 0
    completeness += 1.0 if syntax_ok else 0
    completeness += 1.0 if scripts_in_order else 0
    completeness += 1.0 if stats.get("levels") == 6 and stats.get("questions") == 42 else 0
    completeness += 1.0 if stats.get("answersPerLevel") == [7] * 6 else 0
    completeness += 0.5 if stats.get("repeatableAnswers") == 42 else 0
    completeness += 1.0 if stats.get("winningPaths") == 6 else 0
    completeness += 1.0 if stats.get("losingPaths") == 6 else 0
    completeness += 1.0 if "localStorage" in progress and "catch" in progress and not any("Progress" in issue for issue in issues) else 0
    completeness += 1.0 if ui_smoke_ok else 0
    completeness += 0.5 if deploy_ok else 0

    enjoyment = 0.0
    enjoyment += 1.5 if "learning-line" in ui and "tip-line" in ui and "q.why" in ui else 0
    enjoyment += 1.0 if "rivalId" in engine and "PATCHBOT" in ui else 0
    enjoyment += 1.25 if "streak" in engine and "result-stars" in ui and "xp-pill" in ui else 0
    enjoyment += 1.25 if "AudioContext" in ui and "data-action=\"sound\"" in ui else 0
    enjoyment += 1.25 if len(re.findall(r"@keyframes\s+", css)) >= 5 and "--orange: #ff9900" in css.lower() else 0
    enjoyment += 1.0 if "level-grid" in ui and "intro-screen" in ui else 0
    enjoyment += 1.0 if "prefers-reduced-motion" in css and "keydown" in main and "aria-label" in ui else 0
    enjoyment += 1.0 if "review-panel" in ui and "data-action=\"retry\"" not in ui and "Try again" in ui else 0
    enjoyment += 0.75 if "answer-card:not(:disabled):hover" in css and "card.tip" in ui else 0
    # A heuristic cannot certify human enjoyment, even when every signal is present.
    enjoyment = min(enjoyment, 8.5)

    return {
        "run": run_number,
        "completeness": round(completeness, 2),
        "enjoyableness_proxy": round(enjoyment, 2),
        "overall": round((completeness + enjoyment) / 2, 2),
        "passes_over_7": completeness > 7 and enjoyment > 7,
        "stats": stats,
        "screen_flow": "passed" if ui_smoke_ok else "failed",
        "s3_dry_run": "passed" if deploy_ok else "failed",
        "issues": issues,
        "limit": "Enjoyableness is a feature-based proxy; a real player must judge fun and clarity.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Score Question Duel, with at most three numbered runs.")
    parser.add_argument("--run", type=int, required=True, choices=(1, 2, 3))
    args = parser.parse_args()
    report = quality_gate(args.run)
    output_dir = ROOT / "evaluation"
    output_dir.mkdir(exist_ok=True)
    output = output_dir / f"run-{args.run}.json"
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"Saved {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
