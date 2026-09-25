# Question Duel: an AWS beginner adventure

A single-player browser card game that teaches AWS services through short battles against a bot. Attack with the right AWS service, rebuild a system to heal, and counter threats to raise a shield.

The game rules and AWS content are plain, DOM-free JavaScript modules. The interface is a React app (Vite) with the Atlas Duel visual style on top of them.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev        # play at the local URL Vite prints
npm test           # combat balance checks + screen-flow checks
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

## Battle rules

The player starts with **12 HP** and the enemy with **7 HP**. Every action takes one turn:

| Action | Minigame | Result |
| --- | --- | --- |
| Attack | Choose the best AWS service from four cards. Level 4 adds 12-second incident alerts; level 5 adds two-card builds. | Best fit deals 1 damage. A close answer is safe; a poor answer costs 2 HP; running out of time costs 3 HP. |
| Repair | Connect three real AWS services in the right order within 14 seconds. | Restore up to 2 HP. Ready again after three turns. |
| Shield | Counter three rapid AWS threats within 12 seconds. | Block 1 damage from each of the next three enemy attacks. |

The enemy hits for **2 HP** and repairs itself when it drops to 2 HP or less. Its accuracy rises from **35% in level 1 to 70% in level 6**. The ten-question bank for each level cycles until one side reaches zero HP. Winning unlocks the next level.

Keys: **1–4** play a card, **1–3** answer a minigame, **Enter** continues, **D** on the level map unlocks every level for a demo.

## Project layout

| Path | What it is |
| --- | --- |
| `data/content.js` | AWS service cards, questions, explanations, and minigame content |
| `js/engine.js` | Deterministic, DOM-free battle rules (player vs bot) |
| `js/progress.js` | Saved progress in `localStorage`, with an in-memory fallback |
| `js/flow.js` | DOM-free screen flow: title, map, intro, duel, minigames, result |
| `src/game.js` | Loads the four modules above, in order, for React |
| `src/App.jsx`, `src/game.css` | The React interface, sounds, music, and animations |
| `assets/background.mp3` | Background music; shares the mute button with sound effects |
| `tools/test_combat.js` | Combat and balance checks |
| `tools/smoke_ui.js` | Screen-flow checks for `js/flow.js` |
| `tools/evaluate_game.py` | Optional feature-based quality proxy |
| `aws/deploy.py` | Optional Python uploader for the built site to an existing S3 bucket |

To change questions or cards, edit `data/content.js`. To change rules, edit `js/engine.js`. The UI reads both, so it needs no changes for new content.

## Checks

```bash
npm test
python tools/evaluate_game.py --check
```

The three reports in `evaluation/` grade an earlier version and remain as historical records.

## AWS hosting

The game teaches AWS services, but its cards do not create those services, and the browser game never needs AWS credentials. The built site (`dist/`, including the music) can be hosted from S3, optionally through CloudFront:

```bash
npm run build
python aws/deploy.py --bucket YOUR-BUCKET --region eu-west-2 --dry-run   # preview the upload
python aws/deploy.py --bucket YOUR-BUCKET --region eu-west-2              # needs boto3 + AWS credentials
```

See [AWS_README.md](AWS_README.md) for Workshop Studio access notes and bucket setup. The upload step there is now `aws/deploy.py` above, which uploads `dist/`.
