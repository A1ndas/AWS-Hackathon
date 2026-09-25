/*
  ATLAS DUEL: frontend demo of a two-player educational strategy card game.
  Geography edition. No backend, no accounts, no networking: local hot-seat play.

  How this file is organised
    1. CONTENT  Levels, cards, questions, answer grades, damage. Pure data.
                Swap this section to re-skin the game (e.g. AWS storage).
    2. ENGINE   Dealing, grading, round resolution, the match reducer. No UI.
    3. UI       React components. They read state and dispatch actions only.
    4. STYLES   One CSS string, injected by the root component.
*/
import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  AlertTriangle,
  Castle,
  Check,
  Compass,
  Crown,
  Eye,
  Flag,
  Globe,
  HelpCircle,
  Home,
  Info,
  Landmark,
  Layers,
  Lock,
  Map as MapIcon,
  MapPin,
  Mountain,
  Navigation,
  RotateCcw,
  Scale,
  Settings,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  X,
} from "lucide-react";

/* ==========================================================================
   1. CONTENT
   ========================================================================== */

const GAME = {
  title: "Atlas Duel",
  edition: "Geography edition",
  tagline: "Seven cards. Seven questions. Spend them wisely.",
  startHp: 100,
};

// Damage dealt to the OPPONENT for each answer quality.
// Tuned for 100 HP: the best possible hand deals exactly 100, so a knockout
// can only happen on the final question, and only after a flawless game.
const DAMAGE = { perfect: 15, good: 10, weak: 5, wrong: 0, overkill: 0 };

const QUALITY = {
  perfect: { label: "Perfect", stamp: "PERFECT", headline: "CORRECT" },
  good: { label: "Good", stamp: "GOOD", headline: "CORRECT, BUT NOT THE BEST" },
  weak: { label: "Weak", stamp: "WEAK", headline: "VALID, BUT NOT IDEAL" },
  wrong: { label: "Wrong", stamp: "WRONG", headline: "WRONG ANSWER" },
  overkill: { label: "Overkill", stamp: "OVERKILL", headline: "OVERKILL!" },
};
const QUALITY_ORDER = ["perfect", "good", "weak", "wrong", "overkill"];

// Progression ladder. The AWS version keeps this exact structure:
// USB, HDD, SSD, Data centre, Cloud.
const LEVELS = [
  { id: 1, name: "Discovery", question: "Where on the map?", icon: "compass" },
  { id: 2, name: "Exploration", question: "What's inside the borders?", icon: "map" },
  { id: 3, name: "Navigation", question: "Where do the borders meet?", icon: "navigation" },
  { id: 4, name: "Expedition", question: "How big is big?", icon: "mountain" },
  { id: 5, name: "World", question: "How does it all compare?", icon: "globe" },
];

const QUESTION_TYPES = {
  location: { label: "Location", icon: "pin" },
  concept: { label: "Geography concept", icon: "layers" },
  trap: { label: "Trap question", icon: "alert" },
  landmark: { label: "Landmark", icon: "landmark" },
  bestfit: { label: "Best fit", icon: "target" },
  fact: { label: "Direct fact", icon: "info" },
  comparative: { label: "Comparative", icon: "scale" },
};

const REGIONS = {
  europe: { label: "Europe", tint: "#6F95D6" },
  africa: { label: "Africa", tint: "#D3A04A" },
  asia: { label: "Asia", tint: "#C47C92" },
  eurasia: { label: "Europe and Asia", tint: "#9C88BC" },
  northAmerica: { label: "North America", tint: "#58AC7B" },
  southAmerica: { label: "South America", tint: "#36A596" },
  oceania: { label: "Oceania", tint: "#8F84D3" },
};

// The card pool. `coords` are the capital's coordinates, `fact` is the
// fallback explanation shown when a card doesn't fit a question.
const CARDS = [
  { id: "spain", name: "Spain", kind: "country", region: "europe", code: "ES", coords: "40°N 4°W", fact: "Spain covers most of the Iberian Peninsula. Madrid is its capital and biggest city." },
  { id: "portugal", name: "Portugal", kind: "country", region: "europe", code: "PT", coords: "39°N 9°W", fact: "Portugal lines the Atlantic edge of Iberia. Its only land neighbour is Spain." },
  { id: "lesotho", name: "Lesotho", kind: "country", region: "africa", code: "LS", coords: "29°S 27°E", fact: "Lesotho is a mountain kingdom, completely surrounded by South Africa." },
  { id: "vatican", name: "Vatican City", kind: "microstate", region: "europe", code: "VA", coords: "42°N 12°E", fact: "Vatican City is the world's smallest country: a city-state inside Rome." },
  { id: "sanmarino", name: "San Marino", kind: "microstate", region: "europe", code: "SM", coords: "44°N 12°E", fact: "San Marino claims to be the world's oldest republic, and sits entirely inside Italy." },
  { id: "australia", name: "Australia", kind: "country", region: "oceania", code: "AU", coords: "35°S 149°E", fact: "Australia is an island continent with no land borders. Its capital is Canberra." },
  { id: "switzerland", name: "Switzerland", kind: "country", region: "europe", code: "CH", coords: "47°N 7°E", fact: "Switzerland is a landlocked Alpine country with five neighbours." },
  { id: "turkey", name: "Türkiye", kind: "country", region: "eurasia", code: "TR", coords: "40°N 33°E", fact: "Türkiye spans Europe and Asia. Its capital is Ankara, but Istanbul is far bigger." },
  { id: "canada", name: "Canada", kind: "country", region: "northAmerica", code: "CA", coords: "45°N 76°W", fact: "Canada is the world's second-largest country, with coastline on three oceans." },
  { id: "usa", name: "United States", kind: "country", region: "northAmerica", code: "US", coords: "39°N 77°W", fact: "The United States has about 340 million people and borders Canada and Mexico." },
  { id: "brazil", name: "Brazil", kind: "country", region: "southAmerica", code: "BR", coords: "16°S 48°W", fact: "Brazil is South America's giant: the most people and most of the Amazon." },
  { id: "peru", name: "Peru", kind: "country", region: "southAmerica", code: "PE", coords: "12°S 77°W", fact: "Peru is home to Machu Picchu and the source of the Amazon River." },
  { id: "india", name: "India", kind: "country", region: "asia", code: "IN", coords: "29°N 77°E", fact: "India became the world's most populous country in 2023, with over 1.4 billion people." },
  { id: "china", name: "China", kind: "country", region: "asia", code: "CN", coords: "40°N 116°E", fact: "China has over 1.4 billion people and borders 14 countries." },
];

// Grade helpers keep the question table readable.
const grade = (quality) => (note = null) => ({ quality, note });
const perfect = grade("perfect");
const good = grade("good");
const weak = grade("weak");
const wrong = grade("wrong");
const overkill = grade("overkill");

// Seven questions, one per round. Any card not listed in `answers` is wrong
// and falls back to its `fact`. `lesson` is the teaching line after a round.
const QUESTIONS = [
  {
    id: "iberia",
    level: 1,
    type: "location",
    prompt: "Which country sits on the Iberian Peninsula?",
    support: "Europe's south-west corner, walled off from France by the Pyrenees.",
    idealLabel: "Spain or Portugal",
    lesson: "Spain and Portugal share the Iberian Peninsula. Spain covers about 85% of it and Portugal holds the Atlantic side.",
    answers: {
      spain: perfect("Spain covers about 85% of the peninsula."),
      portugal: perfect("Portugal fills the peninsula's Atlantic side."),
      brazil: wrong("Brazil speaks Portuguese, but it's an ocean away from Iberia."),
      peru: wrong("Spanish is spoken in Peru, but Peru is in South America, not Iberia."),
    },
  },
  {
    id: "enclave",
    level: 2,
    type: "concept",
    prompt: "Which country is completely surrounded by just one other country?",
    support: "Only three countries on Earth are fully enclosed by a single neighbour.",
    idealLabel: "Lesotho, Vatican City or San Marino",
    lesson: "Lesotho sits inside South Africa, and Vatican City and San Marino both sit inside Italy. No other countries are enclosed by one neighbour.",
    answers: {
      lesotho: perfect("Lesotho sits entirely inside South Africa."),
      vatican: perfect("Vatican City sits entirely inside Rome, Italy."),
      sanmarino: perfect("San Marino sits entirely inside Italy."),
      switzerland: weak("Landlocked, yes. But Switzerland has five neighbours, not one."),
      portugal: weak("Portugal borders only Spain, but its whole west side is Atlantic coast."),
      canada: weak("Canada has just one land neighbour, but coastline on three oceans."),
      brazil: wrong("Brazil borders ten countries. About as un-surrounded as it gets."),
      china: wrong("China borders 14 countries, tied for the most on Earth."),
      australia: wrong("Australia has no land borders at all. It's an island continent."),
      usa: wrong("The US has two land neighbours and two long ocean coasts."),
    },
  },
  {
    id: "capitals",
    level: 2,
    type: "trap",
    prompt: "In which country is the capital NOT the biggest city?",
    support: "Careful: it's tempting to assume a capital is always the biggest city.",
    idealLabel: "Australia, Canada, Brazil and more",
    lesson: "Plenty of capitals aren't the biggest city. Canberra, Ottawa, Brasília and Washington, D.C. were picked or purpose-built as capitals, so bigger cities grew elsewhere.",
    answers: {
      australia: perfect("Canberra is the capital. Sydney is far bigger."),
      switzerland: perfect("Bern is the capital. Zurich is bigger."),
      turkey: perfect("Ankara is the capital. Istanbul is far bigger."),
      canada: perfect("Ottawa is the capital. Toronto is bigger."),
      usa: perfect("Washington, D.C. is the capital. New York City is far bigger."),
      brazil: perfect("Brasília is the capital. São Paulo is far bigger."),
      china: perfect("Beijing is the capital. Shanghai is bigger."),
      sanmarino: perfect("Surprise: the City of San Marino is tiny. Serravalle is the biggest town."),
      india: weak("Contested. Delhi, home of New Delhi, versus Mumbai depends on how you count."),
      spain: wrong("Madrid is both the capital and the biggest city."),
      portugal: wrong("Lisbon is both the capital and the biggest city."),
      peru: wrong("Lima is the capital and by far the biggest city."),
      lesotho: wrong("Maseru is both the capital and the biggest city."),
      vatican: wrong("Vatican City is a city-state. The whole country is one city."),
    },
  },
  {
    id: "niagara",
    level: 3,
    type: "landmark",
    prompt: "Niagara Falls straddles the border of two countries. Name one of them.",
    support: "Three waterfalls on the Niagara River, between Lake Erie and Lake Ontario.",
    idealLabel: "Canada or the United States",
    lesson: "Niagara Falls sits right on the Canada–US border. The Horseshoe Falls are mostly Canadian, and the American Falls are in New York State.",
    answers: {
      canada: perfect("Most of the giant Horseshoe Falls is on Canada's side."),
      usa: perfect("The American Falls are in New York State."),
      brazil: wrong("Brazil's famous falls are Iguazu, on the border with Argentina."),
    },
  },
  {
    id: "amazon",
    level: 4,
    type: "bestfit",
    prompt: "Which country holds the biggest share of the Amazon rainforest?",
    support: "The rainforest stretches across nine countries and territories.",
    idealLabel: "Brazil",
    lesson: "Brazil holds roughly 60% of the Amazon rainforest, more than every other country combined.",
    answers: {
      brazil: perfect("Brazil holds about 60% of the rainforest."),
      peru: good("Peru has the second-biggest share, about 13%, and the river's source. Brazil holds about 60%."),
    },
  },
  {
    id: "sa-population",
    level: 4,
    type: "fact",
    prompt: "Which country has the largest population in South America?",
    support: "About 430 million people live in South America.",
    idealLabel: "Brazil",
    lesson: "Brazil has over 200 million people, close to half of everyone in South America.",
    answers: {
      brazil: perfect("Over 200 million people, close to half the continent."),
      peru: weak("Right continent, but Peru has about 34 million people. Brazil has over 200 million."),
      india: overkill("India has about 1.4 billion people, more than three South Americas. Wrong continent, massive overkill."),
      china: overkill("China has about 1.4 billion people, more than three South Americas. Wrong continent, massive overkill."),
      usa: wrong("The US has about 340 million people, but it's in North America."),
    },
  },
  {
    id: "eu-population",
    level: 5,
    type: "comparative",
    prompt: "Which country has more people than the entire European Union?",
    support: "The EU's 27 member countries add up to about 450 million people.",
    idealLabel: "India or China",
    lesson: "India and China each have over 1.4 billion people, more than three times the whole EU.",
    answers: {
      india: perfect("About 1.45 billion people, more than three EUs."),
      china: perfect("About 1.4 billion people, more than three EUs."),
      usa: weak("The world's third most populous country, but about 340 million is short of the EU's 450 million."),
      brazil: wrong("Over 200 million people, still less than half the EU."),
      vatican: wrong("Vatican City has fewer than 1,000 residents. Bold choice."),
      sanmarino: wrong("San Marino has about 34,000 people. The EU has about 450 million."),
    },
  },
];

