# Question Duel — an AWS beginner adventure

A single-player browser game that teaches AWS services through short battles. Attack with AWS answers, rebuild a system to heal, and counter threats to raise a shield.

## Play locally

Double-click `index.html` in a modern desktop browser. Keep `assets/`, `css/`, `data/`, and `js/` beside it. No install, build step, server, or AWS account is needed. Progress uses `localStorage` where the browser permits it; if local file storage is restricted, the game remains playable for that session.

The supplied background track is stored at `assets/background.mp3`. It begins after you press Play, loops quietly, and shares the 🔊 mute button with sound effects. Music playback may wait for a browser click.

## Battle rules

The player starts with **12 HP** and the enemy with **7 HP**. Every action takes one turn:

| Action | Minigame | Result |
| --- | --- | --- |
| Attack | Choose the best AWS service from four cards. Later levels add timed alerts and two-card builds. | Best fit deals 1 enemy damage; a poor answer costs 2 player HP. |
| Heal | Connect three real AWS services in the right order to rebuild a system. You have 14 seconds. | Restore up to 2 HP. Both player and enemy may heal again after the same three-turn cooldown. |
| Defend | Counter three rapid AWS threats with the matching service. You have 12 seconds. | Block 1 damage from each of the next three enemy attacks. The action becomes available again when the shield expires. |

The enemy attacks for **2 HP if it hits**. Its accuracy rises from **35% in level one to 70% in level six**; its health, damage, and healing strength do not rise. There is no question limit: the ten-question bank for each level cycles until one side reaches zero HP. Enemy healing can require more than seven successful attacks.

| Level | Icon | Beginner topic |
| --- | --- | --- |
| 1. Cloud Bootcamp | 💿 | Core AWS services: compute, storage, database, access, delivery, monitoring |
| 2. Connected Cloud | 🔌 | VPC, DNS, load balancing, APIs, scaling, edge delivery |
| 3. Disk Drive Dungeon | 💽 | SQL, NoSQL, cache, objects, volumes, archives |
| 4. Server Room | 🖥️ | Compute, traffic, monitoring, timed incidents |
| 5. Cloud Control | ☁️ | IAM, KMS, WAF, serverless builds |
| 6. The Global Grid | 🌐 | Mixed architecture and the most accurate enemy |

Use the mouse or keys **1–4** for attack cards and **1–3** for the heal and defense choices. Press **Enter** after feedback. Winning unlocks the next level; losing allows an immediate retry. Press **D** on the level map to unlock all levels for a demo.

## Code and checks

- `data/content.js` — service cards, questions, explanations, and AWS minigame content
- `js/engine.js` — deterministic, DOM-free combat rules
- `js/ui.js`, `js/main.js`, `js/progress.js` — screens, timers, animations, sounds, music, and local saves
- `css/style.css` — AWS orange styling and effects
- `tools/test_combat.js` — combat and balance checks
- `tools/smoke_ui.js` — in-memory screen-flow check
- `tools/evaluate_game.py` — optional feature-based quality proxy; fun still needs human playtesting
- `aws/deploy.py` — optional Python uploader to an existing S3 bucket

Run `node tools/test_combat.js` and `node tools/smoke_ui.js` to check the current game. Run `python tools/evaluate_game.py --check` for an unsaved feature-based score. The three reports in `evaluation/` grade an earlier version and remain as historical records.

## AWS hosting

The game teaches AWS services, but its cards do not create those services. The website, including its MP3, can be hosted from S3, optionally through CloudFront. See [AWS_README.md](AWS_README.md) for Workshop Studio access notes and deployment steps. The browser game never needs AWS credentials.
