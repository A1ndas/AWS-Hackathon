"""Feature-based quality proxy for the current Question Duel build (React UI + game engine).

The original three numbered evaluation reports are historical and are never overwritten.
Use --check for a fresh, unsaved score. Human playtesting is still needed for fun.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ["data/content.js", "js/engine.js", "js/progress.js", "js/flow.js"]
UI = ["index.html", "src/main.jsx", "src/game.js", "src/App.jsx", "src/game.css", "assets/background.mp3"]
CHECKS = ["tools/test_combat.js", "tools/smoke_ui.js", "aws/deploy.py", "package.json"]


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, capture_output=True, text=True)


def read(name: str) -> str:
    path = ROOT / name
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def evaluate() -> dict:
    issues: list[str] = []
    present = all((ROOT / name).is_file() for name in ENGINE + UI + CHECKS)
    if not present:
        issues.append("A required game, UI, or check file is missing.")
    syntax_ok = present and all(run(["node", "--check", name]).returncode == 0 for name in ENGINE)
    if not syntax_ok:
        issues.append("JavaScript syntax check failed.")
    combat = run(["node", "tools/test_combat.js"]) if present else None
    combat_ok = combat is not None and combat.returncode == 0
    if not combat_ok:
        issues.append("Combat check failed: " + (combat.stderr.strip() if combat else "files missing"))
    screen = run(["node", "tools/smoke_ui.js"]) if present else None
    screen_ok = screen is not None and screen.returncode == 0
    if not screen_ok:
        issues.append("Screen-flow check failed: " + (screen.stderr.strip() if screen else "files missing"))

    built = (ROOT / "dist" / "index.html").is_file()
    deploy_ok = None
    if built:
        deploy = run([sys.executable, "aws/deploy.py", "--bucket", "example-question-duel",
                      "--region", "eu-west-2", "--dry-run"])
        deploy_ok = deploy.returncode == 0 and "DRY RUN: index.html" in deploy.stdout
        if not deploy_ok:
            issues.append("S3 deployment dry run failed.")

    html, app, css = read("index.html"), read("src/App.jsx"), read("src/game.css")
    loader, engine, content = read("src/game.js"), read("js/engine.js"), read("data/content.js")
    order = ["data/content.js", "js/engine.js", "js/progress.js", "js/flow.js"]
    wiring_ok = all(name in loader for name in order) and \
        [loader.index(name) for name in order] == sorted(loader.index(name) for name in order) and \
        "/src/main.jsx" in html
    if not wiring_ok:
        issues.append("Engine modules are not loaded in order by src/game.js.")

    complete = sum([2 if present else 0, 1 if syntax_ok else 0, 2 if combat_ok else 0,
                    2 if screen_ok else 0, 1 if deploy_ok is not False else 0, 2 if wiring_ok else 0])
    enjoyment = 0.0
    enjoyment += 2 if all(word in engine for word in ("playerHp", "enemyHp", "shieldTurns", "lastEnemyHealTurn")) else 0
    enjoyment += 1.5 if all(word in app for word in ("useCountdown", "miniPick", "miniTimeout")) else 0
    enjoyment += 1.5 if all(word in app for word in ("AudioContext", "hit", "hurt", "win", "lose")) else 0
    enjoyment += 1.5 if css.count("@keyframes") >= 10 else 0
    enjoyment += 1 if content.count("question(") >= 60 else 0
    enjoyment += 1 if "ad-review-why" in app and "ad-docs" in app else 0
    enjoyment += 1 if "prefers-reduced-motion" in css and "SoundButton" in app else 0
    enjoyment = min(enjoyment, 8.5)
    return {"completeness": complete, "enjoyableness_proxy": enjoyment,
            "overall": round((complete + enjoyment) / 2, 2),
            "passes_over_7": complete > 7 and enjoyment > 7,
            "screen_flow": "passed" if screen_ok else "failed",
            "combat": "passed" if combat_ok else "failed",
            "s3_dry_run": "skipped (run npm run build first)" if deploy_ok is None else "passed" if deploy_ok else "failed",
            "issues": issues,
            "limit": "Enjoyableness is a feature-based proxy; only people can judge whether the game is fun."}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Score the current build without saving a numbered report")
    parser.add_argument("--run", type=int, choices=(1, 2, 3), help="Save one of the original three numbered reports")
    args = parser.parse_args()
    if not args.check and args.run is None:
        parser.error("Choose --check or --run 1, 2, or 3.")
    output = ROOT / "evaluation" / f"run-{args.run}.json" if args.run else None
    if output and output.exists():
        parser.error(f"{output.name} already exists; the three-run limit is preserved. Use --check.")
    result = evaluate()
    if output:
        result["run"] = args.run
        output.parent.mkdir(exist_ok=True)
        output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