// Balanced dealing. Each hand takes one random card from every slot, so any
// deal has a perfect card for every question. Brazil is the only perfect card
// for BOTH rounds 5 and 6, and Peru is its "good" stand-in on round 5, so the
// best possible hand always deals exactly 100 damage. Spending Brazil early,
// or spending Canada/USA before Niagara, is where the strategy bites.
const DEAL_SLOTS = [
  ["spain", "portugal"],
  ["lesotho", "vatican", "sanmarino"],
  ["australia", "switzerland", "turkey"],
  ["canada", "usa"],
  ["brazil"],
  ["peru"],
  ["india", "china"],
];

/* ==========================================================================
   2. ENGINE
   ========================================================================== */

const CARD_BY_ID = Object.fromEntries(CARDS.map((card, i) => [card.id, { ...card, number: i + 1 }]));
const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((level) => [level.id, level]));
const cardName = (id) => CARD_BY_ID[id]?.name ?? id;
const pad2 = (n) => String(n).padStart(2, "0");

const PHASE = { HANDOFF: "handoff", SELECT: "select", READY: "ready", REVEAL: "reveal" };

function getAnswer(question, cardId) {
  return question.answers[cardId] ?? { quality: "wrong", note: null };
}

const isPerfect = (question, cardId) => getAnswer(question, cardId).quality === "perfect";

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dealHand(slots = DEAL_SLOTS) {
  return shuffle(slots.map((slot) => slot[Math.floor(Math.random() * slot.length)]));
}

// Best total damage a hand can deal if every card is spent on the right
// question. Tiny DP over (question index, used-card bitmask).
function maxDamageForHand(hand, questions = QUESTIONS) {
  const memo = new Map();
  const best = (qi, usedMask) => {
    if (qi === questions.length) return 0;
    const key = qi * 4096 + usedMask;
    if (memo.has(key)) return memo.get(key);
    let top = 0;
    hand.forEach((cardId, i) => {
      if (usedMask & (1 << i)) return;
      const dmg = DAMAGE[getAnswer(questions[qi], cardId).quality];
      top = Math.max(top, dmg + best(qi + 1, usedMask | (1 << i)));
    });
    memo.set(key, top);
    return top;
  };
  return best(0, 0);
}

const remainingCards = (state, p) => state.hands[p].filter((id) => state.used[p][id] === undefined);

// The line that makes the resource mechanic visible: did you save a card,
// burn one too early, or miss one you were holding?
function strategyNote(state, p, cardId) {
  const { hands, used, history, round } = state;
  const question = QUESTIONS[round];

  if (isPerfect(question, cardId)) {
    const passedOver = history.find(
      (h) => h.picks[p] !== cardId && isPerfect(QUESTIONS[h.round], cardId),
    );
    return passedOver
      ? { kind: "saved", text: `Held since round ${passedOver.round + 1}, and it paid off.` }
      : null;
  }

  const perfectCards = hands[p].filter((id) => isPerfect(question, id));
  const stillHeld = perfectCards.filter((id) => id !== cardId && used[p][id] === undefined);
  if (stillHeld.length) {
    const id = stillHeld[0];
    const neededLater = QUESTIONS.slice(round + 1).some((q) => isPerfect(q, id));
    return neededLater
      ? { kind: "held", text: `You held back ${cardName(id)}, which was perfect here. Saving it for later?` }
      : { kind: "missed", text: `${cardName(id)} was in your hand, and it was the perfect card.` };
  }

  const spent = perfectCards
    .filter((id) => used[p][id] !== undefined)
    .sort((a, b) => used[p][a] - used[p][b]);
  if (spent.length) {
    const id = spent[spent.length - 1];
    return { kind: "spent", text: `${cardName(id)} was perfect here, but you spent it in round ${used[p][id] + 1}.` };
  }
  return { kind: "none", text: "No perfect card for this one in your hand this game." };
}

function resolveRound(state) {
  const question = QUESTIONS[state.round];
  const results = state.picks.map((cardId, p) => {
    const { quality, note } = getAnswer(question, cardId);
    return { cardId, quality, damage: DAMAGE[quality], note, strategy: strategyNote(state, p, cardId) };
  });
  return { round: state.round, picks: [...state.picks], results };
}

function matchOutcome({ hp, history, maxDamage }) {
  const dealt = [0, 1].map((p) => history.reduce((sum, h) => sum + h.results[p].damage, 0));
  const perfects = [0, 1].map((p) => history.filter((h) => h.results[p].quality === "perfect").length);
  const ko = hp.map((h) => h <= 0);
  const winner = hp[0] === hp[1] ? null : hp[0] > hp[1] ? 0 : 1;
  return { dealt, perfects, ko, winner, maxDamage };
}

function newMatch(names) {
  const hands = [dealHand(), dealHand()];
  return {
    screen: "game",
    names,
    hands,
    used: [{}, {}], // cardId -> round index it was spent in
    hp: [GAME.startHp, GAME.startHp],
    round: 0,
    phase: PHASE.HANDOFF,
    turn: 0,
    selected: null,
    picks: [null, null],
    history: [],
    damageApplied: false,
    maxDamage: hands.map((hand) => maxDamageForHand(hand)),
    startedAt: Date.now(),
    endedAt: null,
    matchId: Math.random().toString(36).slice(2),
  };
}

const initialState = () => ({ screen: "title", names: ["Player 1", "Player 2"] });

function reducer(state, action) {
  switch (action.type) {
    case "START":
      return newMatch(action.names);
    case "RESTART":
      return newMatch(state.names);
    case "MENU":
      return { screen: "title", names: state.names };
    case "SHOW_HAND":
      return state.phase === PHASE.HANDOFF ? { ...state, phase: PHASE.SELECT, selected: null } : state;
    case "SELECT": {
      if (state.phase !== PHASE.SELECT) return state;
      if (!remainingCards(state, state.turn).includes(action.cardId)) return state;
      return { ...state, selected: state.selected === action.cardId ? null : action.cardId };
    }
    case "CONFIRM": {
      if (state.phase !== PHASE.SELECT || !state.selected) return state;
      const picks = [...state.picks];
      picks[state.turn] = state.selected;
      return state.turn === 0
        ? { ...state, picks, selected: null, turn: 1, phase: PHASE.HANDOFF }
        : { ...state, picks, selected: null, phase: PHASE.READY };
    }
    case "REVEAL": {
      if (state.phase !== PHASE.READY) return state;
      const entry = resolveRound(state);
      const used = state.used.map((u, p) => ({ ...u, [state.picks[p]]: state.round }));
      return { ...state, used, history: [...state.history, entry], phase: PHASE.REVEAL, damageApplied: false };
    }
    case "APPLY_DAMAGE": {
      if (state.phase !== PHASE.REVEAL || state.damageApplied) return state;
      const { results } = state.history[state.history.length - 1];
      const hp = [
        Math.max(0, state.hp[0] - results[1].damage),
        Math.max(0, state.hp[1] - results[0].damage),
      ];
      return { ...state, hp, damageApplied: true };
    }
    case "NEXT": {
      if (state.phase !== PHASE.REVEAL || !state.damageApplied) return state;
      const over = state.round === QUESTIONS.length - 1 || state.hp.some((h) => h <= 0);
      if (over) return { ...state, screen: "end", endedAt: Date.now() };
      return { ...state, round: state.round + 1, phase: PHASE.HANDOFF, turn: 0, picks: [null, null], selected: null };
    }
    default:
      return state;
  }
}

