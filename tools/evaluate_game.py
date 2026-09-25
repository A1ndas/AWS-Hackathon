"""Feature-based quality proxy for the current Question Duel combat build.

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
SITE = ["index.html", "css/style.css", "data/content.js", "js/engine.js",
        "js/progress.js", "js/ui.js", "js/main.js"]
CHECKS = ["tools/test_combat.js", "tools/smoke_ui.js", "aws/deploy.py"]


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, capture_output=True, text=True)


def evaluate() -> dict:
    issues: list[str] = []
    present = all((ROOT / name).is_file() for name in SITE + CHECKS)
    if not present:
        issues.append("A required game or check file is missing.")
    syntax_ok = present and all(run(["node", "--check", name]).returncode == 0
                                for name in SITE if name.endswith(".js"))
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
    deploy = run([sys.executable, "aws/deploy.py", "--bucket", "example-question-duel",
                  "--region", "eu-west-2", "--dry-run"]) if present else None
    deploy_ok = deploy is not None and deploy.returncode == 0 and deploy.stdout.count("DRY RUN:") == 7
    if not deploy_ok:
        issues.append("S3 deployment dry run failed.")

    html = (ROOT / "index.html").read_text(encoding="utf-8") if present else ""
    css = (ROOT / "css/style.css").read_text(encoding="utf-8") if present else ""
    ui = (ROOT / "js/ui.js").read_text(encoding="utf-8") if present else ""
    main = (ROOT / "js/main.js").read_text(encoding="utf-8") if present else ""
    engine = (ROOT / "js/engine.js").read_text(encoding="utf-8") if present else ""
    content = (ROOT / "data/content.js").read_text(encoding="utf-8") if present else ""
    order = SITE[2:]
    scripts_ok = all(name in html for name in order) and [html.index(name) for name in order] == sorted(html.index(name) for name in order)
    direct_file_ok = scripts_ok and 'type="module"' not in html and "fetch(" not in html + ui + main
    if not direct_file_ok:
        issues.append("Direct-file script loading check failed.")

    complete = sum([2 if present else 0, 1 if syntax_ok else 0, 2 if combat_ok else 0,
                    2 if screen_ok else 0, 1 if deploy_ok else 0, 2 if direct_file_ok else 0])
    enjoyment = 0.0
    enjoyment += 2 if all(word in engine for word in ("playerHp", "enemyHp", "shieldTurns", "enemyHealUsed")) else 0
    enjoyment += 1.5 if all(word in main for word in ("startMiniTimer", "miniColor", "miniLane")) else 0
    enjoyment += 1.5 if all(word in ui for word in ("AudioContext", "hit", "hurt", "win", "lose")) else 0
    enjoyment += 1.5 if css.count("@keyframes") >= 10 and "--orange: #ff9900" in css.lower() else 0
    enjoyment += 1 if content.count("question(") >= 60 else 0
    enjoyment += 1 if "learning-line" in ui and "docs-link" in ui else 0
    enjoyment += 1 if "prefers-reduced-motion" in css and "data-action=\"sound\"" in ui else 0
    enjoyment = min(enjoyment, 8.5)
    return {"completeness": complete, "enjoyableness_proxy": enjoyment,
            "overall": round((complete + enjoyment) / 2, 2),
            "passes_over_7": complete > 7 and enjoyment > 7,
            "screen_flow": "passed" if screen_ok else "failed",
            "combat": "passed" if combat_ok else "failed",
            "s3_dry_run": "passed" if deploy_ok else "failed",
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
