/*
  Question Duel: React UI (Atlas Duel visual system) for the AWS game.

  Game rules live in the team's DOM-free modules, loaded by ./game.js:
    data/content.js  AWS cards, questions, repair and defense minigame content
    js/engine.js     deterministic battle rules, player vs bot
    js/progress.js   saved progress: unlocks, best scores, sound setting
    js/flow.js       screen flow: title, map, intro, duel, minigames, result
  This file only renders state and turns clicks, keys, and timers into flow calls.
*/
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Archive,
  Check,
  CircleHelp,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  House,
  KeyRound,
  Layers,
  Lock,
  Map as MapIcon,
  Network,
  Play,
  Puzzle,
  RotateCcw,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { content, engine, flow, progressApi } from "./game.js";
import musicUrl from "../assets/background.mp3";
import "./game.css";

/* ---------- Presentation data (no game rules here) ---------- */

const TYPES = {
  physical: { label: "Physical", tint: "#8FA3B5", Icon: HardDrive },
  storage: { label: "Storage", tint: "#6F95D6", Icon: Archive },
  network: { label: "Networking", tint: "#36A596", Icon: Network },
  database: { label: "Database", tint: "#9C88BC", Icon: Database },
  compute: { label: "Compute", tint: "#D3A04A", Icon: Cpu },
  monitoring: { label: "Monitoring", tint: "#58AC7B", Icon: Activity },
  security: { label: "Security", tint: "#C47C92", Icon: KeyRound },
};

const OUTCOME = {
  hit: { stamp: "HIT", headline: "DIRECT HIT", tone: "hit", cue: "hit" },
  combo: { stamp: "COMBO", headline: "COMBO BUILD", tone: "hit", cue: "combo" },
  close: { stamp: "CLOSE", headline: "CLOSE, BUT NOT THE BEST FIT", tone: "close", cue: "pick" },
  wrong: { stamp: "WRONG", headline: "WRONG SERVICE", tone: "wrong", cue: "hurt" },
  timeout: { stamp: "TOO SLOW", headline: "TIME'S UP", tone: "wrong", cue: "timeout" },
  repaired: { stamp: "REPAIRED", headline: "SYSTEM REPAIRED", tone: "good", cue: "heal" },
  shielded: { stamp: "SHIELD UP", headline: "SHIELD RAISED", tone: "shield", cue: "shield" },
  failed: { stamp: "FAILED", headline: "MINIGAME FAILED", tone: "wrong", cue: "hurt" },
};

const MODES = {
  deploy: { label: "Deploy", Icon: Swords, hint: "Best fit deals 1 damage. A close answer is safe; a poor one costs 2 HP." },
  timed: { label: "Incident alert", Icon: Timer, hint: "12 seconds on the clock. Running out costs 3 HP." },
  build: { label: "Two-card build", Icon: Layers, hint: "Pick the main service, then its supporting service. The right pair earns a +30 combo." },
  match: { label: "Match four", Icon: Puzzle, hint: "Place each card on its prompt. Any wrong pairing costs 2 HP." },
};

const REVEAL_STEPS = [550, 1350, 2000];
const pad2 = (n) => String(n).padStart(2, "0");
const cardOf = (id) => content.cards[id];
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Sound: small WebAudio cues, plus the team's background track ---------- */

const CUES = {
  start: [[392, 0.09], [523, 0.12]],
  pick: [[660, 0.06]],
  hit: [[587, 0.07], [880, 0.14]],
  combo: [[523, 0.06], [784, 0.06], [1046, 0.18]],
  hurt: [[196, 0.2, "sawtooth"]],
  heal: [[523, 0.09], [659, 0.09], [784, 0.16]],
  shield: [[392, 0.08, "triangle"], [587, 0.16, "triangle"]],
  timeout: [[233, 0.28, "square"]],
  win: [[523, 0.12], [659, 0.12], [784, 0.12], [1046, 0.32]],
  lose: [[392, 0.2], [330, 0.2], [262, 0.4]],
};
let audioCtx = null;

function playCue(cue, enabled) {
  if (!enabled || !CUES[cue]) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    let t = audioCtx.currentTime;
    for (const [freq, dur, type = "sine"] of CUES[cue]) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  } catch {
    /* Sound is optional. */
  }
}

/* ---------- Root ---------- */