/* ==========================================================================
   4. STYLES
   Chart-table theme: deep-sea board with a graticule grid and contour rings,
   chart-paper cards, two player inks (Ember and Glacier), gold for "perfect".
   The reveal (flip, passport stamp, impact) is the one loud moment.
   ========================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Display:wght@800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap');

.ad {
  --abyss: #081A2B;
  --abyss-2: #0C2438;
  --line: rgba(150, 200, 230, 0.16);
  --line-2: rgba(150, 200, 230, 0.28);
  --contour: rgba(120, 190, 225, 0.085);
  --grid: rgba(150, 200, 230, 0.05);
  --paper: #EDE6D3;
  --paper-2: #DED3B8;
  --ink: #0D2238;
  --text: #E8EEF3;
  --muted: #93A9BC;
  --dim: #5E7890;
  --ember: #FF7847;
  --ember-2: #FFB08C;
  --glacier: #56C7F5;
  --glacier-2: #A6E4FF;
  --gold: #F6C548;
  --perfect: #F6C548;
  --good: #58D68D;
  --weak: #A9B8C4;
  --wrong: #FF5468;
  --overkill: #B48CFF;
  --display: "Big Shoulders Display", "Arial Narrow", "Roboto Condensed", sans-serif;
  --stencil: "Big Shoulders Stencil Display", "Big Shoulders Display", "Arial Narrow", sans-serif;
  --body: "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--text);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  background-color: var(--abyss);
  background-image:
    radial-gradient(900px 540px at 6% 38%, rgba(255, 120, 71, 0.11), transparent 62%),
    radial-gradient(900px 540px at 94% 38%, rgba(86, 199, 245, 0.11), transparent 62%),
    repeating-radial-gradient(circle at 50% 120%, transparent 0 52px, var(--contour) 52px 53px),
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px),
    linear-gradient(180deg, var(--abyss-2), var(--abyss) 70%);
  background-size: auto, auto, auto, 80px 80px, 80px 80px, auto;
}
.ad::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(760px 420px at 50% 24%, rgba(246, 197, 72, 0.15), transparent 70%);
  opacity: 0;
  transition: opacity 1.2s ease;
}
.ad.is-final { --contour: rgba(246, 197, 72, 0.12); }
.ad.is-final::before { opacity: 1; }

.ad *, .ad *::before, .ad *::after { box-sizing: border-box; }
:where(.ad) h1, :where(.ad) h2, :where(.ad) h3, :where(.ad) p { margin: 0; }
:where(.ad) button, :where(.ad) input { font: inherit; color: inherit; }
.ad :focus-visible { outline: 3px solid var(--gold); outline-offset: 3px; }

.ad .p1 { --pc: var(--ember); --pc-2: var(--ember-2); --pc-deep: #B94A22; --pc-glow: rgba(255, 120, 71, 0.3); }
.ad .p2 { --pc: var(--glacier); --pc-2: var(--glacier-2); --pc-deep: #1F7DAE; --pc-glow: rgba(86, 199, 245, 0.3); }
.ad .tone-perfect { --tone: var(--perfect); }
.ad .tone-good { --tone: var(--good); }
.ad .tone-weak { --tone: var(--weak); }
.ad .tone-wrong { --tone: var(--wrong); }
.ad .tone-overkill { --tone: var(--overkill); }

/* ---------- Buttons ---------- */
.ad-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5em;
  padding: 0.62em 1.2em 0.58em; border: 0; border-radius: 12px;
  font-family: var(--display); font-weight: 800; font-size: 20px; line-height: 1; letter-spacing: 0.03em;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
}
.ad-btn:disabled { cursor: not-allowed; opacity: 0.4; filter: saturate(0.4); }
.ad-btn:not(:disabled):hover { transform: translateY(-2px); }
.ad-btn:not(:disabled):active { transform: translateY(2px); }
.ad-btn-lg { padding: 0.62em 1.45em 0.58em; font-size: 23px; }
.ad-btn-gold { background: var(--gold); color: var(--ink); box-shadow: 0 5px 0 #A07818, 0 12px 26px rgba(246, 197, 72, 0.22); }
.ad-btn-gold:not(:disabled):active { box-shadow: 0 2px 0 #A07818; }
.ad-btn-player { background: var(--pc); color: var(--ink); box-shadow: 0 5px 0 var(--pc-deep), 0 12px 26px var(--pc-glow); }
.ad-btn-player:not(:disabled):active { box-shadow: 0 2px 0 var(--pc-deep); }
.ad-btn-ghost { background: transparent; color: var(--text); box-shadow: inset 0 0 0 2px var(--line-2); }
.ad-btn-ghost:hover { box-shadow: inset 0 0 0 2px var(--muted); }
.ad-icon-btn {
  display: grid; place-items: center; width: 40px; height: 40px; padding: 0;
  border: 0; border-radius: 10px; background: rgba(150, 200, 230, 0.08); color: var(--text);
  cursor: pointer; transition: background 0.15s;
}
.ad-icon-btn:hover { background: rgba(150, 200, 230, 0.16); }

/* ---------- Header ---------- */
.ad-top {
  position: sticky; top: 0; z-index: 20;
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px;
  padding: 10px 22px;
  background: rgba(8, 26, 43, 0.9);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}
.ad-brand {
  display: flex; align-items: center; gap: 9px; white-space: nowrap;
  font-family: var(--display); font-weight: 900; font-size: 25px; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--paper);
}
.ad-brand .ad-rose { color: var(--gold); }
.ad-meta { display: flex; align-items: center; gap: 16px; }
.ad-round { font-family: var(--display); font-weight: 700; font-size: 18px; color: var(--muted); white-space: nowrap; }
.ad-round b { margin-left: 2px; font-size: 24px; font-weight: 900; color: var(--text); }
.ad-clock {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--display); font-weight: 700; font-size: 20px; color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* Level track: an expedition route. */
.ad-track { display: flex; align-items: flex-start; justify-content: center; margin: 0; padding: 0; list-style: none; }
.ad-track-stop { position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px; width: 108px; }
.ad-track-stop + .ad-track-stop::before {
  content: ""; position: absolute; top: 16px; right: 50%; width: 100%;
  border-top: 2px dashed var(--line-2);
}
.ad-track-stop.is-done::before, .ad-track-stop.is-current::before { border-top-style: solid; border-top-color: var(--gold); }
.ad-track-marker {
  position: relative; z-index: 1; display: grid; place-items: center;
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--abyss); border: 2px solid var(--line-2); color: var(--dim);
  transition: background 0.4s, border-color 0.4s, color 0.4s, box-shadow 0.4s, transform 0.4s;
}
.ad-track-stop.is-done .ad-track-marker { background: var(--gold); border-color: var(--gold); color: var(--ink); }
.ad-track-stop.is-current .ad-track-marker {
  border-color: var(--gold); color: var(--gold); transform: scale(1.1);
  box-shadow: 0 0 0 5px rgba(246, 197, 72, 0.14), 0 0 20px rgba(246, 197, 72, 0.4);
}
.ad-track-stop.is-last .ad-track-marker { width: 40px; height: 40px; margin-top: -3px; border-width: 4px; border-style: double; }
.ad-track-stop.is-last.is-current .ad-track-marker { background: var(--gold); border-color: #FFF1C2; color: var(--ink); animation: ad-pulse 1.8s ease-in-out infinite; }
.ad-track-text { white-space: nowrap; font-family: var(--display); font-weight: 700; font-size: 14px; letter-spacing: 0.04em; color: var(--dim); }
.ad-track-text b { margin-right: 2px; font-weight: 900; }
.ad-track-stop.is-done .ad-track-text { color: var(--muted); }
.ad-track-stop.is-current .ad-track-text { color: var(--gold); }
@keyframes ad-pulse {
  0%, 100% { box-shadow: 0 0 0 5px rgba(246, 197, 72, 0.18), 0 0 22px rgba(246, 197, 72, 0.5); }
  50% { box-shadow: 0 0 0 10px rgba(246, 197, 72, 0.05), 0 0 36px rgba(246, 197, 72, 0.75); }
}

/* Settings menu */
.ad-menu { position: relative; }
.ad-menu-list {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 40; min-width: 220px; padding: 6px;
  border-radius: 12px; background: #0E2B43;
  box-shadow: inset 0 0 0 1px var(--line-2), 0 18px 40px rgba(0, 0, 0, 0.5);
}
.ad-menu-list button {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px;
  border: 0; border-radius: 8px; background: none; color: var(--text);
  font: 700 15px/1.2 var(--body); text-align: left; cursor: pointer;
}
.ad-menu-list button:hover { background: rgba(150, 200, 230, 0.12); }

/* ---------- Board ---------- */
.ad-board {
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr) minmax(180px, 240px);
  grid-template-areas: "p1 q p2";
  align-items: stretch; gap: 22px;
  max-width: 1260px; margin: 0 auto; padding: 20px 22px 8px;
}
.ad-player.p1 { grid-area: p1; }
.ad-player.p2 { grid-area: p2; }
.ad-plate { grid-area: q; }

