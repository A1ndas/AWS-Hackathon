# Question Duel — learn AWS by playing

A complete, single-player browser game for the AWS hackathon. Read a real-world technology problem, choose one of seven reusable answer cards, and outscore a deterministic bot. Every choice gets a fit score and a short explanation of the best answer.

## Play locally

Open `index.html` in a modern desktop browser. There is no install, build step, npm package, server, or AWS account required to play. Progress is saved in `localStorage` where the browser permits it; on restrictive `file:` pages, play still works with session-only progress.

## How a duel works

- Each of the six levels has **seven question cards and seven answer cards**. The answer cards stay available throughout the duel.
- Pick the answer that fits the question best. A card may be useful for several questions, but score differently for each one: **Perfect fit**, **Strong fit**, **Works with trade-offs**, **Weak fit**, or **Wrong tool**.
- PatchBot uses a fixed, preselected answer for each question. The player and bot reveal their choices together; the higher total after seven questions wins.
- Strong choices build a streak bonus. Feedback explains the strongest fit and links to AWS documentation when the best card is an AWS service.
- Winning unlocks the next level. The result screen recaps all seven questions. Replaying can improve your best score; losing never erases progress.

| Level | Icon | Focus |
| --- | --- | --- |
| 1. The CD Era | 💿 | Physical media and cloud storage |
| 2. The USB Crossing | 🔌 | Moving files, DNS, and edge delivery |
| 3. Disk Drive Dungeon | 💽 | Block storage, databases, caches, and archives |
| 4. Server Room | 🖥️ | Compute, scaling, APIs, and monitoring |
| 5. Cloud Control | ☁️ | Permissions, keys, web filtering, and serverless |
| 6. The Global Grid | 🌐 | A complete global architecture challenge |

Use the mouse or keys **1–7** to pick cards, and **Enter** to continue after feedback. The sound button mutes the generated effects. Press **D** on the level map to unlock every level for a judge demo; **Reset progress** is on the title screen.

## Project structure

- `data/content.js` — all card, question, score, opponent, and explanation content
- `js/engine.js` — deterministic duel rules, with no DOM access
- `js/ui.js`, `js/main.js`, `js/progress.js` — screens, navigation, sound, and local saves
- `css/style.css` — AWS orange and dark-theme presentation
- `tools/evaluate_game.py` — separate Python quality evaluator
- `tools/smoke_ui.js` — screen-flow simulation used by the evaluator
- `aws/deploy.py` — optional Python uploader for an existing S3 bucket

Run the evaluator with `python tools/evaluate_game.py --run 1` (run numbers 1–3 are supported). Reports go to `evaluation/run-N.json`. It checks content, deterministic winning and losing routes, save behavior, and simulated screen flow. The enjoyableness number is a **feature-based proxy**, not a substitute for a human playtest.

## AWS use

The game teaches AWS services; it does **not** create EC2 instances, databases, or other services represented by its cards. The playable website can be hosted from S3, preferably through CloudFront when account permissions allow it. See [AWS_README.md](AWS_README.md) for the Workshop Studio account checklist and deployment instructions. The game itself needs no backend or credentials.
