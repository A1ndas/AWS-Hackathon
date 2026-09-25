# Question Duel — an AWS beginner adventure

A single-player browser game that teaches AWS services through short battles. Read an infrastructure problem, choose the best of four service cards, and defeat the enemy before your health reaches zero.

## Play locally

Double-click `index.html` in a modern desktop browser. Keep the `css/`, `data/`, and `js/` folders beside it. No install, build step, server, or AWS account is needed. The same files can be hosted on Amazon S3. Progress is saved in `localStorage` where the browser permits it; if local file storage is restricted, the game remains playable for that session.

## Battle rules

- Each level has a seven-card deck, but only **four cards** appear each turn. The best-fit answer removes **one of the enemy's seven HP**. A reasonable alternative misses without a mistake penalty; a poor or wrong choice costs two player HP. The enemy's visible intent may cause more damage.
- There is **no seven-question limit**. The question bank cycles until you land seven hits or run out of health. Each level contains ten different problems.
- Later levels introduce **12-second incident alerts**, **two-card builds**, and **5-second dodge phases** during enemy surges. A successful dodge blocks two damage. Timed events are never required in the first three levels.
- Feedback names the best service, explains why it fits, and links to AWS documentation. The title screen lets you mute the generated sound effects. Reduced-motion system settings suppress animations.
- Winning unlocks the next level. Losing allows an immediate retry. Press **D** on the level map to unlock all levels for a demo.

| Level | Icon | Beginner topic |
| --- | --- | --- |
| 1. Cloud Bootcamp | 💿 | Core AWS services: compute, storage, database, access, delivery, monitoring |
| 2. Connected Cloud | 🔌 | VPC, DNS, load balancing, APIs, scaling, edge delivery |
| 3. Disk Drive Dungeon | 💽 | Data choices: SQL, NoSQL, cache, objects, volumes, archives |
| 4. Server Room | 🖥️ | Compute, traffic, monitoring, timed incidents |
| 5. Cloud Control | ☁️ | IAM, KMS, WAF, serverless builds |
| 6. The Global Grid | 🌐 | Mixed architecture and the hardest enemy |

Use the mouse or keys **1–4** for cards. Press **Enter** after feedback. During a dodge phase, use keys **1–3** or click a lane; avoid the flashing red lane.

## Code and checks

- `data/content.js` — service cards, beginner questions, answer decks, and explanations
- `js/engine.js` — deterministic, DOM-free combat rules
- `js/ui.js`, `js/main.js`, `js/progress.js` — screens, timers, sounds, navigation, local saves
- `css/style.css` — AWS orange styling, battle effects, responsive layout
- `tools/test_combat.js` — combat and content checks
- `tools/smoke_ui.js` — in-memory screen-flow check
- `tools/evaluate_game.py` — optional quality proxy; subjective fun still needs human playtesting
- `aws/deploy.py` — optional Python uploader to an existing S3 bucket

Run `node tools/test_combat.js` and `node tools/smoke_ui.js` to check the current game. Run `python tools/evaluate_game.py --check` for an unsaved feature-based score. The reports in `evaluation/` were produced for the first, score-based version and are retained as historical records; they do not grade this combat update.

## AWS hosting

The game teaches AWS services, but its cards do not create those services. The website can be hosted from S3, optionally through CloudFront. See [AWS_README.md](AWS_README.md) for the Workshop Studio access notes and deployment steps. The browser game never needs AWS credentials.