.ad-player { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.ad-player-stage { position: relative; display: grid; place-items: end center; width: 160px; height: 156px; }
.ad-player-info { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
.ad-player-id { display: flex; flex-direction: column; align-items: center; max-width: 100%; }
.ad-player-name {
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: var(--display); font-weight: 900; font-size: 28px; line-height: 1; letter-spacing: 0.02em; color: var(--pc);
}
.ad-player-role { font-size: 13px; color: var(--muted); }

.ad-status {
  padding: 5px 13px 4px; border-radius: 99px;
  font-family: var(--display); font-weight: 800; font-size: 16px; line-height: 1.1; letter-spacing: 0.03em;
  background: rgba(150, 200, 230, 0.08); color: var(--muted);
  transition: background 0.3s, color 0.3s;
}
.ad-status.is-active { background: var(--pc); color: var(--ink); }
.ad-status.is-locked { background: transparent; box-shadow: inset 0 0 0 2px var(--pc); color: var(--pc); }
.ad-status.is-q { background: var(--tone); color: var(--ink); }

.ad-pips { display: flex; align-items: center; gap: 4px; }
.ad-pips span { width: 11px; height: 15px; border-radius: 3px; background: rgba(150, 200, 230, 0.08); box-shadow: inset 0 0 0 1px var(--line-2); transition: background 0.3s, box-shadow 0.3s; }
.ad-pips span.is-live { background: var(--pc); box-shadow: 0 0 8px var(--pc-glow); }
.ad-pips small { margin-left: 6px; font-size: 13px; color: var(--muted); }

/* HP bar, drawn like a map scale bar */
.ad-hp { width: 100%; max-width: 212px; }
.ad-hp-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; font-family: var(--display); font-weight: 800; }
.ad-hp-label { font-size: 15px; letter-spacing: 0.08em; color: var(--muted); }
.ad-hp-num { font-size: 16px; color: var(--muted); font-variant-numeric: tabular-nums; }
.ad-hp-num b { display: inline-block; margin-right: 1px; font-size: 28px; font-weight: 900; color: var(--text); }
.ad-hp-track { position: relative; height: 16px; overflow: hidden; border-radius: 4px; background: #04101C; box-shadow: inset 0 0 0 1px var(--line-2); }
.ad-hp-fill, .ad-hp-lag { position: absolute; top: 0; bottom: 0; left: 0; }
.ad-hp-lag { background: #FFFFFF; opacity: 0.55; transition: width 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.5s; }
.ad-hp-fill { background: var(--hp); box-shadow: 0 0 14px var(--hp); transition: width 0.45s ease-out, background-color 0.4s ease; }
.ad-hp-scale {
  position: absolute; inset: 0; pointer-events: none;
  background:
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.16) 0 10%, transparent 10% 20%),
    repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(4, 16, 28, 0.7) calc(10% - 1px) 10%);
}
.ad-hp.hp-ok { --hp: var(--good); }
.ad-hp.hp-warn { --hp: #F6A93B; }
.ad-hp.hp-crit { --hp: var(--wrong); }
.ad-hp.hp-crit .ad-hp-fill { animation: ad-critical 1s ease-in-out infinite; }
.ad-hp.is-hit .ad-hp-track { animation: ad-shake 0.55s both; }
.ad-hp.is-hit .ad-hp-num b { animation: ad-num-hit 0.7s both; }
@keyframes ad-shake {
  0%, 100% { transform: none; }
  15% { transform: translate(-6px, 1px); } 30% { transform: translate(5px, -1px); }
  45% { transform: translate(-4px, 0); } 60% { transform: translate(3px, 1px); } 75% { transform: translate(-2px, 0); }
}
@keyframes ad-critical { 50% { opacity: 0.55; } }
@keyframes ad-num-hit { 30% { color: var(--wrong); transform: scale(1.22); } }

/* ---------- Avatars ---------- */
.ad-avatar {
  --bot: 120px;
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  width: calc(var(--bot) + 14px); height: calc(var(--bot) * 1.12);
}
.ad-avatar-base {
  position: absolute; left: 50%; bottom: 0; width: calc(var(--bot) * 0.78); height: 16px;
  border-radius: 50%; transform: translateX(-50%);
  background: radial-gradient(closest-side, var(--pc-glow), transparent);
}
.ad-avatar-base::after { content: ""; position: absolute; inset: 3px 14%; border-radius: 50%; border: 1px solid var(--line-2); }
.ad-avatar-bob { position: relative; animation: ad-bob 3.4s ease-in-out infinite; }
.ad-avatar.p2 .ad-avatar-bob { animation-delay: -1.7s; }
.ad-bot { display: block; width: var(--bot); height: calc(var(--bot) * 1.083); overflow: visible; }
.ad-avatar.p2 .ad-bot { transform: scaleX(-1); }
.ad-avatar-body.is-hit { animation: ad-hit 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
.ad-avatar.is-attack { animation: ad-lunge-r 0.55s ease-out both; }
.ad-avatar.p2.is-attack { animation-name: ad-lunge-l; }
.ad-avatar.is-victory .ad-avatar-bob { animation: ad-jump 1s cubic-bezier(0.3, 0.8, 0.4, 1) infinite; }
.ad-avatar.is-victory .ad-bot { filter: drop-shadow(0 0 18px rgba(246, 197, 72, 0.6)); }
.ad-avatar.is-defeat .ad-avatar-bob { animation: ad-slump 0.9s ease-out both; }
.ad-avatar.p2.is-defeat .ad-avatar-bob { animation-name: ad-slump-r; }
.ad-avatar.is-defeat .ad-bot { filter: grayscale(0.85) brightness(0.7); }
.ad-eyes { transform-box: fill-box; transform-origin: center; animation: ad-blink 4.6s infinite; }
.ad-avatar.p2 .ad-eyes { animation-delay: -2.1s; }
.ad-antenna { animation: ad-antenna 1.8s ease-in-out infinite; }
@keyframes ad-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes ad-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.12); } }
@keyframes ad-antenna { 50% { opacity: 0.3; } }
@keyframes ad-hit {
  0%, 100% { transform: none; filter: none; }
  12% { transform: translateX(-9px) rotate(-5deg); filter: brightness(1.6) drop-shadow(0 0 14px #FF5468); }
  26% { transform: translateX(8px) rotate(4deg); }
  40% { transform: translateX(-6px) rotate(-3deg); filter: brightness(1.3) drop-shadow(0 0 10px #FF5468); }
  56% { transform: translateX(4px) rotate(2deg); }
  72% { transform: translateX(-2px); filter: none; }
}
@keyframes ad-lunge-r { 0%, 100% { transform: none; } 30% { transform: translateX(22px) rotate(5deg); } }
@keyframes ad-lunge-l { 0%, 100% { transform: none; } 30% { transform: translateX(-22px) rotate(-5deg); } }
@keyframes ad-jump { 0%, 100% { transform: translateY(0); } 35% { transform: translateY(-24px); } 55% { transform: translateY(-19px); } 75% { transform: translateY(0) scaleY(0.96); } }
@keyframes ad-slump { to { transform: translateY(12px) rotate(-12deg); } }
@keyframes ad-slump-r { to { transform: translateY(12px) rotate(12deg); } }

/* Damage feedback */
.ad-float { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.ad-float-dmg {
  position: absolute; left: 50%; top: 12%; transform: translateX(-50%); white-space: nowrap;
  font-family: var(--display); font-weight: 900; font-size: 46px; line-height: 1; color: var(--wrong);
  text-shadow: 0 3px 0 #5A0F1C, 0 0 24px rgba(255, 84, 104, 0.65);
  animation: ad-rise 2.3s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
.ad-float-taken {
  position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%) rotate(-8deg);
  padding: 4px 10px 3px; border-radius: 4px; background: var(--wrong); color: #fff;
  font-family: var(--stencil); font-weight: 900; font-size: 24px; line-height: 1; letter-spacing: 0.06em;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  animation: ad-slam 2.3s 0.1s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}
.ad-float-miss {
  position: absolute; left: 50%; top: 64%; transform: translateX(-50%); white-space: nowrap;
  padding: 4px 11px; border-radius: 99px; background: rgba(8, 26, 43, 0.88); box-shadow: inset 0 0 0 1px var(--line-2);
  font-family: var(--display); font-weight: 800; font-size: 17px; color: var(--muted);
  animation: ad-rise 2.3s ease both;
}
.ad-float-crit {
  position: absolute; left: 50%; top: -10px; transform: translateX(-50%); white-space: nowrap;
  padding: 5px 11px 4px; border-radius: 99px; background: var(--gold); color: var(--ink);
  font-family: var(--display); font-weight: 900; font-size: 17px; letter-spacing: 0.05em;
  box-shadow: 0 0 26px rgba(246, 197, 72, 0.65);
  animation: ad-pop 2.5s cubic-bezier(0.2, 1.5, 0.4, 1) both;
}
.ad-impact {
  position: absolute; left: 50%; top: 46%; width: 24px; height: 24px; margin: -12px 0 0 -12px;
  border-radius: 50%; border: 3px solid var(--wrong); animation: ad-ring 0.7s ease-out both;
}
@keyframes ad-rise {
  0% { opacity: 0; transform: translate(-50%, 14px) scale(0.6); }
  14% { opacity: 1; transform: translate(-50%, -4px) scale(1.18); }
  26% { transform: translate(-50%, 0) scale(1); }
  80% { opacity: 1; transform: translate(-50%, -10px); }
  100% { opacity: 0; transform: translate(-50%, -30px); }
}
@keyframes ad-slam {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(-8deg) scale(2.2); }
  12%, 82% { opacity: 1; transform: translate(-50%, -50%) rotate(-8deg) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(-8deg) scale(0.96); }
}
@keyframes ad-pop {
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.5); }
  14% { opacity: 1; transform: translate(-50%, 0) scale(1.08); }
  22%, 84% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -8px); }
}
@keyframes ad-ring { from { opacity: 1; transform: scale(0.4); } to { opacity: 0; transform: scale(6); } }

/* ---------- Question plate ---------- */
.ad-plate {
  position: relative; display: flex; flex-direction: column; gap: 12px; min-height: 290px;
  padding: 28px 32px 22px; overflow: hidden; border-radius: 6px;
  background: linear-gradient(180deg, rgba(16, 48, 73, 0.94), rgba(12, 36, 56, 0.94));
  border: 1px solid var(--line-2);
  box-shadow: inset 0 0 0 6px rgba(8, 26, 43, 0.92), inset 0 0 0 7px var(--line), 0 26px 60px rgba(0, 0, 0, 0.35);
  transition: border-color 0.8s, box-shadow 0.8s;
}
.ad-plate::before, .ad-plate::after {
  content: ""; position: absolute; left: 7px; right: 7px; height: 6px; pointer-events: none;
  background: repeating-linear-gradient(90deg, var(--line-2) 0 1px, transparent 1px 24px);
}
.ad-plate::before { top: 7px; }
.ad-plate::after { bottom: 7px; }
.ad-plate.is-final {
  border-color: rgba(246, 197, 72, 0.6);
  box-shadow: inset 0 0 0 6px rgba(8, 26, 43, 0.92), inset 0 0 0 7px rgba(246, 197, 72, 0.35), 0 0 70px rgba(246, 197, 72, 0.16), 0 26px 60px rgba(0, 0, 0, 0.35);
}
.ad-plate.is-final::before, .ad-plate.is-final::after { background: repeating-linear-gradient(90deg, rgba(246, 197, 72, 0.5) 0 1px, transparent 1px 24px); }
.ad-plate-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ad-plate-type { display: inline-flex; align-items: center; gap: 7px; font-family: var(--display); font-weight: 800; font-size: 19px; letter-spacing: 0.02em; color: var(--gold); }
.ad-plate-round { font-family: var(--display); font-weight: 700; font-size: 17px; color: var(--muted); }
.ad-plate-round b { margin-left: 4px; font-size: 34px; font-weight: 900; line-height: 1; color: var(--text); }
.ad-plate-prompt { max-width: 28ch; margin-top: 4px; font-family: var(--body); font-weight: 700; font-size: clamp(23px, 2.3vw, 32px); line-height: 1.2; color: var(--text); text-wrap: balance; }
.ad-plate-support { max-width: 56ch; font-size: 17px; color: var(--muted); }
.ad-plate-next { display: flex; align-items: baseline; gap: 10px; margin-top: auto; padding-top: 14px; border-top: 1px dashed var(--line-2); font-size: 15px; color: var(--muted); }
.ad-next-tag { flex: none; font-family: var(--display); font-weight: 800; font-size: 16px; letter-spacing: 0.03em; color: var(--paper); }
.ad-next-crown { flex: none; align-self: center; color: var(--gold); }

.ad-banner {
  position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; text-align: center; color: var(--gold); pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(16, 48, 73, 0.98), rgba(8, 26, 43, 0.98));
  animation: ad-banner 2.3s ease both;
}
.ad-banner-kicker { margin-top: 6px; font-family: var(--display); font-weight: 800; font-size: 19px; letter-spacing: 0.1em; color: var(--muted); }
.ad-banner-name {
  font-family: var(--display); font-weight: 900; font-size: clamp(54px, 6.4vw, 92px); line-height: 0.9;
  letter-spacing: 0.02em; text-transform: uppercase; color: var(--paper);
  animation: ad-banner-name 2.3s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.ad-banner-q { margin-top: 6px; font-size: 19px; font-style: italic; color: var(--muted); }
.ad-banner.is-final .ad-banner-name { color: var(--gold); text-shadow: 0 0 36px rgba(246, 197, 72, 0.55); }
@keyframes ad-banner { 0% { opacity: 0; } 10%, 82% { opacity: 1; } 100% { opacity: 0; visibility: hidden; } }
@keyframes ad-banner-name { 0% { opacity: 0; transform: scale(1.3); letter-spacing: 0.25em; } 22% { opacity: 1; transform: scale(1); letter-spacing: 0.02em; } 100% { transform: scale(0.98); } }

/* ---------- Action zone ---------- */
.ad-zone { display: flex; flex-direction: column; align-items: center; max-width: 1260px; min-height: 370px; margin: 0 auto; padding: 14px 22px 36px; }

.ad-hand-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 6px 16px; text-align: center; }
.ad-hand-who { font-family: var(--display); font-weight: 800; font-size: 17px; letter-spacing: 0.03em; color: var(--pc); }
.ad-hand-head h3 { font-family: var(--display); font-weight: 900; font-size: 32px; line-height: 1; }
.ad-hand-count { font-size: 14px; color: var(--muted); }
.ad-hand { display: flex; align-items: flex-end; justify-content: center; min-height: 262px; padding: 42px 16px 18px; }
.ad-hand .ad-card { margin: 0 -6px; animation: ad-deal 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i) * 60ms); }
.ad-hand .ad-card:hover { z-index: 3; transform: translateY(-18px) rotate(0deg) scale(1.04); }
.ad-hand .ad-card.is-selected { z-index: 4; transform: translateY(-34px) rotate(0deg) scale(1.08); }
.ad-hand:has(.is-selected) .ad-card:not(.is-selected) .ad-card-front { filter: saturate(0.65) brightness(0.8); }
.ad-hand-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.ad-hand-hint { font-size: 14px; color: var(--muted); }
@keyframes ad-deal { from { opacity: 0; transform: translateY(110px) rotate(0deg) scale(0.9); } }

/* ---------- Cards ---------- */
.ad-card {
  --cw: 136px;
  position: relative; display: block; flex: none; width: var(--cw); height: calc(var(--cw) * 1.4);
  margin: 0; padding: 0; border: 0; border-radius: 13px; background: none; color: inherit; text-align: left;
  perspective: 1100px;
  transform: translateY(var(--lift, 0px)) rotate(var(--rot, 0deg));
  transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}
