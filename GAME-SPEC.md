# LIFE — Complete Specification

**A life-management RPG for one player: you.**

This document describes every element of the game as it currently exists, so it can be
rebuilt from the ground up — in any stack, with any model, without reading the old code.

Everything here was reverse-engineered from the working app (`index.html`, `app.js`,
`styles.css`, `brutalist.css`). Where the current build has bugs or dead code, it says so
explicitly in **[§15 Known issues]**, so a rebuild doesn't inherit them.

---

## Table of contents

1. [The concept](#1-the-concept)
2. [Architecture & tech](#2-architecture--tech)
3. [The data model (complete)](#3-the-data-model-complete)
4. [Navigation & page map](#4-navigation--page-map)
5. [Core systems: player, stats, time](#5-core-systems-player-stats-time)
6. [Activities](#6-activities)
7. [Lead Generation](#7-lead-generation)
8. [The Entity (Vibe)](#8-the-entity-vibe)
9. [People: girls, friends, relationships](#9-people-girls-friends-relationships)
10. [Planning layer: Northstar, Eras, Manifest](#10-planning-layer-northstar-eras-manifest)
11. [Time layer: Schedule & Time Allocation](#11-time-layer-schedule--time-allocation)
12. [ME: Body Map, Level Up, history](#12-me-body-map-level-up-history)
13. [The Portal and its worlds](#13-the-portal-and-its-worlds)
14. [Cross-system links (the "feeds" web)](#14-cross-system-links-the-feeds-web)
15. [Known issues & dead code](#15-known-issues--dead-code)
16. [Design system](#16-design-system)
17. [Rebuild guide](#17-rebuild-guide)

---

## 1. The concept

LIFE is a single-player RPG where the "character" is the real person using it. It is not a
simulation of a fictional life — it is a **structured mirror of an actual one**. You enter
what you actually do, own, want and are working on; the app scores it, shows balance and
trajectory, and makes improvement legible as levelling.

Three ideas hold the whole thing together:

**1. Everything is an item in a slot.** Activities, lead sources, vibe inputs, grooming
products — all are *inventory items* that you *slot* into a limited number of *slots*. Slots
are scarce. What you slot is what counts. This is the core loop everywhere in the app:
build an inventory → choose what's active → see the score change.

**2. Everything is rated, and every rating implies a gap.** Items carry tiers (S–F), ROI
levels, difficulty, 0–25 levels. Every score is shown against its ceiling ("8/25",
"88% of potential"), so the gap between where you are and what's possible is always visible.
The app is a gap-finder.

**3. What you build in one world counts somewhere else.** Systems feed each other
automatically (see **[§14]**). A social media account you level up becomes fuel in Lead
Generation. An activity you mark as lead-generating appears as a lead source. Slotted
activities raise your Vibe. Nothing is a silo — that interconnection is the point.

The tone is deliberate: terminal-brutalist, second-person, blunt. Copy reads like
*"You are draining yourself. Cut back on indulgences"*, *"Empty day — tap + Add and paint
your perfect one"*, *"What exactly gets this to the next level? Write the moves."* The app
is meant to feel like a system that holds you to something.

---

## 2. Architecture & tech

### Current build

| Aspect | Implementation |
|---|---|
| Stack | Vanilla HTML + CSS + JS. No framework, no build step, no dependencies |
| Files | `index.html` (676 ln), `app.js` (~7,900 ln), `styles.css` (~7,700 ln), `brutalist.css` (516 ln) |
| Hosting | Static. Served from GitHub Pages (`yexedmg.github.io`) |
| Persistence | `localStorage` under key `life-rpg-data`, whole state as one JSON blob |
| Rendering | String-template `innerHTML` assignment; full re-render per page |
| State | One global mutable object `D`, plus module-level UI variables |
| Target | Mobile-first (iPhone-sized portrait), also works on desktop |

### How rendering works

All pages exist simultaneously in the DOM as `<div class="page">`. Navigation toggles an
`.active` class. A single `render()` function dispatches to the current page's render
function:

```
navigateTo(page) → toggle .active → currentPage = page → render()
render() → syncVibeStat() → updateXPDisplay() → updateHeaderSubtitle()
        → renderHeaderDate() → if (currentPage === X) renderX()
```

Every mutation follows the same shape:

```
openXModal()  →  builds HTML string, calls openModal(html)
submitX()     →  reads DOM inputs → mutates D → closeModal() → save() → renderX() → toast()
```

`save()` writes all of `D` to localStorage. `load()` reads it and runs a long chain of
migrations. There is no reactivity — every change explicitly calls a render function.

### Modal system

One shared modal. `openModal(htmlString)` injects into `#modal-content` and adds `.active`
to `#modal-backdrop` and `#modal-container`. `closeModal()` removes them. Every form in the
app is a modal built from a template string with inline `onclick` handlers referencing
global functions.

### Recommended rebuild stack

The vanilla approach has hit its limits (7,900-line single file, no type safety, manual
re-renders, bug class in **[§15]**). For a rebuild:

- **Framework**: React or Svelte with components per system
- **State**: one typed store (Zustand/Redux/Svelte stores) mirroring the `D` shape
- **Types**: TypeScript — the data model in **[§3]** maps directly to interfaces
- **Persistence**: keep localStorage, but with a **versioned schema + explicit migration
  chain** and a single source of truth for defaults (see **[§15.1]** — this is the #1 bug)
- **Routing**: real routes per page instead of class toggling
- Keep: the design language, the slot metaphor, the copy voice, the math in this document

---

## 3. The data model (complete)

The entire app state is one object. Here is every field, with types and meaning.

```ts
interface GameData {
  // ─── PLAYER ───
  player: {
    level: number;                  // starts 1
    xp: number;                     // current XP toward next level
    stats: {
      money: number;                // uncapped (currency)
      boldness: number;             // 0–25
      fear: number;                 // 0–25
      health: number;               // 0–25
      social: number;               // 0–25
      charm: number;                // 0–25
      sexAppeal: number;            // 0–25
      power: number;                // 0–25
      fight: number;                // 0–25
      looks: number;                // 0–25
      vibe: number;                 // 0–25, COMPUTED — never set directly
    };
    streaks: { coldApproach: number };
  };

  // ─── PEOPLE ───
  girls: Girl[];
  friends: Friend[];
  relationships: {
    theOne: string | null;          // girl id — Slot 1
    commons: string[];              // girl ids — Slot 2
    sidelined: string[];            // girl ids
  };

  // ─── ACTIVITIES ───
  activityCategories: ActivityCategory[];
  activitySections?: ActivitySection[];   // optional grouping layer
  customActivities: LegacyActivity[];     // legacy, see §15

  // ─── LEAD GENERATION ───
  leadgen: { methods: LeadMethod[] };

  // ─── THE ENTITY ───
  vibeComponents: VibeComponent[];

  // ─── WORLD ───
  world: {
    currentCityId: string;
    currentBoroughId: string;
    mainBoroughId: string | null;   // borough that shows global/shared data
    cities: City[];
  };
  nextMoves: NextMove[];

  // ─── PLANNING ───
  northstar: { text: string; targetDate: string|null; updatedAt: number } | null;
  eras: Era[];
  manifests: Manifest[];
  manifestInfo?: string;            // free-text global notes on goals
  abilities: Ability[];

  // ─── LIFESTYLE ───
  lifestyles: Lifestyle[];
  activeLifestyleId: string | null;

  // ─── TIME ───
  schedule: WeekSchedule;           // global weekly plan
  timeAllocs: TimeAlloc[];          // "ideal day" templates
  currentTimeAllocId: string;
  bestTimeAlloc: TimeSlot[];        // legacy, pre-timeAllocs

  // ─── ME / PORTAL ───
  meStats: MeStat[];                // body-map stat elements

  // ─── MONEY WORLD ───
  moneyGoal: number | null;
  incomes: Income[];

  // ─── RATINGS WORLD ───
  ratings: RatingNode[];

  // ─── SOCIAL WORLD ───
  socialMedia: Platform[];

  // ─── LOG / TIME ───
  day: number;                      // in-game day, starts 1
  log: LogEntry[];                  // capped at 500
  months: Record<string, MonthRec>; // "YYYY-M" → record
  settings: { birthday?: string };  // 'YYYY-MM-DD'
}
```

### Entity definitions

```ts
interface Girl {
  id: string; name: string;
  rarity: 1|2|3|4|5;
  origin: string;                   // where you met
  affinity: number;                 // 0–100
  looksLikeYou: number;             // 0–100, hidden until dates >= 3
  status: 'Talking'|'Dating'|'Common'|'TheOne'|'Sidelined';
  dates: number; notes: string; createdDay: number;
}

interface Friend {
  id: string; name: string;
  rarity: 1–5;                      // doubles as their Social star
  socialStar: number; origin: string; notes: string; createdDay: number;
}

interface ActivityCategory {
  id: string; name: string; emoji: string;   // emoji is a text tag like "[SPT]"
  maxSlots: number;                 // 1–10
  slots: (string|null)[];           // item ids, length === maxSlots
  inventory: ActivityItem[];
  sectionId?: string;               // optional section grouping
  _collapsed?: boolean;             // UI-only
  _invOpen?: boolean;               // UI-only
}

interface ActivityItem {
  id: string; name: string; emoji: string;
  time: string;                     // "HH:MM–HH:MM" or ''
  kind: 'expansion'|'maintenance'|'cost';
  realm: 'real'|'synthetic';
  meetBonus: number;                // 0–15
  xp: number;                       // XP per "Do"
  leadgen: boolean;                 // mirrors into Lead Gen "Lifestyle" method
  statEffects: Partial<Record<StatKey, number>>;
}

interface ActivitySection { id: string; name: string; collapsed: boolean }

interface LeadMethod {
  id: string; name: string; emoji: string;
  maxSlots: number;                 // 1–10
  maxGain: number;                  // 1–30, caps each item's gain %
  slots: (string|null)[];
  inventory: LeadItem[];
}

interface LeadItem {
  id: string; name: string;
  difficulty: 'easy'|'medium'|'hard';
  roi: 'low'|'medium-low'|'medium'|'high'|'very-high';
  leads: number;                    // raw count; 20 leads = 1 star
  sourceActivityId?: string;        // set if mirrored from an activity
  sourcePlatformId?: string;        // set if mirrored from a social platform
}

interface VibeComponent {
  id: string; name: string; emoji: string; desc: string;
  maxSlots: number; maxGain: number;         // default 2 / 25
  slots: (string|null)[];
  inventory: { id, name, difficulty, roi }[];
}

interface City { id: string; name: string; boroughs: Borough[] }
interface Borough {
  id: string; name: string;
  activityCategories: ActivityCategory[];    // borough-scoped
  activitySections?: ActivitySection[];
  leadgen: { methods: LeadMethod[] };        // borough-scoped
  places: Place[];
}
interface Place { id, name, type, notes, visited: boolean }
interface NextMove { id, name, statEffects, city: string|null, done: boolean }

interface Ability {
  id: string; name: string; desc: string;
  unlocked: boolean;
  assignments: { type: 'activity'|'leadmethod'; methodId: string; itemId: string }[];
}

interface Era { id, name, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', color, createdAt }

interface Manifest {
  id: string; name: string; emoji: string; collapsed: boolean; createdAt: number;
  milestones: { id, name, collapsed, tasks: { id, name, done }[] }[];
}

interface Lifestyle {
  id: string; name: string; emoji: string; isActive: boolean; createdAt: number;
  activities: { id, activityItemId, catId, sourceLabel, subLabel }[];
  schedule: WeekSchedule;           // each lifestyle has its OWN weekly schedule
}

type WeekSchedule = Record<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun', ScheduleEntry[]>;
interface ScheduleEntry {
  id: string; time: string;         // "HH:MM–HH:MM"
  name: string;
  catId: string|null; activityItemId: string|null;
  levelUpRef?: { statId: string; moveId: string };   // link to a Level-Up move
}

interface TimeAlloc { id: string; name: string; slots: TimeSlot[] }
interface TimeSlot {
  id: string; title: string;
  start: 'HH:MM'; end: 'HH:MM'; color: string;
  levelUpRef?: { statId: string; moveId: string };
}

interface MeStat {
  id: string; title: string; desc: string;
  stars: number;                    // 0–25 (field name is legacy; it's a level)
  mapX?: number; mapY?: number;     // dragged position on the body map
  levelUp: { id: string; text: string }[];            // "how to level this up"
  history: { t: number; from: number|null; to: number }[];   // every level change
  createdAt: number;
}

interface Platform {                // social media
  id: string; title: string; desc: string;
  level: number;                    // 0–25, drives Online Presence ROI
  levelUp: { id, text }[];
  history: { t, from, to }[];
  createdAt: number;
}

interface Income {
  id: string; title: string; desc: string;
  amount: number;                   // $ per month
  hoursPerWeek: number;
  status: 'active'|'possible';
  projections: { id, date: 'YYYY-MM', when: string, amount: number }[];
  createdAt: number;
}

interface RatingNode {              // 3-layer tree: category → sub → items
  id: string; name: string; desc: string;
  rating: 'S'|'A'|'B'|'C'|'D'|'E'|'F'|null;
  routine: { is: true; minutes: number } | null;
  children?: RatingNode[];          // layer 1 → layer 2
  items?: RatingItem[];             // layer 2 → layer 3
}

interface RatingItem {
  id: string; name: string;
  tier: 'S'..'F';
  later: boolean;                   // true = planned, not owned yet
  upgrade: { name: string; tier: string; price: number } | null;
  upgrades: {                       // completed upgrade history
    t: number; fromName: string; fromTier: string;
    toName: string; toTier: string; price: number;
  }[];
}

interface LogEntry { t: number; day: number; month: string; year: number; msg: string; tag: string }
// tags: xp, meet, meet-miss, date, relationship, friend, activity, summon,
//       world, manifest, upgrade, day, monthly, meta, event
```

### Defaults on a fresh install

```
player.stats = { money:0, boldness:1, fear:1, health:5, social:1,
                 charm:1, sexAppeal:1, power:1, fight:1, looks:1, vibe:0 }
day = 1

activityCategories = [
  Sports      [SPT]  3 slots
  Part-time Job [JOB] 1 slot
  School / Classes [CLS] 2 slots
  Combat      [CMB]  2 slots
  Social      [SOC]  2 slots
  Grooming    [GRM]  1 slot
  Other       [···]  3 slots
]

leadgen.methods = [
  lm-job     Part-time Job   1 slot,  maxGain 15  (seeded: "Albert Heijn vakkenvuller", easy/medium)
  lm-cold    Cold Approach   2 slots, maxGain 20
  lm-sports  Sports          2 slots, maxGain 18
  lm-event   Event Hosting   1 slot,  maxGain 12
  lm-online  Online Presence 2 slots, maxGain 10
]
// lm-lifestyle (2 slots, maxGain 15) is created automatically when needed

vibeComponents = [
  vc-vibe        Vibe          ✦  2 slots, maxGain 25
  vc-socialproof Social Proof  ●  2 slots, maxGain 25
  vc-style       Style         ◆  2 slots, maxGain 25
  vc-energy      Energy        ▲  2 slots, maxGain 25
]

world = Rotterdam → City Center (set as mainBorough)

ratings = [Hair, Face, Dental, Shower, Body towel, Extracosmetics,
           Clothes, Digital system, Physique]   // all unrated, no children

timeAllocs = [{ name: 'Default day', slots: [] }]
schedule   = { mon:[], tue:[], ..., sun:[] }
```

---

## 4. Navigation & page map

### Bottom dock (5 tabs, always visible)

| Label | Page | Purpose |
|---|---|---|
| LIFE | `lifestyle` | Lifestyle team compositions + hub into Social/Activities |
| TIME | `schedule` | Time Allocation (ideal day) + weekly schedule |
| HOME | `home` | Dashboard: XP, Northstar, Era, Birthday, Manifest, terminals |
| PORTAL | `portal` | World select — the main hub into everything |
| ME | `me` | Body map, stats grid, overview actions |

### All pages

**Main pages** (pushed to nav stack, `goBack()` pops):

```
home            Dashboard
lifestyle       Lifestyle list + hub
lifestyledetail One lifestyle: activities, contribution breakdown, its own schedule
schedule        TIME — Time Allocation strip + weekly planner
me              Body map, stats grid, quick actions, relationship preview
portal          World select
  ├── social          Social world (areas grid)
  │     └── socialmedia  Platforms list
  ├── money           Money world (goal, balance, areas)
  │     ├── income        Income streams (flowing / possible)
  │     └── incomedetail  One stream + projection graph
  ├── ratings         ⭐ Ratings world (layer 1)
  │     └── ratingdetail  Layers 2 and 3
  └── (dynamic doors for each body-map stat)
activities      Activity categories, sections, slots, bench
girls           Girls hub (Entity / Roster / Life)
  ├── roster         Girls + Friends tabs
  ├── life           Relationship slots + chasers + sidelined
  └── vibe           THE ENTITY — vibe bar, breakdown, components
        └── vibecomp     One component's slots + inventory
leadgen         Lead Generation — bar, stars, method list
  └── leadmethod     One method: slots, inventory, lead counts
world           Cities grid + Next Moves
  └── citydetail     Boroughs, places
manifest        Goals list
  └── manifestdetail  One goal: milestones, tasks
stat            One stat's detail page
```

**Overlay pages** (shown on top, `hideOverlay()` closes, not in nav stack):

```
abilities    Ability list, unlock/assign
totalstats   All stats + maintenance/expansion/cost balance + ability counts
calendar     Era list + 12-month year grid with era coloring
stats        Stats grid + roster rarity distribution
months       Month tabs + recap + event log
saveload     Export JSON / Import JSON / Reset all data
```

Navigation internals: `navStack` array (max 30), `navigateTo(page)` pushes, `goBack()` pops
(defaults to `home`). `suppressNavPush` flag prevents double-push during back navigation.

---

## 5. Core systems: player, stats, time

### 5.1 Stats

Eleven stats. All are capped **0–25** except `money`, which is uncapped currency.

| Key | Label | Icon | Meaning |
|---|---|---|---|
| `money` | Money | `$` | Currency. Earned from work, spent on dates, summons, upgrades |
| `boldness` | Boldness | `!` | Raised by successful cold approaches. Gates risky actions |
| `fear` | Fear | `~` | Grows from failure/rejection. Offsets boldness |
| `health` | Health | `+` | Raised by sports, rest, grooming. Drained by overwork |
| `social` | Social | `●` | Raised by hangouts and parties. Feeds Meet bar strongly |
| `charm` | Charm | `◆` | Charisma. Grows from social wins and dates |
| `sexAppeal` | Sex Appeal | `♦` | Grows from sports + charm combos. Major Meet driver |
| `power` | Power | `■` | Raw strength — built by strength sports |
| `fight` | Fight | `▲` | Combat skill — raised by combat activities |
| `looks` | Looks | `○` | Grooming and style. Feeds Meet bar like Sex Appeal |
| `vibe` | Vibe | `✦` | **Computed.** The Entity's overall percentage, rounded |

`applyEffects(effects)` adds deltas, flooring at 0 and capping at 25 (money exempt).
`vibe` is overwritten every render by `syncVibeStat()` — never set it directly.

### 5.2 XP and levelling

```
XP_BASE = 100,  XP_MULT = 1.4
xpForLevel(lvl) = floor(100 × 1.4^(lvl−1))

Level 1→2:  100 XP
Level 2→3:  140
Level 3→4:  196
Level 4→5:  274
Level 5→6:  384 …
```

`addXP(amount, reason)` adds, then loops: while `xp >= needed`, subtract and level up.
A level-up shows a full-screen `LEVEL UP` banner for 2.5s. Every XP gain writes a log entry.

XP sources: doing an activity (item's `xp`, default 5), executing a Next Move (10),
completing a manifest goal (50), and the legacy relationship actions (hang 4, date 8,
ask out 25, The One 80, meeting someone 5 + rarity×4).

### 5.3 In-game time

The app runs a **parallel fictional calendar** alongside real dates:

```
DAYS_PER_MONTH = 30       START_MONTH_INDEX = 3 (April)     START_YEAR = 2026
day starts at 1  →  displayed as "2026-04-01"

dayToMonthIndex(day) = floor((day − 1) / 30)
monthInfoFromIndex(i) = month (3+i) mod 12, year 2026 + floor((3+i)/12)
```

`tickDay()` advances one day: `day += 1`, `fear −= 0.1` (slow natural decay),
runs `dominoTick()`, and if the month rolled over, calls `finalizeMonth()` which computes a
recap (girls met, dates, misses, promotions, XP gained) and stores it on the month record.

**Note:** real-world dates are used separately for Eras, the Calendar, Birthday countdown,
Income projections, and the upgrade histories. The fictional day counter only advances when
you "Do" an activity or execute a Next Move.

### 5.4 Birthday countdown

Set a real birth date in settings. Home shows days to the next birthday, the age you'll turn,
and a progress bar through the current year. Recomputed every second while on Home via
`setInterval`. The countdown math borrows across calendar units properly (seconds → minutes →
hours → days → months → years).

---

## 6. Activities

**Page:** `activities` · **Reached from:** Lifestyle hub

The core slot system. Three nested levels: **Sections → Categories → Items**.

### Structure

- **Section** — optional grouping (e.g. "Main", "Side", "Career"). Collapsible, reorderable
  by drag. Categories without a section fall into a pseudo-section "Ungrouped".
- **Category** — e.g. Sports, Grooming. Has `maxSlots` (1–10, adjustable with +/−), a slot
  grid, and a "Bench" (unslotted inventory). Collapsible, draggable between sections.
- **Item** — the actual activity. Lives in a category's inventory; can be *slotted* (active)
  or *benched*.

### Item properties

| Field | Values | Effect |
|---|---|---|
| `kind` | `expansion` ▲ / `maintenance` ■ / `cost` ● | Drives the balance meter in Total Stats |
| `realm` | `real` ⬢ / `synthetic` ◇ | Physical/offline vs digital/screen-only |
| `time` | `HH:MM–HH:MM` | Duration feeds schedule hour math; prefills schedule entries |
| `meetBonus` | 0–15 | Feeds Meet bar and Vibe contribution |
| `xp` | 1–50 | XP awarded when you tap "Do" |
| `leadgen` | boolean | If true, mirrors into the Lead Gen "Lifestyle" method |
| `statEffects` | map of stat → ±N | Applied when you "Do" the activity |

### Interactions

- **Slot/unslot**: drag-and-drop (desktop) or "Slot →" button opening a slot picker (mobile).
  Dragging an item to a *different* category physically moves it between inventories.
- **Do**: applies `statEffects`, awards XP, logs it, and advances the in-game day.
- **Summary bar** at the top of the page: filled/total slots meter, counts of
  expansion/maintenance/cost among slotted items, total scheduled hours, category count.

### Balance verdicts (Total Stats overlay)

Counts slotted items by kind; lead-method slots always count as expansion.

```
costPct >= 50  → "You are draining yourself. Cut back on indulgences and costs."
costPct >= 30  → "Heavy on cost — indulgences are eating into your balance. Careful."
expPct  >= 70  → "Heavy on expansion — you are pushing growth hard. Don't burn out."
expPct  >= 45 && costPct <= 15 → "Healthy balance of expansion and maintenance."
expPct  >= 45  → "Good expansion push, but watch the costs creeping in."
expPct  >= 25  → "Maintenance-heavy. Go expand — slot a lead or a skill-building activity."
else           → "Almost all maintenance. You are coasting. Add expansion activities."
```

### Borough scoping

Activity categories and lead methods can be **global** or **scoped to a borough**. The
helper `actCats()` returns `D.activityCategories` when the current borough is the
`mainBorough`, otherwise that borough's own `activityCategories`. Same pattern for
`leadMethods()`. This lets you keep a separate activity set per place you live.

---

## 7. Lead Generation

**Page:** `leadgen` → `leadmethod` · **Reached from:** Entity, Money world, Home terminal

A parallel slot system modelling *how you meet people / generate opportunities*.

### The gain matrix

Each lead item has **difficulty × ROI**, which maps to a gain percentage:

| | low | medium-low | medium | high | very-high |
|---|---|---|---|---|---|
| **easy** | 1 | 2 | 4 | 6 | 8 |
| **medium** | 2 | 3 | 5 | 8 | 10 |
| **hard** | 3 | 5 | 7 | 10 | 12 |

An item's effective gain is `min(matrixValue, method.maxGain)`.

### The lead bar

```
computeLeadBar() = average of every slotted item's effective gain, clamped 0–100
```

Note it's a **mean, not a sum** — slotting one weak item *lowers* the bar. Scarcity matters.

### ROI → colour tier

ROI alone drives an item's visual tier:

| ROI | Tier | Feel |
|---|---|---|
| very-high | Legendary | red |
| high | Epic | yellow |
| medium | Rare | blue |
| medium-low | Uncommon | light green |
| low | Common | grey |

A method's card shows the rounded **average ROI index** of its slotted items.

### Leads and stars

Separate from gain %, each item tracks a raw **lead count**. 

```
LEADS_PER_STAR = 20      LEAD_MAX_STARS = 18
stars = min(18, floor(leadCount / 20))
```

Stars render as SVG (filled gold with glow, empty dashed outline). Shown per item, per
method, and globally ("POTENTIAL LEADS"). Edit mode exposes −/+/+10 buttons per item.

### Edit mode

Toggling "✎ Edit" on a method reveals controls to adjust `maxSlots` (1–10), `maxGain` (1–30),
add items, and adjust lead counts.

---

## 8. The Entity (Vibe)

**Page:** `vibe` → `vibecomp` · **Reached from:** Girls hub

The Entity is the app's "overall magnetism" score — one number composed of several parts,
all weighted equally.

### Composition

```
computeVibe() = average of:
    [ leadBarPercent, ...each vibeComponent's gain ]
clamped 0–100  →  written to player.stats.vibe (rounded)
```

Default components (each 2 slots, max gain 25%):

| Component | Icon | Meaning |
|---|---|---|
| **Vibe** | ✦ | Personal magnetism — the energy you put out, how you carry yourself |
| **Social Proof** | ● | How others perceive your social value — circles, events, credibility |
| **Style** | ◆ | Fashion, grooming, fragrance — how you present visually |
| **Energy** | ▲ | Confidence, body language, eye contact, presence |

Components are user-editable: you can add, rename, re-icon, delete, and adjust slots/max gain.

### Component gain

Component items use the same difficulty × ROI matrix as lead items:

```
componentGain = average(slotted item gains) + activityBonus
                clamped to [0, maxGain]
```

`activityBonus` applies **only to `vc-vibe`** and comes from your slotted activities:

```
per slotted activity:  1 + (meetBonus × 0.5) + (statEffectCount × 0.3)
```

So slotting real activities on the Activities page directly raises your Vibe — and the
`vc-vibe` detail page lists each contributing activity with its exact contribution.

---

## 9. People: girls, friends, relationships

> ⚠️ This is the app's **original** core (it began as a dating-sim-style RPG). Much of the
> random-encounter machinery still exists in code but **has no UI entry point** in the
> current build — see **[§15.2]**. Documented here in full so a rebuild can decide
> deliberately whether to keep, cut, or rework it.

### Roster

Two tabs: **Girls** and **Friends**, searchable, sorted by rarity then affinity.

- **Girl**: rarity 1–5★, origin, affinity 0–100, `looksLikeYou` 0–100 (hidden behind `?`
  until 3 dates), status, date count.
- **Friend**: rarity 1–5 doubling as their *Social star*. Each friend adds
  `rarity × 0.5` to the Meet bar.

### Relationship slots (`life` page)

```
SLOT 1 — THE ONE      exactly one girl, or empty
SLOT 2 — THE COMMONS  multiple girlfriends
CHASERS               everyone with status Talking or Dating
SIDELINED             demoted
```

**Gates:**
- Ask out (→ Common): `affinity >= 60`
- Promote to The One: `affinity >= 90` **and** `looksLikeYou >= 70`

Promoting a new The One sidelines the previous one.

### The domino engine

Runs every `tickDay()` when at least one slot is filled (`taken > 0`):

1. Every Talking/Dating girl gains `(1 or 2) × min(taken, 3)` affinity — being taken makes
   you more wanted.
2. If 2+ commons: a random winner gains +2 affinity, a random loser loses 2 — they compete.
3. If Slot 1 is empty, a common with `looksLikeYou >= 80` and `affinity >= 85` has a 25%
   chance per day to "challenge" for the slot (currently log-only).

The `life` page header shows the ratio: `{chasers} : 1 — girls chasing you`.

### The Meet bar (legacy)

```
percent =   1                           (base)
          + social      × 1.0
          + charm       × 0.5
          + sexAppeal   × 1.0
          + looks       × 1.0
          + boldness    × 0.5
          − fear        × 0.5
          + Σ(friend.rarity × 0.5)
          + Σ(customActivity.meetBonus)
          + coldApproachStreak × 1.0
          + taken × 2
clamped 0–150  (display caps at 100 — it can exceed 100, like shiny odds)
```

Expected rarity: `>=100 → 5★`, `>=80 → 4★`, `>=50 → 3★`, `>=25 → 2★`, else `1★`.

**Rarity roll** — weighted, shifting toward higher tiers as the bar grows:
```
base weights [40, 30, 20, 8, 2] for 1★–5★
weight[i] = max(1, base[i] × (1 + (i − 2) × percent/100))
```

**Encounter** (`rollEncounter`): roll 0–100 against the bar. Miss → `fear += 1` and a
"nobody hit it off" log. Hit → generate a girl at the rolled rarity, award `5 + rarity×4` XP,
screen-flash animation.

**Cold approach**: `successChance = clamp(30 + boldness×5 − fear×3, 5, 90)`.
Success → `boldness += 2`, `fear −= 1`, streak +1, generate a girl at `rollRarity(bar + 10)`.
Failure → `fear += 2`, streak reset to 0.

**Summon** — pay for a guaranteed meet:

| Venue | Cost | Rarity range |
|---|---|---|
| Cheap bar | $30 | 1★–3★ |
| Nice lounge | $80 | 2★–4★ |
| VIP gala | $200 | 3★–5★ |

**Generated girl**: `affinity = 5 + rarity×4`, `looksLikeYou = clamp(20 + rarity×10 + rand×40, 0, 100)`.

**Actions**: Hang out ($5, +6 affinity, +1 social, +1 charm, 4 XP) ·
Date ($20, +12 affinity, +1 charm, 8 XP) · Sideline · Release.
Hang out with a friend: `+friend.socialStar social`, `+1 charm`, `3 + star` XP.

---

## 10. Planning layer: Northstar, Eras, Manifest

### 10.1 Northstar

One sentence — the direction everything else serves. Optional deadline turns the Home card
into a big day-countdown. Displayed uppercase in a hero card on Home.

### 10.2 Eras ("Main Quest")

A named, dated, coloured span of time — a chapter or sprint.

```
Era = { name, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', color }
```

**Home widget** shows the *current* era (earliest-starting active one) with a progress bar:
days passed, days left. If none is active, it shows the next upcoming one with "starts in N
days". Otherwise an empty prompt.

**Calendar overlay**: an era list (status: past / current / planned) plus a **12-month year
grid**. Every day cell covered by an era is tinted with that era's colour; first and last
days get rounded ends; days covered by multiple eras are marked. Today is highlighted.
Monday-first week layout. Year dropdown spans all era-covered years plus the current year.

Palette: 10 fixed colours (`#ff6b6b, #ffa94d, #ffd43b, #8ce99a, #4dd4ac, #63e6be, #74c0fc,
#9775fa, #da77f2, #f783ac`).

### 10.3 Manifest ("Side Quest")

Goals broken into milestones broken into tasks. Framing: *"Set a goal, detach, and do your
best on what's required."*

```
Manifest → milestones[] → tasks[{ name, done }]

manifestProgress  = done tasks / total tasks across all milestones  (%)
milestoneProgress = done tasks / tasks in that milestone            (%)
milestoneDone     = tasks.length > 0 && every task done
```

Completing the final task of a goal awards **50 XP** and fires
`🎯 Goal "<name>" ACHIEVED!`. Everything is collapsible at both levels and editable inline
from either the list page or the detail page. A global free-text "INFORMATION" box holds
rules/notes that apply across all goals.

Home shows the top 3 incomplete goals as compact progress cards.

### 10.4 Abilities

Named capabilities ("Defend yourself in a fight") that are **locked or unlocked** and can be
**assigned** to specific activity items or lead items. Assigned abilities appear as chips
(◈) on those item tiles — locked chips dimmed, unlocked highlighted. The idea: you gain the
ability by doing the things it's attached to. Unlock is currently manual.

---

## 11. Time layer: Schedule & Time Allocation

Both live on the **TIME** page. They answer different questions: *Time Allocation* is the
ideal shape of a day; *Schedule* is the actual week.

### 11.1 Time Allocation ("the ideal day")

Multiple named **day types** ("Work day", "Weekend", "Monk day") as tabs. Each holds painted
**time slots**:

```
TimeSlot = { title, start: 'HH:MM', end: 'HH:MM', color, levelUpRef? }
```

Rendered as a **24-hour SVG strip** (viewBox 0 0 360 170): a horizontal bar from x=10–350,
y=118–146, with hour ticks every 6h (labelled 0:00 / 6:00 / 12:00 / 18:00 / 23:59) and
minor ticks every 3h. Each slot is a coloured rectangle positioned by
`x = 10 + (minutes/1440) × 340`, with a staggered label above (3 rows, 32px apart) connected
by a pointer line and dot. Tapping a block opens its editor.

Six slot colours: `#4EC8FF #40E382 #FFCB1C #FF3366 #C852FF #FF7B00` (auto-cycled by index).

Validation: title required, both times required, end must be after start.

### 11.2 Weekly Schedule

Mon–Sun tabs. Each day holds entries:

```
ScheduleEntry = { time: 'HH:MM–HH:MM', name, catId, activityItemId, levelUpRef? }
```

Entries can be: an **existing activity** (prefills its time), a **custom name**, or a
**Level-Up move** (see §12.2).

**Time parsing** (`parseTimeRange`) handles `–` or `-` separators, computes duration in
hours rounded to the nearest 0.5, and wraps overnight spans (+24h if negative).

### 11.3 Week analytics

This is the most computed part of the app. `computeScheduleWeekStats()` produces:

- **Per day**: total hours, hours by category, hours by stat, full activity list, entry count
- **Per week**: total hours, hours by category, hours by stat, and detail arrays mapping
  each stat/category back to the specific day+activity+hours that produced it

Rendered as:

1. **Week overview** — 7 day cards with activity dots, count, hours, a per-day stat
   mini-breakdown with percentages, and "Nh free" (24 − scheduled).
2. **Active day breakdown** — scheduled vs 24h with a usage bar, each activity with its
   time, stat chips, hours and % of day, plus an explicit **"Not Scheduled — Free/Unplanned"**
   row for the remainder.
3. **Weekly total** — BY STAT and BY CATEGORY sections, each with a bar, hours, %, day
   chips, and an expandable per-day activity detail.

A stat only accrues hours if the scheduled activity has a non-zero `statEffect` for it.
This same renderer serves both the global schedule and each lifestyle's own schedule.

### 11.4 Lifestyle

A **lifestyle** is a named "team composition" of activities — like a party build.

- Add activities from any category; each shows under a mapped *source label*
  (e.g. School/Classes → "Socialising/Networking", Sports/Combat → "Physical Training",
  Part-time Job → "Income/Work", Grooming → "Self-Care/Appearance").
- **Contribution breakdown**: sums each activity's stat effects, Meet bonus, and
  `Vibe (when slotted)` value (`1 + meetBonus×0.5 + statCount×0.3`), sorted ascending, each
  with a bar and % of the absolute total.
- **Total Score** = sum of absolute contribution values; lifestyles are **ranked** against
  each other (`#1 Highest score`).
- One lifestyle can be **Active** at a time.
- Each lifestyle has its **own weekly schedule**, with the same full analytics.

---

## 12. ME: Body Map, Level Up, history

**Page:** `me`

### 12.1 The Body Map

An SVG human silhouette (viewBox 0 0 360 420) drawn as a single bezier path. Your personal
stat elements ("body-map stats") are pinned to it as draggable dots with leader lines to
labels on the left and right edges.

```
MeStat = { title, desc, stars: 0–25, mapX?, mapY?, levelUp[], history[] }
```

**Auto-placement** by keyword when no position is saved:

| Keywords | Position |
|---|---|
| inner, organisation, mind, mental, focus, discipline | head (200, 34) |
| circle, friends, network, crew | right shoulder (220, 88) |
| social | left shoulder (140, 88) |
| health, energy, sleep | chest (172, 118) |
| physique, fitness, body, gym, muscle, strength | left arm (120, 150) |
| money, finance, wealth, income, cash | right side (240, 180) |
| lifestyle, style, routine | legs (165, 300) |

Unmatched stats cycle through 5 fallback positions. Dragging a dot saves `mapX`/`mapY`
permanently. A drag-guard flag stops the drag from also opening the edit modal.

Labels are split left/right by x-position, sorted by y, and evenly spaced (max 60px apart).

The rest of the ME page: a stats grid (all 11, each `N/25` except money) linking to stat
detail pages, quick-action cards (Total Stats, Abilities, Calendar, World), and a
relationship slots preview.

### 12.2 Level Up moves

Every "stat element" — body-map stats **and** social media platforms — carries a list of
concrete moves that raise it:

```
levelUp: [{ id, text }]      e.g. "Train 3× a week", "Post 4 times a week"
```

These live in a **shared registry** so other systems can reference them by
`{ statId, moveId }`. Two consumers today:

- **Schedule**: the activity picker has an `⤴ Level-up moves` optgroup. Picking one creates
  an entry named after the move with a stored `levelUpRef`; the row shows
  `⤴ levels up <Stat>`.
- **Time Allocation**: the slot painter has an optional level-up select that prefills the
  title; linked slots are marked `⤴` on the day strip.

The stat's own Level Up section shows **usage chips** counting where each move is used
(`◷ schedule ×N`, `▮ time alloc ×N`), so you can see which intentions you've actually
built into your week.

### 12.3 Upgrade history

Every stat element records each level change:

```
history: [{ t: timestamp, from: number|null, to: number }]
```

Seeded with `{ from: null, to: initial }` on creation ("started at 4/25"). Appended on every
save **that actually changes the level** (no-op saves record nothing).

Shown as a **◆ PAST UPGRADES** section in the stat's modal: date, `7 → 9 / 25`, and a
`▲ +2` (green) or `▼ -1` (red) delta chip. Last 10 shown with a "+N earlier" note.
Portal stat doors show the most recent change inline (`last ↑  +2 · 18 jul 26`).

Rating items have their own parallel upgrade history — see §13.3.

---

## 13. The Portal and its worlds

**Page:** `portal` — the main hub. A gradient hero, then "WORLDS".

Top row, three doors with live stat rows:

| Door | Shows |
|---|---|
| **LIFESTYLE** | lifestyle count, friends, platforms, up to 2 social body-map stats |
| **$ MONEY** | goal, balance, money stat level |
| **⭐️** | first 4 rating categories with tier + % of potential |

Then `⌘ DIGITAL SYSTEM` (a shortcut into the "Digital system" rating category), then
**one door per remaining body-map stat** showing its level, last upgrade, and note.

### 13.1 Social world

`social` → areas grid: **Girls**, **Social life** (platforms), **Circle** (friends),
**Meet**, **Events & Parties**. Plus a "YOUR SOCIAL STATS" terminal listing body-map stats
whose title matches `/social|circle|friend/i`.

**Social Media page**: platforms with a 0–25 "how alive is it" level, description, progress
bar, and the feed note *"⚡ FEEDS → ONLINE PRESENCE"*. Each platform carries Level Up moves
and upgrade history like body-map stats.

### 13.2 Money world

`money` → goal card, balance terminal, income terminal, and area cards (Money Stat,
Manifest, Lead Gen) + a "YOUR MONEY STATS" terminal.

**Income page**: streams split into **FLOWING** and **POSSIBLE STREAMS**. Summary terminal
shows $/month, $/year, hours invested, "if possibles land +$X/mo", and the projected goal
date. Each stream: amount, hours/week, and a computed **effective hourly rate**
(`amount × 12 / (hours × 52)`).

**The projection engine** — the most mathematically interesting part:

```
Each stream has dated milestones: { date: 'YYYY-MM', amount }

streamValueAt(stream, t):
    points = [{ now, currentAmount }, ...future milestones sorted by date]
    → linear interpolation between surrounding points
    → flat before first / after last

totalIncomeAt(t) = Σ streamValueAt(stream, t) for all non-possible streams

projectGoalEta():
    balance = current money
    walk month by month (up to 240 months):
        balance += totalIncomeAt(month)
        if balance >= moneyGoal → return that month
```

Rendered as hand-built **SVG line graphs** (360×200) with y-grid + `$Nk` labels, x labels
(start/mid/end as `Mon 'YY`), an optional goal line, filled area under the curve, and
clickable points that open the milestone editor.

### 13.3 Ratings world (⭐)

*"Everything you run — rated S to F, pushed to its potential."*

A **3-layer tree** for everything you own and use:

```
Layer 1  Category    Hair, Face, Dental, Shower, Clothes, Digital system, Physique…
Layer 2  Sub-node    "Neus", "Redness", "Hair routine"…
Layer 3  Items       Adapalene, Cleanser, Moisturizer, Biore…
```

Layers 1 and 2 carry a tier, description, and an optional **routine** flag with minutes
(shown as `⏱ 15 min routine`).

**Tiers and values:**

| Tier | S | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|
| Value | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
| Colour | `#FFCB1C` | `#C852FF` | `#4EC8FF` | `#40E382` | `#FFE81A` | `#FF7B00` | `#FF3B30` |

**% of potential** — the headline metric, rendered as a red→green gradient bar:

```
node with items:    Σ TIER_VAL(owned items) / (ownedCount × 6) × 100
node with children: average of children's percentages
                    ("owned" excludes items flagged `later`)
```

So 100% means every item you use is rated S. The bar is literally "how close is this part
of your life to its ceiling".

**Items** carry: current tier, a `later` flag (planned, not owned yet — shown dashed under
"◇ ADD LATER"), and an optional **upgrade**:

```
upgrade = { name, tier, price }
```

**The Zelda-style upgrade screen**: tapping an item with a planned upgrade shows
`current (tier) ➜ target (tier)` side by side with the price and your balance. If you can't
afford it, the button reads "Not enough $" and is disabled. Confirming:

1. Deducts the price from `player.stats.money`
2. Records the upgrade in the item's `upgrades[]` history
3. Replaces the item's name and tier with the upgrade's
4. Clears the `later` flag and the pending upgrade
5. Logs it

**Past upgrades** are then shown in both the item editor and the upgrade screen: date,
`Biore (A) ➜ La Roche-Posay (S)` with tier letters in their colours, and a gold `$25` price
chip. Last 10, newest first.

### 13.4 World map

`world` → city cards (borough count, place count, "unlocked" count = all inventory items +
lead items + places inside). `citydetail` → borough sections with **places** (name, type,
notes, visited toggle). One borough is the **main** borough (★) — it shows your global
activities and lead methods; others have their own scoped sets.

**Next Moves**: planned actions with stat effects and an optional city. "Execute" applies
the effects, awards 10 XP, logs it, removes the move, and advances a day.

---

## 14. Cross-system links (the "feeds" web)

This is what makes LIFE a system rather than a set of lists. Four automatic links:

```
┌──────────────────┐   level 0–25 → ROI tier    ┌─────────────────────┐
│  Social Media    │ ─────────────────────────► │  Lead Gen:          │
│  platforms       │   auto-mirrored items      │  Online Presence    │
└──────────────────┘                            └─────────────────────┘

┌──────────────────┐   leadgen: true            ┌─────────────────────┐
│  Activity items  │ ─────────────────────────► │  Lead Gen:          │
│                  │   auto-mirrored items      │  Lifestyle (auto)   │
└──────────────────┘                            └─────────────────────┘

┌──────────────────┐   1 + meetBonus×0.5        ┌─────────────────────┐
│  Slotted         │     + statCount×0.3        │  Entity component:  │
│  activities      │ ─────────────────────────► │  vc-vibe            │
└──────────────────┘                            └─────────────────────┘

┌──────────────────┐   mean of all parts        ┌─────────────────────┐
│  Lead bar +      │ ─────────────────────────► │  player.stats.vibe  │
│  all components  │                            │  (overwritten)      │
└──────────────────┘                            └─────────────────────┘

┌──────────────────┐   { statId, moveId }       ┌─────────────────────┐
│  Level-Up moves  │ ─────────────────────────► │  Schedule entries + │
│  on stat elements│   usage counted back       │  Time Alloc slots   │
└──────────────────┘                            └─────────────────────┘
```

### Platform → Online Presence

A platform's 0–25 level maps to the ROI of its mirrored lead item:

```
level >= 21 → very-high      level >= 16 → high       level >= 11 → medium
level >=  6 → medium-low     else        → low
```

`syncOnlinePresenceFeeds()` creates/updates/removes mirror items (id `sm-mirror-<platformId>`)
and cleans dangling slots. Mirror items can't be deleted directly from Lead Gen — you remove
the platform.

### Activity → Lifestyle lead method

`syncLifestyleLeads()` collects every activity item with `leadgen: true`, creates the
`lm-lifestyle` method on demand (2 slots, maxGain 15), and mirrors each as
`li-mirror-<activityId>` at medium/medium. Names stay in sync. Removing the flag removes the
mirror. Attempting to delete a mirror shows: *"Toggle 'Generates Leads' off on the activity
to remove this."*

Both sync functions run on every Lead Gen render and on every activity/platform mutation.

---

## 15. Known issues & dead code

**Read this before rebuilding.** These are real defects in the current build.

### 15.1 ⚠️ The defaults/migration split — the most important bug

`defaultData()` and the migration chain in `load()` are **two separate sources of truth**,
and `load()` returns early when localStorage is empty:

```js
function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return;          // ← fresh install skips ALL migrations below
  ...
  if (!Array.isArray(D.timeAllocs)) D.timeAllocs = [...]   // never runs on fresh install
}
```

Any field created only by a migration is **undefined on a fresh install**. This has already
caused two production crashes:

- `D.timeAllocs` undefined → `currentTimeAlloc()` threw → killed the whole TIME page render
  → the "+ Add" button silently did nothing. *Only reproduced on mobile* because the
  developer's desktop had old localStorage where the migration had run.
- `D.ratings` undefined → the entire ⭐ world broken on fresh installs.

Both were patched by adding the fields to `defaultData()` and making accessors self-healing,
but **the pattern will keep producing this bug**.

**Fix in the rebuild:** one schema definition with defaults, a `version` field on the saved
blob, and a numbered migration chain that always runs — including on fresh data. Test every
feature with empty localStorage.

### 15.2 Orphaned systems (code exists, no UI entry point)

Verified by grep — each of these appears exactly once in the codebase (its own definition):

| Function / element | Status |
|---|---|
| `rollEncounter()` | Random meet encounter — never called |
| `openSummonModal()` / `doSummon()` | Summon venues — never called |
| `renderMeet()` | Meet bar page renderer — the page isn't in `index.html` |
| `endDay()` | Day advance button — never called |
| `#home-activity-feed` | `renderHome()` writes to it; element doesn't exist |
| `#activities-presets`, `renderActivities()` | Superseded by `renderActivitiesV2()` |
| `PRESET_ACTIVITIES`, `customActivities`, `doActivity()` | Legacy pre-category system |
| `#meet-bar-fill` | Referenced by dead `renderMeet()` |

The whole random-encounter / summon / cold-approach layer is **vestigial**. `computeMeetBar()`
is still live (the Social world's "Meet" card shows its percentage), and `customActivities`
still feeds it, but nothing can create a custom activity any more.

**Decision needed in the rebuild**: keep the dating-sim layer as a real feature, or cut it
and keep LIFE purely as the life-management system it has evolved into. Roughly 600 lines of
`app.js` are dead or near-dead.

### 15.3 Other issues

- **Field naming**: `MeStat.stars` holds a 0–25 level, not stars. `Friend.rarity` doubles as
  `socialStar`. Rename in a rebuild.
- **No input sanitisation on IDs**: every handler is an inline `onclick="fn('${id}')"` string.
  IDs are generated (safe today) but names are only escaped via `escapeHtml`, and some are
  interpolated into attributes (`addLifestyleActivity(... '${escapeHtml(sourceLabel)}' ...)`)
  where a quote would break the handler.
- **No undo** anywhere. Deletes are `confirm()`-gated at best.
- **Full re-render on every change** — fine at current scale, will not survive growth.
- **`_collapsed` / `_invOpen` UI flags are persisted** into the save blob alongside real data.
- **The in-game day counter** only advances on "Do"/"Execute", so the fictional calendar
  drifts arbitrarily from real time — while Eras, Birthday, Income and histories all use
  real dates. Two unrelated clocks.
- **No tests, no types, no build step.**

---

## 16. Design system

### Palette (`styles.css :root`)

```css
--bg-primary:  #12172B      /* deep navy — the canvas */
--bg-secondary:#1B2244
--bg-card:     rgba(255,255,255,0.06)
--bg-modal:    rgba(18,23,43,0.97)

--border-subtle:       rgba(255,255,255,0.08)
--border-medium:       rgba(255,255,255,0.14)
--border-accent:       rgba(120,170,255,0.25)
--border-accent-strong:rgba(120,170,255,0.45)

--cyan:   #4EC8FF    /* primary accent */
--green:  #40E382    /* positive / gain */
--yellow: #FFE81A
--red:    #FF3B30    /* negative / danger */
--pink:   #FF3366    /* action buttons */
--purple: #C852FF
--gold:   #FFCB1C    /* history / premium */
--orange: #FF7B00

--text-primary:  #ECF0FA
--text-secondary:#A4B0D0
--text-muted:    #6878A0
--text-dark:     #465170

--font-mono: 'JetBrains Mono', 'SF Mono', monospace
--font-sans: 'Inter', -apple-system, sans-serif
--dock-height: 72px
--safe-bottom: env(safe-area-inset-bottom, 0px)
```

### The brutalist skin (`brutalist.css`)

Loaded **after** `styles.css` as an override layer. The defining treatment:

```css
--font-display: 'Archivo Black'       /* all titles and section headers */
--font-sans:    'Space Grotesk'       /* body */

#app * { border-radius: 0 !important; }         /* zero rounding, everywhere */

/* Cards: 3px hard border + hard offset shadow, no blur */
--b-shadow-cyan:   6px 6px 0 #4EC8FF;
--b-shadow-pink:   6px 6px 0 #FF3366;
--b-shadow-gold:   6px 6px 0 #FFCB1C;
--b-shadow-green:  6px 6px 0 #40E382;
--b-shadow-purple: 6px 6px 0 #C852FF;
```

Flat `#12172B` background with no gradients, plus a subtle scanline overlay across the app.
Accent shadow colours rotate across card types. The result reads like a terminal/arcade UI.

### Recurring components

| Class | Role |
|---|---|
| `.page` / `.page-scroll` | Full-screen page, scroll container |
| `.section-header` | Uppercase label + optional small action button |
| `.hub-card` | Big tappable row: icon, title, description, → arrow |
| `.world-door` | Portal door with stat rows (`.world-hl`) |
| `.term-sect` / `.term-row` | "Terminal" panel — mono label/value rows |
| `.method-row` | Lead method / vibe component row with gain on the right |
| `.lead-tile` / `.act-tile` | Draggable item tile with tier colouring |
| `.slot-zone` / `.act-slot-zone` | Drop target, `.slot-filled` when occupied |
| `.pill-btn` | Modal buttons; `.good` (cyan), `.danger` (red), `.warm` |
| `.small-btn` | Pink action button in section headers |
| `.tier-badge` / `.tier-pick` | S–F tier chip / picker |
| `.empty-state` | Muted prompt for empty lists |
| `.toast` | Transient bottom message (2.8s) |
| `.level-up-banner` | Full-screen LEVEL UP flash (2.5s) |
| `.pot-bar` | Red→green "% of potential" gradient bar |
| `.levelup-sect` / `.hist-sect` | Level Up moves / Past Upgrades panels |

### Visual language rules

- Icons are **text glyphs**, not emoji fonts: `[SPT]`, `[JOB]`, `◆ ▲ ■ ● ✦ ◉ ⚡ ⤴ ➜ ◇ ⬢`
- Every score shows its ceiling: `8/25`, `88% of potential`, `5/18★`
- Section headers are uppercase, letter-spaced, mono/display
- Values are mono; prose is sans
- Green = gain, red = loss, gold = history/premium, cyan = primary, pink = act

---

## 17. Rebuild guide

### Build order

Each phase is independently usable — don't build the whole graph before anything works.

**Phase 1 — Foundation**
1. Typed schema from **[§3]** with versioned defaults and a migration chain that
   **always runs** (fixes **[§15.1]**)
2. Persistence (localStorage or a real backend), export/import JSON, reset
3. Page shell, 5-tab dock, routing, shared modal, toast

**Phase 2 — The slot engine** *(this is the heart — get it right once, reuse everywhere)*
4. A generic `SlotSystem` component: inventory + N slots + tap-to-slot + drag-to-slot +
   add/edit/delete items + adjustable slot count
5. Activities on top of it (categories, sections, kinds, realms, time)
6. Lead Generation on top of it (difficulty × ROI matrix, lead counts, stars)
7. The Entity on top of it (components, the vc-vibe activity bonus)

**Phase 3 — Personal state**
8. Stats, XP, levelling, the log
9. ME page + body map + Level Up moves + upgrade history
10. Portal with dynamic stat doors

**Phase 4 — Time**
11. Time Allocation (day types, SVG strip)
12. Weekly Schedule + the full week analytics renderer (reused for lifestyles)
13. Lifestyle (team composition, contribution breakdown, ranking, own schedule)

**Phase 5 — Worlds**
14. Ratings world (3-layer tree, % of potential, upgrade screen, upgrade history)
15. Money world (incomes, projection engine, SVG graphs, goal ETA)
16. Social world (platforms)

**Phase 6 — Planning & links**
17. Northstar, Eras, Calendar grid, Manifest, Abilities
18. **All cross-system feeds from [§14]** — wire these last, after both ends exist
19. World map, boroughs, places, Next Moves

**Phase 7 — Decide**
20. Keep, rework, or cut the dating-sim layer (**[§15.2]**)

### Invariants to preserve

- **Slots are scarce, and the bar is a mean.** Lead bar and component gains are *averages*
  of slotted items, so adding a weak item lowers the score. This is deliberate — it forces
  choice. Don't "fix" it into a sum.
- **`player.stats.vibe` is derived.** Recompute on every render; never let it be set.
- **Mirrored items are not user-owned.** They're created, updated and destroyed by the sync
  functions. Block direct deletion and point the user at the source.
- **"% of potential" is the signature metric.** `Σ value / (count × max)` — keep the
  red→green bar and the phrasing everywhere.
- **History is append-only, and only on real change.** A save with no level change records
  nothing.
- **Every number shows its ceiling.**

### What to do differently

1. **One source of truth for schema + defaults.** This single change prevents the entire
   bug class in **[§15.1]**.
2. **Types everywhere.** The data model is intricate (mirrors, refs, 3-layer trees); a type
   system catches the `levelUpRef`/`sourceActivityId` dangling-reference class for free.
3. **Component-ise the slot system.** It's implemented four separate times today
   (activities, leads, vibe components, and partly ratings). Build it once.
4. **Component-ise "rated thing with levelUp + history".** Body-map stats and social
   platforms are already the same shape; rating items are close. Unify them.
5. **Real referential integrity.** `levelUpRef`, `catId`/`activityItemId`, ability
   assignments and lifestyle activities can all dangle when the target is deleted. Today
   each read site defensively re-checks. Either cascade deletes or centralise resolution.
6. **Separate the two clocks** — or drop the fictional in-game calendar entirely and run
   everything on real dates. The current split (day counter vs real dates) serves nothing.
7. **Undo for destructive actions.**
8. **Test with empty localStorage, on a phone, every time.**

### Copy voice (keep this)

Second person, direct, a little hard. Prompts are questions, not labels:

> "What part of you is this?" · "How strong is it right now?" · "What's the current setup?"
> "What exactly gets this to the next level? Write the moves." · "Call your shot."
> "How much are you chasing?" · "What number are you chasing? Tap to set it."
> "Empty day — tap '+ Add' and paint your perfect one." · "Nothing on the map yet."
> "You are coasting. Add expansion activities." · "It landed — start flowing."
> "Set a goal, detach, and do your best on what's required."

Buttons are verbs with attitude: *Paint it · Lock it in · Call it · Put it on the map ·
Cut it · Wipe it · Drop it · Never mind · Take it off · It landed*.

---

*Generated from the LIFE codebase at commit `03b8449`.*
