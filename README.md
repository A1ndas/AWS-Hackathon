# UI-Elya — Demo Branch

This branch is **not part of the shipped game**. It was a standalone visual demo
("Atlas Duel," a geography-quiz mockup) I built to show the team what the
card-duel UI, layout, and animations could look like before we had the real
AWS game engine to plug into.

Once the engine (levels, questions, minigames) was ready on `main`, this UI
was rebuilt from scratch as `src/App.jsx` on the `final` branch, wired up to
the real content instead of hardcoded geography data, and merged into `main`
via PR #1. That merged version is what the team should use.

This branch is kept around only for reference / portfolio purposes and is
safe to ignore (or delete).