button.ad-card { cursor: pointer; }
.ad-card-inner { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 0.65s cubic-bezier(0.3, 0.7, 0.2, 1); }
.ad-card.is-down .ad-card-inner { transform: rotateY(180deg); }
.ad-card-face { position: absolute; inset: 0; overflow: hidden; border-radius: 13px; -webkit-backface-visibility: hidden; backface-visibility: hidden; }
.ad-card-front {
  display: flex; flex-direction: column; padding: 9px 9px 10px;
  background: linear-gradient(180deg, var(--paper), var(--paper-2)); color: var(--ink);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 0 0 1px rgba(13, 34, 56, 0.3), 0 12px 26px rgba(0, 0, 0, 0.45);
  transition: box-shadow 0.3s, filter 0.3s;
}
.ad-card-top { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; line-height: 1; color: #4A5D70; }
.ad-card-no { margin-left: auto; white-space: nowrap; font-family: var(--display); font-weight: 800; font-size: 13px; color: #6A7B8C; }
.ad-card-art {
  position: relative; display: grid; place-items: center; flex: 1; margin: 7px 0 8px; overflow: hidden; border-radius: 8px;
  background-color: var(--tint);
  background-image:
    repeating-radial-gradient(circle at 26% 78%, transparent 0 7px, rgba(255, 255, 255, 0.24) 7px 8px),
    linear-gradient(155deg, rgba(255, 255, 255, 0.2), rgba(13, 34, 56, 0.3));
  box-shadow: inset 0 0 0 1px rgba(13, 34, 56, 0.22);
}
.ad-card-code { font-family: var(--display); font-weight: 900; font-size: calc(var(--cw) * 0.36); line-height: 1; letter-spacing: 0.02em; color: transparent; -webkit-text-stroke: 1.6px rgba(255, 255, 255, 0.95); }
.ad-card-coords { position: absolute; left: 7px; bottom: 5px; font-size: 10px; font-weight: 700; letter-spacing: 0.02em; color: rgba(255, 255, 255, 0.95); }
.ad-card-name { font-family: var(--display); font-weight: 900; font-size: calc(var(--cw) * 0.168); line-height: 0.95; letter-spacing: 0.01em; text-transform: uppercase; color: var(--ink); }
.ad-card-name.is-long { font-size: calc(var(--cw) * 0.135); }
.ad-card-region { margin-top: 3px; font-size: 11.5px; line-height: 1.2; color: #4A5D70; }

.ad-card-back, .ad-cardback {
  display: grid; place-items: center; color: var(--pc-2);
  background-color: #0D2A42;
  background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0 8px, var(--pc-glow) 8px 9px);
  box-shadow: inset 0 0 0 5px #0A2135, inset 0 0 0 7px var(--pc), 0 12px 26px rgba(0, 0, 0, 0.45);
}
.ad-card-back { transform: rotateY(180deg); }
.ad-cardback { position: relative; flex: none; width: 78px; height: 109px; margin: 0 -9px; border-radius: 10px; transform: translateY(var(--lift, 0px)) rotate(var(--rot, 0deg)); }
.ad-cardback.is-big { width: 108px; height: 151px; margin: 0; border-radius: 12px; }

.ad-card.is-selected .ad-card-front { box-shadow: 0 0 0 3px var(--pc), 0 0 26px var(--pc-glow), 0 0 60px var(--pc-glow), 0 22px 34px rgba(0, 0, 0, 0.5); }
.ad-card-flag {
  position: absolute; top: -14px; left: 50%; z-index: 6; transform: translateX(-50%); white-space: nowrap;
  padding: 5px 10px 4px; border-radius: 99px; background: var(--pc); color: var(--ink);
  font-family: var(--display); font-weight: 900; font-size: 13px; line-height: 1; letter-spacing: 0.1em;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35); animation: ad-flag 0.25s ease-out both;
}
@keyframes ad-flag { from { opacity: 0; transform: translate(-50%, 6px); } }

/* Passport stamp on reveal */
.ad-stamp {
  position: absolute; left: 50%; top: 45%; z-index: 5; transform: translate(-50%, -50%) rotate(-11deg); white-space: nowrap;
  padding: 6px 11px 4px; border: 3px solid var(--tone); border-radius: 7px; background: rgba(8, 26, 43, 0.88); color: var(--tone);
  font-family: var(--stencil); font-weight: 900; font-size: 27px; line-height: 1; letter-spacing: 0.07em;
  box-shadow: 0 0 0 2px rgba(8, 26, 43, 0.55), 0 8px 22px rgba(0, 0, 0, 0.45);
  animation: ad-stamp 0.45s 0.62s cubic-bezier(0.2, 1.5, 0.35, 1) both;
}
@keyframes ad-stamp { from { opacity: 0; transform: translate(-50%, -50%) rotate(-11deg) scale(2.4); } }
.ad-card.is-stamped .ad-card-front { transition: box-shadow 0.35s 0.7s, filter 0.35s 0.7s; }
.ad-card.is-stamped.tone-perfect .ad-card-front { box-shadow: 0 0 0 3px var(--perfect), 0 0 34px rgba(246, 197, 72, 0.55), 0 16px 30px rgba(0, 0, 0, 0.5); }
.ad-card.is-stamped.tone-good .ad-card-front { box-shadow: 0 0 0 3px var(--good), 0 0 26px rgba(88, 214, 141, 0.4), 0 16px 30px rgba(0, 0, 0, 0.5); }
.ad-card.is-stamped.tone-wrong .ad-card-front, .ad-card.is-stamped.tone-overkill .ad-card-front { filter: grayscale(0.55) brightness(0.8); }

/* Handoff and ready */
.ad-handoff { justify-content: center; gap: 22px; }
.ad-handoff-backs { display: flex; align-items: flex-end; justify-content: center; height: 126px; padding-top: 8px; }
.ad-handoff-copy { display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 560px; text-align: center; }
.ad-handoff-lock { display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px; border-radius: 99px; background: rgba(255, 120, 71, 0.14); color: var(--ember-2); font-size: 14px; font-weight: 700; }
.ad-handoff-kicker { font-family: var(--display); font-weight: 800; font-size: 18px; letter-spacing: 0.03em; color: var(--pc); }
.ad-handoff-copy h3 { font-family: var(--display); font-weight: 900; font-size: 40px; line-height: 1; }
.ad-handoff-note { margin-bottom: 10px; color: var(--muted); }
.ad-ready { justify-content: center; gap: 10px; text-align: center; }
.ad-ready-cards { display: flex; align-items: center; gap: 26px; margin-bottom: 10px; }
.ad-ready-cards .ad-cardback.p1 { --rot: -7deg; }
.ad-ready-cards .ad-cardback.p2 { --rot: 7deg; }
.ad-ready h3 { font-family: var(--display); font-weight: 900; font-size: 36px; line-height: 1; }
.ad-ready p { margin-bottom: 12px; color: var(--muted); }
.ad-vs { font-family: var(--stencil); font-weight: 900; font-size: 46px; line-height: 1; color: var(--gold); text-shadow: 0 0 24px rgba(246, 197, 72, 0.45); }

/* Reveal */
.ad-reveal { gap: 14px; }
.ad-duel { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); grid-template-areas: "p1 vs p2"; align-items: center; gap: 20px; width: 100%; max-width: 1120px; }
.ad-duel-side { display: flex; align-items: center; gap: 18px; min-width: 0; }
.ad-duel-side.p1 { grid-area: p1; flex-direction: row-reverse; }
.ad-duel-side.p2 { grid-area: p2; }
.ad-duel-vs { grid-area: vs; }
.ad-duel-card { display: flex; flex: none; flex-direction: column; align-items: center; gap: 8px; }
.ad-duel-who { font-family: var(--display); font-weight: 800; font-size: 18px; color: var(--pc); }
.ad-card.is-reveal { --cw: 146px; }
.ad-blurb { flex: 1; min-width: 0; max-width: 330px; opacity: 0; transform: translateY(8px); transition: opacity 0.4s ease, transform 0.4s ease; }
.ad-blurb.is-shown { opacity: 1; transform: none; }
.ad-duel-side.p1 .ad-blurb { text-align: right; }
.ad-blurb-head { font-family: var(--display); font-weight: 900; font-size: 23px; line-height: 1; letter-spacing: 0.02em; color: var(--tone); }
.ad-blurb-card { margin: 3px 0 5px; font-family: var(--display); font-weight: 800; font-size: 19px; color: var(--text); }
.ad-blurb-text { font-size: 15px; line-height: 1.42; color: rgba(232, 238, 243, 0.88); }
.ad-blurb-dmg { margin-top: 8px; font-family: var(--display); font-weight: 900; font-size: 21px; color: var(--tone); }
.ad-blurb-strat { margin-top: 9px; padding: 7px 10px; border-radius: 8px; background: rgba(150, 200, 230, 0.08); font-size: 13.5px; line-height: 1.38; color: var(--muted); }
.ad-blurb-strat.kind-spent, .ad-blurb-strat.kind-missed { background: rgba(255, 84, 104, 0.12); color: #FFB6C0; }
.ad-blurb-strat.kind-saved { background: rgba(246, 197, 72, 0.14); color: #FBE3A1; }
.ad-blurb-strat.kind-held { background: rgba(86, 199, 245, 0.12); color: var(--glacier-2); }
.ad-lesson { display: flex; flex-direction: column; align-items: center; gap: 6px; max-width: 760px; text-align: center; opacity: 0; transform: translateY(6px); transition: opacity 0.4s 0.15s ease, transform 0.4s 0.15s ease; }
.ad-lesson.is-shown { opacity: 1; transform: none; }
.ad-lesson-tag { display: inline-flex; align-items: center; gap: 5px; margin-right: 4px; vertical-align: 1px; font-family: var(--display); font-weight: 800; font-size: 17px; color: var(--gold); }
.ad-lesson b { font-family: var(--display); font-weight: 900; font-size: 22px; color: var(--paper); }
.ad-lesson-text { font-size: 15.5px; color: var(--muted); }
.ad-lesson .ad-btn { margin-top: 10px; }

/* ---------- Title ---------- */
.ad-title { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; min-height: 100vh; padding: 44px 22px 52px; text-align: center; }
.ad-title-hero { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: end; gap: 26px; max-width: 1080px; }
.ad-title-hero .ad-avatar { --bot: 132px; }
.ad-logo {
  font-family: var(--display); font-weight: 900; font-size: clamp(76px, 12vw, 164px); line-height: 0.8; letter-spacing: 0.01em;
  text-transform: uppercase; color: var(--paper);
  background-image:
    linear-gradient(rgba(13, 34, 56, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(13, 34, 56, 0.3) 1px, transparent 1px),
    linear-gradient(180deg, #F6F0E1 20%, #D6C69E);
  background-size: 12px 12px, 12px 12px, auto;
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 5px 0 rgba(0, 0, 0, 0.35));
}
.ad-tagline { margin-top: 16px; font-family: var(--display); font-weight: 800; font-size: clamp(22px, 2.6vw, 30px); letter-spacing: 0.02em; color: var(--gold); }
.ad-edition { margin-top: 6px; color: var(--muted); }
.ad-setup { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: center; gap: 14px 16px; }
.ad-name { display: flex; flex-direction: column; gap: 6px; text-align: left; }
.ad-name span { font-family: var(--display); font-weight: 800; font-size: 16px; letter-spacing: 0.02em; color: var(--pc); }
.ad-name input { width: 210px; padding: 11px 14px; border: 2px solid var(--line-2); border-radius: 10px; background: rgba(8, 26, 43, 0.85); color: var(--text); font: 700 18px/1.2 var(--body); transition: border-color 0.15s, box-shadow 0.15s; }
.ad-name input:focus-visible { outline: none; border-color: var(--pc); box-shadow: 0 0 0 4px var(--pc-glow); }
.ad-setup-vs { align-self: center; padding-top: 22px; font-family: var(--stencil); font-weight: 900; font-size: 30px; color: var(--gold); }
.ad-setup .ad-btn { margin-left: 8px; }

.ad-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px; max-width: 1040px; margin: 0; padding: 0; list-style: none; counter-reset: ad-step; text-align: left; }
.ad-steps li { position: relative; padding: 16px 0 0 50px; border-top: 2px dashed var(--line-2); counter-increment: ad-step; }
.ad-steps li::before { content: counter(ad-step); position: absolute; left: 0; top: 12px; font-family: var(--display); font-weight: 900; font-size: 42px; line-height: 1; color: var(--gold); }
.ad-steps h3 { margin-bottom: 4px; font-family: var(--display); font-weight: 800; font-size: 23px; line-height: 1.05; color: var(--text); }
.ad-steps p { font-size: 15px; color: var(--muted); }
.ad-ladder { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ad-ladder span { display: inline-flex; align-items: baseline; gap: 6px; padding: 3px 9px 2px; border-radius: 6px; background: var(--tone); color: var(--ink); font-size: 13px; font-weight: 700; }
.ad-ladder b { font-family: var(--display); font-weight: 900; font-size: 16px; }

/* ---------- Overlays ---------- */
.ad-modal { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 20px; background: rgba(4, 12, 22, 0.82); -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); animation: ad-fade 0.25s ease both; }
.ad-modal-card { position: relative; width: min(1040px, 100%); max-height: 90vh; overflow: auto; padding: 30px 30px 34px; border-radius: 14px; background: var(--abyss-2); box-shadow: inset 0 0 0 1px var(--line-2), 0 30px 80px rgba(0, 0, 0, 0.55); }
.ad-modal-card h2 { margin-bottom: 22px; font-family: var(--display); font-weight: 900; font-size: 42px; line-height: 1; }
.ad-modal-x { position: absolute; top: 16px; right: 16px; }
@keyframes ad-fade { from { opacity: 0; } }

.ad-end { position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(4, 12, 22, 0.86); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: ad-fade 0.45s ease both; }
.ad-end-inner { max-width: 1040px; margin: 0 auto; padding: 34px 22px 48px; }
.ad-end-hero { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 18px; text-align: center; }
.ad-end-hero .ad-avatar { --bot: 138px; }
.ad-end-headline { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--gold); }
.ad-end-headline h2 { font-family: var(--display); font-weight: 900; font-size: clamp(56px, 8.5vw, 112px); line-height: 0.86; letter-spacing: 0.01em; text-transform: uppercase; color: var(--gold); text-shadow: 0 0 44px rgba(246, 197, 72, 0.35); animation: ad-end-title 0.7s 0.15s cubic-bezier(0.2, 1.3, 0.4, 1) both; }
@keyframes ad-end-title { from { opacity: 0; transform: scale(1.5); } }
.ad-end-headline p { font-size: 18px; color: var(--muted); }
.ad-end-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 28px 0 22px; }
.ad-end-stat { padding: 16px 18px 18px; border-top: 3px solid var(--pc); border-radius: 10px; background: rgba(16, 48, 73, 0.6); box-shadow: inset 0 0 0 1px var(--line); }
.ad-end-stat-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.ad-end-name { font-family: var(--display); font-weight: 900; font-size: 28px; line-height: 1; color: var(--pc); }
.ad-end-hp { font-family: var(--display); font-weight: 700; font-size: 18px; color: var(--muted); }
.ad-end-hp b { font-size: 30px; font-weight: 900; color: var(--text); }
.ad-end-plan { margin: 8px 0 10px; font-size: 15px; color: var(--muted); }
.ad-end-plan b { color: var(--text); }
.ad-end-bar { height: 10px; overflow: hidden; border-radius: 99px; background: #04101C; box-shadow: inset 0 0 0 1px var(--line-2); }
.ad-end-bar i { display: block; height: 100%; border-radius: 99px; background: var(--pc); animation: ad-grow 1.1s 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes ad-grow { from { width: 0; } }
.ad-summary-wrap { overflow-x: auto; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--line); }
.ad-summary { width: 100%; min-width: 720px; border-collapse: collapse; font-size: 14.5px; }
.ad-summary th { padding: 10px 12px; border-bottom: 1px solid var(--line-2); background: rgba(16, 48, 73, 0.5); text-align: left; font-family: var(--display); font-weight: 800; font-size: 16px; color: var(--muted); }
.ad-summary td { padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
.ad-summary tr:last-child td { border-bottom: 0; }
.ad-sum-round { font-family: var(--display); font-weight: 900; font-size: 20px; color: var(--muted); }
.ad-sum-type { display: block; margin-bottom: 2px; font-family: var(--display); font-weight: 800; font-size: 14px; color: var(--gold); }
.ad-sum-ideal { font-weight: 700; color: var(--paper); }
.ad-chip { display: inline-block; padding: 3px 9px 2px; border-radius: 99px; background: var(--tone); color: var(--ink); font-size: 13.5px; font-weight: 700; }
.ad-summary small { display: block; margin-top: 4px; font-size: 12.5px; color: var(--muted); }
.ad-end-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 26px; }

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .ad-top { grid-template-columns: auto 1fr; }
  .ad-meta { justify-self: end; }
  .ad-track { grid-column: 1 / -1; grid-row: 2; }
}
@media (max-width: 900px) {
  .ad-board { grid-template-columns: 1fr 1fr; grid-template-areas: "p1 p2" "q q"; gap: 14px; padding-top: 14px; }
  .ad-player { flex-direction: row; align-items: center; gap: 10px; text-align: left; }
  .ad-player-stage { flex: none; width: 104px; height: 108px; }
  .ad-player .ad-avatar { --bot: 86px; }
  .ad-player-info, .ad-player-id { align-items: flex-start; }
  .ad-plate { min-height: 0; padding: 22px 22px 18px; }
  .ad-duel { grid-template-columns: 1fr 1fr; grid-template-areas: "p1 p2"; align-items: start; gap: 14px; }
  .ad-duel-vs { display: none; }
  .ad-duel-side, .ad-duel-side.p1 { flex-direction: column; align-items: center; }
  .ad-duel-side.p1 .ad-blurb { text-align: left; }
  .ad-blurb { max-width: none; }
  .ad-steps { grid-template-columns: 1fr; }
  .ad-title-hero, .ad-end-hero { grid-template-columns: 1fr 1fr; }
  .ad-title-hero > div, .ad-end-headline { grid-column: 1 / -1; grid-row: 1; }
  .ad-title-hero .ad-avatar, .ad-end-hero .ad-avatar { justify-self: center; --bot: 104px; }
  .ad-end-stats { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .ad-top { gap: 8px; padding: 8px 12px; }
  .ad-brand span, .ad-track-text b { display: none; }
  .ad-track-stop { width: 66px; }
  .ad-track-text { font-size: 12px; }
  .ad-board, .ad-zone { padding-left: 12px; padding-right: 12px; }
  .ad-player { flex-direction: column; align-items: center; text-align: center; }
  .ad-player-info, .ad-player-id { align-items: center; }
  .ad-player-stage { width: 92px; height: 92px; }
  .ad-player .ad-avatar { --bot: 72px; }
  .ad-player-name { font-size: 22px; }
  .ad-card { --cw: 102px; }
  .ad-card-coords, .ad-card-no { display: none; }
  .ad-hand { flex-wrap: wrap; gap: 14px 8px; min-height: 0; padding-top: 26px; }
  .ad-hand .ad-card { --rot: 0deg !important; --lift: 0px !important; margin: 0; }
  .ad-card.is-reveal { --cw: 118px; }
  .ad-hand-head h3, .ad-handoff-copy h3 { font-size: 30px; }
  .ad-setup .ad-btn { margin-left: 0; }
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .ad *, .ad *::before, .ad *::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; animation-delay: 0ms !important;
    transition-duration: 0.01ms !important; transition-delay: 0ms !important;
  }
  .ad .ad-float > * { animation: none !important; }
  .ad .ad-impact, .ad .ad-banner { display: none; }
}
`;

/* ==========================================================================
   3. UI
   ========================================================================== */

const ICONS = {
  compass: Compass,
  map: MapIcon,
  navigation: Navigation,
  mountain: Mountain,
  globe: Globe,
  pin: MapPin,
  layers: Layers,
  alert: AlertTriangle,
  landmark: Landmark,
  target: Target,
  info: Info,
  scale: Scale,
};

const ROLES = ["The Explorer", "The Rival"];

export default function AtlasDuel() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const inMatch = state.screen !== "title";
  const finalLevel = inMatch && QUESTIONS[state.round].level === LEVELS.length;

  return (
    <div className={`ad${finalLevel ? " is-final" : ""}`}>
      <style>{CSS}</style>
      {inMatch ? (
        <GameBoard state={state} dispatch={dispatch} />
      ) : (
        <TitleScreen names={state.names} onStart={(names) => dispatch({ type: "START", names })} />
      )}
      {state.screen === "end" && <EndScreen state={state} dispatch={dispatch} />}
    </div>
  );
}

/* ---------- Title ---------- */

function TitleScreen({ names, onStart }) {
  const [p1, setP1] = useState(names[0]);
  const [p2, setP2] = useState(names[1]);
  const start = () => onStart([p1.trim() || "Player 1", p2.trim() || "Player 2"]);

  return (
    <main className="ad-title">
      <div className="ad-title-hero">
        <Avatar p={0} />
        <div>
          <h1 className="ad-logo">{GAME.title}</h1>
          <p className="ad-tagline">{GAME.tagline}</p>
          <p className="ad-edition">A two-player strategy card game that teaches. {GAME.edition}, demo build.</p>
        </div>
        <Avatar p={1} />
      </div>

      <form
        className="ad-setup"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <label className="ad-name p1">
          <span>Player 1, the Explorer</span>
          <input value={p1} maxLength={14} onChange={(e) => setP1(e.target.value)} />
        </label>
        <span className="ad-setup-vs" aria-hidden="true">VS</span>
        <label className="ad-name p2">
          <span>Player 2, the Rival</span>
          <input value={p2} maxLength={14} onChange={(e) => setP2(e.target.value)} />
        </label>
        <button type="submit" className="ad-btn ad-btn-gold ad-btn-lg">
          <Swords size={20} /> Start match
        </button>
      </form>

      <HowToSteps />
    </main>
  );
}

function HowToSteps() {
  return (
    <ol className="ad-steps">
      <li>
        <h3>Seven cards, seven questions</h3>
        <p>You each get a hand of 7 answer cards. Play one per question. Once a card is spent, it's gone for the rest of the match.</p>
      </li>
      <li>
        <h3>Better fit, bigger hit</h3>
        <p>Every card is graded against the question. The better the fit, the more damage you deal to your rival.</p>
        <div className="ad-ladder">
          {QUALITY_ORDER.map((q) => (
            <span key={q} className={`tone-${q}`}>
              {QUALITY[q].label} <b>{DAMAGE[q]}</b>
            </span>
          ))}
        </div>
      </li>
      <li>
        <h3>Pick in secret, reveal together</h3>
        <p>Pass the device, lock in your card, then flip both at once. Check "Up next" before you spend a card you might need.</p>
      </li>
    </ol>
  );
}

function HowToOverlay({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-howto-title" onClick={onClose}>
      <div className="ad-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ad-icon-btn ad-modal-x" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        <h2 id="ad-howto-title">How to play</h2>
        <HowToSteps />
      </div>
    </div>
  );
}

/* ---------- Board ---------- */

function GameBoard({ state, dispatch }) {
  const { round, phase, names, hp, history, matchId } = state;
  const question = QUESTIONS[round];
  const level = LEVEL_BY_ID[question.level];
  const [step, setStep] = useState(0);
  const [banner, setBanner] = useState(null);
  const [showHowTo, setShowHowTo] = useState(false);

  // The one orchestrated moment: flip, stamp, impact, explanation.
  useEffect(() => {
    if (phase !== PHASE.REVEAL) {
      setStep(0);
      return undefined;
    }
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 380),
      setTimeout(() => {
        setStep(2);
        dispatch({ type: "APPLY_DAMAGE" });
      }, 1500),
      setTimeout(() => setStep(3), 2350),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase, round, matchId, dispatch]);

  // Level-up banner whenever the round crosses into a new level.
  useEffect(() => {
    const previous = round > 0 ? QUESTIONS[round - 1].level : null;
    const current = QUESTIONS[round].level;
    if (current === previous) return undefined;
    setBanner(LEVEL_BY_ID[current]);
    const t = setTimeout(() => setBanner(null), 2300);
    return () => clearTimeout(t);
  }, [round, matchId]);

  const current = phase === PHASE.REVEAL ? history[history.length - 1] : null;
  const fxFor = (p) =>
    current && step >= 2
      ? {
          dealt: current.results[p].damage,
          taken: current.results[1 - p].damage,
          crit: current.results[p].quality === "perfect",
          key: `${matchId}-${round}-${p}`,
        }
      : null;

  return (
    <div className="ad-game">
      <TopBar
        state={state}
        level={level}
        onHowTo={() => setShowHowTo(true)}
        onRestart={() => dispatch({ type: "RESTART" })}
        onMenu={() => dispatch({ type: "MENU" })}
      />
      <div className="ad-board">
        {[0, 1].map((p) => (
          <PlayerPanel
            key={p}
            p={p}
            name={names[p]}
            hp={hp[p]}
            cardsLeft={remainingCards(state, p).length}
            status={playerStatus(state, p, current, step)}
            fx={fxFor(p)}
          />
        ))}
        <QuestionPanel question={question} round={round} banner={banner} />
      </div>
      <ActionZone state={state} step={step} current={current} dispatch={dispatch} />
      {showHowTo && <HowToOverlay onClose={() => setShowHowTo(false)} />}
    </div>
  );
}

function playerStatus(state, p, current, step) {
  const { phase, turn, picks } = state;
  if (phase === PHASE.REVEAL && current) {
    const q = current.results[p].quality;
    return step >= 1 ? { tone: `is-q tone-${q}`, text: QUALITY[q].label } : { tone: "is-idle", text: "Revealing" };
  }
  if (picks[p]) return { tone: "is-locked", text: "Locked in" };
  if (turn === p) return { tone: "is-active", text: phase === PHASE.SELECT ? "Choosing a card" : "Ready to pick" };
  return { tone: "is-idle", text: "Waiting" };
}

/* ---------- Header ---------- */

function TopBar({ state, level, onHowTo, onRestart, onMenu }) {
  return (
    <header className="ad-top">
      <div className="ad-brand">
        <CompassRose size={26} />
        <span>{GAME.title}</span>
      </div>
      <LevelTrack current={level.id} />
      <div className="ad-meta">
        <span className="ad-round">
          Round <b>{state.round + 1}</b>/{QUESTIONS.length}
        </span>
        <MatchClock startedAt={state.startedAt} endedAt={state.endedAt} />
        <SettingsMenu onHowTo={onHowTo} onRestart={onRestart} onMenu={onMenu} />
      </div>
    </header>
  );
}

function LevelTrack({ current }) {
  return (
    <ol className="ad-track" aria-label="Level progress">
      {LEVELS.map((level) => {
        const status = level.id < current ? "done" : level.id === current ? "current" : "todo";
        const final = level.id === LEVELS.length;
        const Icon = ICONS[level.icon];
        return (
          <li
            key={level.id}
            className={`ad-track-stop is-${status}${final ? " is-last" : ""}`}
            aria-current={status === "current" ? "step" : undefined}
          >
            <span className="ad-track-marker">
              {status === "done" ? <Check size={15} strokeWidth={3} /> : <Icon size={final ? 18 : 15} />}
            </span>
            <span className="ad-track-text">
              <b>{pad2(level.id)}</b> {level.name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function MatchClock({ startedAt, endedAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endedAt) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endedAt]);
  const secs = Math.max(0, Math.floor(((endedAt ?? now) - startedAt) / 1000));
  const mm = pad2(Math.floor(secs / 60));
  const ss = pad2(secs % 60);
  return (
    <span className="ad-clock" title="Match time">
      <Timer size={16} /> {mm}:{ss}
    </span>
  );
}

function SettingsMenu({ onHowTo, onRestart, onMenu }) {
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

  const run = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="ad-menu" ref={ref}>
      <button
        type="button"
        className="ad-icon-btn"
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Settings size={19} />
      </button>
      {open && (
        <div className="ad-menu-list" role="menu">
          <button type="button" role="menuitem" onClick={run(onHowTo)}>
            <HelpCircle size={17} /> How to play
          </button>
          <button type="button" role="menuitem" onClick={run(onRestart)}>
            <RotateCcw size={17} /> Restart match
          </button>
          <button type="button" role="menuitem" onClick={run(onMenu)}>
            <Home size={17} /> Back to title
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Players ---------- */

function PlayerPanel({ p, name, hp, cardsLeft, status, fx }) {
  const hit = Boolean(fx && fx.taken > 0);
  return (
    <section className={`ad-player p${p + 1}`} aria-label={`Player ${p + 1}, ${name}, ${hp} HP`}>
      <div className="ad-player-stage">
        <Avatar p={p} hit={hit} attack={Boolean(fx && fx.dealt > 0)} />
        {fx && <FloatText key={fx.key} fx={fx} />}
      </div>
      <div className="ad-player-info">
        <div className="ad-player-id">
          <span className="ad-player-name">{name}</span>
          <span className="ad-player-role">{ROLES[p]}</span>
        </div>
        <HealthBar hp={hp} hit={hit} />
        <CardPips left={cardsLeft} total={DEAL_SLOTS.length} />
        <span className={`ad-status ${status.tone}`}>{status.text}</span>
      </div>
    </section>
  );
}

function FloatText({ fx }) {
  return (
    <div className="ad-float" aria-hidden="true">
      {fx.taken > 0 ? (
        <>
          <span className="ad-impact" />
          <span className="ad-float-dmg">-{fx.taken} HP</span>
          <span className="ad-float-taken">TAKEN!</span>
        </>
      ) : (
        <span className="ad-float-miss">No damage</span>
      )}
      {fx.crit && <span className="ad-float-crit">CRITICAL ANSWER</span>}
    </div>
  );
}

function HealthBar({ hp, hit }) {
  const pct = Math.max(0, Math.min(100, (hp / GAME.startHp) * 100));
  const tone = pct > 50 ? "ok" : pct > 25 ? "warn" : "crit";
  return (
    <div className={`ad-hp hp-${tone}${hit ? " is-hit" : ""}`}>
      <div className="ad-hp-row">
        <span className="ad-hp-label">HP</span>
        <span className="ad-hp-num">
          <b>{hp}</b>/{GAME.startHp}
        </span>
      </div>
      <div
        className="ad-hp-track"
        role="meter"
        aria-label="Health"
        aria-valuemin={0}
        aria-valuemax={GAME.startHp}
        aria-valuenow={hp}
      >
        <div className="ad-hp-lag" style={{ width: `${pct}%` }} />
        <div className="ad-hp-fill" style={{ width: `${pct}%` }} />
        <div className="ad-hp-scale" />
      </div>
    </div>
  );
}

function CardPips({ left, total }) {
  return (
    <div className="ad-pips" aria-label={`${left} of ${total} cards left`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < left ? "is-live" : ""} />
      ))}
      <small>{left} left</small>
    </div>
  );
}

function Avatar({ p, hit = false, attack = false, outcome = null }) {
  const classes = ["ad-avatar", `p${p + 1}`, attack && "is-attack", outcome && `is-${outcome}`]
    .filter(Boolean)
    .join(" ");
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

// Globe-headed bots: the Explorer wears a pith helmet, the Rival a captain's cap.
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

/* ---------- Question plate ---------- */

function QuestionPanel({ question, round, banner }) {
  const type = QUESTION_TYPES[question.type];
  const TypeIcon = ICONS[type.icon];
  const next = QUESTIONS[round + 1];
  const final = question.level === LEVELS.length;
  return (
    <section className={`ad-plate${final ? " is-final" : ""}`}>
      <div className="ad-plate-head">
        <span className="ad-plate-type">
          <TypeIcon size={16} /> {type.label}
        </span>
        <span className="ad-plate-round">
          Round <b>{pad2(round + 1)}</b>
        </span>
      </div>
      <h2 className="ad-plate-prompt">{question.prompt}</h2>
      <p className="ad-plate-support">{question.support}</p>
      <div className="ad-plate-next">
        {next ? (
          <>
            <span className="ad-next-tag">Up next</span>
            <span>{next.prompt}</span>
          </>
        ) : (
          <>
            <Crown size={15} className="ad-next-crown" />
            <span>Final question. Make it count.</span>
          </>
        )}
      </div>
      {banner && <LevelBanner key={banner.id} level={banner} />}
    </section>
  );
}

function LevelBanner({ level }) {
  const Icon = ICONS[level.icon];
  const final = level.id === LEVELS.length;
  return (
    <div className={`ad-banner${final ? " is-final" : ""}`} role="status">
      <Icon size={final ? 40 : 30} />
      <span className="ad-banner-kicker">{final ? "Final level" : `Level ${pad2(level.id)}`}</span>
      <span className="ad-banner-name">{level.name}</span>
      <span className="ad-banner-q">{level.question}</span>
    </div>
  );
}

/* ---------- Cards ---------- */

function GameCard({ cardId, selected = false, onSelect, faceDown = false, owner = 0, stamp = null, style, className = "" }) {
  const card = CARD_BY_ID[cardId];
  const region = REGIONS[card.region];
  const KindIcon = card.kind === "microstate" ? Castle : Flag;
  const Tag = onSelect ? "button" : "div";
  const classes = [
    "ad-card",
    selected && "is-selected",
    faceDown && "is-down",
    stamp && `is-stamped tone-${stamp}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      type={onSelect ? "button" : undefined}
      className={classes}
      style={{ ...style, "--tint": region.tint }}
      onClick={onSelect}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={onSelect ? `${card.name}, ${region.label}` : undefined}
    >
      {selected && <span className="ad-card-flag">SELECTED</span>}
      <span className="ad-card-inner">
        <span className="ad-card-face ad-card-front">
          <span className="ad-card-top">
            <KindIcon size={11} strokeWidth={2.5} />
            {card.kind === "microstate" ? "Microstate" : "Country"}
            <span className="ad-card-no">No. {pad2(card.number)}</span>
          </span>
          <span className="ad-card-art">
            <span className="ad-card-code">{card.code}</span>
            <span className="ad-card-coords">{card.coords}</span>
          </span>
          <span className={`ad-card-name${card.name.length > 9 ? " is-long" : ""}`}>{card.name}</span>
          <span className="ad-card-region">{region.label}</span>
        </span>
        <span className={`ad-card-face ad-card-back p${owner + 1}`}>
          <CompassRose size={54} />
        </span>
      </span>
      {stamp && <span className="ad-stamp">{QUALITY[stamp].stamp}</span>}
    </Tag>
  );
}

