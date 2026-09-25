# Integration guide for backend (AWS content + bot opponent)

This branch (`temp/UI`) has the finished frontend for the card-battle game. It's currently a **local 2-player hot-seat** game with geography content. Your backend is **single-player vs a bot**, so this needs adapting, not just dropping in.

## Entry point
- **File:** `src/App.jsx` — single React component, default export.
- Already wired into this Vite project (`package.json`, `vite.config.js` present). Run `npm install && npm run dev` to see it working as-is first.

## What has to change: 2-player hot-seat → 1 player vs bot
Right now the reducer treats both sides as human turns (`SHOW_HAND` → `SELECT` → `CONFIRM`, done twice, once per player, with a "pass the device" screen in between). For a bot opponent:

1. **Skip the hand-off screen for player 2.** The `HandoffPanel` / "Pass the device to Player 2" step should never show for the bot. Only Player 1 (the human) sees `HandPanel` and picks a card.
2. **Bot picks automatically.** After the human confirms their card (`CONFIRM` action, `turn: 0 → 1`), immediately call your bot logic to choose player 2's card, then dispatch `SELECT` + `CONFIRM` for player 2 programmatically (no UI shown). Do this in the `reducer` or in a `useEffect` in `GameBoard` watching for `turn === 1`.
3. **Bot difficulty / logic lives on your side.** The engine already exposes everything needed to write a bot: `remainingCards(state, 1)` gives the bot's live hand, `getAnswer(question, cardId)` grades any card against the current question, `maxDamageForHand` shows optimal play. Plug your bot's card choice into the `SELECT`/`CONFIRM` dispatch for player 1-index `1`.
4. **Rename "Player 2" → your bot's name** in `PlayerPanel` (`ROLES` array, `names` state) and swap `RivalBot` avatar/copy if you want a specific bot personality.

## File structure (all in App.jsx, top to bottom)
1. **CONTENT** — `GAME`, `DAMAGE`, `LEVELS`, `CARDS`, `QUESTIONS`, `DEAL_SLOTS`. Pure data. **Replace with your AWS content**, same shape (see `perfect/good/weak/wrong/overkill` grading helpers in the file).
2. **ENGINE** — dealing, grading, the `reducer`, match outcome logic. No UI. **Bot hook goes here.**
3. **UI** — all React components (title, board, cards, reveal, end screen). Adjust `HandoffPanel` usage per point 1 above; otherwise should carry over as-is.
4. **STYLES** — one CSS string injected via `<style>`. Reuse for visual consistency; only change tokens (colors/fonts) at the top if you need to match existing backend branding.

## Priority order
1. Get it running (`npm install && npm run dev`).
2. Wire the bot into player 2's turn (points 1–3 above) — this is the main behavior change.
3. Swap CONTENT section to AWS questions/cards.
4. Merge into main.

Ping the UI dev (Elya) if the data shape needs to change — the UI reads directly from `QUESTIONS`, `CARDS`, `LEVELS`, `DAMAGE` by name, and the reducer's phase names (`HANDOFF`, `SELECT`, `READY`, `REVEAL`) are used throughout the components.