export default function App() {
  const [view, setViewState] = useState(flow.initial);
  const [progress, setProgressState] = useState(() => progressApi.load());
  const [toast, setToast] = useState(null);
  const [howTo, setHowTo] = useState(false);
  const [banner, setBanner] = useState(null);
  const [reveal, setReveal] = useState({ key: null, step: 0 });
  const viewRef = useRef(view);
  const progressRef = useRef(progress);
  const music = useRef(null);
  const actionsRef = useRef(null);
  const level = flow.levelOf(content, view);

  const setView = (next) => {
    viewRef.current = next;
    setViewState(next);
  };
  const setProgress = (next) => {
    progressRef.current = next;
    setProgressState(next);
  };
  const say = (text) => setToast({ text, id: Date.now() });
  const soundOn = () => progressRef.current.sound;

  const syncMusic = (enabled) => {
    if (!music.current) {
      const track = new Audio(musicUrl);
      track.loop = true;
      track.volume = 0.28;
      music.current = track;
    }
    if (enabled) music.current.play().catch(() => {});
    else music.current.pause();
  };

  // Runs a pure flow transition, then plays the matching sound.
  const run = (transition) => {
    const before = viewRef.current;
    let next;
    try {
      next = transition(before);
    } catch (error) {
      say(error.message);
      return;
    }
    if (next === before) return;
    setView(next);
    if (next.review && next.review !== before.review) {
      playCue(OUTCOME[flow.outcome(next)].cue, soundOn());
      const r = next.review;
      if (r.enemyHeal || r.botDamage) {
        setTimeout(() => playCue(r.enemyHeal ? "heal" : "hurt", soundOn()), REVEAL_STEPS[1]);
      }
    } else if (next.pick && next.pick !== before.pick) {
      playCue("pick", soundOn());
    } else if (next.mini && before.mini && next.mini.step !== before.mini.step) {
      playCue(next.mini.kind === "defend" ? "shield" : "pick", soundOn());
    } else if (next.matchSlots !== before.matchSlots) {
      playCue("pick", soundOn());
    }
    if (next.notice) say(next.notice);
  };

  const startBattle = (fromView) => {
    const next = flow.begin(content, engine, fromView);
    if (next === fromView) return;
    setView(next);
    setBanner({ level: flow.levelOf(content, next), id: Date.now() });
    playCue("start", soundOn());
    syncMusic(soundOn());
  };

  const actions = {
    title: () => setView(flow.title()),
    map: () => {
      setView(flow.map());
      syncMusic(soundOn());
    },
    level: (id) => setView(flow.chooseLevel(content, progressRef.current, viewRef.current, id)),
    begin: () => startBattle(viewRef.current),
    answer: (id, timedOut = false) => run((v) => flow.answer(content, engine, v, id, timedOut)),
    matchPick: (id) => run((v) => flow.matchPick(content, engine, v, id)),
    mini: (kind) => {
      const before = viewRef.current;
      const next = flow.startMini(engine, before, kind);
      if (next === before) return;
      setView(next);
      playCue("start", soundOn());
    },
    miniPick: (id) => run((v) => (v.mini && v.mini.cleared.includes(id) ? v : flow.miniPick(content, engine, v, id))),
    miniTimeout: () => run((v) => flow.finishMini(content, engine, v, false)),
    continue: () => {
      const current = viewRef.current;
      if (!current.review) return;
      if (flow.finishing(current)) {
        const lv = flow.levelOf(content, current);
        setProgress(progressApi.record(progressRef.current, lv, { won: current.duel.won, playerScore: current.duel.score }));
        playCue(current.duel.won ? "win" : "lose", soundOn());
      }
      setView(flow.continueDuel(current));
    },
    next: () => {
      const lv = flow.levelOf(content, viewRef.current);
      if (lv) setView(flow.chooseLevel(content, progressRef.current, viewRef.current, lv.id + 1));
    },
    retry: () => startBattle(viewRef.current),
    sound: () => {
      const next = progressApi.setSound(progressRef.current, !progressRef.current.sound);
      setProgress(next);
      syncMusic(next.sound && viewRef.current.screen !== "title");
    },
    unlockAll: () => {
      setProgress(progressApi.unlockAll(progressRef.current));
      say("Demo mode: all levels unlocked!");
    },
    reset: () => {
      if (!window.confirm("Reset all saved Question Duel progress?")) return;
      syncMusic(false);
      setProgress(progressApi.reset());
      setView(flow.title());
      say("Progress reset.");
    },
  };
  actionsRef.current = actions;

  // Reveal sequence after every action: your move lands, then the enemy's, then the lesson.
  useEffect(() => {
    const key = view.review;
    if (!key) return undefined;
    if (reducedMotion()) {
      setReveal({ key, step: 3 });
      return undefined;
    }
    setReveal({ key, step: 0 });
    const timers = REVEAL_STEPS.map((ms, i) => setTimeout(() => setReveal({ key, step: i + 1 }), ms));
    return () => timers.forEach(clearTimeout);
  }, [view.review]);
  const step = view.review ? (reveal.key === view.review ? reveal.step : 0) : 3;
  const stepRef = useRef(step);
  stepRef.current = step;

  // Countdowns: 12 s incident alerts, 14 s repair, 12 s defense.
  const clockKey = (() => {
    if (view.screen !== "duel" || !view.duel || view.review || view.duel.status !== "active") return null;
    if (view.mini) return `mini:${view.mini.kind}:${view.duel.turn}`;
    return engine.mode(level, view.duel) === "timed" ? `timed:${view.duel.turn}` : null;
  })();
  const clock = useCountdown(clockKey, (key) => {
    if (key.startsWith("mini:")) actionsRef.current.miniTimeout();
    else actionsRef.current.answer(null, true);
  });

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!banner) return undefined;
    const t = setTimeout(() => setBanner(null), 2300);
    return () => clearTimeout(t);
  }, [banner]);

  useEffect(() => () => music.current?.pause(), []);

  // Keyboard: 1-4 cards, 1-3 minigame choices, Enter to continue, D on the map to unlock all.
  useEffect(() => {
    const onKey = (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const v = viewRef.current;
      const a = actionsRef.current;
      const lv = flow.levelOf(content, v);
      if (event.key === "Escape") {
        setHowTo(false);
        return;
      }
      if (v.screen === "map" && event.key.toLowerCase() === "d") {
        a.unlockAll();
        return;
      }
      if (v.screen !== "duel" || !lv) return;
      if (v.review && event.key === "Enter") {
        event.preventDefault();
        if (stepRef.current >= 3) a.continue();
        return;
      }
      if (v.mini && /^[1-3]$/.test(event.key)) {
        event.preventDefault();
        a.miniPick(flow.miniOptions(lv, v.mini)[Number(event.key) - 1]);
        return;
      }
      if (flow.canPlay(v) && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        const cardId = engine.hand(lv, v.duel)[Number(event.key) - 1];
        if (engine.mode(lv, v.duel) === "match") a.matchPick(cardId);
        else a.answer(cardId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const finalLevel = level && level.id === content.levels.length && (view.screen === "duel" || view.screen === "result");

  return (
    <div className={`ad${finalLevel ? " is-final" : ""}`}>
      {view.screen === "title" ? (
        <TitleScreen progress={progress} actions={actions} onHowTo={() => setHowTo(true)} />
      ) : (
        <>
          <TopBar view={view} level={level} progress={progress} actions={actions} onHowTo={() => setHowTo(true)} />
          {view.screen === "map" && <MapScreen progress={progress} actions={actions} />}
          {view.screen === "intro" && <IntroScreen level={level} actions={actions} />}
          {(view.screen === "duel" || view.screen === "result") && (
            <DuelScreen view={view} level={level} step={step} clock={clock} banner={banner} actions={actions} />
          )}
          {view.screen === "result" && <ResultScreen view={view} level={level} progress={progress} actions={actions} />}
        </>
      )}
      {howTo && <HowToOverlay onClose={() => setHowTo(false)} />}
      {toast && (
        <div className="ad-toast" role="status" key={toast.id}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function useCountdown(key, onExpire) {
  const [clock, setClock] = useState(null);
  const expire = useRef(onExpire);
  expire.current = onExpire;
  const totalFor = (k) => (k && k.startsWith("mini:heal") ? 14000 : 12000);

  useEffect(() => {
    if (!key) return undefined;
    const total = totalFor(key);
    const end = Date.now() + total;
    setClock({ key, total, left: total });
    const id = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      setClock({ key, total, left });
      if (left <= 0) {
        clearInterval(id);
        expire.current(key);
      }
    }, 100);
    return () => clearInterval(id);
  }, [key]);

  if (!key) return null;
  return clock && clock.key === key ? clock : { key, total: totalFor(key), left: totalFor(key) };
}

/* ---------- Title ---------- */

function TitleScreen({ progress, actions, onHowTo }) {
  const xp = progressApi.xp(progress);
  return (
    <main className="ad-title">
      <div className="ad-title-hero">
        <Avatar p={0} />
        <div>
          <h1 className="ad-logo">{content.title}</h1>
          <p className="ad-tagline">{content.subtitle}</p>
          <p className="ad-edition">
            A single-player AWS card duel against {content.rivalName}. Six levels, {countQuestions()} real scenarios.
          </p>
        </div>
        <Avatar p={1} />
      </div>
      <div className="ad-title-actions">
        <button type="button" className="ad-btn ad-btn-gold ad-btn-lg" onClick={actions.map}>
          <Play size={20} /> Play
        </button>
        <button type="button" className="ad-btn ad-btn-ghost" onClick={onHowTo}>
          <CircleHelp size={18} /> How to play
        </button>
        <SoundButton on={progress.sound} onToggle={actions.sound} />
      </div>
      {xp > 0 && (
        <p className="ad-title-note">
          {xp} XP earned. Level {progress.unlocked} unlocked.
        </p>
      )}
      <HowToSteps />
    </main>
  );
}

function countQuestions() {
  return content.levels.reduce((sum, lv) => sum + lv.questions.length, 0);
}

function HowToSteps() {
  return (
    <ol className="ad-steps">
      <li>
        <h3>Attack with the right service</h3>
        <p>Read the AWS problem and play the best-fit service card. A direct hit knocks 1 HP off the enemy's 7.</p>
        <div className="ad-ladder">
          <span className="tone-perfect">Best fit <b>1 dmg</b></span>
          <span className="tone-weak">Close <b>safe</b></span>
          <span className="tone-wrong">Poor <b>−2 HP</b></span>
          <span className="tone-overkill">Too slow <b>−3 HP</b></span>
        </div>
      </li>
      <li>
        <h3>Repair to heal</h3>
        <p>Connect three real AWS services in the right order within 14 seconds to restore 2 of your 12 HP. Ready again after three turns.</p>
      </li>
      <li>
        <h3>Shield to block</h3>
        <p>Counter three rapid threats within 12 seconds. Your shield then blocks 1 damage from each of the next three enemy attacks.</p>
      </li>
    </ol>
  );
}

function HowToOverlay({ onClose }) {
  return (
    <div className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-howto-title" onClick={onClose}>
      <div className="ad-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ad-icon-btn ad-modal-x" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2 id="ad-howto-title">How to play</h2>
        <HowToSteps />
        <p className="ad-map-foot">
          The enemy hits for 2 HP and repairs itself when it is low. Its accuracy rises from 35% in level one to 70% in level six.
          Keys: <span className="ad-kbd">1</span>–<span className="ad-kbd">4</span> play a card,{" "}
          <span className="ad-kbd">1</span>–<span className="ad-kbd">3</span> answer a minigame, <span className="ad-kbd">Enter</span> continues.
        </p>
      </div>
    </div>
  );
}

/* ---------- Header ---------- */

function TopBar({ view, level, progress, actions, onHowTo }) {
  return (
    <header className="ad-top">
      <button type="button" className="ad-brand ad-brand-btn" onClick={actions.title} aria-label="Back to title">
        <CompassRose size={26} />
        <span>{content.title}</span>
      </button>
      <LevelTrack current={level ? level.id : nextLevelId(progress)} progress={progress} />
      <div className="ad-meta">
        <span className="ad-round">
          <b>{progressApi.xp(progress)}</b> XP
        </span>
        <SoundButton on={progress.sound} onToggle={actions.sound} />
        <SettingsMenu view={view} actions={actions} onHowTo={onHowTo} />
      </div>
    </header>
  );
}

function nextLevelId(progress) {
  const open = content.levels.find((lv) => lv.id <= progress.unlocked && !progress.completed[String(lv.id)]);
  return open ? open.id : progress.unlocked;
}

function SoundButton({ on, onToggle }) {
  return (
    <button type="button" className="ad-icon-btn" aria-label={on ? "Mute sound and music" : "Turn sound and music on"} aria-pressed={on} onClick={onToggle}>
      {on ? <Volume2 size={19} /> : <VolumeX size={19} />}
    </button>
  );
}

function LevelTrack({ current, progress }) {
  return (
    <ol className="ad-track" aria-label="Level progress">
      {content.levels.map((lv) => {
        const done = Boolean(progress.completed[String(lv.id)]);
        const status = lv.id === current ? "current" : done ? "done" : "todo";
        const last = lv.id === content.levels.length;
        return (
          <li key={lv.id} className={`ad-track-stop is-${status}${last ? " is-last" : ""}`} aria-current={status === "current" ? "step" : undefined}>
            <span className="ad-track-marker" aria-hidden="true">
              {done && status !== "current" ? <Check size={15} strokeWidth={3} /> : lv.id > progress.unlocked ? <Lock size={13} /> : <span className="ad-track-emoji">{lv.icon}</span>}
            </span>
            <span className="ad-track-text">
              <b>{pad2(lv.id)}</b>
              {status === "current" ? ` ${lv.name}` : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SettingsMenu({ view, actions, onHowTo }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const pick = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="ad-menu" ref={ref}>
      <button type="button" className="ad-icon-btn" aria-label="Menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Settings size={19} />
      </button>
      {open && (
        <div className="ad-menu-list" role="menu">
          {view.screen !== "map" && (
            <button type="button" role="menuitem" onClick={pick(actions.map)}>
              <MapIcon size={17} /> Level map
            </button>
          )}
          <button type="button" role="menuitem" onClick={pick(onHowTo)}>
            <CircleHelp size={17} /> How to play
          </button>
          <button type="button" role="menuitem" onClick={pick(actions.title)}>
            <House size={17} /> Title screen
          </button>
          <button type="button" role="menuitem" onClick={pick(actions.reset)}>
            <RotateCcw size={17} /> Reset progress
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Level map and intro ---------- */

function MapScreen({ progress, actions }) {
  return (
    <main className="ad-map">
      <div className="ad-map-head">
        <h2>Choose your battle</h2>
        <p>Win a level to unlock the next. Each enemy aims a little better than the last.</p>
      </div>
      <ol className="ad-route">
        {content.levels.map((lv) => {
          const locked = lv.id > progress.unlocked;
          const done = Boolean(progress.completed[String(lv.id)]);
          const best = Number(progress.best[String(lv.id)]) || 0;
          const state = locked ? "is-locked" : done ? "is-done" : "is-ready";
          return (
            <li key={lv.id}>
              <button type="button" className={`ad-stop ${state}`} disabled={locked} onClick={() => actions.level(lv.id)}>
                <span className="ad-stop-no">Level {pad2(lv.id)}</span>
                <span className="ad-stop-icon" aria-hidden="true">{lv.icon}</span>
                <span className="ad-stop-name">{lv.name}</span>
                <span className="ad-stop-theme">{lv.theme}</span>
                <span className="ad-stop-enemy">
                  {lv.enemyIcon} {lv.enemy}, {engine.accuracy(lv)}% accuracy
                </span>
                <span className="ad-stop-status">
                  {locked ? (
                    <>
                      <Lock size={14} /> Locked
                    </>
                  ) : done ? (
                    <>
                      <Check size={14} /> Cleared, best {best}
                    </>
                  ) : (
                    "Ready"
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="ad-map-foot">
        Demo tip: press <span className="ad-kbd">D</span> to unlock every level.
      </p>
    </main>
  );
}

function IntroScreen({ level, actions }) {
  return (
    <main className="ad-intro">
      <section className="ad-plate ad-intro-card">
        <span className="ad-kicker">Level {pad2(level.id)}</span>
        <h2>
          {level.icon} {level.name}
        </h2>
        <p className="ad-intro-theme">{level.theme}</p>
        <p className="ad-intro-text">{level.intro}</p>
        <div className="ad-chips">
          <span className="ad-chip">You: 12 HP</span>
          <span className="ad-chip">Enemy: 7 HP</span>
          <span className="ad-chip">Best fit: 1 damage</span>
          <span className="ad-chip">Poor answer: −2 HP</span>
          {level.id >= 4 && <span className="ad-chip"><Timer size={14} /> Incident alerts</span>}
          {level.id >= 5 && <span className="ad-chip"><Layers size={14} /> Two-card builds</span>}
        </div>
        <div className="ad-intro-actions">
          <button type="button" className="ad-btn ad-btn-gold ad-btn-lg" onClick={actions.begin}>
            <Swords size={20} /> Begin battle
          </button>
          <button type="button" className="ad-btn ad-btn-ghost" onClick={actions.map}>
            <MapIcon size={18} /> Level map
          </button>
        </div>
      </section>
      <aside className="ad-intro-enemy p2">
        <div style={{ position: "relative" }}>
          <Avatar p={1} />
          <span className="ad-enemy-badge" aria-hidden="true">{level.enemyIcon}</span>
        </div>
        <h3>{level.enemy}</h3>
        <p>
          Hits for 2 HP with {engine.accuracy(level)}% accuracy, and repairs itself when it drops to 2 HP or less.
        </p>
      </aside>
    </main>
  );
}

/* ---------- Duel ---------- */

function shownHp(view, step) {
  const d = view.duel;
  if (!view.review || !view.before || step >= 3) return { player: d.playerHp, enemy: d.enemyHp };
  const b = view.before;
  const r = view.review;
  let player = b.playerHp;
  let enemy = b.enemyHp;
  if (step >= 1) {
    player = Math.max(0, player - r.wrongDamage + r.playerHeal);
    enemy -= r.hit ? 1 : 0;
  }
  if (step >= 2) {
    player = Math.max(0, player - r.botDamage);
    enemy += r.enemyHeal;
  }
  return { player, enemy };
}

function effectsFor(view, step) {
  const r = view.review;
  const fx = { player: [], enemy: [], playerHit: false, enemyHit: false, playerLunge: false, enemyLunge: false };
  if (!r || step < 1) return fx;
  const out = flow.outcome(view);
  if (out === "hit" || out === "combo") {
    fx.enemy.push({ kind: "dmg", text: "-1 HP" }, { kind: "taken", text: out === "combo" ? "COMBO!" : "HIT!" });
    fx.player.push({ kind: "crit", text: out === "combo" ? "COMBO +30" : "CRITICAL ANSWER" });
    fx.enemyHit = step < 3;
    fx.playerLunge = step === 1;
  } else if (out === "wrong" || out === "timeout") {
    fx.player.push({ kind: "dmg", text: `-${r.wrongDamage} HP` }, { kind: "taken", text: out === "timeout" ? "TOO SLOW" : "OUCH!" });
    fx.playerHit = step === 1;
  } else if (out === "close") {
    fx.player.push({ kind: "miss", text: "Close: no damage" });
  } else if (out === "repaired") {
    fx.player.push({ kind: "heal", text: `+${r.playerHeal} HP` }, { kind: "shield", text: "REPAIRED" });
  } else if (out === "shielded") {
    fx.player.push({ kind: "shield", text: "SHIELD UP ×3" });
  } else {
    fx.player.push({ kind: "miss", text: "Minigame failed" });
  }
  if (step >= 2 && r.botActed) {
    if (r.intent.kind === "heal") {
      fx.enemyLate = [{ kind: "heal", text: `+${r.enemyHeal} HP` }, { kind: "shield", text: "SELF-REPAIR" }];
    } else if (r.botHit) {
      fx.playerLate = [{ kind: "dmg", text: `-${r.botDamage} HP` }, { kind: "taken", text: r.blocked ? "BLOCKED 1" : "TAKEN!" }];
      fx.playerHit = fx.playerHit || step === 2;
      fx.enemyLunge = step === 2;
    } else {
      fx.playerLate = [{ kind: "miss", text: "Enemy missed" }];
    }
  }
  return fx;
}

function DuelScreen({ view, level, step, clock, banner, actions }) {
  const d = view.duel;
  const reviewing = Boolean(view.review && view.before);
  const basis = reviewing ? view.before : d;
  const hp = shownHp(view, step);
  const fx = effectsFor(view, step);
  const intent = reviewing ? view.review.intent : engine.intent(level, d);
  const playerBadges = [];
  if (d.shieldTurns > 0) playerBadges.push({ cls: "is-shield", Icon: ShieldCheck, text: `Shield ×${d.shieldTurns}` });
  if (d.streak > 1) playerBadges.push({ cls: "is-streak", Icon: Zap, text: `Streak ×${d.streak}` });
  playerBadges.push({ cls: "", Icon: Trophy, text: `${d.score} pts` });

  return (
    <div className="ad-game">
      <div className="ad-board">
        <Fighter
          p={0}
          name="You"
          role="Cloud Explorer"
          hp={hp.player}
          max={d.playerMaxHp}
          fx={fx.player}
          lateFx={fx.playerLate}
          fxKey={`${d.turn}-${step >= 2 ? "b" : "a"}`}
          hit={fx.playerHit}
          lunge={fx.playerLunge}
          outcome={view.screen === "result" ? (d.won ? "victory" : "defeat") : null}
          extra={
            <div className="ad-player-badges">
              {playerBadges.map((b) => (
                <span key={b.text} className={`ad-badge ${b.cls}`}>
                  <b.Icon size={13} /> {b.text}
                </span>
              ))}
            </div>
          }
        />
        <QuestionPlate view={view} level={level} basis={basis} clock={clock} banner={banner} />
        <Fighter
          p={1}
          name={level.enemy}
          role={`${content.rivalName} unit`}
          badge={level.enemyIcon}
          hp={hp.enemy}
          max={d.enemyMaxHp}
          fx={fx.enemy}
          lateFx={fx.enemyLate}
          fxKey={`${d.turn}-${step >= 2 ? "b" : "a"}`}
          hit={fx.enemyHit}
          lunge={fx.enemyLunge}
          outcome={view.screen === "result" ? (d.won ? "defeat" : "victory") : null}
          extra={
            <div className={`ad-intent${intent.kind === "heal" ? " is-heal" : ""}`}>
              <small>{reviewing ? "Enemy move" : "Next enemy move"}</small>
              <b>{intent.label}</b>
              {intent.kind === "attack" && <small>{intent.accuracy}% accuracy</small>}
            </div>
          }
        />
      </div>
      {view.screen === "duel" && (
        <div className="ad-zone">
          {view.review ? (
            <ReviewPanel view={view} level={level} step={step} onContinue={actions.continue} />
          ) : view.mini ? (
            <MiniPanel view={view} level={level} onPick={actions.miniPick} />
          ) : (
            <HandPanel view={view} level={level} actions={actions} />
          )}
        </div>
      )}
    </div>
  );
}

function Fighter({ p, name, role, badge, hp, max, fx, lateFx, fxKey, hit, lunge, outcome, extra }) {
  return (
    <section className={`ad-player p${p + 1}`} aria-label={`${name}, ${hp} of ${max} HP`}>
      <div className="ad-player-stage">
        <Avatar p={p} hit={hit} attack={lunge} outcome={outcome} />
        {badge && <span className="ad-enemy-badge" aria-hidden="true">{badge}</span>}
        {fx.length > 0 && <FloatText key={`a-${fxKey}`} items={fx} />}
        {lateFx && <FloatText key={`b-${fxKey}`} items={lateFx} late />}
      </div>
      <div className="ad-player-info">
        <div className="ad-player-id">
          <span className="ad-player-name">{name}</span>
          <span className="ad-player-role">{role}</span>
        </div>
        <HealthBar hp={hp} max={max} hit={hit} />
        {extra}
      </div>
    </section>
  );
}

function FloatText({ items, late = false }) {
  return (
    <div className={`ad-float${late ? " is-late" : ""}`} aria-hidden="true">
      {items.map((item) => (
        <span key={item.text} className={`ad-float-${item.kind}`}>
          {item.text}
        </span>
      ))}
    </div>
  );
}

function QuestionPlate({ view, level, basis, clock, banner }) {
  const mini = view.mini;
  const final = level.id === content.levels.length;
  let head;
  let prompt;
  let support;
  if (mini) {
    const heal = mini.kind === "heal";
    head = (
      <span className={`ad-plate-type${heal ? "" : " is-build"}`}>
        {heal ? <Wrench size={16} /> : <Shield size={16} />} {heal ? `Repair: ${level.repair.title}` : "Defense: counter three threats"}
      </span>
    );
    prompt = heal ? level.repair.steps[mini.step].clue : level.defense[mini.step].prompt;
    support = heal
      ? "Connect three real AWS services in order. A wrong pick ends the repair."
      : "Pick the matching service for each threat. Success blocks 1 damage from each of the next 3 attacks.";
  } else {
    const mode = engine.mode(level, basis);
    const m = MODES[mode];
    if (mode === "match") {
      const info = engine.matchPairs(level, basis);
      const slots = view.matchSlots || [null, null, null, null];
      return (
        <section className={`ad-plate ad-plate-match${final ? " is-final" : ""}`}>
          <div className="ad-plate-head">
            <span className="ad-plate-type is-match">
              <m.Icon size={16} /> {m.label}
            </span>
            <span className="ad-plate-round">
              Turn <b>{pad2(basis.turn + 1)}</b>
            </span>
          </div>
          <p className="ad-plate-support">{m.hint}</p>
          <ol className="ad-match-prompts">
            {info.questions.map((mq, i) => {
              const cardId = slots[i];
              return (
                <li key={mq.id} className={cardId ? "is-filled" : ""}>
                  <span className="ad-match-num">{i + 1}</span>
                  <span className="ad-match-text">{mq.prompt}</span>
                  <span className="ad-match-slot">
                    {cardId ? (
                      <>
                        <span aria-hidden="true">{cardOf(cardId).icon}</span> {cardOf(cardId).name}
                      </>
                    ) : (
                      "Empty"
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          {banner && banner.level && <LevelBanner key={banner.id} level={banner.level} />}
        </section>
      );
    }
    const q = engine.question(level, basis);
    head = (
      <span className={`ad-plate-type${mode === "timed" ? " is-timed" : mode === "build" ? " is-build" : ""}`}>
        <m.Icon size={16} /> {m.label}: {q.topic}
      </span>
    );
    prompt = q.prompt;
    support = m.hint;
  }
  const low = clock && clock.left <= 4000;
  return (
    <section className={`ad-plate${final ? " is-final" : ""}`}>
      <div className="ad-plate-head">
        {head}
        <span className="ad-plate-round">
          Turn <b>{pad2(basis.turn + 1)}</b>
        </span>
      </div>
      <h2 className="ad-plate-prompt">{prompt}</h2>
      <p className="ad-plate-support">{support}</p>
      {clock && (
        <div className="ad-plate-next" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="ad-plate-clock">
            <span>
              <Timer size={15} /> Time left
            </span>
            <b>{(clock.left / 1000).toFixed(1)}s</b>
          </div>
          <div className={`ad-plate-timer${low ? " is-low" : ""}`}>
            <i style={{ width: `${(clock.left / clock.total) * 100}%` }} />
          </div>
        </div>
      )}
      {banner && banner.level && <LevelBanner key={banner.id} level={banner.level} />}
    </section>
  );
}

function LevelBanner({ level }) {
  const final = level.id === content.levels.length;
  return (
    <div className={`ad-banner${final ? " is-final" : ""}`} role="status">
      <span style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">{level.icon}</span>
      <span className="ad-banner-kicker">{final ? "Final level" : `Level ${pad2(level.id)}`}</span>
      <span className="ad-banner-name">{level.name}</span>
      <span className="ad-banner-q">
        {level.enemyIcon} {level.enemy} wants a duel
      </span>
    </div>
  );
}

const fanStyle = (i, n, spread = 3, curve = 2.4) => {
  const offset = i - (n - 1) / 2;
  return { "--rot": `${offset * spread}deg`, "--lift": `${offset * offset * curve}px`, "--i": i };
};

function HandPanel({ view, level, actions }) {
  const d = view.duel;
  const hand = engine.hand(level, d);
  const mode = engine.mode(level, d);
  const building = mode === "build";
  const matching = mode === "match";
  const slots = view.matchSlots || [null, null, null, null];
  const heading = building
    ? view.pick
      ? "Now pick the supporting service"
      : "Pick the main service"
    : matching
      ? "Place each card on its prompt"
      : "Choose the best AWS service";
  const cooldown = engine.healCooldown(d);
  const full = d.playerHp >= d.playerMaxHp;

  return (
    <div className="ad-hand-zone p1" style={{ width: "100%" }}>
      <div className="ad-hand-head">
        <span className="ad-hand-who">{building ? "Two-card build" : matching ? "Match four" : "Your hand"}</span>
        <h3>{heading}</h3>
        <span className="ad-hand-count">
          Keys <span className="ad-kbd">1</span>–<span className="ad-kbd">4</span>
        </span>
      </div>
      <div className="ad-hand ad-duel-hand" role="group" aria-label="Attack cards">
        {hand.map((id, i) => {
          const slotIndex = matching ? slots.indexOf(id) : -1;
          const placed = slotIndex >= 0;
          return (
            <AwsCard
              key={`${d.turn}-${id}`}
              id={id}
              index={i}
              selected={matching ? placed : view.pick === id}
              flag={matching ? (placed ? `Q${slotIndex + 1}` : null) : view.pick === id ? "MAIN" : null}
              onPick={() => (matching ? actions.matchPick(id) : actions.answer(id))}
              style={fanStyle(i, hand.length)}
            />
          );
        })}
      </div>
      <div className="ad-actions">
        <span className="ad-actions-label">Or spend this turn on a minigame</span>
        <button type="button" className="ad-action is-heal" disabled={!engine.canHeal(d)} onClick={() => actions.mini("heal")}>
          <Wrench size={24} />
          <span>
            <b>Repair</b>
            <small>{full ? "HP is full" : cooldown ? `Ready in ${plural(cooldown, "turn")}` : "+2 HP, 14 seconds"}</small>
          </span>
        </button>

        <button type="button" className="ad-action is-shield" disabled={!engine.canDefend(d)} onClick={() => actions.mini("defend")}>
          <Shield size={24} />
          <span>
            <b>Shield</b>
            <small>{d.shieldTurns ? `Active for ${plural(d.shieldTurns, "more attack")}` : "Block 3 attacks, 12 seconds"}</small>
          </span>
        </button>
      </div>
    </div>
  );
}

function MiniPanel({ view, level, onPick }) {
  const mini = view.mini;
  const heal = mini.kind === "heal";
  const options = flow.miniOptions(level, mini);
  const labels = heal ? level.repair.steps.map((s) => cardOf(s.id).name) : ["Threat 1", "Threat 2", "Threat 3"];
  return (
    <div className={`ad-mini ${heal ? "p1" : "p2"}`}>
      <div className="ad-mini-head">
        <span className="ad-hand-who">{heal ? "Repair minigame" : "Defense minigame"}</span>
        <h3>{heal ? `Step ${mini.step + 1} of 3` : `Threat ${mini.step + 1} of 3`}</h3>
      </div>
      <div className="ad-mini-steps" aria-label="Minigame progress">
        {labels.map((label, i) => (
          <span key={label} className={`ad-mini-step${i < mini.step ? " is-done" : i === mini.step ? " is-now" : ""}`}>
            {i < mini.step ? <Check size={13} /> : null} {heal && i >= mini.step ? `Step ${i + 1}` : label}
          </span>
        ))}
      </div>
      <div className="ad-hand" role="group" aria-label="Minigame choices">
        {options.map((id, i) => {
          const done = mini.cleared.includes(id);
          return (
            <AwsCard
              key={`${mini.kind}-${mini.step}-${id}`}
              id={id}
              index={i}
              disabled={done}
              done={done}
              flag={done ? "DONE" : null}
              onPick={() => onPick(id)}
              style={fanStyle(i, options.length, 2, 2)}
            />
          );
        })}
      </div>
      <p className="ad-hand-hint">
        Keys <span className="ad-kbd">1</span>–<span className="ad-kbd">3</span>. {heal ? "Restores 2 HP when all three steps are right." : "Raises a shield when all three threats are countered."}
      </p>
    </div>
  );
}

function ReviewPanel({ view, level, step, onContinue }) {
  const r = view.review;
  const d = view.duel;
  const out = flow.outcome(view);
  const meta = OUTCOME[out];
  const q = r.kind === "attack" ? level.questions[r.questionIndex] : null;
  const best = r.bestId ? cardOf(r.bestId) : null;
  const support = r.supportId ? cardOf(r.supportId) : null;
  const finishing = flow.finishing(view);

  let why;
  let extra = null;
  if (r.kind === "attack") {
    why = q.why;
    if (!r.hit) {
      extra = (
        <p className="ad-review-best">
          Best answer: <b>{best.name}</b>. {best.tip}
        </p>
      );
    } else if (r.mode === "build") {
      extra = (
        <p className="ad-review-best">
          {r.combo ? (
            <>
              <b>{support.name}</b> was the right partner: +30 combo.
            </>
          ) : (
            <>
              Right main service. The ideal partner was <b>{cardOf(q.support).name}</b>.
            </>
          )}
        </p>
      );
    }
  } else if (r.kind === "heal") {
    why = r.success ? `You rebuilt "${level.repair.title}" and restored ${r.playerHeal} HP.` : r.failureDetail;
  } else if (r.kind === "match") {
    why = r.matchCorrect === 4 ? "All four services matched their prompts." : `${r.matchCorrect} of 4 matched.`;
    const misses = r.matchIds
      .map((qid, i) => ({ mq: level.questions.find((item) => item.id === qid), got: r.matchAnswers[i] }))
      .filter(({ mq, got }) => got !== mq.best);
    if (misses.length) {
      extra = (
        <p className="ad-review-best">
          {misses.map(({ mq, got }) => (
            <span key={mq.id} className="ad-match-fix">
              &ldquo;{mq.prompt}&rdquo; needed <b>{cardOf(mq.best).name}</b>, not {cardOf(got).name}.
            </span>
          ))}
        </p>
      );
    }
  } else {
    why = r.success ? "Shield raised: it blocks 1 damage from each of the next 3 enemy attacks." : r.failureDetail;
  }

  let enemyLine;
  let enemyBad = false;
  if (!r.botActed) enemyLine = d.won ? `${level.enemy} is offline. You win!` : "You are out of HP.";
  else if (r.intent.kind === "heal") enemyLine = `${level.enemy} repaired itself: +${r.enemyHeal} HP.`;
  else if (r.botHit) {
    enemyBad = true;
    enemyLine = `${level.enemy} hit you for ${r.botDamage} HP${r.blocked ? ". Your shield blocked 1." : "."}`;
  } else enemyLine = `${level.enemy} attacked and missed.`;

  const docs = best && best.docs;

  return (
    <div className="ad-review">
      <div className="ad-review-cards">
        {r.kind === "attack" ? (
          r.timedOut ? (
            <div className={`ad-action-card tone-${meta.tone}`}>
              <Timer size={64} />
              <span className="ad-stamp">{meta.stamp}</span>
            </div>
          ) : (
            <>
              <AwsCard id={r.answerId} stamp={meta.stamp} tone={meta.tone} className="is-reveal" />
              {support && <AwsCard id={r.supportId} className="is-support" />}
            </>
          )
        ) : (
          <div className={`ad-action-card tone-${meta.tone}`}>
            {r.kind === "heal" ? <Wrench size={64} /> : r.kind === "match" ? <Puzzle size={64} /> : <Shield size={64} />}
            <span className="ad-stamp">{meta.stamp}</span>
          </div>
        )}
      </div>
      <div className={`ad-review-copy tone-${meta.tone}${step >= 1 ? " is-shown" : ""}`} aria-live="polite">
        <p className="ad-review-head">{meta.headline}</p>
        <p className="ad-review-why">{why}</p>
        {extra}
        {docs && (
          <a className="ad-docs" href={docs} target="_blank" rel="noreferrer">
            Read about {best.name} in the AWS docs <ExternalLink size={14} />
          </a>
        )}
        <p className={`ad-review-enemy${step >= 2 ? " is-shown" : ""}${enemyBad ? " is-bad" : ""}`}>
          <span aria-hidden="true">{level.enemyIcon}</span> {enemyLine}
        </p>
      </div>
      <div className="ad-review-side">
        <button type="button" className="ad-btn ad-btn-gold ad-btn-lg" onClick={onContinue} disabled={step < 3}>
          {finishing ? "See result" : "Next turn"}
        </button>
        <small>
          or press <span className="ad-kbd">Enter</span>
        </small>
      </div>
    </div>
  );
}

/* ---------- Result ---------- */

function ResultScreen({ view, level, progress, actions }) {
  const d = view.duel;
  const won = d.won;
  const stars = engine.stars(level, d);
  const best = Math.max(Number(progress.best[String(level.id)]) || 0, d.score);
  const hasNext = won && level.id < content.levels.length;
  const misses = d.history.filter((h) => h.kind === "attack" && !h.hit && h.questionIndex !== null);
  const seen = new Set();
  const recap = misses.filter((h) => (seen.has(h.questionIndex) ? false : seen.add(h.questionIndex))).slice(0, 5);

  return (
    <div className="ad-end" role="dialog" aria-modal="true" aria-labelledby="ad-end-title">
      <div className="ad-end-inner">
        <div className="ad-end-hero">
          <Avatar p={0} outcome={won ? "victory" : "defeat"} />
          <div className="ad-end-headline">
            <Trophy size={30} />
            <h2 id="ad-end-title">{won ? "Victory" : "Defeated"}</h2>
            <p>{won ? `${level.enemy} is offline. ${level.name} cleared.` : `${level.enemy} won this round. Repair and shield can turn it around.`}</p>
            {won && (
              <div className="ad-stars" aria-label={`${stars} of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} className={n <= stars ? "" : "is-off"} fill={n <= stars ? "currentColor" : "none"} />
                ))}
              </div>
            )}
          </div>
          <Avatar p={1} outcome={won ? "defeat" : "victory"} />
        </div>

        <div className="ad-end-grid">
          <div className="ad-end-cell"><b>{d.score}</b><small>Score</small></div>
          <div className="ad-end-cell"><b>{d.hits}</b><small>Direct hits</small></div>
          <div className="ad-end-cell"><b>{d.turn}</b><small>Turns</small></div>
          <div className="ad-end-cell"><b>{d.playerHp}/{d.playerMaxHp}</b><small>HP left</small></div>
          <div className="ad-end-cell"><b>{best}</b><small>Best score</small></div>
        </div>

        {recap.length > 0 && (
          <div className="ad-recap">
            <h3>Worth another look</h3>
            <ul>
              {recap.map((h) => {
                const q = level.questions[h.questionIndex];
                return (
                  <li key={q.id}>
                    {q.prompt} <b>{cardOf(q.best).name}</b>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="ad-end-actions">
          {hasNext && (
            <button type="button" className="ad-btn ad-btn-gold ad-btn-lg" onClick={actions.next}>
              <Sparkles size={19} /> Next level
            </button>
          )}
          <button type="button" className={`ad-btn ${hasNext ? "ad-btn-ghost" : "ad-btn-gold ad-btn-lg"}`} onClick={actions.retry}>
            <RotateCcw size={18} /> Retry
          </button>
          <button type="button" className="ad-btn ad-btn-ghost" onClick={actions.map}>
            <MapIcon size={18} /> Level map
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Shared pieces ---------- */

function AwsCard({ id, index = null, selected = false, flag = null, onPick, disabled = false, done = false, stamp = null, tone = null, style, className = "" }) {
  const card = cardOf(id);
  if (!card) return null;
  const type = TYPES[card.type] || TYPES.physical;
  const Tag = onPick ? "button" : "div";
  const size = card.name.length > 18 ? " is-xl" : card.name.length > 11 ? " is-long" : "";
  const classes = ["ad-card", selected && "is-selected", done && "is-done", stamp && `is-stamped tone-${tone}`, className].filter(Boolean).join(" ");
  return (
    <Tag
      type={onPick ? "button" : undefined}
      className={classes}
      style={{ ...style, "--tint": type.tint }}
      onClick={onPick}
      disabled={onPick ? disabled : undefined}
      aria-pressed={onPick ? selected : undefined}
      aria-label={onPick ? `${index !== null ? `${index + 1}: ` : ""}${card.name}, ${type.label}` : undefined}
      title={card.tip}
    >
      {flag && <span className="ad-card-flag">{flag}</span>}
      <span className="ad-card-inner">
        <span className="ad-card-face ad-card-front">
          <span className="ad-card-top">
            <type.Icon size={11} strokeWidth={2.5} />
            {type.label}
            {index !== null && <span className="ad-card-key">{index + 1}</span>}
          </span>
          <span className="ad-card-art">
            <span className="ad-card-emoji" aria-hidden="true">{card.icon}</span>
          </span>
          <span className={`ad-card-name${size}`}>{card.name}</span>
        </span>
        <span className="ad-card-face ad-card-back p1">
          <CompassRose size={54} />
        </span>
      </span>
      {stamp && <span className="ad-stamp">{stamp}</span>}
    </Tag>
  );
}

function HealthBar({ hp, max, hit }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const tone = pct > 50 ? "ok" : pct > 25 ? "warn" : "crit";
  return (
    <div className={`ad-hp hp-${tone}${hit ? " is-hit" : ""}`} style={{ "--segs": max }}>
      <div className="ad-hp-row">
        <span className="ad-hp-label">HP</span>
        <span className="ad-hp-num">
          <b>{hp}</b>/{max}
        </span>
      </div>
      <div className="ad-hp-track" role="meter" aria-label="Health" aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}>
        <div className="ad-hp-lag" style={{ width: `${pct}%` }} />
        <div className="ad-hp-fill" style={{ width: `${pct}%` }} />
        <div className="ad-hp-scale" />
      </div>
    </div>
  );
}

function Avatar({ p, hit = false, attack = false, outcome = null }) {
  const classes = ["ad-avatar", `p${p + 1}`, attack && "is-attack", outcome && `is-${outcome}`].filter(Boolean).join(" ");
  const eyes = outcome === "defeat" ? "x" : outcome === "victory" ? "happy" : hit ? "hurt" : "open";
  const Bot = p === 0 ? ExplorerBot : RivalBot;
  return (
    <div className={classes}>
      <span className="ad-avatar-base" />
      <div className="ad-avatar-bob">
        <div className={`ad-avatar-body${hit ? " is-hit" : ""}`}>
          <Bot eyes={eyes} />
        </div>
      </div>
    </div>
  );
}

function Eyes({ kind, color, left, right, cy }) {
  if (kind === "x") {
    return (
      <g stroke={color} strokeWidth="2.6" strokeLinecap="round">
        {[left, right].map((x) => (
          <path key={x} d={`M${x - 3.5} ${cy - 3.5} L${x + 3.5} ${cy + 3.5} M${x + 3.5} ${cy - 3.5} L${x - 3.5} ${cy + 3.5}`} />
        ))}
      </g>
    );
  }
  if (kind === "happy") {
    return (
      <g stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none">
        {[left, right].map((x) => (
          <path key={x} d={`M${x - 4} ${cy + 2} Q${x} ${cy - 5} ${x + 4} ${cy + 2}`} />
        ))}
      </g>
    );
  }
  if (kind === "hurt") {
    return (
      <g stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={`M${left - 4} ${cy - 3.5} L${left + 3} ${cy} L${left - 4} ${cy + 3.5}`} />
        <path d={`M${right + 4} ${cy - 3.5} L${right - 3} ${cy} L${right + 4} ${cy + 3.5}`} />
      </g>
    );
  }
  return (
    <g className="ad-eyes">
      {[left, right].map((x) => (
        <rect key={x} x={x - 3.5} y={cy - 4.5} width="7" height="9" rx="3.5" fill={color} />
      ))}
    </g>
  );
}

// Globe-headed bots: you are the Explorer (pith helmet), the enemy wears a captain's cap.
function ExplorerBot({ eyes }) {
  return (
    <svg className="ad-bot" viewBox="0 0 120 130" aria-hidden="true">
      <defs>
        <linearGradient id="adP1Suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF9A6E" />
          <stop offset="1" stopColor="#DD5530" />
        </linearGradient>
      </defs>
      <rect x="45" y="100" width="11" height="18" rx="5" fill="#16324D" />
      <rect x="64" y="100" width="11" height="18" rx="5" fill="#16324D" />
      <rect x="20" y="76" width="13" height="27" rx="6.5" fill="url(#adP1Suit)" />
      <rect x="87" y="76" width="13" height="27" rx="6.5" fill="url(#adP1Suit)" />
      <rect x="31" y="70" width="58" height="40" rx="17" fill="url(#adP1Suit)" />
      <path d="M39 74 L80 106" stroke="#8A3218" strokeWidth="5" strokeLinecap="round" opacity=".45" />
      <circle cx="60" cy="89" r="8" fill="#F6C548" stroke="#8A3218" strokeWidth="2" />
      <path d="M60 83 L62.4 89 L60 95 L57.6 89 Z" fill="#8A3218" />
      <circle cx="60" cy="47" r="27" fill="#EDE6D3" />
      <g stroke="#BDB295" strokeWidth="1.2" fill="none">
        <ellipse cx="60" cy="47" rx="12" ry="27" />
        <path d="M33 47 H87 M37 35 Q60 42 83 35 M37 59 Q60 52 83 59" />
      </g>
      <rect x="37" y="40" width="46" height="20" rx="10" fill="#0D2238" />
      <Eyes kind={eyes} color="#FFB08C" left={49.5} right={70.5} cy={50} />
      <ellipse cx="60" cy="27" rx="37" ry="7.5" fill="#B8904F" />
      <path d="M33 27 Q35 4 60 4 Q85 4 87 27 Z" fill="#DDB872" />
      <rect x="33.5" y="21" width="53" height="5" fill="#8F6A33" />
    </svg>
  );
}

function RivalBot({ eyes }) {
  return (
    <svg className="ad-bot" viewBox="0 0 120 130" aria-hidden="true">
      <defs>
        <linearGradient id="adP2Suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#86DCFF" />
          <stop offset="1" stopColor="#2B8FC8" />
        </linearGradient>
      </defs>
      <rect x="45" y="100" width="11" height="18" rx="5" fill="#16324D" />
      <rect x="64" y="100" width="11" height="18" rx="5" fill="#16324D" />
      <rect x="20" y="76" width="13" height="27" rx="6.5" fill="url(#adP2Suit)" />
      <rect x="87" y="76" width="13" height="27" rx="6.5" fill="url(#adP2Suit)" />
      <rect x="31" y="70" width="58" height="40" rx="17" fill="url(#adP2Suit)" />
      <path d="M49 84 L60 92 L71 84 M49 93 L60 101 L71 93" stroke="#0D2238" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".75" />
      <line x1="76" y1="26" x2="88" y2="8" stroke="#0D2238" strokeWidth="3" strokeLinecap="round" />
      <circle className="ad-antenna" cx="89" cy="7" r="4.5" fill="#56C7F5" />
      <circle cx="60" cy="47" r="27" fill="#E3ECEF" />
      <g stroke="#A9BCC4" strokeWidth="1.2" fill="none">
        <ellipse cx="60" cy="47" rx="12" ry="27" />
        <path d="M33 47 H87 M37 35 Q60 42 83 35 M37 59 Q60 52 83 59" />
      </g>
      <rect x="37" y="40" width="46" height="20" rx="10" fill="#0D2238" />
      <Eyes kind={eyes} color="#9BE7FF" left={49.5} right={70.5} cy={50} />
      <path d="M35 30 Q37 11 60 11 Q83 11 85 30 Z" fill="#12344F" />
      <rect x="34" y="25" width="52" height="6" rx="3" fill="#F6C548" />
      <path d="M34 31 Q52 38 72 31 L70 36 Q50 43 32 35 Z" fill="#0A1E30" />
    </svg>
  );
}

function CompassRose({ size = 44 }) {
  return (
    <svg className="ad-rose" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".55" />
      <circle cx="24" cy="24" r="12.5" fill="none" stroke="currentColor" strokeWidth=".9" opacity=".35" />
      <path d="M24 2.5 L27.6 24 L24 45.5 L20.4 24 Z" fill="currentColor" />
      <path d="M2.5 24 L24 20.4 L45.5 24 L24 27.6 Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}