function CardBack({ p, style, className = "" }) {
  return (
    <span className={`ad-cardback p${p + 1} ${className}`} style={style}>
      <CompassRose size={38} />
    </span>
  );
}

const fanStyle = (i, n, spread = 3, curve = 2.4) => {
  const offset = i - (n - 1) / 2;
  return { "--rot": `${offset * spread}deg`, "--lift": `${offset * offset * curve}px`, "--i": i };
};

/* ---------- Action zone (hand, handoff, ready, reveal) ---------- */

function ActionZone({ state, step, current, dispatch }) {
  switch (state.phase) {
    case PHASE.HANDOFF:
      return <HandoffPanel state={state} onShow={() => dispatch({ type: "SHOW_HAND" })} />;
    case PHASE.SELECT:
      return <HandPanel state={state} dispatch={dispatch} />;
    case PHASE.READY:
      return <ReadyPanel onReveal={() => dispatch({ type: "REVEAL" })} />;
    default:
      return current ? <RevealPanel state={state} step={step} current={current} onNext={() => dispatch({ type: "NEXT" })} /> : null;
  }
}

function HandoffPanel({ state, onShow }) {
  const p = state.turn;
  const name = state.names[p];
  const other = state.names[1 - p];
  const left = remainingCards(state, p).length;
  return (
    <div className={`ad-zone ad-handoff p${p + 1}`}>
      <div className="ad-handoff-backs" aria-hidden="true">
        {Array.from({ length: left }, (_, i) => (
          <CardBack key={i} p={p} style={fanStyle(i, left, 5, 3)} />
        ))}
      </div>
      <div className="ad-handoff-copy">
        {p === 1 && (
          <p className="ad-handoff-lock">
            <Lock size={15} /> {state.names[0]} locked in
          </p>
        )}
        <p className="ad-handoff-kicker">Player {p + 1}'s turn</p>
        <h3>{p === 0 ? `${name}, take the device` : `Pass the device to ${name}`}</h3>
        <p className="ad-handoff-note">{other}, no peeking. {name}'s cards stay hidden until they tap below.</p>
        <button type="button" className="ad-btn ad-btn-player ad-btn-lg" onClick={onShow}>
          <Eye size={19} /> I'm {name}, show my cards
        </button>
      </div>
    </div>
  );
}

