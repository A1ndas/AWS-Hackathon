# Question Duel — an AWS beginner adventure

A single-player browser game that teaches AWS services through short battles. Answer infrastructure problems, repair your systems, and defend against an enemy that aims more accurately each level.

## Play locally

Double-click `index.html` in a modern desktop browser. Keep the `css/`, `data/`, and `js/` folders beside it. No install, build step, server, or AWS account is needed. Progress uses `localStorage` where the browser permits it; if local file storage is restricted, the game remains playable for that session.

## Battle rules

Both sides use the same **one-time heal of up to 2 HP**. The player starts with **12 HP** and the enemy with **7 HP**. Every action spends one turn:

| Action | Minigame | Reward |
| --- | --- | --- |
| Attack | Pick the best AWS service from four answer cards. Later levels include timed incidents and two-card builds. | A best-fit answer deals 1 enemy damage. A poor answer costs 2 player HP. |
| Heal | Memorize and repeat a three-color circuit before the 9-second timer expires. | Restore up to 2 player HP. One attempt per battle, even if it fails. |
| Defend | Dodge the flashing danger lane across three waves before the 7-second timer expires. | Block 1 damage from each of the next three enemy attacks. One attempt per battle. |

The enemy attacks for **2 HP if it hits**, or uses its one-time heal when low on health. Its accuracy rises from **35% in level one to 70% in level six**. Attack damage, health, and healing stay the same across levels. The enemy can heal, so it may take more than seven successful answers to bring its HP to zero. There is no question limit: the question bank cycles until one side is defeated.

Each level contains ten short problems, and feedback explains the best AWS service with a link to the official documentation. The sound button mutes the generated effects; reduced-motion system settings suppress animations.

| Level | Icon | Beginner topic |
| --- | --- | --- |
| 1. Cloud Bootcamp | 💿 | Core AWS services: compute, storage, database, access, delivery, monitoring |
| 2. Connected Cloud | 🔌 | VPC, DNS, load balancing, APIs, scaling, edge delivery |
| 3. Disk Drive Dungeon | 💽 | Data choices: SQL, NoSQL, cache, objects, volumes, archives |
| 4. Server Room | 🖥️ | Compute, traffic, monitoring, timed incidents |
| 5. Cloud Control | ☁️ | IAM, KMS, WAF, serverless builds |
| 6. The Global Grid | 🌐 | Mixed architecture and the most accurate enemy |

Use the mouse or keys **1–4** for attack cards and the heal circuit, and **1–3** for defense lanes. Press **Enter** after feedback. Winning unlocks the next level; losing allows an immediate retry. Press **D** on the level map to unlock all levels for a demo.

## Code and checks

- `data/content.js` — service cards, beginner questions, answer decks, and explanations
- `js/engine.js` — deterministic, DOM-free combat rules
- `js/ui.js`, `js/main.js`, `js/progress.js` — screens, timers, sounds, navigation, local saves
- `css/style.css` — AWS orange styling, battle effects, responsive layout
- `tools/test_combat.js` — combat and balance checks
- `tools/smoke_ui.js` — in-memory screen-flow check
- `tools/evaluate_game.py` — optional feature-based quality proxy; fun still needs human playtesting
- `aws/deploy.py` — optional Python uploader to an existing S3 bucket

Run `node tools/test_combat.js` and `node tools/smoke_ui.js` to check the current game. Run `python tools/evaluate_game.py --check` for an unsaved feature-based score. The three reports in `evaluation/` grade an earlier version and remain as historical records.

## AWS hosting

The game teaches AWS services, but its cards do not create those services. The website can be hosted from S3, optionally through CloudFront. See [AWS_README.md](AWS_README.md) for Workshop Studio access notes and deployment steps. The browser game never needs AWS credentials.