function HandPanel({ state, dispatch }) {
  const p = state.turn;
  const cards = remainingCards(state, p);
  const name = state.names[p];
  const { selected } = state;
  const hint = selected
    ? `${cardName(selected)} selected. Confirming locks it in.`
    : cards.length === 1
      ? "Your last card. Select it and confirm."
      : "Select a card to answer. Hover to inspect.";

  return (
    <div className={`ad-zone ad-hand-zone p${p + 1}`}>
      <div className="ad-hand-head">
        <span className="ad-hand-who">Player {p + 1}'s turn</span>
        <h3>{name}, choose your card</h3>
        <span className="ad-hand-count">
          {cards.length} {cards.length === 1 ? "card" : "cards"} left
        </span>
      </div>
      <div className="ad-hand" role="group" aria-label={`${name}'s hand`}>
        {cards.map((id, i) => (
          <GameCard
            key={id}
            cardId={id}
            owner={p}
            selected={selected === id}
            onSelect={() => dispatch({ type: "SELECT", cardId: id })}
            style={fanStyle(i, cards.length)}
          />
        ))}
      </div>
      <div className="ad-hand-actions">
        <button
          type="button"
          className="ad-btn ad-btn-player ad-btn-lg"
          disabled={!selected}
          onClick={() => dispatch({ type: "CONFIRM" })}
        >
          <Lock size={18} /> CONFIRM ANSWER
        </button>
        <p className="ad-hand-hint" aria-live="polite">
          {hint}
        </p>
      </div>
    </div>
  );
}

function ReadyPanel({ onReveal }) {
  return (
    <div className="ad-zone ad-ready">
      <div className="ad-ready-cards" aria-hidden="true">
        <CardBack p={0} className="is-big" />
        <span className="ad-vs">VS</span>
        <CardBack p={1} className="is-big" />
      </div>
      <h3>Both answers locked</h3>
      <p>Gather round. Both cards flip at once.</p>
      <button type="button" className="ad-btn ad-btn-gold ad-btn-lg" onClick={onReveal}>
        <Swords size={20} /> REVEAL
      </button>
    </div>
  );
}

function RevealPanel({ state, step, current, onNext }) {
  const question = QUESTIONS[current.round];
  const isLast = current.round === QUESTIONS.length - 1 || state.hp.some((h) => h <= 0);
  return (
    <div className="ad-zone ad-reveal">
      <div className="ad-duel" aria-live="polite">
        {[0, 1].map((p) => {
          const result = current.results[p];
          return (
            <div key={p} className={`ad-duel-side p${p + 1}`}>
              <div className="ad-duel-card">
                <span className="ad-duel-who">{state.names[p]}</span>
                <GameCard
                  cardId={result.cardId}
                  owner={p}
                  faceDown={step < 1}
                  stamp={step >= 1 ? result.quality : null}
                  className="is-reveal"
                />
              </div>
              <ResultBlurb result={result} shown={step >= 3} />
            </div>
          );
        })}
        <span className="ad-vs ad-duel-vs" aria-hidden="true">
          VS
        </span>
      </div>
      <div className={`ad-lesson${step >= 3 ? " is-shown" : ""}`}>
        <p>
          <span className="ad-lesson-tag">
            <Sparkles size={15} /> Ideal answer
          </span>{" "}
          <b>{question.idealLabel}</b>
        </p>
        <p className="ad-lesson-text">{question.lesson}</p>
        <button type="button" className="ad-btn ad-btn-gold" onClick={onNext} disabled={step < 3}>
          {isLast ? "See final results" : "Next question"}
        </button>
      </div>
    </div>
  );
}

function ResultBlurb({ result, shown }) {
  const card = CARD_BY_ID[result.cardId];
  const meta = QUALITY[result.quality];
  return (
    <div className={`ad-blurb tone-${result.quality}${shown ? " is-shown" : ""}`}>
      <p className="ad-blurb-head">{meta.headline}</p>
      <p className="ad-blurb-card">{card.name}</p>
      <p className="ad-blurb-text">{result.note ?? `Doesn't fit this one. ${card.fact}`}</p>
      <p className="ad-blurb-dmg">{result.damage > 0 ? `+${result.damage} DAMAGE` : "0 DAMAGE"}</p>
      {result.strategy && <p className={`ad-blurb-strat kind-${result.strategy.kind}`}>{result.strategy.text}</p>}
    </div>
  );
}

/* ---------- End screen ---------- */

function EndScreen({ state, dispatch }) {
  const { names, hp, history, maxDamage } = state;
  const o = matchOutcome(state);
  const loser = o.winner === null ? null : 1 - o.winner;
  const knockout = loser !== null && o.ko[loser];

  let title;
  let sub;
  if (o.winner === null) {
    title = o.ko[0] && o.ko[1] ? "Double knockout" : "Draw";
    sub = o.ko[0] && o.ko[1] ? "Two flawless hands. Nobody left standing." : `Dead level on ${hp[0]} HP each.`;
  } else if (knockout) {
    title = "Knockout!";
    sub = o.dealt[o.winner] === maxDamage[o.winner]
      ? `${names[o.winner]} played a flawless hand.`
      : `${names[o.winner]} knocked out ${names[loser]}.`;
  } else {
    title = `${names[o.winner]} wins`;
    sub = `By ${Math.abs(hp[0] - hp[1])} HP after ${history.length} rounds.`;
  }
  const outcomeFor = (p) => (o.winner === null ? null : o.winner === p ? "victory" : "defeat");

  return (
    <div className="ad-end" role="dialog" aria-modal="true" aria-labelledby="ad-end-title">
      <div className="ad-end-inner">
        <div className="ad-end-hero">
          <Avatar p={0} outcome={outcomeFor(0)} />
          <div className="ad-end-headline">
            <Trophy size={30} />
            <h2 id="ad-end-title">{title}</h2>
            <p>{sub}</p>
          </div>
          <Avatar p={1} outcome={outcomeFor(1)} />
        </div>

        <div className="ad-end-stats">
          {[0, 1].map((p) => (
            <div key={p} className={`ad-end-stat p${p + 1}`}>
              <div className="ad-end-stat-top">
                <span className="ad-end-name">{names[p]}</span>
                <span className="ad-end-hp">
                  <b>{hp[p]}</b> HP left
                </span>
              </div>
              <p className="ad-end-plan">
                Dealt <b>{o.dealt[p]}</b> of {maxDamage[p]} possible damage with {o.perfects[p]}{" "}
                perfect {o.perfects[p] === 1 ? "answer" : "answers"}.
              </p>
              <div className="ad-end-bar">
                <i style={{ width: `${(o.dealt[p] / maxDamage[p]) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="ad-summary-wrap">
          <table className="ad-summary">
            <thead>
              <tr>
                <th>Round</th>
                <th>Question</th>
                <th>{names[0]}</th>
                <th>{names[1]}</th>
                <th>Ideal answer</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => {
                const q = QUESTIONS[h.round];
                return (
                  <tr key={h.round}>
                    <td className="ad-sum-round">{pad2(h.round + 1)}</td>
                    <td>
                      <span className="ad-sum-type">{QUESTION_TYPES[q.type].label}</span>
                      {q.prompt}
                    </td>
                    {h.results.map((r, p) => (
                      <td key={p}>
                        <span className={`ad-chip tone-${r.quality}`}>{cardName(r.cardId)}</span>
                        <small>
                          {QUALITY[r.quality].label}, {r.damage > 0 ? `+${r.damage}` : "0"} damage
                        </small>
                      </td>
                    ))}
                    <td className="ad-sum-ideal">{q.idealLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="ad-end-actions">
          <button type="button" className="ad-btn ad-btn-gold ad-btn-lg" onClick={() => dispatch({ type: "RESTART" })}>
            <RotateCcw size={19} /> Rematch with new hands
          </button>
          <button type="button" className="ad-btn ad-btn-ghost" onClick={() => dispatch({ type: "MENU" })}>
            <Home size={18} /> Back to title
          </button>
        </div>
      </div>
    </div>
  );
}
