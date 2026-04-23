/* ============================================
   LIFE — Life RPG Logic
   ============================================ */

// ── Constants ──
const XP_BASE = 100;
const XP_MULT = 1.4;

const RARITY_LABEL = {
  5: '5★ Legendary', 4: '4★ Epic', 3: '3★ Rare', 2: '2★ Common', 1: '1★ Basic',
};

const STAT_KEYS = ['money', 'boldness', 'fear', 'health', 'social', 'charm', 'sexAppeal', 'power', 'fight', 'looks', 'vibe'];
const STAT_LABELS = {
  money: 'Money', boldness: 'Boldness', fear: 'Fear', health: 'Health',
  social: 'Social', charm: 'Charm', sexAppeal: 'Sex Appeal', power: 'Power', fight: 'Fight', looks: 'Looks', vibe: 'Vibe'
};
const STAT_CSS = {
  money: 'money', boldness: 'boldness', fear: 'fear', health: 'health',
  social: 'social', charm: 'charm', sexAppeal: 'sex', power: 'power', fight: 'fight', looks: 'looks', vibe: 'vibe'
};
const STAT_EMOJI = {
  money: '$', boldness: '!', fear: '~', health: '+', social: '●',
  charm: '◆', sexAppeal: '♦', power: '■', fight: '▲', looks: '○', vibe: '✦'
};
const STAT_DESC = {
  money: 'Currency. Earned from work, spent on dates, summons and lifestyle.',
  boldness: 'Raised by successful cold approaches and wins. Gates risky actions.',
  fear: 'Grows from failures and rejections. Offsets boldness.',
  health: 'Raised by sports, rest and grooming. Drained by overwork.',
  social: 'Raised by hangouts and parties. Feeds the Meet bar strongly.',
  charm: 'Charisma. Grows from social wins and successful dates.',
  sexAppeal: 'Grows from sports + charm combos. Major Meet driver.',
  power: 'Raw strength — built by strength sports.',
  fight: 'Combat skill — raised by combat activities (Judo, boxing).',
  looks: 'Grooming and style. Feeds the Meet bar like Sex Appeal.',
  vibe: 'The Entity — one thing composed of Vibe, Lead Generation, Social Proof, Style, and Energy. All parts equal. Tap to see the big picture.'
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_PER_MONTH = 30;
const START_MONTH_INDEX = 3; // April
const START_YEAR = 2026;

const PRESET_ACTIVITIES = [
  {
    id: 'p-job', name: 'Part-time Job (shift)', desc: 'Clock in a shift at your job.',
    effects: { money: +25, health: -2 }, meetBonus: 0, xp: 8,
    emoji: '[JOB]', kind: 'job'
  },
  {
    id: 'p-gym', name: 'Gym Session', desc: 'Hit the weights.',
    effects: { health: +2, power: +2, sexAppeal: +1 }, meetBonus: 1, xp: 6,
    emoji: '[GYM]', kind: 'sport'
  },
  {
    id: 'p-run', name: 'Go for a Run', desc: 'Cardio morning.',
    effects: { health: +3, sexAppeal: +1 }, meetBonus: 1, xp: 5,
    emoji: '[RUN]', kind: 'sport'
  },
  {
    id: 'p-class', name: 'Attend Classes', desc: 'Show up, pay attention, meet classmates.',
    effects: { social: +1 }, meetBonus: 3, xp: 8,
    emoji: '[CLS]', kind: 'school'
  },
  {
    id: 'p-party', name: 'Go to a Party', desc: 'Socialize at a house / club party.',
    effects: { social: +3, charm: +2, health: -1, money: -10 }, meetBonus: 2, xp: 10,
    emoji: '[PTY]', kind: 'social'
  },
  {
    id: 'p-rest', name: 'Rest Day', desc: 'Recover health and chill.',
    effects: { health: +3, fear: -1 }, meetBonus: 0, xp: 2,
    emoji: '[RST]', kind: 'rest'
  },
];

const SUMMON_COST_TABLE = [
  { label: 'Cheap bar', cost: 30, minRarity: 1, maxRarity: 3 },
  { label: 'Nice lounge', cost: 80, minRarity: 2, maxRarity: 4 },
  { label: 'VIP gala', cost: 200, minRarity: 3, maxRarity: 5 },
];

const FEMALE_NAMES = [
  'Ava', 'Mia', 'Luna', 'Zoe', 'Iris', 'Nora', 'Sofia', 'Lily', 'Emma', 'Isla', 'Aya', 'Rei',
  'Maya', 'Nia', 'Sasha', 'Yara', 'Lena', 'Ines', 'Kira', 'Juno', 'Hana', 'Leah', 'Vera',
  'Rosa', 'Noa', 'Ella', 'Elin', 'Selin', 'Selma', 'Mina', 'Clara', 'Amara', 'Alia'
];
const MALE_NAMES = [
  'Mike', 'Jay', 'Theo', 'Luca', 'Finn', 'Kai', 'Ren', 'Nico', 'Sam', 'Milo',
  'Noah', 'Liam', 'Ezra', 'Rafa', 'Dario', 'Nate', 'Owen', 'Leo', 'Max', 'Ben'
];

const GIRL_ORIGINS = [
  'Coffee shop', 'Campus hallway', 'Gym', 'Library', 'Bar', 'Club', 'Park', 'Bus stop',
  'Bookstore', 'Cold approach on street', 'Friend\'s party', 'Class project', 'Elevator'
];

// ── State ──
function defaultData() {
  return {
    player: {
      level: 1, xp: 0,
      stats: { money: 0, boldness: 1, fear: 1, health: 5, social: 1, charm: 1, sexAppeal: 1, power: 1, fight: 1, looks: 1, vibe: 0 },
      streaks: { coldApproach: 0 },
    },
    girls: [],
    friends: [],
    relationships: { theOne: null, commons: [], sidelined: [] },
    customActivities: [],
    // Categorized activity inventories with drag-drop slots.
    // Each category: { id, name, emoji, maxSlots, slots:[itemId|null,...], inventory:[ {id,name,emoji,statEffects,meetBonus} ] }
    activityCategories: defaultActivityCategories(),
    // Lead generation — parallel system feeding its own bar
    leadgen: defaultLeadgen(),
    // Vibe components — the big picture (Lead Gen is one part)
    vibeComponents: defaultVibeComponents(),
    // World map + cities
    world: defaultWorld(),
    // Planned self-moves
    nextMoves: [],
    log: [],            // { t, day, month, year, msg, tag }
    months: {},         // "2026-3" -> { events: [], summary: {...} } (index 3 = April)
    day: 1,
    settings: {},
    abilities: [],      // [{id, name, desc, unlocked, assignments:[{type:'activity'|'leadmethod', methodId, itemId}]}]
    northstar: null,    // { text, updatedAt }
    eras: [],           // [{ id, name, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', color, createdAt }]
  };
}

function defaultActivityCategories() {
  return [
    { id: 'cat-sports', name: 'Sports', emoji: '[SPT]', maxSlots: 3, slots: [null, null, null], inventory: [] },
    { id: 'cat-job', name: 'Part-time Job', emoji: '[JOB]', maxSlots: 1, slots: [null], inventory: [] },
    { id: 'cat-school', name: 'School / Classes', emoji: '[CLS]', maxSlots: 2, slots: [null, null], inventory: [] },
    { id: 'cat-combat', name: 'Combat', emoji: '[CMB]', maxSlots: 2, slots: [null, null], inventory: [] },
    { id: 'cat-social', name: 'Social', emoji: '[SOC]', maxSlots: 2, slots: [null, null], inventory: [] },
    { id: 'cat-grooming', name: 'Grooming', emoji: '[GRM]', maxSlots: 1, slots: [null], inventory: [] },
    { id: 'cat-custom', name: 'Other', emoji: '[···]', maxSlots: 3, slots: [null, null, null], inventory: [] },
  ];
}

function defaultLeadgen() {
  return {
    methods: [
      {
        id: 'lm-job', name: 'Part-time Job', emoji: '[JOB]', maxSlots: 1, maxGain: 15, slots: [null],
        inventory: [
          { id: 'li-ah', name: 'Albert Heijn vakkenvuller', difficulty: 'easy', roi: 'medium' },
        ]
      },
      { id: 'lm-cold', name: 'Cold Approach', emoji: '[CLD]', maxSlots: 2, maxGain: 20, slots: [null, null], inventory: [] },
      { id: 'lm-event', name: 'Event Hosting', emoji: '[EVT]', maxSlots: 1, maxGain: 12, slots: [null], inventory: [] },
      { id: 'lm-online', name: 'Online Presence', emoji: '[NET]', maxSlots: 2, maxGain: 10, slots: [null, null], inventory: [] },
    ],
  };
}

function defaultVibeComponents() {
  return [
    {
      id: 'vc-vibe', name: 'Vibe', emoji: '✦', maxSlots: 2, maxGain: 25, slots: [null, null],
      desc: 'Your personal magnetism — the energy you put out, how you carry yourself, the feeling people get around you.',
      inventory: []
    },
    {
      id: 'vc-socialproof', name: 'Social Proof', emoji: '●', maxSlots: 2, maxGain: 25, slots: [null, null],
      desc: 'How others perceive your social value — friend circles, being seen at events, social media credibility.',
      inventory: []
    },
    {
      id: 'vc-style', name: 'Style', emoji: '◆', maxSlots: 2, maxGain: 25, slots: [null, null],
      desc: 'Fashion, grooming, fragrance — how you present yourself visually.',
      inventory: []
    },
    {
      id: 'vc-energy', name: 'Energy', emoji: '▲', maxSlots: 2, maxGain: 25, slots: [null, null],
      desc: 'Confidence, body language, eye contact, presence — the energy you radiate.',
      inventory: []
    },
  ];
}

function defaultWorld() {
  const mainBorId = 'bor-rot-center';
  return {
    currentCityId: 'city-rotterdam',
    currentBoroughId: mainBorId,
    mainBoroughId: mainBorId,
    cities: [
      {
        id: 'city-rotterdam', name: 'Rotterdam',
        boroughs: [
          { id: mainBorId, name: 'City Center', activityCategories: [], leadgen: { methods: [] }, places: [] },
        ]
      },
    ],
  };
}
function defaultBorough(name) {
  return { id: uid('bor'), name: name || 'New Borough', activityCategories: [], leadgen: { methods: [] }, places: [] };
}

// Gain % lookup: difficulty × ROI → gainPct contribution
const LEAD_GAIN_MATRIX = {
  easy:   { low: 1, 'medium-low': 2, medium: 4, high: 6,  'very-high': 8  },
  medium: { low: 2, 'medium-low': 3, medium: 5, high: 8,  'very-high': 10 },
  hard:   { low: 3, 'medium-low': 5, medium: 7, high: 10, 'very-high': 12 },
};
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const ROI_LABEL = { low: 'Low', 'medium-low': 'Med-Low', medium: 'Medium', high: 'High', 'very-high': 'Very High' };

// ROI determines the item color tier (user spec: red=super, yellow=high, blue=medium, lightgreen=med-low, grey=low)
const ROI_TIER_MAP = {
  'very-high': { cls: 'tier-legendary', label: 'Legendary' },
  high:        { cls: 'tier-epic',      label: 'Epic' },
  medium:      { cls: 'tier-rare',      label: 'Rare' },
  'medium-low':{ cls: 'tier-uncommon',  label: 'Uncommon' },
  low:         { cls: 'tier-common',    label: 'Common' },
};
function roiTierClass(roi) { return (ROI_TIER_MAP[roi] || ROI_TIER_MAP.low).cls; }
function roiTierLabel(roi) { return (ROI_TIER_MAP[roi] || ROI_TIER_MAP.low).label; }

let D = defaultData();
let currentPage = 'home';
let currentRosterTab = 'girls';
let currentMonthKey = null;

// ── Persistence ──
const SAVE_KEY = 'life-rpg-data';

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(D)); } catch (e) { }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    D = deepMerge(defaultData(), parsed);
    // Migration: add maxGain to lead methods without it
    if (D.leadgen?.methods) {
      leadMethods().forEach(m => {
        if (!m.maxGain) m.maxGain = 15;
        (m.inventory || []).forEach(it => { if (it.leads == null) it.leads = 0; });
      });
    }
    // Migration: add vibeComponents if missing
    if (!D.vibeComponents || !D.vibeComponents.length) {
      D.vibeComponents = defaultVibeComponents();
    }
    // Migration: add vc-vibe component if missing from existing vibeComponents
    if (D.vibeComponents && !D.vibeComponents.find(c => c.id === 'vc-vibe')) {
      D.vibeComponents.unshift({
        id: 'vc-vibe', name: 'Vibe', emoji: '✦', maxSlots: 2, maxGain: 25, slots: [null, null],
        desc: 'Your personal magnetism — the energy you put out, how you carry yourself, the feeling people get around you.',
        inventory: []
      });
    }
    // Migration: add vibe stat if missing
    if (D.player.stats.vibe === undefined) D.player.stats.vibe = 0;
    // Migration: ensure activity items have a kind (maintenance|expansion)
    (D.activityCategories || []).forEach(cat => {
      (cat.inventory || []).forEach(it => {
        if (!it.kind || (it.kind !== 'maintenance' && it.kind !== 'expansion')) {
          const eff = it.statEffects || {};
          const gains = Object.values(eff).some(v => v > 0);
          it.kind = gains ? 'expansion' : 'maintenance';
        }
      });
    });
    // Migration: abilities
    if (!Array.isArray(D.abilities)) D.abilities = [];
    // Migration: northstar + eras
    if (D.northstar === undefined) D.northstar = null;
    if (!Array.isArray(D.eras)) D.eras = [];
    // Migration: world/cities/boroughs
    migrateWorld();
  } catch (e) { console.warn('load failed', e); }
}

function migrateWorld() {
  if (!D.world) D.world = defaultWorld();
  // Old shape: cities had discovered/completion, no boroughs.
  // New shape: only Rotterdam by default, every city has boroughs[].
  const cities = D.world.cities || [];
  // Remove legacy cities that weren't Rotterdam if they had no boroughs + weren't discovered.
  // Safer: keep user-discovered cities, just migrate them.
  const kept = [];
  cities.forEach(c => {
    // Drop any legacy "???" or undiscovered stub cities.
    if (c && c.discovered === false && !c.boroughs) return;
    kept.push(c);
  });
  // Ensure Rotterdam exists.
  if (!kept.find(c => c.id === 'city-rotterdam' || (c.name || '').toLowerCase() === 'rotterdam')) {
    kept.unshift({ id: 'city-rotterdam', name: 'Rotterdam', boroughs: [] });
  }
  // Normalize each city: add boroughs[] if missing; drop legacy fields.
  kept.forEach(c => {
    delete c.discovered;
    delete c.completion;
    if (!Array.isArray(c.boroughs)) c.boroughs = [];
    c.boroughs.forEach(b => {
      if (!b.activityCategories) b.activityCategories = [];
      if (!b.leadgen) b.leadgen = { methods: [] };
      if (!b.leadgen.methods) b.leadgen.methods = [];
      if (!Array.isArray(b.places)) b.places = [];
    });
  });
  D.world.cities = kept;
  // Ensure Rotterdam has a default City Center borough if empty.
  const rot = D.world.cities.find(c => c.id === 'city-rotterdam') || D.world.cities[0];
  if (rot && rot.boroughs.length === 0) {
    rot.boroughs.push({ id: 'bor-rot-center', name: 'City Center', activityCategories: [], leadgen: { methods: [] }, places: [] });
  }
  // mainBoroughId defaults to Rotterdam's first borough (legacy users get global stuff in that borough view).
  if (!D.world.mainBoroughId) D.world.mainBoroughId = rot ? rot.boroughs[0].id : null;
  // currentCityId / currentBoroughId: pick Rotterdam's main borough if current is invalid.
  if (!D.world.cities.find(c => c.id === D.world.currentCityId)) {
    D.world.currentCityId = rot ? rot.id : (D.world.cities[0] && D.world.cities[0].id);
  }
  const curCity = D.world.cities.find(c => c.id === D.world.currentCityId);
  if (!curCity || !curCity.boroughs.find(b => b.id === D.world.currentBoroughId)) {
    D.world.currentBoroughId = curCity && curCity.boroughs[0] ? curCity.boroughs[0].id : null;
  }
}

// ── Borough / city helpers ──
function currentCity() { return (D.world.cities || []).find(c => c.id === D.world.currentCityId) || null; }
function currentBorough() {
  const c = currentCity();
  if (!c) return null;
  return (c.boroughs || []).find(b => b.id === D.world.currentBoroughId) || null;
}
function isMainBorough(b) { return b && D.world && b.id === D.world.mainBoroughId; }
// Active (scoped-to-current-borough) activity categories. Returns D.activityCategories if the
// current borough is the "main" borough (so the user's shared/global stash shows up there).
function actCats() {
  const b = currentBorough();
  if (!b || isMainBorough(b)) return D.activityCategories;
  if (!b.activityCategories) b.activityCategories = [];
  return b.activityCategories;
}
function setActCats(next) {
  const b = currentBorough();
  if (!b || isMainBorough(b)) D.activityCategories = next;
  else b.activityCategories = next;
}
function leadMethods() {
  const b = currentBorough();
  if (!b || isMainBorough(b)) return D.leadgen.methods;
  if (!b.leadgen) b.leadgen = { methods: [] };
  if (!b.leadgen.methods) b.leadgen.methods = [];
  return b.leadgen.methods;
}
// Unlocked-things count for a given borough (used for the number under each card).
function boroughUnlockCount(b) {
  if (!b) return 0;
  const acts = (b.id === D.world.mainBoroughId ? D.activityCategories : b.activityCategories) || [];
  const leads = ((b.id === D.world.mainBoroughId ? D.leadgen.methods : (b.leadgen && b.leadgen.methods)) || []);
  let n = 0;
  acts.forEach(cat => n += (cat.inventory || []).length);
  leads.forEach(m => n += (m.inventory || []).length);
  n += (b.places || []).length;
  return n;
}
function cityUnlockCount(c) {
  if (!c) return 0;
  return (c.boroughs || []).reduce((s, b) => s + boroughUnlockCount(b), 0);
}
function deepMerge(base, override) {
  if (Array.isArray(override)) return override.slice();
  if (override && typeof override === 'object') {
    const out = Array.isArray(base) ? [] : { ...base };
    for (const k of Object.keys(override)) {
      out[k] = (base && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k]))
        ? deepMerge(base[k], override[k])
        : override[k];
    }
    return out;
  }
  return override !== undefined ? override : base;
}

// ── Helpers ──
function uid(prefix = 'id') { return prefix + '-' + Math.random().toString(36).slice(2, 9); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function starsHtml(r) { return '★'.repeat(r) + '☆'.repeat(5 - r); }
function rarityClass(r) { return 'rar-' + r; }
function initial(name) { return (name || '?').trim().charAt(0).toUpperCase(); }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function dayToMonthIndex(day) { return Math.floor((day - 1) / DAYS_PER_MONTH); }
function monthInfoFromIndex(idx) {
  const m = (START_MONTH_INDEX + idx) % 12;
  const y = START_YEAR + Math.floor((START_MONTH_INDEX + idx) / 12);
  return { name: MONTH_NAMES[m], year: y, key: y + '-' + m };
}
function currentMonthInfo() { return monthInfoFromIndex(dayToMonthIndex(D.day)); }

// ── XP / Log ──
function xpForLevel(lvl) { return Math.floor(XP_BASE * Math.pow(XP_MULT, lvl - 1)); }
function addXP(amount, reason) {
  D.player.xp += amount;
  let needed = xpForLevel(D.player.level);
  let leveled = false;
  while (D.player.xp >= needed) {
    D.player.xp -= needed;
    D.player.level++;
    leveled = true;
    needed = xpForLevel(D.player.level);
  }
  addLog(`+${amount} XP — ${reason}`, 'xp');
  if (leveled) showLevelUp(D.player.level);
  updateXPDisplay();
}

function addLog(msg, tag) {
  const m = currentMonthInfo();
  const entry = { t: Date.now(), day: D.day, month: m.name, year: m.year, msg, tag: tag || 'event' };
  D.log.push(entry);
  if (D.log.length > 500) D.log = D.log.slice(-500);

  if (!D.months[m.key]) D.months[m.key] = { name: m.name, year: m.year, events: [], summary: null };
  D.months[m.key].events.push(entry);

  save();
}

function showLevelUp(level) {
  const div = document.createElement('div');
  div.className = 'level-up-banner';
  div.innerHTML = `<div class="level-up-title">LEVEL UP</div><div class="level-up-number">${level}</div>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── Navigation ──
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  currentPage = page;
  render();
}
function showOverlay(page) {
  document.getElementById('page-' + page).classList.add('active');
  if (page === 'months') renderMonths();
  if (page === 'stats') renderStats();
  if (page === 'abilities') renderAbilities();
  if (page === 'totalstats') renderTotalStats();
  if (page === 'calendar') renderCalendar();
}
function hideOverlay() {
  document.querySelectorAll('.overlay-page').forEach(p => p.classList.remove('active'));
}

// ── Stats mutation ──
function applyEffects(effects) {
  for (const k of Object.keys(effects)) {
    if (D.player.stats[k] === undefined) continue;
    D.player.stats[k] = Math.max(0, D.player.stats[k] + effects[k]);
  }
}

// ── Activities ──
function doActivity(activityId) {
  const all = [...PRESET_ACTIVITIES, ...D.customActivities];
  const a = all.find(x => x.id === activityId);
  if (!a) return;
  applyEffects(a.effects || {});
  addXP(a.xp || 4, a.name);
  addLog(`Did ${a.name}.`, 'activity');
  tickDay(); // each activity consumes a day
}

function addCustomActivity(data) {
  const a = {
    id: uid('act'),
    name: data.name,
    desc: data.desc || 'Custom activity',
    effects: data.effects || {},
    meetBonus: Number(data.meetBonus) || 0,
    xp: Number(data.xp) || 5,
    emoji: data.emoji || '★',
    kind: 'custom',
  };
  D.customActivities.push(a);
  addLog(`Added custom activity "${a.name}".`, 'meta');
  save();
  render();
}

function deleteCustomActivity(id) {
  D.customActivities = D.customActivities.filter(a => a.id !== id);
  save();
  render();
}

// ── Meet bar ──
function computeMeetBar() {
  const s = D.player.stats;
  const parts = [];
  parts.push({ label: 'Base', val: 1 });
  parts.push({ label: 'Social', val: s.social * 1.0 });
  parts.push({ label: 'Charm', val: s.charm * 0.5 });
  parts.push({ label: 'Sex Appeal', val: s.sexAppeal * 1.0 });
  parts.push({ label: 'Looks', val: (s.looks || 0) * 1.0 });
  parts.push({ label: 'Boldness', val: s.boldness * 0.5 });
  parts.push({ label: 'Fear', val: -s.fear * 0.5 });

  // Friends contribute by rarity
  const friendSum = D.friends.reduce((sum, f) => sum + f.rarity * 0.5, 0);
  if (friendSum > 0) parts.push({ label: `Friends (${D.friends.length})`, val: friendSum });

  // Recurring custom activities
  const actSum = D.customActivities.reduce((sum, a) => sum + (a.meetBonus || 0), 0);
  if (actSum > 0) parts.push({ label: 'Recurring activities', val: actSum });

  // Cold approach streak
  if (D.player.streaks.coldApproach > 0) {
    parts.push({ label: 'Cold-approach streak', val: D.player.streaks.coldApproach * 1.0 });
  }

  // Domino bonus: being taken makes others want you
  const taken = (D.relationships.theOne ? 1 : 0) + D.relationships.commons.length;
  if (taken > 0) parts.push({ label: `Taken × ${taken}`, val: taken * 2 });

  const raw = parts.reduce((a, b) => a + b.val, 0);
  const percent = clamp(raw, 0, 150); // can exceed 100 like shiny odds
  const display = Math.min(percent, 100);
  return { percent, display, parts };
}

function expectedRarity(pct) {
  if (pct >= 100) return 5;
  if (pct >= 80) return 4;
  if (pct >= 50) return 3;
  if (pct >= 25) return 2;
  return 1;
}

function rollRarity(pct) {
  // Weighted roll. Higher pct = higher rarities more likely.
  const base = [40, 30, 20, 8, 2]; // 1..5
  const boost = pct / 100;
  const weights = base.map((w, i) => {
    // Shift weight toward higher tiers as pct grows
    return Math.max(1, w * (1 + (i - 2) * boost));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i + 1;
    r -= weights[i];
  }
  return 1;
}

function rollEncounter() {
  const { percent } = computeMeetBar();
  const roll = Math.random() * 100;
  if (roll > percent) {
    D.player.stats.fear = Math.max(0, D.player.stats.fear + 1);
    addLog(`Went out — nobody hit it off (bar was ${percent.toFixed(0)}%).`, 'meet-miss');
    tickDay();
    toast('No connection.');
    return;
  }
  const rarity = rollRarity(percent);
  const g = newGirl(rarity, pickRandom(GIRL_ORIGINS));
  D.girls.push(g);
  addXP(5 + rarity * 4, `Met ${g.name}`);
  addLog(`Met ${g.name} (${RARITY_LABEL[rarity]}) at ${g.origin}.`, 'meet');
  flash();
  tickDay();
  toast(`Met ${g.name} — ${RARITY_LABEL[rarity]}`);
}

function newGirl(rarity, origin) {
  const name = pickRandom(FEMALE_NAMES);
  // looksLikeYou score: correlates slightly with rarity + randomness
  const looksLikeYou = clamp(Math.floor(20 + rarity * 10 + Math.random() * 40), 0, 100);
  return {
    id: uid('g'),
    name,
    rarity,
    origin,
    affinity: 5 + rarity * 4,
    looksLikeYou,
    status: 'Talking', // Talking | Dating | Common | TheOne | Sidelined
    dates: 0,
    notes: '',
    createdDay: D.day,
  };
}

function newFriend(rarity, origin) {
  return {
    id: uid('f'),
    name: pickRandom(MALE_NAMES),
    rarity,            // rarity doubles as their Social star
    origin,
    socialStar: rarity,
    notes: '',
    createdDay: D.day,
  };
}

function coldApproach() {
  const bold = D.player.stats.boldness;
  const fear = D.player.stats.fear;
  const successChance = clamp(30 + bold * 5 - fear * 3, 5, 90);
  const roll = Math.random() * 100;
  if (roll <= successChance) {
    D.player.stats.boldness += 2;
    D.player.stats.fear = Math.max(0, D.player.stats.fear - 1);
    D.player.streaks.coldApproach = (D.player.streaks.coldApproach || 0) + 1;
    const rarity = rollRarity(computeMeetBar().percent + 10);
    const g = newGirl(rarity, 'Cold approach on street');
    D.girls.push(g);
    addXP(10 + rarity * 3, `Cold approach success — ${g.name}`);
    addLog(`Cold approach succeeded — met ${g.name} (${RARITY_LABEL[rarity]}).`, 'meet');
    flash();
    toast(`Bold! Met ${g.name}.`);
  } else {
    D.player.stats.fear += 2;
    D.player.streaks.coldApproach = 0;
    addLog(`Cold approach flopped. Fear grew.`, 'meet-miss');
    toast('Rejected. Fear +2.');
  }
  tickDay();
}

// ── Summon ──
function openSummonModal() {
  const body = SUMMON_COST_TABLE.map((s, i) => `
    <div class="activity-card">
      <div class="name">${s.label}</div>
      <div class="desc">Cost: $${s.cost} • rarities ${s.minRarity}★–${s.maxRarity}★</div>
      <div class="row">
        <button class="pill-btn good" onclick="doSummon(${i})">Summon</button>
      </div>
    </div>`).join('');
  openModal(`
    <h3> Summon</h3>
    <div class="desc" style="color:var(--text-secondary);font-size:12px;margin-bottom:10px">Spend money for a guaranteed meet at a venue.</div>
    <div style="display:flex;flex-direction:column;gap:8px">${body}</div>
    <div class="row"><button class="pill-btn" onclick="closeModal()">Close</button></div>
  `);
}

function doSummon(idx) {
  const s = SUMMON_COST_TABLE[idx];
  if (D.player.stats.money < s.cost) { toast('Not enough money.'); return; }
  D.player.stats.money -= s.cost;
  // Bias rarity to min..max
  const range = s.maxRarity - s.minRarity + 1;
  const rarity = s.minRarity + Math.floor(Math.random() * range);
  const g = newGirl(rarity, s.label);
  D.girls.push(g);
  addXP(6 + rarity * 4, `Summoned ${g.name} at ${s.label}`);
  addLog(`Summoned ${g.name} (${RARITY_LABEL[rarity]}) at ${s.label}. -$${s.cost}.`, 'summon');
  closeModal();
  flash();
  toast(`Summoned ${g.name}!`);
  render();
}

function flash() {
  const el = document.createElement('div');
  el.className = 'summon-flash';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// ── Girl actions ──
function hangOut(id) {
  const g = girlById(id);
  if (!g) return;
  if (D.player.stats.money < 5) { toast('Need $5 to hang out.'); return; }
  D.player.stats.money -= 5;
  g.affinity = clamp(g.affinity + 6, 0, 100);
  D.player.stats.social += 1;
  D.player.stats.charm += 1;
  addXP(4, `Hung out with ${g.name}`);
  addLog(`Hung out with ${g.name} (+6 affinity).`, 'date');
  tickDay();
}

function dateGirl(id) {
  const g = girlById(id);
  if (!g) return;
  if (D.player.stats.money < 20) { toast('Need $20 for a date.'); return; }
  D.player.stats.money -= 20;
  g.affinity = clamp(g.affinity + 12, 0, 100);
  g.dates += 1;
  D.player.stats.charm += 1;
  addXP(8, `Dated ${g.name}`);
  addLog(`Took ${g.name} on a date (+12 affinity).`, 'date');
  tickDay();
}

function askOut(id) {
  const g = girlById(id);
  if (!g) return;
  if (g.affinity < 60) { toast('Need affinity ≥ 60.'); return; }
  if (D.relationships.commons.includes(id)) { toast('Already a common.'); return; }
  g.status = 'Common';
  D.relationships.commons.push(id);
  addXP(25, `${g.name} is now a girlfriend`);
  addLog(`Asked out ${g.name} — she said YES. (Slot 2)`, 'relationship');
  toast(`${g.name} is now your girlfriend.`);
  save(); render();
}

function promoteTheOne(id) {
  const g = girlById(id);
  if (!g) return;
  if (g.affinity < 90 || g.looksLikeYou < 70) {
    toast('Need affinity ≥ 90 and looks-like-you ≥ 70.');
    return;
  }
  // Dethrone previous The One if any -> sideline
  if (D.relationships.theOne && D.relationships.theOne !== id) {
    const old = girlById(D.relationships.theOne);
    if (old) { old.status = 'Sidelined'; D.relationships.sidelined.push(old.id); }
  }
  D.relationships.commons = D.relationships.commons.filter(x => x !== id);
  D.relationships.theOne = id;
  g.status = 'TheOne';
  addXP(80, `${g.name} is The One`);
  addLog(`${g.name} became The One. ★`, 'relationship');
  toast(`${g.name} is The One.`);
  save(); render();
}

function sideline(id) {
  const g = girlById(id);
  if (!g) return;
  g.status = 'Sidelined';
  D.relationships.commons = D.relationships.commons.filter(x => x !== id);
  if (D.relationships.theOne === id) D.relationships.theOne = null;
  if (!D.relationships.sidelined.includes(id)) D.relationships.sidelined.push(id);
  addLog(`Sidelined ${g.name}.`, 'relationship');
  save(); render();
}

function release(id) {
  const g = girlById(id);
  if (!g) return;
  D.girls = D.girls.filter(x => x.id !== id);
  D.relationships.commons = D.relationships.commons.filter(x => x !== id);
  D.relationships.sidelined = D.relationships.sidelined.filter(x => x !== id);
  if (D.relationships.theOne === id) D.relationships.theOne = null;
  addLog(`Released ${g.name}.`, 'relationship');
  save(); render();
}

function girlById(id) { return D.girls.find(g => g.id === id); }
function friendById(id) { return D.friends.find(f => f.id === id); }

// ── Friend actions ──
function hangOutFriend(id) {
  const f = friendById(id);
  if (!f) return;
  D.player.stats.social += f.socialStar;
  D.player.stats.charm += 1;
  addXP(3 + f.socialStar, `Hung out with ${f.name}`);
  addLog(`Hung out with ${f.name} (${f.socialStar}★ social). +${f.socialStar} social.`, 'friend');
  tickDay();
}
function removeFriend(id) {
  const f = friendById(id);
  if (!f) return;
  D.friends = D.friends.filter(x => x.id !== id);
  addLog(`Lost touch with ${f.name}.`, 'friend');
  save(); render();
}

// ── Day / month / domino engine ──
function tickDay() {
  const prevMonthIdx = dayToMonthIndex(D.day);
  D.day += 1;
  const newMonthIdx = dayToMonthIndex(D.day);

  // Natural decay
  D.player.stats.fear = Math.max(0, D.player.stats.fear - 0.1); // slow fade
  // cold approach streak decays every 3 days if no approach
  // (kept simple: just leave as-is)

  dominoTick();

  if (newMonthIdx > prevMonthIdx) {
    finalizeMonth(monthInfoFromIndex(prevMonthIdx));
  }

  save();
  render();
}

function endDay() {
  addLog(`Ended Day ${D.day}.`, 'day');
  D.player.stats.health = Math.min(20, D.player.stats.health + 1);
  tickDay();
  toast(`Day ${D.day}`);
}

function dominoTick() {
  const taken = (D.relationships.theOne ? 1 : 0) + D.relationships.commons.length;
  if (taken === 0) return;

  // Passive affinity bump for all "Talking" girls
  D.girls.forEach(g => {
    if (g.status === 'Talking' || g.status === 'Dating') {
      const bump = Math.random() < 0.5 ? 1 : 2;
      g.affinity = clamp(g.affinity + bump * Math.min(taken, 3), 0, 100);
    }
  });

  // Commons fight each other
  const commons = D.relationships.commons.map(girlById).filter(Boolean);
  if (commons.length >= 2) {
    const winner = commons[Math.floor(Math.random() * commons.length)];
    const loserPool = commons.filter(c => c !== winner);
    const loser = loserPool[Math.floor(Math.random() * loserPool.length)];
    winner.affinity = clamp(winner.affinity + 2, 0, 100);
    loser.affinity = clamp(loser.affinity - 2, 0, 100);
  }

  // Slot 1 challenge: if empty, any common with looks-like-you ≥ 80 and affinity ≥ 85 may challenge
  if (!D.relationships.theOne) {
    const challenger = commons.find(c => c.looksLikeYou >= 80 && c.affinity >= 85);
    if (challenger && Math.random() < 0.25) {
      addLog(`${challenger.name} is challenging for The One slot.`, 'relationship');
    }
  }
}

function finalizeMonth(info) {
  const key = info.key;
  const mo = D.months[key];
  if (!mo) return;
  const events = mo.events || [];
  // Compute summary
  const sum = {
    girlsMet: events.filter(e => e.tag === 'meet').length,
    misses: events.filter(e => e.tag === 'meet-miss').length,
    dates: events.filter(e => e.tag === 'date').length,
    promotions: events.filter(e => e.tag === 'relationship' && /girlfriend|The One/.test(e.msg)).length,
    moneyEarned: 0,
    xpGained: events.filter(e => e.tag === 'xp').reduce((a, b) => a + (parseInt((b.msg.match(/\+(\d+) XP/) || [0, 0])[1]) || 0), 0),
    finalDay: D.day - 1,
    finalLevel: D.player.level,
    finalMoney: D.player.stats.money,
  };
  mo.summary = sum;

  const recap = ` ${info.name} recap: met ${sum.girlsMet}, dates ${sum.dates}, promotions ${sum.promotions}, XP +${sum.xpGained}.`;
  D.log.push({ t: Date.now(), day: D.day - 1, month: info.name, year: info.year, msg: recap, tag: 'monthly' });
  save();
}

// ── Rendering ──
function render() {
  syncVibeStat();
  updateXPDisplay();
  updateHeaderSubtitle();
  renderHeaderDate();
  if (currentPage === 'home') renderHome();
  if (currentPage === 'activities') { renderActivities(); renderActivitiesV2(); }
  if (currentPage === 'roster') renderRoster();
  if (currentPage === 'life') renderLife();
  if (currentPage === 'girls') renderGirls();
  if (currentPage === 'leadgen') renderLeadgen();
  if (currentPage === 'leadmethod') renderLeadMethodDetail();
  if (currentPage === 'vibe') renderVibePage();
  if (currentPage === 'vibecomp') renderVibeCompDetail();
  if (currentPage === 'world') renderWorld();
  if (currentPage === 'citydetail') renderCityDetail();
  if (currentPage === 'stat') renderStatPage();
}

function updateXPDisplay() {
  const needed = xpForLevel(D.player.level);
  const pct = Math.min((D.player.xp / needed) * 100, 100);
  const el = document.getElementById('home-xp-bar');
  const txt = document.getElementById('home-xp-text');
  const lvl = document.getElementById('home-level');
  if (el) el.style.width = pct + '%';
  if (txt) txt.textContent = `${D.player.xp} / ${needed} XP`;
  if (lvl) lvl.textContent = D.player.level;
}
function updateHeaderSubtitle() {
  const el = document.getElementById('home-day-label');
  if (!el) return;
  const info = currentMonthInfo();
  const taken = (D.relationships.theOne ? 1 : 0) + D.relationships.commons.length;
  const talking = D.girls.filter(g => g.status === 'Talking' || g.status === 'Dating').length;
  el.textContent = `Day ${D.day} — ${info.name} ${info.year} • taken: ${taken} / talking: ${talking}`;
}

function renderHome() {
  renderNorthstar();
  renderCurrentEraWidget();
  renderBirthday();
  renderHomeLeads();
  // Stats grid
  const grid = document.getElementById('home-stats-grid');
  grid.innerHTML = STAT_KEYS.map(k => `
    <button class="qstat qstat-btn ${STAT_CSS[k]}" onclick="openStatPage('${k}')">
      <div class="qstat-label">${STAT_EMOJI[k] || ''} ${STAT_LABELS[k]}${k === 'money' ? ' ($)' : ''}</div>
      <div class="qstat-value">${Math.round(D.player.stats[k])}</div>
    </button>
  `).join('');

  // Slots preview
  const sp = document.getElementById('home-slots-preview');
  const one = D.relationships.theOne ? girlById(D.relationships.theOne) : null;
  const commons = D.relationships.commons.map(girlById).filter(Boolean);
  if (!one && commons.length === 0) {
    sp.innerHTML = '<div class="empty-state">Your roster is empty.</div>';
  } else {
    let html = '';
    if (one) html += `<div class="slot-mini the-one"><div class="label">THE ONE</div><div class="name">${one.name}</div><div class="label">${starsHtml(one.rarity)} • ${one.affinity}%</div></div>`;
    commons.forEach(g => {
      html += `<div class="slot-mini common"><div class="label">COMMON</div><div class="name">${g.name}</div><div class="label">${starsHtml(g.rarity)} • ${g.affinity}%</div></div>`;
    });
    sp.innerHTML = html;
  }

  // Activity feed (recent log, last 12, newest first)
  const feed = document.getElementById('home-activity-feed');
  const recent = D.log.slice(-12).reverse();
  if (recent.length === 0) {
    feed.innerHTML = '<div class="empty-state">No activity yet.</div>';
  } else {
    feed.innerHTML = recent.map(e => `
      <div class="activity-item ${e.tag === 'monthly' ? 'monthly' : ''}">
        <span>${escapeHtml(e.msg)}</span>
        <span class="t">D${e.day}</span>
      </div>
    `).join('');
  }
}

function renderActivities() {
  const presetsEl = document.getElementById('activities-presets');
  presetsEl.innerHTML = PRESET_ACTIVITIES.map(activityCard).join('');

  const customEl = document.getElementById('activities-custom');
  document.getElementById('custom-count').textContent = `CUSTOM (${D.customActivities.length})`;
  if (D.customActivities.length === 0) {
    customEl.innerHTML = '<div class="empty-state">No custom activities. Add one like "Judo" to boost your Meet bar.</div>';
  } else {
    customEl.innerHTML = D.customActivities.map(a => activityCard(a, true)).join('');
  }
}

function activityCard(a, isCustom) {
  const effectsStr = Object.entries(a.effects || {}).map(([k, v]) =>
    `${v >= 0 ? '+' : ''}${v} ${STAT_LABELS[k] || k}`
  ).join(' · ');
  const meet = a.meetBonus ? `  •  Meet +${a.meetBonus}` : '';
  return `
    <div class="activity-card">
      <div class="name">${a.emoji || '★'} ${escapeHtml(a.name)}</div>
      <div class="desc">${escapeHtml(a.desc || '')}</div>
      <div class="meta">${effectsStr}${meet}  •  +${a.xp} XP</div>
      <div class="row">
        <button class="pill-btn good" onclick="doActivity('${a.id}')">Do it</button>
        ${isCustom ? `<button class="pill-btn danger" onclick="deleteCustomActivity('${a.id}')">Remove</button>` : ''}
      </div>
    </div>`;
}

function renderMeet() {
  const { percent, display, parts } = computeMeetBar();
  const rar = expectedRarity(percent);
  const bar = document.getElementById('meet-bar-fill');
  bar.style.width = display + '%';
  document.getElementById('meet-bar-pct').textContent = `${percent.toFixed(0)}%`;
  document.getElementById('meet-bar-rarity').textContent = `${RARITY_LABEL[rar]} expected`;

  // Chips
  const taken = (D.relationships.theOne ? 1 : 0) + D.relationships.commons.length;
  const talking = D.girls.filter(g => g.status === 'Talking' || g.status === 'Dating').length;
  const chips = [
    ['Talking to', talking],
    ['Girlfriends', taken],
    ['Cold streak', D.player.streaks.coldApproach || 0],
    ['Money', '$' + D.player.stats.money],
  ];
  document.getElementById('meet-chips').innerHTML = chips.map(([k, v]) =>
    `<span class="chip">${k}: <strong>${v}</strong></span>`
  ).join('');

  // Breakdown
  const bd = document.getElementById('meet-breakdown');
  bd.innerHTML = parts.map(p =>
    `<div class="brow"><span class="label">${escapeHtml(p.label)}</span><span class="val ${p.val < 0 ? 'neg' : ''}">${p.val >= 0 ? '+' : ''}${p.val.toFixed(1)}</span></div>`
  ).join('');

  // History (last 6 meets)
  const history = [...D.log].filter(e => e.tag === 'meet' || e.tag === 'summon').slice(-6).reverse();
  const hist = document.getElementById('meet-history');
  hist.innerHTML = history.length
    ? history.map(e => `<div class="activity-item"><span>${escapeHtml(e.msg)}</span><span class="t">D${e.day}</span></div>`).join('')
    : '<div class="empty-state">No one met yet.</div>';
}

function switchRosterTab(tab) {
  currentRosterTab = tab;
  document.querySelectorAll('#page-roster .inv-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('roster-tab-' + tab).classList.add('active');
  document.querySelectorAll('#page-roster .inv-content').forEach(c => c.classList.remove('active'));
  document.getElementById('roster-' + tab).classList.add('active');
  renderRoster();
}

function renderRoster() {
  const q = (document.getElementById('roster-search')?.value || '').toLowerCase();
  const girlsEl = document.getElementById('roster-girls');
  const girls = D.girls
    .filter(g => !q || g.name.toLowerCase().includes(q) || g.origin.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => b.rarity - a.rarity || b.affinity - a.affinity);
  girlsEl.innerHTML = girls.length
    ? girls.map(girlCard).join('')
    : '<div class="empty-state">No girls match.</div>';

  const friendsEl = document.getElementById('roster-friends');
  const friends = D.friends
    .filter(f => !q || f.name.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => b.rarity - a.rarity);
  friendsEl.innerHTML = friends.length
    ? friends.map(friendCard).join('')
    : '<div class="empty-state">No friends match.</div>';
}

function girlCard(g) {
  const sidelined = g.status === 'Sidelined';
  const badge = {
    Talking: '', Dating: 'DATING', Common: 'COMMON', TheOne: '★ THE ONE', Sidelined: 'SIDELINED'
  }[g.status] || '';
  return `
    <div class="entity-card ${sidelined ? 'sidelined' : ''}" onclick="openGirlDetails('${g.id}')">
      <div class="entity-avatar ${rarityClass(g.rarity)}">${initial(g.name)}</div>
      <div class="entity-body">
        <div class="entity-name">${escapeHtml(g.name)} ${badge ? `<span class="entity-badge">${badge}</span>` : ''}</div>
        <div class="entity-meta"><span class="entity-stars">${starsHtml(g.rarity)}</span> • ${escapeHtml(g.origin)} • affinity ${g.affinity} • look-alike ${g.dates >= 3 ? g.looksLikeYou : '?'}</div>
        <div class="affinity-bar"><div class="affinity-bar-fill" style="width:${g.affinity}%"></div></div>
      </div>
    </div>`;
}

function friendCard(f) {
  return `
    <div class="entity-card" onclick="openFriendDetails('${f.id}')">
      <div class="entity-avatar ${rarityClass(f.rarity)}">${initial(f.name)}</div>
      <div class="entity-body">
        <div class="entity-name">${escapeHtml(f.name)} <span class="entity-badge">FRIEND</span></div>
        <div class="entity-meta"><span class="entity-stars">${starsHtml(f.rarity)}</span> social • ${escapeHtml(f.origin || 'Unknown')}</div>
      </div>
    </div>`;
}

function openGirlDetails(id) {
  const g = girlById(id); if (!g) return;
  const gateOne = g.affinity >= 90 && g.looksLikeYou >= 70;
  const gateCommon = g.affinity >= 60;
  openModal(`
    <h3> ${escapeHtml(g.name)}</h3>
    <div class="meta" style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-bottom:10px">
      ${starsHtml(g.rarity)} • ${escapeHtml(g.origin)} • status: ${g.status}<br>
      affinity: ${g.affinity}% • looks-like-you: ${g.dates >= 3 ? g.looksLikeYou : '? (after 3 dates)'} • dates: ${g.dates}
    </div>
    <div class="affinity-bar" style="margin-bottom:14px"><div class="affinity-bar-fill" style="width:${g.affinity}%"></div></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      <button class="pill-btn" onclick="hangOut('${g.id}');closeModal()">Hang out ($5)</button>
      <button class="pill-btn warm" onclick="dateGirl('${g.id}');closeModal()">Date ($20)</button>
      ${gateCommon && g.status === 'Talking' ? `<button class="pill-btn good" onclick="askOut('${g.id}');closeModal()">Ask out (Slot 2)</button>` : ''}
      ${gateOne ? `<button class="pill-btn good" onclick="promoteTheOne('${g.id}');closeModal()">★ Make her The One</button>` : ''}
      ${g.status !== 'Sidelined' ? `<button class="pill-btn danger" onclick="sideline('${g.id}');closeModal()">Sideline</button>` : ''}
      <button class="pill-btn danger" onclick="release('${g.id}');closeModal()">Release</button>
    </div>
    <div class="row"><button class="pill-btn" onclick="closeModal()">Close</button></div>
  `);
}

function openFriendDetails(id) {
  const f = friendById(id); if (!f) return;
  openModal(`
    <h3> ${escapeHtml(f.name)}</h3>
    <div class="meta" style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-bottom:10px">
      ${starsHtml(f.rarity)} social • ${escapeHtml(f.origin || 'Unknown')}<br>
      Boost to Meet bar: +${(f.rarity * 0.5).toFixed(1)}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      <button class="pill-btn good" onclick="hangOutFriend('${f.id}');closeModal()">Hang out</button>
      <button class="pill-btn danger" onclick="removeFriend('${f.id}');closeModal()">Remove</button>
    </div>
    <div class="row"><button class="pill-btn" onclick="closeModal()">Close</button></div>
  `);
}

function openAddRosterModal() {
  const isGirl = currentRosterTab === 'girls';
  openModal(`
    <h3>${isGirl ? ' Add Girl' : ' Add Friend'}</h3>
    <div class="form-row"><label>NAME</label><input id="f-name" placeholder="${isGirl ? 'e.g. Mia' : 'e.g. Mike'}"/></div>
    <div class="form-row"><label>RARITY (1–5)${isGirl ? '' : ' — their Social star'}</label><input id="f-rarity" type="number" min="1" max="5" value="3"/></div>
    <div class="form-row"><label>ORIGIN</label><input id="f-origin" placeholder="${isGirl ? 'Where you met' : 'Where you met them'}"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddRoster(${isGirl})">Add</button>
    </div>
  `);
}

function submitAddRoster(isGirl) {
  const name = (document.getElementById('f-name').value || '').trim() || (isGirl ? pickRandom(FEMALE_NAMES) : pickRandom(MALE_NAMES));
  const rarity = clamp(parseInt(document.getElementById('f-rarity').value) || 3, 1, 5);
  const origin = (document.getElementById('f-origin').value || '').trim() || (isGirl ? pickRandom(GIRL_ORIGINS) : 'Somewhere');
  if (isGirl) {
    const g = newGirl(rarity, origin);
    g.name = name;
    D.girls.push(g);
    addLog(`Added ${name} (${RARITY_LABEL[rarity]}) manually.`, 'meet');
  } else {
    const f = newFriend(rarity, origin);
    f.name = name;
    D.friends.push(f);
    addLog(`Befriended ${name} (${rarity}★ social).`, 'friend');
  }
  closeModal();
  save(); render();
}

function openAddActivityModal() {
  openModal(`
    <h3>★ Add Custom Activity</h3>
    <div class="form-row"><label>NAME</label><input id="ca-name" placeholder="e.g. Judo class"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ca-emoji" placeholder="" maxlength="2"/></div>
    <div class="form-row"><label>MEET BAR BONUS (0–15)</label><input id="ca-meet" type="number" min="0" max="15" value="3"/></div>
    <div class="form-row"><label>XP PER DO</label><input id="ca-xp" type="number" min="1" max="50" value="6"/></div>
    <div class="form-row"><label>EFFECTS (advanced — e.g. fight:+2,power:+1)</label><input id="ca-effects" placeholder="fight:+2,power:+1"/></div>
    <div class="form-row"><label>DESCRIPTION</label><textarea id="ca-desc" placeholder="What is this activity?"></textarea></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddActivity()">Add</button>
    </div>
  `);
}

function submitAddActivity() {
  const name = (document.getElementById('ca-name').value || '').trim();
  if (!name) { toast('Need a name.'); return; }
  const emoji = document.getElementById('ca-emoji').value || '★';
  const meetBonus = Number(document.getElementById('ca-meet').value) || 0;
  const xp = Number(document.getElementById('ca-xp').value) || 5;
  const desc = document.getElementById('ca-desc').value || '';
  const effStr = document.getElementById('ca-effects').value || '';
  const effects = parseEffects(effStr);
  addCustomActivity({ name, emoji, meetBonus, xp, desc, effects });
  closeModal();
}

function parseEffects(str) {
  const out = {};
  str.split(',').forEach(part => {
    const m = part.trim().match(/^(\w+)\s*:\s*([+-]?\d+)$/);
    if (!m) return;
    const key = m[1];
    const mapped = STAT_KEYS.find(k => k.toLowerCase() === key.toLowerCase());
    if (!mapped) return;
    out[mapped] = parseInt(m[2]);
  });
  return out;
}

function renderLife() {
  const one = D.relationships.theOne ? girlById(D.relationships.theOne) : null;
  const commons = D.relationships.commons.map(girlById).filter(Boolean);

  const talking = D.girls.filter(g => g.status === 'Talking' || g.status === 'Dating');
  const chasersCount = talking.length;
  const takenCount = (one ? 1 : 0) + commons.length;
  const ratio = document.getElementById('domino-ratio');
  if (takenCount === 0 || chasersCount === 0) {
    ratio.textContent = `${chasersCount} : 1 — no chasers yet`;
  } else {
    ratio.textContent = `${chasersCount} : 1 — girls chasing you`;
  }

  // Slot 1
  const sOne = document.getElementById('slot-one');
  if (one) {
    sOne.innerHTML = `
      <div class="slot-one-card">
        <div class="entity-avatar ${rarityClass(one.rarity)}">${initial(one.name)}</div>
        <div>
          <div class="name">${escapeHtml(one.name)}</div>
          <div class="meta">${starsHtml(one.rarity)} • ${escapeHtml(one.origin)}</div>
          <div class="meta">affinity ${one.affinity}% • looks-like-you ${one.looksLikeYou}</div>
          <div class="row" style="display:flex;gap:6px;margin-top:8px">
            <button class="pill-btn" onclick="hangOut('${one.id}')">Hang out</button>
            <button class="pill-btn warm" onclick="dateGirl('${one.id}')">Date</button>
            <button class="pill-btn danger" onclick="sideline('${one.id}')">Sideline</button>
          </div>
        </div>
      </div>`;
  } else {
    sOne.innerHTML = '<div class="empty-state">No soulmate yet. Promote from Slot 2 once affinity ≥ 90 and looks-like-you ≥ 70.</div>';
  }

  // Slot 2
  const sC = document.getElementById('slot-commons');
  if (commons.length === 0) {
    sC.innerHTML = '<div class="empty-state">No girlfriends yet.</div>';
  } else {
    sC.innerHTML = commons.map(g => `
      <div class="common-card">
        <div class="name">${escapeHtml(g.name)}</div>
        <div class="meta">${starsHtml(g.rarity)} • aff ${g.affinity}%</div>
        <div class="meta">look ${g.dates >= 3 ? g.looksLikeYou : '?'}</div>
        <div class="row">
          <button class="pill-btn" onclick="hangOut('${g.id}')">Hang</button>
          <button class="pill-btn warm" onclick="dateGirl('${g.id}')">Date</button>
          ${g.affinity >= 90 && g.looksLikeYou >= 70 ? `<button class="pill-btn good" onclick="promoteTheOne('${g.id}')">★ Promote</button>` : ''}
          <button class="pill-btn danger" onclick="sideline('${g.id}')">Sideline</button>
        </div>
      </div>`).join('');
  }

  // Chasers (talking/dating)
  const ch = document.getElementById('chasers-list');
  ch.innerHTML = talking.length
    ? talking.map(girlCard).join('')
    : '<div class="empty-state">Nobody is chasing. Fill a slot to start the domino.</div>';

  // Sidelined
  const sl = document.getElementById('sidelined-list');
  const sidelined = D.relationships.sidelined.map(girlById).filter(Boolean);
  sl.innerHTML = sidelined.length
    ? sidelined.map(girlCard).join('')
    : '<div class="empty-state">Nobody sidelined yet.</div>';
}

// ── Months overlay ──
function renderMonths() {
  const keys = Object.keys(D.months).sort((a, b) => {
    const [ay, am] = a.split('-').map(Number);
    const [by, bm] = b.split('-').map(Number);
    return (ay * 12 + am) - (by * 12 + bm);
  });
  const tabsEl = document.getElementById('months-tabs');
  if (keys.length === 0) {
    tabsEl.innerHTML = '<div class="empty-state">No months yet. Live a little.</div>';
    document.getElementById('month-recap').innerHTML = '';
    document.getElementById('month-events').innerHTML = '';
    return;
  }
  if (!currentMonthKey || !D.months[currentMonthKey]) currentMonthKey = keys[keys.length - 1];

  tabsEl.innerHTML = keys.map(k => {
    const m = D.months[k];
    return `<button class="month-tab ${k === currentMonthKey ? 'active' : ''}" onclick="selectMonth('${k}')">${m.name} ${m.year}</button>`;
  }).join('');

  const m = D.months[currentMonthKey];
  const isFinalized = !!m.summary;
  const live = isFinalized ? m.summary : computeLiveSummary(m);

  document.getElementById('month-recap').innerHTML = `
    <h4>${m.name} ${m.year} ${isFinalized ? '— recap' : '(ongoing)'}</h4>
    <div class="recap-grid">
      <div class="recap-cell"><div class="k">Girls met</div><div class="v">${live.girlsMet || 0}</div></div>
      <div class="recap-cell"><div class="k">Dates</div><div class="v">${live.dates || 0}</div></div>
      <div class="recap-cell"><div class="k">Misses</div><div class="v">${live.misses || 0}</div></div>
      <div class="recap-cell"><div class="k">Promotions</div><div class="v">${live.promotions || 0}</div></div>
      <div class="recap-cell"><div class="k">XP gained</div><div class="v">+${live.xpGained || 0}</div></div>
      <div class="recap-cell"><div class="k">Events</div><div class="v">${(m.events || []).length}</div></div>
    </div>
  `;

  const eventsEl = document.getElementById('month-events');
  const events = (m.events || []).slice().reverse();
  eventsEl.innerHTML = events.length
    ? events.map(e => `
        <div class="month-event">
          <span class="d">D${e.day}</span>
          <span class="m">${escapeHtml(e.msg)}</span>
        </div>`).join('')
    : '<div class="empty-state">Nothing recorded this month.</div>';
}

function computeLiveSummary(m) {
  const events = m.events || [];
  return {
    girlsMet: events.filter(e => e.tag === 'meet').length,
    misses: events.filter(e => e.tag === 'meet-miss').length,
    dates: events.filter(e => e.tag === 'date').length,
    promotions: events.filter(e => e.tag === 'relationship' && /girlfriend|The One/.test(e.msg)).length,
    xpGained: events.filter(e => e.tag === 'xp').reduce((a, b) => a + (parseInt((b.msg.match(/\+(\d+) XP/) || [0, 0])[1]) || 0), 0),
  };
}

function selectMonth(key) { currentMonthKey = key; renderMonths(); }

// ── Stats overlay ──
function renderStats() {
  const el = document.getElementById('stats-content');
  const rarityCounts = [1, 2, 3, 4, 5].map(r => D.girls.filter(g => g.rarity === r).length);
  const max = Math.max(1, ...rarityCounts);
  el.innerHTML = `
    <div class="stats-grid">
      ${STAT_KEYS.map(k => `<div class="qstat ${STAT_CSS[k]}">
        <div class="qstat-label">${STAT_LABELS[k]}</div>
        <div class="qstat-value">${Math.round(D.player.stats[k])}</div>
      </div>`).join('')}
    </div>
    <div class="section-header"><span>ROSTER RARITY</span></div>
    <div class="rarity-bar-container">
      ${[5, 4, 3, 2, 1].map(r => {
    const count = rarityCounts[r - 1];
    const pct = count / max * 100;
    return `<div class="rarity-bar">
          <span class="lbl">${r}★</span>
          <span class="trk"><span class="fil ${rarityClass(r)}" style="width:${pct}%;display:block;height:100%;"></span></span>
          <span class="num">${count}</span>
        </div>`;
  }).join('')}
    </div>
    <div class="section-header"><span>TOTALS</span></div>
    <div class="stats-grid">
      <div class="qstat"><div class="qstat-label">Girls</div><div class="qstat-value">${D.girls.length}</div></div>
      <div class="qstat"><div class="qstat-label">Friends</div><div class="qstat-value">${D.friends.length}</div></div>
      <div class="qstat"><div class="qstat-label">Sidelined</div><div class="qstat-value">${D.relationships.sidelined.length}</div></div>
    </div>
  `;
}

// ── Modal ──
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-backdrop').classList.add('active');
  document.getElementById('modal-container').classList.add('active');
}
function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('active');
  document.getElementById('modal-container').classList.remove('active');
}

// ── Save/Load ──
function exportSaveData() {
  const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-rpg-save-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Save exported.');
}

function importSaveData(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      D = deepMerge(defaultData(), parsed);
      save();
      render();
      toast('Save imported.');
    } catch (err) { toast('Import failed.'); }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (!confirm('Reset ALL data? This cannot be undone.')) return;
  localStorage.removeItem(SAVE_KEY);
  D = defaultData();
  hideOverlay();
  navigateTo('home');
  toast('Reset.');
}

// ── Utility ──
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Header date ──
function renderHeaderDate() {
  const el = document.getElementById('wordmark-date');
  if (!el) return;
  const info = currentMonthInfo();
  const dayInMonth = ((D.day - 1) % DAYS_PER_MONTH) + 1;
  el.textContent = `${info.year}-${String(MONTH_NAMES.indexOf(info.name) + 1).padStart(2, '0')}-${String(dayInMonth).padStart(2, '0')}`;
}

// ── Stat page ──
let currentStatKey = null;
function openStatPage(key) {
  if (key === 'vibe') { navigateTo('vibe'); return; }
  currentStatKey = key;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-stat').classList.add('active');
  renderStatPage();
}
function renderStatPage() {
  const k = currentStatKey;
  if (!k) return;
  const el = document.getElementById('stat-page-content');
  const val = Math.round(D.player.stats[k] || 0);
  const relatedActs = PRESET_ACTIVITIES.filter(a => a.effects && a.effects[k])
    .concat(D.customActivities.filter(a => a.effects && a.effects[k]));
  const related = actCats().flatMap(c => c.inventory.filter(it => it.statEffects && it.statEffects[k]));
  el.innerHTML = `
    <div class="stat-hero ${STAT_CSS[k]}">
      <div class="stat-hero-emoji">${STAT_EMOJI[k] || '◆'}</div>
      <div class="stat-hero-body">
        <div class="stat-hero-name">${STAT_LABELS[k]}${k === 'money' ? ' ($)' : ''}</div>
        <div class="stat-hero-val">${val}</div>
        <div class="stat-hero-desc">${STAT_DESC[k] || ''}</div>
      </div>
    </div>
    ${k === 'social' ? `
      <div class="section-header"><span>FRIENDS (boost this stat)</span></div>
      <div class="inv-content active">
        ${D.friends.length ? D.friends.map(friendCard).join('') : '<div class="empty-state">No friends yet.</div>'}
      </div>` : ''}
    <div class="section-header"><span>ACTIVITIES THAT AFFECT ${STAT_LABELS[k].toUpperCase()}</span></div>
    <div class="activities-list">
      ${relatedActs.length ? relatedActs.map(a => activityCard(a)).join('')
      : '<div class="empty-state">No activity currently impacts this stat.</div>'}
    </div>
    ${related.length ? `
      <div class="section-header"><span>INVENTORY ITEMS</span></div>
      <div class="activities-list">
        ${related.map(it => `<div class="activity-card"><div class="name">${it.emoji || '★'} ${escapeHtml(it.name)}</div><div class="meta">${statEffectsStr(it.statEffects)}</div></div>`).join('')}
      </div>` : ''}
  `;
}

function statEffectsStr(effs) {
  if (!effs) return '';
  return Object.entries(effs).map(([k, v]) => `${v >= 0 ? '+' : ''}${v} ${STAT_LABELS[k] || k}`).join(' · ');
}

// ── Girls hub ──
function renderGirls() {
  const girlsCount = D.girls.filter(g => g.status !== 'Sidelined').length;
  const taken = (D.relationships.theOne ? 1 : 0) + D.relationships.commons.length;
  const vibePct = computeVibe().percent.toFixed(0);
  const el = document.getElementById('girls-hub');
  if (!el) return;
  el.innerHTML = `
    <button class="hub-card hub-card-vibe" onclick="navigateTo('vibe')">
      <div class="hub-icon">✦</div>
      <div class="hub-body"><div class="hub-title">The Entity</div><div class="hub-desc">${vibePct}% — the big picture</div></div>
      <div class="hub-arrow">→</div>
    </button>
    <button class="hub-card" onclick="navigateTo('roster')">
      <div class="hub-icon"></div>
      <div class="hub-body"><div class="hub-title">Roster</div><div class="hub-desc">${girlsCount} girls · ${D.friends.length} friends</div></div>
    </button>
    <button class="hub-card" onclick="navigateTo('life')">
      <div class="hub-icon"></div>
      <div class="hub-body"><div class="hub-title">Life (Slots)</div><div class="hub-desc">${taken} girlfriend${taken === 1 ? '' : 's'}</div></div>
    </button>
    <button class="hub-card" onclick="navigateTo('meet')">
      <div class="hub-icon"></div>
      <div class="hub-body"><div class="hub-title">Meet</div><div class="hub-desc">${computeMeetBar().percent.toFixed(0)}% chance bar</div></div>
    </button>
  `;
}

// ── Lead Generation ──
function leadItemGain(item, method) {
  if (!item) return 0;
  const raw = (LEAD_GAIN_MATRIX[item.difficulty]?.[item.roi]) || 0;
  // Cap at method's maxGain if provided
  if (method && method.maxGain) return Math.min(raw, method.maxGain);
  return raw;
}
function computeLeadBar() {
  const slotted = [];
  leadMethods().forEach(m => {
    m.slots.forEach(itemId => {
      if (!itemId) return;
      const item = m.inventory.find(x => x.id === itemId);
      if (item) slotted.push({ method: m, item });
    });
  });
  if (slotted.length === 0) return { percent: 0, parts: [], slotted };
  const gains = slotted.map(s => leadItemGain(s.item, s.method));
  const avg = gains.reduce((a, b) => a + b, 0) / gains.length;
  const parts = slotted.map(s => ({
    label: `${s.method.name}: ${s.item.name}`,
    val: leadItemGain(s.item, s.method),
  }));
  return { percent: clamp(avg, 0, 100), parts, slotted };
}
// ── Tier coloring for lead items / methods ──
// (Legacy gain-based tiers kept for backward compat, but items use ROI directly)
const GAIN_TIERS = [
  { min: 10, cls: 'tier-legendary', label: 'Legendary' },
  { min: 7, cls: 'tier-epic', label: 'Epic' },
  { min: 5, cls: 'tier-rare', label: 'Rare' },
  { min: 3, cls: 'tier-uncommon', label: 'Uncommon' },
  { min: 0, cls: 'tier-common', label: 'Common' },
];
function gainTierClass(pct) { for (const t of GAIN_TIERS) if (pct >= t.min) return t.cls; return 'tier-common'; }
function gainTierLabel(pct) { for (const t of GAIN_TIERS) if (pct >= t.min) return t.label; return 'Common'; }

// Method avg ROI tier (for the head page cards) — uses dominant ROI of slotted items
function methodAvgRoiTier(m) {
  const roiOrder = ['low', 'medium-low', 'medium', 'high', 'very-high'];
  const items = m.slots.map(id => id ? m.inventory.find(x => x.id === id) : null).filter(Boolean);
  if (items.length === 0) return 'low';
  const avgIdx = items.map(it => roiOrder.indexOf(it.roi)).reduce((a, b) => a + b, 0) / items.length;
  return roiOrder[Math.round(avgIdx)] || 'low';
}
function methodAvgGain(m) {
  const items = m.slots.map(id => id ? m.inventory.find(x => x.id === id) : null).filter(Boolean);
  if (items.length === 0) return 0;
  return items.map(it => leadItemGain(it, m)).reduce((a, b) => a + b, 0) / items.length;
}

// ── Vibe system — the big picture entity ──
// Vibe component gain computation (same pattern as lead items)
// For vc-vibe specifically, slotted activities also contribute
function vibeComponentGain(comp) {
  const itemGains = comp.slots
    .map(id => id ? comp.inventory.find(x => x.id === id) : null)
    .filter(Boolean)
    .map(it => {
      const raw = (LEAD_GAIN_MATRIX[it.difficulty]?.[it.roi]) || 0;
      return comp.maxGain ? Math.min(raw, comp.maxGain) : raw;
    });

  // For vc-vibe: slotted activities contribute too
  let activityBonus = 0;
  if (comp.id === 'vc-vibe') {
    activityBonus = getSlottedActivityBonus();
  }

  const totalItems = itemGains.length;
  if (totalItems === 0 && activityBonus === 0) return 0;

  const itemTotal = itemGains.reduce((a, b) => a + b, 0);
  // Combine: item average + activity bonus (additive)
  const itemAvg = totalItems > 0 ? itemTotal / totalItems : 0;
  return clamp(itemAvg + activityBonus, 0, comp.maxGain || 100);
}

// Compute bonus from slotted activities
function getSlottedActivityBonus() {
  let bonus = 0;
  actCats().forEach(cat => {
    cat.slots.forEach(itemId => {
      if (!itemId) return;
      const item = cat.inventory.find(x => x.id === itemId);
      if (!item) return;
      // Each slotted activity contributes 1% base + 0.5% per meetBonus point
      const meetB = item.meetBonus || 0;
      const statCount = Object.keys(item.statEffects || {}).length;
      bonus += 1 + meetB * 0.5 + statCount * 0.3;
    });
  });
  return bonus;
}

// Get list of slotted activities for display
function getSlottedActivities() {
  const list = [];
  actCats().forEach(cat => {
    cat.slots.forEach(itemId => {
      if (!itemId) return;
      const item = cat.inventory.find(x => x.id === itemId);
      if (!item) return;
      const meetB = item.meetBonus || 0;
      const statCount = Object.keys(item.statEffects || {}).length;
      const contrib = 1 + meetB * 0.5 + statCount * 0.3;
      list.push({ item, cat, contrib });
    });
  });
  return list;
}

function computeVibe() {
  const leadPct = computeLeadBar().percent;
  const componentPcts = (D.vibeComponents || []).map(c => vibeComponentGain(c));
  const allPcts = [leadPct, ...componentPcts];
  const total = allPcts.reduce((a, b) => a + b, 0);
  const avg = allPcts.length > 0 ? total / allPcts.length : 0;
  // Build breakdown
  const parts = [
    { label: 'Lead Generation', val: leadPct },
    ...(D.vibeComponents || []).map(c => ({ label: c.name, val: vibeComponentGain(c) })),
  ];
  return { percent: clamp(avg, 0, 100), parts, total };
}

// Keep vibe stat synced with computation
function syncVibeStat() {
  const { percent } = computeVibe();
  D.player.stats.vibe = Math.round(percent);
}

let vibeCompEditMode = false;
function toggleVibeCompEdit() {
  vibeCompEditMode = !vibeCompEditMode;
  if (currentPage === 'vibecomp') renderVibeCompDetail();
}

let vibeEditMode = false;
function toggleVibeEdit() {
  vibeEditMode = !vibeEditMode;
  const el = document.getElementById('vibe-components');
  if (el) el.classList.toggle('editing', vibeEditMode);
  const btn = document.getElementById('vibe-edit-toggle');
  if (btn) btn.classList.toggle('active', vibeEditMode);
}

let currentVibeCompId = null;
function openVibeComp(id) {
  if (id === 'leadgen') {
    navigateTo('leadgen');
  } else {
    currentVibeCompId = id;
    navigateTo('vibecomp');
  }
}

// ── Lead Gen HEAD page (list of methods) ──
let currentLeadMethodId = null;
function openLeadMethod(id) { currentLeadMethodId = id; navigateTo('leadmethod'); }

function renderLeadgen() {
  const { percent, slotted } = computeLeadBar();
  const bar = document.getElementById('lead-bar-fill');
  if (bar) bar.style.width = Math.min(percent, 100) + '%';
  const pctEl = document.getElementById('lead-bar-pct');
  if (pctEl) pctEl.textContent = `${percent.toFixed(0)}% total gain`;
  const subEl = document.getElementById('lead-bar-sub');
  if (subEl) subEl.textContent = slotted.length
    ? `${slotted.length} active lead${slotted.length === 1 ? '' : 's'} — avg of their gain %`
    : 'No active leads. Open a method to slot items.';

  const globalEl = document.getElementById('lead-global-stars');
  if (globalEl) globalEl.innerHTML = leadStarsCard('POTENTIAL LEADS', totalLeadCount());

  const methodsEl = document.getElementById('lead-methods');
  methodsEl.innerHTML = leadMethods().map(m => {
    const avg = methodAvgGain(m);
    const avgRoi = methodAvgRoiTier(m);
    const tier = m.slots.some(Boolean) ? roiTierClass(avgRoi) : 'tier-common';
    const used = m.slots.filter(Boolean).length;
    const leads = methodLeadCount(m);
    return `
      <button class="method-row ${tier}" onclick="openLeadMethod('${m.id}')">
        <div class="method-body">
          <div class="method-name">${escapeHtml(m.name)}</div>
          <div class="method-meta">${used}/${m.maxSlots} slot${m.maxSlots === 1 ? '' : 's'} · potential ${m.maxGain || '∞'}% · ${used > 0 ? roiTierLabel(avgRoi) : 'empty'}</div>
          <div class="method-meta"><span class="lead-count-badge">${leads} leads</span></div>
          ${leadStarsHtml(leads, { inline: true })}
        </div>
        <div class="method-gain">+${avg.toFixed(0)}%</div>
      </button>`;
  }).join('');
}

// ── Lead counts & stars ──
const LEADS_PER_STAR = 20;
const LEAD_MAX_STARS = 18;

function methodLeadCount(m) {
  return (m.inventory || []).reduce((s, it) => s + (Number(it.leads) || 0), 0);
}
function totalLeadCount() {
  return (leadMethods() || []).reduce((s, m) => s + methodLeadCount(m), 0);
}
function leadStarSvg(filled, size) {
  const fill = filled ? '#ffcd4a' : 'none';
  const stroke = filled ? 'none' : 'rgba(255,255,255,0.45)';
  const dash = filled ? '' : 'stroke-dasharray="2 2"';
  const glow = filled ? 'filter="drop-shadow(0 0 3px rgba(255,205,74,0.6))"' : '';
  return `<svg class="ls ${filled ? 'ls-filled' : 'ls-empty'}" viewBox="0 0 24 24" width="${size}" height="${size}" ${glow}><path d="M12 2 L14.94 8.46 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L9.06 8.46 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round" ${dash}/></svg>`;
}
function leadStarsHtml(count, opts = {}) {
  const perStar = opts.perStar || LEADS_PER_STAR;
  const max = opts.max || LEAD_MAX_STARS;
  const inline = opts.inline ? ' lead-stars-inline' : '';
  const filled = Math.min(max, Math.floor(count / perStar));
  const empty = max - filled;
  const size = opts.inline ? 12 : 18;
  let html = `<div class="lead-stars${inline}">`;
  for (let i = 0; i < filled; i++) html += leadStarSvg(true, size);
  for (let i = 0; i < empty; i++) html += leadStarSvg(false, size);
  html += '</div>';
  return html;
}
function leadStarsCard(title, count, opts = {}) {
  const perStar = opts.perStar || LEADS_PER_STAR;
  const max = opts.max || LEAD_MAX_STARS;
  const filled = Math.min(max, Math.floor(count / perStar));
  const nextAt = (filled + 1) * perStar;
  const tierLbl = filled >= max
    ? 'MAX'
    : `★${filled}/${max} · next at ${nextAt}`;
  return `
    <div class="lead-stars-head">
      <span class="cnt">${count}<span class="sub">${escapeHtml(title)}</span></span>
      <span class="tier">${tierLbl}</span>
    </div>
    ${leadStarsHtml(count, opts)}
  `;
}

let leadsEditMode = false;
function toggleLeadsEdit() {
  leadsEditMode = !leadsEditMode;
  redrawLeadgen();
}

function adjustLeadItemCount(methodId, itemId, delta) {
  const m = leadMethods().find(x => x.id === methodId);
  const it = m?.inventory.find(x => x.id === itemId);
  if (!it) return;
  it.leads = Math.max(0, (Number(it.leads) || 0) + delta);
  save();
  redrawLeadgen();
  if (currentPage === 'home') renderHomeLeads();
}

function renderHomeLeads() {
  const el = document.getElementById('home-leads');
  if (!el) return;
  el.innerHTML = leadStarsCard('POTENTIAL LEADS', totalLeadCount());
}

// ── Lead method DETAIL page ──
function renderLeadMethodDetail() {
  const m = leadMethods().find(x => x.id === currentLeadMethodId);
  if (!m) { navigateTo('leadgen'); return; }
  const title = document.getElementById('leadmethod-title');
  if (title) title.textContent = m.name.toUpperCase();
  const avg = methodAvgGain(m);
  const used = m.slots.filter(Boolean).length;
  const avgRoi = methodAvgRoiTier(m);
  const tierCls = used > 0 ? roiTierClass(avgRoi) : '';

  const slotsHtml = m.slots.map((itemId, idx) => {
    const item = itemId ? m.inventory.find(x => x.id === itemId) : null;
    const tCls = item ? roiTierClass(item.roi) : '';
    return `
      <div class="slot-zone ${tCls}${item ? ' slot-filled' : ''}"
           ondragover="onDragOver(event,this)"
           ondragleave="onDragLeave(event,this)"
           ondrop="onDropLead(event,'${m.id}',${idx})">
        ${item ? leadItemTile(m, item, true) : `<span class="slot-empty">Slot ${idx + 1}</span>`}
      </div>`;
  }).join('');

  const inventoryHtml = m.inventory.length
    ? m.inventory.map(it => leadItemTile(m, it, false)).join('')
    : '<div class="empty-state">No items yet. Tap “+ Item” to add one.</div>';

  const methodLeads = methodLeadCount(m);
  document.getElementById('leadmethod-content').innerHTML = `
    <div class="lead-stars-wrap" style="margin-bottom:10px">
      ${leadStarsCard(m.name.toUpperCase() + ' LEADS', methodLeads)}
    </div>
    <div class="method-summary ${tierCls}">
      <div class="method-summary-row" style="grid-template-columns: repeat(4, 1fr);">
        <div class="ms-cell"><div class="k">Slots</div><div class="v">${used}/${m.maxSlots}</div></div>
        <div class="ms-cell"><div class="k">Avg gain</div><div class="v green">${avg.toFixed(1)}%</div></div>
        <div class="ms-cell"><div class="k">Potential</div><div class="v">${m.maxGain || '∞'}%</div></div>
        <div class="ms-cell"><div class="k">Tier</div><div class="v">${used > 0 ? roiTierLabel(avgRoi) : '—'}</div></div>
      </div>
      ${leadsEditMode ? `
      <div class="method-summary-actions">
        <span class="slot-count">${used}/${m.maxSlots}</span>
        <button class="slot-pm" onclick="adjustLeadMax('${m.id}',-1)">−</button>
        <button class="slot-pm" onclick="adjustLeadMax('${m.id}',1)">+</button>
        <span style="margin-left:8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">POT%</span>
        <button class="slot-pm" onclick="adjustMaxGain('${m.id}',-1)">−</button>
        <button class="slot-pm" onclick="adjustMaxGain('${m.id}',1)">+</button>
        <button class="small-btn" onclick="openAddLeadItem('${m.id}')">+ Item</button>
      </div>` : ''}
    </div>
    <div class="section-header">
      <span>CURRENT PARTY</span>
      <button class="small-btn ${leadsEditMode ? 'active' : ''}" onclick="toggleLeadsEdit()">${leadsEditMode ? '✓ Done' : '✎ Edit'}</button>
    </div>
    <div class="slot-grid slot-grid-auto">${slotsHtml}</div>
    <div class="section-header">
      <span>INVENTORY</span>
    </div>
    <div class="inv-row"
         ondragover="onDragOver(event,this)"
         ondragleave="onDragLeave(event,this)"
         ondrop="onDropLeadInv(event,'${m.id}')">${inventoryHtml}</div>
  `;
}

function leadItemTile(m, it, inSlot) {
  const gain = leadItemGain(it, m);
  const rawGain = leadItemGain(it);
  const isCapped = m.maxGain && rawGain > m.maxGain;
  const tier = roiTierClass(it.roi);
  const leads = Number(it.leads) || 0;
  const abils = abilitiesForTarget('leadmethod', m.id, it.id);
  const abilHtml = abils.length
    ? `<div class="ability-chips">${abils.map(a => `<span class="ability-chip ${a.unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(a.desc || '')}">◈ ${escapeHtml(a.name)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="lead-tile ${tier}" draggable="true"
         ondragstart="onDragStartLead(event,'${m.id}','${it.id}')"
         ondragend="onDragEnd(event)"
         ondblclick="openEditLeadItem('${m.id}','${it.id}')">
      <div class="tile-name">${escapeHtml(it.name)}</div>
      <div class="tile-meta">
        <span class="dot dot-${it.difficulty}"></span>${DIFFICULTY_LABEL[it.difficulty]}
        · <span class="dot roi-${it.roi}"></span>${ROI_LABEL[it.roi]}
      </div>
      <div class="tile-gain">+${gain}%${isCapped ? ' <span style="font-size:8px;color:var(--text-muted)">(cap ' + m.maxGain + '%)</span>' : ''}</div>
      <div class="tile-leads">
        <span class="lead-count-badge">${'★'.repeat(Math.min(LEAD_MAX_STARS, Math.floor(leads / LEADS_PER_STAR)))}${leads > 0 && Math.floor(leads / LEADS_PER_STAR) === 0 ? '☆' : ''} ${Math.floor(leads / LEADS_PER_STAR)}★ · ${leads} leads</span>
        ${inSlot ? '' : leadStarsHtml(leads, { inline: true })}
      </div>
      ${inSlot ? '' : abilHtml}
      ${!inSlot && leadsEditMode ? `
      <div class="lead-count-controls" onclick="event.stopPropagation()">
        <button class="lc-btn" onclick="event.stopPropagation();adjustLeadItemCount('${m.id}','${it.id}',-1)">−</button>
        <span class="lc-val">${leads}</span>
        <button class="lc-btn" onclick="event.stopPropagation();adjustLeadItemCount('${m.id}','${it.id}',1)">+</button>
        <button class="lc-btn" style="width:auto;padding:0 6px;font-size:10px" onclick="event.stopPropagation();adjustLeadItemCount('${m.id}','${it.id}',10)">+10</button>
      </div>` : ''}
      <div class="tile-actions">
        ${inSlot
      ? `<button class="tile-btn" onclick="event.stopPropagation();clearLeadSlot('${m.id}','${it.id}')">Unslot</button>`
      : `<button class="tile-btn" onclick="event.stopPropagation();tapSlotLead('${m.id}','${it.id}')">Slot →</button>`}
        <button class="tile-btn" onclick="event.stopPropagation();openEditLeadItem('${m.id}','${it.id}')">Edit</button>
      </div>
    </div>`;
}

// Mobile-friendly tap-to-slot
function tapSlotLead(methodId, itemId) {
  const m = leadMethods().find(x => x.id === methodId);
  if (!m) return;
  if (m.maxSlots === 1) { placeLeadInSlot(methodId, itemId, 0); return; }
  const btns = m.slots.map((sid, idx) => {
    const occ = sid ? m.inventory.find(x => x.id === sid) : null;
    return `<button class="pill-btn good" onclick="placeLeadInSlot('${methodId}','${itemId}',${idx})">Slot ${idx + 1}${occ ? ` (replace ${escapeHtml(occ.name)})` : ''}</button>`;
  }).join('');
  openModal(`
    <h3>Place in slot</h3>
    <div style="display:flex;flex-direction:column;gap:6px">${btns}</div>
    <div class="row"><button class="pill-btn" onclick="closeModal()">Cancel</button></div>`);
}
function placeLeadInSlot(methodId, itemId, idx) {
  const m = leadMethods().find(x => x.id === methodId);
  if (!m) return;
  m.slots = m.slots.map(s => s === itemId ? null : s);
  m.slots[idx] = itemId;
  closeModal();
  save(); redrawLeadgen();
}
function redrawLeadgen() {
  if (currentPage === 'leadmethod') renderLeadMethodDetail();
  else renderLeadgen();
}
function adjustLeadMax(methodId, delta) {
  const m = leadMethods().find(x => x.id === methodId);
  if (!m) return;
  const next = clamp(m.maxSlots + delta, 1, 10);
  if (next === m.maxSlots) return;
  if (next < m.slots.length) {
    // trim
    m.slots = m.slots.slice(0, next);
  } else {
    while (m.slots.length < next) m.slots.push(null);
  }
  m.maxSlots = next;
  save(); redrawLeadgen();
}
function adjustMaxGain(methodId, delta) {
  const m = leadMethods().find(x => x.id === methodId);
  if (!m) return;
  m.maxGain = clamp((m.maxGain || 10) + delta, 1, 30);
  save(); redrawLeadgen();
}
function openAddLeadItem(methodId) {
  openModal(`
    <h3> Add Lead Item</h3>
    <div class="form-row"><label>NAME</label><input id="li-name" placeholder="e.g. Albert Heijn vakkenvuller"/></div>
    <div class="form-row"><label>DIFFICULTY</label>
      <select id="li-diff">
        <option value="easy">• Easy</option>
        <option value="medium" selected>• Medium</option>
        <option value="hard">• Hard</option>
      </select></div>
    <div class="form-row"><label>SOCIAL ROI</label>
      <select id="li-roi">
        <option value="low">Low (grey)</option>
        <option value="medium-low">Med-Low (green)</option>
        <option value="medium" selected>Medium (blue)</option>
        <option value="high">High (yellow)</option>
        <option value="very-high">Very High (red)</option>
      </select></div>
    <div class="form-row"><label>LEADS (count)</label><input id="li-leads" type="number" min="0" value="0"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddLeadItem('${methodId}')">Add</button>
    </div>`);
}
function submitAddLeadItem(methodId) {
  const m = leadMethods().find(x => x.id === methodId);
  if (!m) return;
  const name = (document.getElementById('li-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  m.inventory.push({
    id: uid('li'), name,
    difficulty: document.getElementById('li-diff').value,
    roi: document.getElementById('li-roi').value,
    leads: Math.max(0, parseInt(document.getElementById('li-leads').value, 10) || 0),
  });
  closeModal();
  save(); redrawLeadgen();
  toast(`Added ${name}.`);
}
function openEditLeadItem(methodId, itemId) {
  const m = leadMethods().find(x => x.id === methodId);
  const it = m?.inventory.find(x => x.id === itemId);
  if (!it) return;
  openModal(`
    <h3> Edit ${escapeHtml(it.name)}</h3>
    <div class="form-row"><label>NAME</label><input id="li-name" value="${escapeHtml(it.name)}"/></div>
    <div class="form-row"><label>DIFFICULTY</label>
      <select id="li-diff">
        ${['easy', 'medium', 'hard'].map(d =>
    `<option value="${d}" ${d === it.difficulty ? 'selected' : ''}>${DIFFICULTY_LABEL[d]}</option>`).join('')}
      </select></div>
    <div class="form-row"><label>SOCIAL ROI</label>
      <select id="li-roi">
        ${['low', 'medium-low', 'medium', 'high', 'very-high'].map(d =>
      `<option value="${d}" ${d === it.roi ? 'selected' : ''}>${ROI_LABEL[d]}</option>`).join('')}
      </select></div>
    <div class="form-row"><label>LEADS (count)</label><input id="li-leads" type="number" min="0" value="${Number(it.leads) || 0}"/></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteLeadItem('${methodId}','${itemId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditLeadItem('${methodId}','${itemId}')">Save</button>
    </div>`);
}
function submitEditLeadItem(methodId, itemId) {
  const m = leadMethods().find(x => x.id === methodId);
  const it = m?.inventory.find(x => x.id === itemId);
  if (!it) return;
  it.name = document.getElementById('li-name').value || it.name;
  it.difficulty = document.getElementById('li-diff').value;
  it.roi = document.getElementById('li-roi').value;
  it.leads = Math.max(0, parseInt(document.getElementById('li-leads').value, 10) || 0);
  closeModal();
  save(); redrawLeadgen();
}
function deleteLeadItem(methodId, itemId) {
  const m = leadMethods().find(x => x.id === methodId);
  if (!m) return;
  m.inventory = m.inventory.filter(x => x.id !== itemId);
  m.slots = m.slots.map(s => s === itemId ? null : s);
  closeModal();
  save(); redrawLeadgen();
}
function clearLeadSlot(methodId, itemId) {
  const m = leadMethods().find(x => x.id === methodId);
  if (!m) return;
  m.slots = m.slots.map(s => s === itemId ? null : s);
  save(); redrawLeadgen();
}

// ── Vibe Page (the big picture) ──
function renderVibePage() {
  const { percent, parts, total } = computeVibe();
  const bar = document.getElementById('vibe-bar-fill');
  if (bar) bar.style.width = Math.min(percent, 100) + '%';
  const pctEl = document.getElementById('vibe-bar-pct');
  if (pctEl) pctEl.textContent = `${percent.toFixed(0)}%`;
  const subEl = document.getElementById('vibe-bar-sub');
  if (subEl) subEl.textContent = parts.filter(p => p.val > 0).length + '/' + parts.length + ' components active';

  // Breakdown
  const breakdownEl = document.getElementById('vibe-breakdown');
  if (breakdownEl) {
    breakdownEl.innerHTML = parts.map(p =>
      `<div class="brow"><span class="label">${escapeHtml(p.label)}</span><span class="val ${p.val > 0 ? '' : 'neg'}">${p.val > 0 ? '+' : ''}${p.val.toFixed(1)}%</span></div>`
    ).join('');
  }

  // Component cards
  const compEl = document.getElementById('vibe-components');
  if (compEl) {
    const leadPct = computeLeadBar().percent;
    const leadSlotted = computeLeadBar().slotted.length;
    const leadTotal = leadMethods().reduce((s, m) => s + m.maxSlots, 0);
    let html = `
      <button class="method-row ${leadPct > 0 ? gainTierClass(leadPct) : 'tier-common'}" onclick="openVibeComp('leadgen')">
        <div class="method-body">
          <div class="method-name">Lead Generation</div>
          <div class="method-meta">${leadSlotted}/${leadTotal} total slots · ${leadMethods().length} methods</div>
        </div>
        <div class="method-gain">+${leadPct.toFixed(0)}%</div>
      </button>`;

    (D.vibeComponents || []).forEach(c => {
      const g = vibeComponentGain(c);
      const used = c.slots.filter(Boolean).length;
      const avgRoi = vibeCompAvgRoi(c);
      const tier = used > 0 ? roiTierClass(avgRoi) : 'tier-common';
      html += `
        <div class="method-row-wrap">
          <button class="method-row ${tier}" onclick="openVibeComp('${c.id}')">
            <div class="method-body">
              <div class="method-name">${c.emoji} ${escapeHtml(c.name)}</div>
              <div class="method-meta">${used}/${c.maxSlots} slots · potential ${c.maxGain}% · ${used > 0 ? roiTierLabel(avgRoi) : 'empty'}</div>
            </div>
            <div class="method-gain">+${g.toFixed(0)}%</div>
          </button>
          <button class="comp-edit-btn" onclick="event.stopPropagation();openEditComponent('${c.id}')" title="Edit component">✎</button>
        </div>`;
    });

    html += `
      <button class="method-row add-component-btn" onclick="openAddComponent()">
        <div class="method-body">
          <div class="method-name">+ Add Component</div>
          <div class="method-meta">Create a new part of the entity</div>
        </div>
      </button>`;

    compEl.innerHTML = html;
  }
}

function vibeCompAvgRoi(c) {
  const roiOrder = ['low', 'medium-low', 'medium', 'high', 'very-high'];
  const items = c.slots.map(id => id ? c.inventory.find(x => x.id === id) : null).filter(Boolean);
  if (items.length === 0) return 'low';
  const avgIdx = items.map(it => roiOrder.indexOf(it.roi)).reduce((a, b) => a + b, 0) / items.length;
  return roiOrder[Math.round(avgIdx)] || 'low';
}

// ── Component CRUD ──
function openAddComponent() {
  openModal(`
    <h3>New Component</h3>
    <div class="form-row"><label>NAME</label><input id="vc-name" placeholder="e.g. Mindset"/></div>
    <div class="form-row"><label>EMOJI</label><input id="vc-emoji" placeholder="e.g. ◇" maxlength="4" style="width:60px"/></div>
    <div class="form-row"><label>DESCRIPTION</label><input id="vc-desc" placeholder="What this represents…"/></div>
    <div class="form-row"><label>SLOTS</label><input id="vc-slots" type="number" min="1" max="10" value="2" style="width:60px"/></div>
    <div class="form-row"><label>MAX GAIN %</label><input id="vc-maxgain" type="number" min="1" max="50" value="25" style="width:60px"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddComponent()">Add</button>
    </div>`);
}

function submitAddComponent() {
  const name = (document.getElementById('vc-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  const emoji = document.getElementById('vc-emoji').value || '◇';
  const desc = document.getElementById('vc-desc').value || '';
  const maxSlots = clamp(parseInt(document.getElementById('vc-slots').value) || 2, 1, 10);
  const maxGain = clamp(parseInt(document.getElementById('vc-maxgain').value) || 25, 1, 50);
  const slots = Array(maxSlots).fill(null);
  D.vibeComponents.push({
    id: uid('vc'), name, emoji, desc, maxSlots, maxGain, slots, inventory: []
  });
  closeModal();
  save();
  renderVibePage();
  toast(`Added ${name}.`);
}

function openEditComponent(compId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  openModal(`
    <h3>Edit ${escapeHtml(c.name)}</h3>
    <div class="form-row"><label>NAME</label><input id="vc-name" value="${escapeHtml(c.name)}"/></div>
    <div class="form-row"><label>EMOJI</label><input id="vc-emoji" value="${escapeHtml(c.emoji)}" maxlength="4" style="width:60px"/></div>
    <div class="form-row"><label>DESCRIPTION</label><input id="vc-desc" value="${escapeHtml(c.desc || '')}"/></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteComponent('${compId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditComponent('${compId}')">Save</button>
    </div>`);
}

function submitEditComponent(compId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  c.name = document.getElementById('vc-name').value || c.name;
  c.emoji = document.getElementById('vc-emoji').value || c.emoji;
  c.desc = document.getElementById('vc-desc').value || '';
  closeModal();
  save();
  renderVibePage();
}

function deleteComponent(compId) {
  D.vibeComponents = D.vibeComponents.filter(x => x.id !== compId);
  closeModal();
  save();
  renderVibePage();
  toast('Component removed.');
}

// ── Vibe Component Detail Page ──
function renderVibeCompDetail() {
  const c = (D.vibeComponents || []).find(x => x.id === currentVibeCompId);
  if (!c) { navigateTo('vibe'); return; }
  const title = document.getElementById('vibecomp-title');
  if (title) title.textContent = c.name.toUpperCase();
  const gain = vibeComponentGain(c);
  const used = c.slots.filter(Boolean).length;
  const avgRoi = vibeCompAvgRoi(c);
  const tierCls = used > 0 ? roiTierClass(avgRoi) : '';

  const slotsHtml = c.slots.map((itemId, idx) => {
    const item = itemId ? c.inventory.find(x => x.id === itemId) : null;
    const tCls = item ? roiTierClass(item.roi) : '';
    return `
      <div class="slot-zone ${tCls}${item ? ' slot-filled' : ''}"
           ondragover="onDragOver(event,this)"
           ondragleave="onDragLeave(event,this)"
           ondrop="onDropVibe(event,'${c.id}',${idx})">
        ${item ? vibeItemTile(c, item, true) : `<span class="slot-empty">Slot ${idx + 1}</span>`}
      </div>`;
  }).join('');

  const inventoryHtml = c.inventory.length
    ? c.inventory.map(it => vibeItemTile(c, it, false)).join('')
    : '<div class="empty-state">No items yet. Tap "+ Item" to add one.</div>';

  document.getElementById('vibecomp-content').innerHTML = `
    ${c.desc ? `<div class="method-desc">${escapeHtml(c.desc)}</div>` : ''}
    <div class="method-summary ${tierCls}">
      <div class="method-summary-row" style="grid-template-columns: repeat(4, 1fr);">
        <div class="ms-cell"><div class="k">Slots</div><div class="v">${used}/${c.maxSlots}</div></div>
        <div class="ms-cell"><div class="k">Avg gain</div><div class="v green">${gain.toFixed(1)}%</div></div>
        <div class="ms-cell"><div class="k">Potential</div><div class="v">${c.maxGain || '∞'}%</div></div>
        <div class="ms-cell"><div class="k">Tier</div><div class="v">${used > 0 ? roiTierLabel(avgRoi) : '—'}</div></div>
      </div>
      ${vibeCompEditMode ? `
      <div class="method-summary-actions">
        <span class="slot-count">${used}/${c.maxSlots}</span>
        <button class="slot-pm" onclick="adjustVibeMax('${c.id}',-1)">−</button>
        <button class="slot-pm" onclick="adjustVibeMax('${c.id}',1)">+</button>
        <span style="margin-left:8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">POT%</span>
        <button class="slot-pm" onclick="adjustVibeMaxGain('${c.id}',-1)">−</button>
        <button class="slot-pm" onclick="adjustVibeMaxGain('${c.id}',1)">+</button>
        <button class="small-btn" onclick="openAddVibeItem('${c.id}')">+ Item</button>
      </div>` : ''}
    </div>
    <div class="section-header">
      <span>CURRENT PARTY</span>
      <button class="small-btn ${vibeCompEditMode ? 'active' : ''}" onclick="toggleVibeCompEdit()">${vibeCompEditMode ? '✓ Done' : '✎ Edit'}</button>
    </div>
    <div class="slot-grid slot-grid-auto">${slotsHtml}</div>
    <div class="section-header"><span>INVENTORY</span></div>
    <div class="inv-row"
         ondragover="onDragOver(event,this)"
         ondragleave="onDragLeave(event,this)"
         ondrop="onDropVibeInv(event,'${c.id}')">${inventoryHtml}</div>
    ${c.id === 'vc-vibe' ? renderActivityContributions() : ''}
  `;
}

function renderActivityContributions() {
  const slotted = getSlottedActivities();
  const totalBonus = getSlottedActivityBonus();
  const actRows = slotted.length
    ? slotted.map(s =>
      `<div class="brow activity-contrib">
        <span class="label">${s.item.emoji || '★'} ${escapeHtml(s.item.name)} <span style="color:var(--text-muted);font-size:9px">(${escapeHtml(s.cat.name)})</span></span>
        <span class="val">+${s.contrib.toFixed(1)}%</span>
      </div>`
    ).join('')
    : '<div class="empty-state">No activities slotted. Fill slots on the Activities page to boost Vibe.</div>';

  return `
    <div class="section-header"><span>FROM ACTIVITIES</span>
      <button class="small-btn" onclick="navigateTo('activities')">Go to Activities</button>
    </div>
    <div class="meet-breakdown">${actRows}</div>
    ${totalBonus > 0 ? `<div class="activity-contrib-total">Total activity bonus: <strong>+${totalBonus.toFixed(1)}%</strong></div>` : ''}
  `;
}

function vibeItemTile(c, it, inSlot) {
  const raw = (LEAD_GAIN_MATRIX[it.difficulty]?.[it.roi]) || 0;
  const gain = c.maxGain ? Math.min(raw, c.maxGain) : raw;
  const isCapped = c.maxGain && raw > c.maxGain;
  const tier = roiTierClass(it.roi);
  return `
    <div class="lead-tile ${tier}" draggable="true"
         ondragstart="onDragStartVibe(event,'${c.id}','${it.id}')"
         ondragend="onDragEnd(event)"
         ondblclick="openEditVibeItem('${c.id}','${it.id}')">
      <div class="tile-name">${escapeHtml(it.name)}</div>
      <div class="tile-meta">
        <span class="dot dot-${it.difficulty}"></span>${DIFFICULTY_LABEL[it.difficulty]}
        · <span class="dot roi-${it.roi}"></span>${ROI_LABEL[it.roi]}
      </div>
      <div class="tile-gain">+${gain}%${isCapped ? ' <span style="font-size:8px;color:var(--text-muted)">(cap ' + c.maxGain + '%)</span>' : ''}</div>
      <div class="tile-actions">
        ${inSlot
      ? `<button class="tile-btn" onclick="event.stopPropagation();clearVibeSlot('${c.id}','${it.id}')">Unslot</button>`
      : `<button class="tile-btn" onclick="event.stopPropagation();tapSlotVibe('${c.id}','${it.id}')">Slot →</button>`}
        <button class="tile-btn" onclick="event.stopPropagation();openEditVibeItem('${c.id}','${it.id}')">Edit</button>
      </div>
    </div>`;
}

// Vibe component slot/inventory CRUD
function tapSlotVibe(compId, itemId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  if (c.maxSlots === 1) { placeVibeInSlot(compId, itemId, 0); return; }
  const btns = c.slots.map((sid, idx) => {
    const occ = sid ? c.inventory.find(x => x.id === sid) : null;
    return `<button class="pill-btn good" onclick="placeVibeInSlot('${compId}','${itemId}',${idx})">Slot ${idx + 1}${occ ? ` (replace ${escapeHtml(occ.name)})` : ''}</button>`;
  }).join('');
  openModal(`
    <h3>Place in slot</h3>
    <div style="display:flex;flex-direction:column;gap:6px">${btns}</div>
    <div class="row"><button class="pill-btn" onclick="closeModal()">Cancel</button></div>`);
}
function placeVibeInSlot(compId, itemId, idx) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  c.slots = c.slots.map(s => s === itemId ? null : s);
  c.slots[idx] = itemId;
  closeModal();
  save(); redrawVibe();
}
function redrawVibe() {
  if (currentPage === 'vibecomp') renderVibeCompDetail();
  else if (currentPage === 'vibe') renderVibePage();
  else render();
}
function adjustVibeMax(compId, delta) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  const next = clamp(c.maxSlots + delta, 1, 10);
  if (next === c.maxSlots) return;
  if (next < c.slots.length) c.slots = c.slots.slice(0, next);
  else while (c.slots.length < next) c.slots.push(null);
  c.maxSlots = next;
  save(); redrawVibe();
}
function adjustVibeMaxGain(compId, delta) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  c.maxGain = clamp((c.maxGain || 10) + delta, 1, 30);
  save(); redrawVibe();
}
function openAddVibeItem(compId) {
  openModal(`
    <h3> Add Vibe Item</h3>
    <div class="form-row"><label>NAME</label><input id="vi-name" placeholder="e.g. Fresh haircut weekly"/></div>
    <div class="form-row"><label>DIFFICULTY</label>
      <select id="vi-diff">
        <option value="easy">• Easy</option>
        <option value="medium" selected>• Medium</option>
        <option value="hard">• Hard</option>
      </select></div>
    <div class="form-row"><label>IMPACT / ROI</label>
      <select id="vi-roi">
        <option value="low">Low (grey)</option>
        <option value="medium-low">Med-Low (green)</option>
        <option value="medium" selected>Medium (blue)</option>
        <option value="high">High (yellow)</option>
        <option value="very-high">Very High (red)</option>
      </select></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddVibeItem('${compId}')">Add</button>
    </div>`);
}
function submitAddVibeItem(compId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  const name = (document.getElementById('vi-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  c.inventory.push({
    id: uid('vi'), name,
    difficulty: document.getElementById('vi-diff').value,
    roi: document.getElementById('vi-roi').value,
  });
  closeModal();
  save(); redrawVibe();
  toast(`Added ${name}.`);
}
function openEditVibeItem(compId, itemId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  openModal(`
    <h3> Edit ${escapeHtml(it.name)}</h3>
    <div class="form-row"><label>NAME</label><input id="vi-name" value="${escapeHtml(it.name)}"/></div>
    <div class="form-row"><label>DIFFICULTY</label>
      <select id="vi-diff">
        ${['easy', 'medium', 'hard'].map(d =>
    `<option value="${d}" ${d === it.difficulty ? 'selected' : ''}>${DIFFICULTY_LABEL[d]}</option>`).join('')}
      </select></div>
    <div class="form-row"><label>IMPACT / ROI</label>
      <select id="vi-roi">
        ${['low', 'medium-low', 'medium', 'high', 'very-high'].map(d =>
      `<option value="${d}" ${d === it.roi ? 'selected' : ''}>${ROI_LABEL[d]}</option>`).join('')}
      </select></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteVibeItem('${compId}','${itemId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditVibeItem('${compId}','${itemId}')">Save</button>
    </div>`);
}
function submitEditVibeItem(compId, itemId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  it.name = document.getElementById('vi-name').value || it.name;
  it.difficulty = document.getElementById('vi-diff').value;
  it.roi = document.getElementById('vi-roi').value;
  closeModal();
  save(); redrawVibe();
}
function deleteVibeItem(compId, itemId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  c.inventory = c.inventory.filter(x => x.id !== itemId);
  c.slots = c.slots.map(s => s === itemId ? null : s);
  closeModal();
  save(); redrawVibe();
}
function clearVibeSlot(compId, itemId) {
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  c.slots = c.slots.map(s => s === itemId ? null : s);
  save(); redrawVibe();
}

// Vibe drag/drop
let dragPayload = null; // { kind:'lead'|'activity'|'vibe', ... }
function onDragStartVibe(e, compId, itemId) {
  dragPayload = { kind: 'vibe', compId, itemId };
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
function onDropVibe(e, compId, slotIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'vibe') return;
  if (dragPayload.compId !== compId) { toast('Item belongs to another component.'); return; }
  const c = D.vibeComponents.find(x => x.id === compId);
  if (!c) return;
  c.slots = c.slots.map(s => s === dragPayload.itemId ? null : s);
  c.slots[slotIdx] = dragPayload.itemId;
  dragPayload = null;
  save(); redrawVibe();
}
function onDropVibeInv(e, compId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'vibe') return;
  if (dragPayload.compId !== compId) return;
  const c = D.vibeComponents.find(x => x.id === compId);
  c.slots = c.slots.map(s => s === dragPayload.itemId ? null : s);
  dragPayload = null;
  save(); redrawVibe();
}

// ── Drag/drop state ──
// dragPayload already declared above for vibe drag/drop
function onDragStartLead(e, methodId, itemId) {
  dragPayload = { kind: 'lead', methodId, itemId };
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
function onDragStartActivity(e, catId, itemId) {
  dragPayload = { kind: 'activity', catId, itemId };
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
function onDragOver(e, target) { e.preventDefault(); target.classList.add('drop-active'); }
function onDragLeave(e, target) { target.classList.remove('drop-active'); }
function onDragEnd(e) { e.target.classList.remove('dragging'); document.querySelectorAll('.drop-active').forEach(x => x.classList.remove('drop-active')); }
function onDropLead(e, methodId, slotIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'lead') return;
  const srcM = leadMethods().find(x => x.id === dragPayload.methodId);
  const dstM = leadMethods().find(x => x.id === methodId);
  if (!srcM || !dstM) return;
  // Item can only move within its owning method (different methods own different items).
  if (srcM !== dstM) { toast('Item belongs to another method.'); return; }
  // Clear any existing slot occupancy for this item (dragging from another slot)
  dstM.slots = dstM.slots.map(s => s === dragPayload.itemId ? null : s);
  dstM.slots[slotIdx] = dragPayload.itemId;
  dragPayload = null;
  save(); redrawLeadgen();
}
function onDropLeadInv(e, methodId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'lead') return;
  if (dragPayload.methodId !== methodId) return;
  const m = leadMethods().find(x => x.id === methodId);
  m.slots = m.slots.map(s => s === dragPayload.itemId ? null : s);
  dragPayload = null;
  save(); redrawLeadgen();
}

// ── Activity categories (drag/drop) ──
let actEditMode = false;
function toggleActEdit() {
  actEditMode = !actEditMode;
  const el = document.getElementById('activity-categories');
  if (el) el.classList.toggle('editing', actEditMode);
  const btn = document.getElementById('act-edit-toggle');
  if (btn) btn.classList.toggle('active', actEditMode);
}

function renderActivitiesV2() {
  const el = document.getElementById('activity-categories');
  if (!el) return;
  let html = actCats().map(renderActivityCategory).join('');
  html += `
    <button class="method-row add-component-btn" onclick="openAddCategory()">
      <div class="method-body">
        <div class="method-name">+ Add Category</div>
        <div class="method-meta">Create a new activity category</div>
      </div>
    </button>`;
  el.innerHTML = html;
  // Preserve editing state
  if (actEditMode) el.classList.add('editing');
}
function renderActivityCategory(cat) {
  const slots = cat.slots.map((itemId, idx) => {
    const item = itemId ? cat.inventory.find(x => x.id === itemId) : null;
    return `
      <div class="slot-zone"
           ondragover="onDragOver(event,this)"
           ondragleave="onDragLeave(event,this)"
           ondrop="onDropActivity(event,'${cat.id}',${idx})">
        ${item ? activityTile(cat, item, true) : '<span class="slot-empty">empty</span>'}
      </div>`;
  }).join('');
  const inv = cat.inventory.length
    ? cat.inventory.map(it => activityTile(cat, it, false)).join('')
    : '<div class="empty-state">No items. Add one.</div>';
  const used = cat.slots.filter(Boolean).length;
  return `
    <div class="category-block">
      <div class="category-head">
        <div class="category-title">${cat.emoji} ${escapeHtml(cat.name)} — <span class="slot-count">${used}/${cat.maxSlots}</span></div>
        <div class="category-actions">
          <button class="slot-pm" onclick="adjustCatMax('${cat.id}',-1)">−</button>
          <button class="slot-pm" onclick="adjustCatMax('${cat.id}',1)">+</button>
          <button class="small-btn" onclick="openAddActivityItem('${cat.id}')">+ Item</button>
          <button class="comp-edit-btn cat-edit-btn" onclick="openEditCategory('${cat.id}')" title="Edit category">✎</button>
        </div>
      </div>
      <div class="slot-row">${slots}</div>
      <div class="inv-label">Inventory</div>
      <div class="inv-row"
           ondragover="onDragOver(event,this)"
           ondragleave="onDragLeave(event,this)"
           ondrop="onDropActivityInv(event,'${cat.id}')">${inv}</div>
    </div>`;
}

// ── Category CRUD ──
function openAddCategory() {
  openModal(`
    <h3>New Category</h3>
    <div class="form-row"><label>NAME</label><input id="ac-name" placeholder="e.g. Meditation"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ac-emoji" placeholder="e.g. [MED]" maxlength="8" style="width:100px"/></div>
    <div class="form-row"><label>SLOTS</label><input id="ac-slots" type="number" min="1" max="10" value="2" style="width:60px"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddCategory()">Add</button>
    </div>`);
}

function submitAddCategory() {
  const name = (document.getElementById('ac-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  const emoji = document.getElementById('ac-emoji').value || '[···]';
  const maxSlots = clamp(parseInt(document.getElementById('ac-slots').value) || 2, 1, 10);
  actCats().push({
    id: uid('cat'), name, emoji, maxSlots, slots: Array(maxSlots).fill(null), inventory: []
  });
  closeModal();
  save(); renderActivitiesV2();
  toast(`Added ${name}.`);
}

function openEditCategory(catId) {
  const c = actCats().find(x => x.id === catId);
  if (!c) return;
  openModal(`
    <h3>Edit ${escapeHtml(c.name)}</h3>
    <div class="form-row"><label>NAME</label><input id="ac-name" value="${escapeHtml(c.name)}"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ac-emoji" value="${escapeHtml(c.emoji)}" maxlength="8" style="width:100px"/></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteCategory('${catId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditCategory('${catId}')">Save</button>
    </div>`);
}

function submitEditCategory(catId) {
  const c = actCats().find(x => x.id === catId);
  if (!c) return;
  c.name = document.getElementById('ac-name').value || c.name;
  c.emoji = document.getElementById('ac-emoji').value || c.emoji;
  closeModal();
  save(); renderActivitiesV2();
}

function deleteCategory(catId) {
  setActCats(actCats().filter(x => x.id !== catId));
  closeModal();
  save(); renderActivitiesV2();
  toast('Category removed.');
}

function activityTile(cat, it, inSlot) {
  const kind = it.kind || 'maintenance';
  const abils = abilitiesForTarget('activity', cat.id, it.id);
  const abilHtml = abils.length
    ? `<div class="ability-chips">${abils.map(a => `<span class="ability-chip ${a.unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(a.desc || '')}">◈ ${escapeHtml(a.name)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="act-tile" draggable="true"
         ondragstart="onDragStartActivity(event,'${cat.id}','${it.id}')"
         ondragend="onDragEnd(event)"
         ondblclick="openEditActivityItem('${cat.id}','${it.id}')">
      <div class="tile-name">${it.emoji || '★'} ${escapeHtml(it.name)}</div>
      <div class="tile-meta">${statEffectsStr(it.statEffects)}${it.meetBonus ? ` · Meet +${it.meetBonus}` : ''}</div>
      <div class="tile-tags"><span class="kind-tag kind-${kind}">${kind === 'expansion' ? '▲ EXPANSION' : '■ MAINTENANCE'}</span></div>
      ${abilHtml}
      <div class="row" style="margin-top:4px">
        <button class="pill-btn good" onclick="event.stopPropagation();doActivityItem('${cat.id}','${it.id}')">Do</button>
        ${inSlot ? `<button class="pill-btn" onclick="event.stopPropagation();clearActivitySlot('${cat.id}','${it.id}')">Unslot</button>` : ''}
      </div>
    </div>`;
}
function adjustCatMax(catId, delta) {
  const c = actCats().find(x => x.id === catId);
  if (!c) return;
  const next = clamp(c.maxSlots + delta, 1, 10);
  if (next === c.maxSlots) return;
  if (next < c.slots.length) c.slots = c.slots.slice(0, next);
  else while (c.slots.length < next) c.slots.push(null);
  c.maxSlots = next;
  save(); renderActivitiesV2();
}
function onDropActivity(e, catId, slotIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'activity') return;
  const src = actCats().find(c => c.id === dragPayload.catId);
  const dst = actCats().find(c => c.id === catId);
  if (!src || !dst || src !== dst) { toast('Item belongs to another category.'); return; }
  dst.slots = dst.slots.map(s => s === dragPayload.itemId ? null : s);
  dst.slots[slotIdx] = dragPayload.itemId;
  dragPayload = null;
  save(); renderActivitiesV2();
}
function onDropActivityInv(e, catId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'activity') return;
  if (dragPayload.catId !== catId) return;
  const c = actCats().find(x => x.id === catId);
  c.slots = c.slots.map(s => s === dragPayload.itemId ? null : s);
  dragPayload = null;
  save(); renderActivitiesV2();
}
function clearActivitySlot(catId, itemId) {
  const c = actCats().find(x => x.id === catId);
  if (!c) return;
  c.slots = c.slots.map(s => s === itemId ? null : s);
  save(); renderActivitiesV2();
}
function openAddActivityItem(catId) {
  const effRows = STAT_KEYS.map(k =>
    `<div class="eff-row"><label>${STAT_LABELS[k]}</label><input type="number" value="0" data-stat="${k}" class="eff-input"/></div>`
  ).join('');
  openModal(`
    <h3>★ Add Item</h3>
    <div class="form-row"><label>NAME</label><input id="ai-name" placeholder="e.g. Judo class"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ai-emoji" placeholder="" maxlength="2"/></div>
    <div class="form-row"><label>KIND</label>
      <select id="ai-kind">
        <option value="expansion" selected>▲ Expansion (grows you: stats, skills, leads)</option>
        <option value="maintenance">■ Maintenance (upkeep: rest, grooming, gaming)</option>
      </select>
    </div>
    <div class="form-row"><label>MEET BAR BONUS</label><input id="ai-meet" type="number" min="0" max="15" value="0"/></div>
    <div class="form-row"><label>XP PER DO</label><input id="ai-xp" type="number" min="1" max="50" value="5"/></div>
    <div class="form-row"><label>STAT EFFECTS</label><div class="effects-grid">${effRows}</div></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddActivityItem('${catId}')">Add</button>
    </div>`);
}
function readEffectInputs() {
  const out = {};
  document.querySelectorAll('.eff-input').forEach(inp => {
    const v = parseInt(inp.value);
    if (v) out[inp.dataset.stat] = v;
  });
  return out;
}
function submitAddActivityItem(catId) {
  const c = actCats().find(x => x.id === catId);
  if (!c) return;
  const name = (document.getElementById('ai-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  c.inventory.push({
    id: uid('ai'),
    name,
    emoji: document.getElementById('ai-emoji').value || '★',
    kind: document.getElementById('ai-kind').value || 'expansion',
    meetBonus: Number(document.getElementById('ai-meet').value) || 0,
    xp: Number(document.getElementById('ai-xp').value) || 5,
    statEffects: readEffectInputs(),
  });
  closeModal();
  save(); renderActivitiesV2();
}
function openEditActivityItem(catId, itemId) {
  const c = actCats().find(x => x.id === catId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  const effRows = STAT_KEYS.map(k =>
    `<div class="eff-row"><label>${STAT_LABELS[k]}</label><input type="number" value="${it.statEffects?.[k] || 0}" data-stat="${k}" class="eff-input"/></div>`
  ).join('');
  openModal(`
    <h3> Edit ${escapeHtml(it.name)}</h3>
    <div class="form-row"><label>NAME</label><input id="ai-name" value="${escapeHtml(it.name)}"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ai-emoji" value="${it.emoji || ''}" maxlength="2"/></div>
    <div class="form-row"><label>KIND</label>
      <select id="ai-kind">
        <option value="expansion" ${(it.kind || 'expansion') === 'expansion' ? 'selected' : ''}>▲ Expansion</option>
        <option value="maintenance" ${it.kind === 'maintenance' ? 'selected' : ''}>■ Maintenance</option>
      </select>
    </div>
    <div class="form-row"><label>MEET BAR BONUS</label><input id="ai-meet" type="number" min="0" max="15" value="${it.meetBonus || 0}"/></div>
    <div class="form-row"><label>XP PER DO</label><input id="ai-xp" type="number" min="1" max="50" value="${it.xp || 5}"/></div>
    <div class="form-row"><label>STAT EFFECTS</label><div class="effects-grid">${effRows}</div></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteActivityItem('${catId}','${itemId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditActivityItem('${catId}','${itemId}')">Save</button>
    </div>`);
}
function submitEditActivityItem(catId, itemId) {
  const c = actCats().find(x => x.id === catId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  it.name = document.getElementById('ai-name').value || it.name;
  it.emoji = document.getElementById('ai-emoji').value || it.emoji;
  it.kind = document.getElementById('ai-kind').value || it.kind || 'expansion';
  it.meetBonus = Number(document.getElementById('ai-meet').value) || 0;
  it.xp = Number(document.getElementById('ai-xp').value) || 5;
  it.statEffects = readEffectInputs();
  closeModal();
  save(); renderActivitiesV2();
}
function deleteActivityItem(catId, itemId) {
  const c = actCats().find(x => x.id === catId);
  if (!c) return;
  c.inventory = c.inventory.filter(x => x.id !== itemId);
  c.slots = c.slots.map(s => s === itemId ? null : s);
  closeModal();
  save(); renderActivitiesV2();
}
function doActivityItem(catId, itemId) {
  const c = actCats().find(x => x.id === catId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  applyEffects(it.statEffects || {});
  addXP(it.xp || 4, it.name);
  // Track city context
  const city = D.world.cities.find(x => x.id === D.world.currentCityId);
  addLog(`Did ${it.name} in ${city?.name || 'somewhere'}.`, 'activity');
  tickDay();
}

// ── World map ──
let expandedCityId = null; // which city's boroughs are shown
let currentCityDetailId = null; // which city is being viewed in detail

function renderWorld() {
  const el = document.getElementById('world-grid');
  if (!el) return;

  el.innerHTML = D.world.cities.map(c => {
    const isCurrent = c.id === D.world.currentCityId;
    const count = cityUnlockCount(c);
    const placeCount = c.boroughs.reduce((s, b) => s + (b.places || []).length, 0);

    return `
      <div class="city-wrapper">
        <div class="city-card ${isCurrent ? 'current' : ''}"
             onclick="openCityDetail('${c.id}')">
          <div class="city-info">
            <div class="city-name">${escapeHtml(c.name)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${c.boroughs.length} borough${c.boroughs.length === 1 ? '' : 's'} · ${placeCount} place${placeCount === 1 ? '' : 's'}</div>
          </div>
          <div style="text-align:center">
            <div class="unlock-count">${count}</div>
            <div class="unlock-label">unlocked</div>
          </div>
          <div class="city-actions" onclick="event.stopPropagation()">
            <button class="bor-act-btn" onclick="event.stopPropagation();renameCity('${c.id}')">✎</button>
            <button class="bor-act-btn" onclick="event.stopPropagation();deleteCity('${c.id}')">×</button>
          </div>
        </div>
      </div>`;
  }).join('');

  renderNextMoves();
}

function openCityDetail(id) {
  currentCityDetailId = id;
  navigateTo('citydetail');
}

function selectBorough(cityId, borId) {
  D.world.currentCityId = cityId;
  D.world.currentBoroughId = borId;
  save(); renderWorld();
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  toast(`Now in ${b?.name || '?'}, ${c?.name || '?'}.`);
}

function toggleMainBorough(borId) {
  if (D.world.mainBoroughId === borId) {
    // Unsetting main — data stays in D.activityCategories / D.leadgen but won't show in any borough
    D.world.mainBoroughId = null;
    toast('Main borough cleared.');
  } else {
    D.world.mainBoroughId = borId;
    toast('Set as main — your global activities & leads show here.');
  }
  save(); renderWorld();
}

// ── City management ──
function openAddCity() {
  openModal(`
    <h3>Add City</h3>
    <div class="form-row"><label>NAME</label><input id="ac-name" placeholder="e.g. Amsterdam"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddCity()">Add</button>
    </div>`);
}
function submitAddCity() {
  const name = (document.getElementById('ac-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  // Check duplicate
  if (D.world.cities.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    toast('City already exists.'); return;
  }
  const cityId = uid('city');
  const borId = uid('bor');
  D.world.cities.push({
    id: cityId, name,
    boroughs: [{ id: borId, name: 'Center', activityCategories: [], leadgen: { methods: [] }, places: [] }]
  });
  addLog(`Added city ${name}.`, 'world');
  closeModal();
  expandedCityId = cityId;
  save(); renderWorld();
  toast(`Added ${name}.`);
}

function renameCity(id) {
  const c = D.world.cities.find(x => x.id === id);
  if (!c) return;
  openModal(`
    <h3>Rename City</h3>
    <div class="form-row"><label>NAME</label><input id="rc-name" value="${escapeHtml(c.name)}"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitRenameCity('${id}')">Save</button>
    </div>`);
}
function submitRenameCity(id) {
  const c = D.world.cities.find(x => x.id === id);
  if (!c) return;
  const name = (document.getElementById('rc-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  c.name = name;
  closeModal(); save(); renderWorld();
}

function deleteCity(id) {
  if (D.world.cities.length <= 1) { toast("Can't delete last city."); return; }
  const c = D.world.cities.find(x => x.id === id);
  if (!c) return;
  openModal(`
    <h3>Delete ${escapeHtml(c.name)}?</h3>
    <div class="desc" style="color:var(--text-secondary);font-size:12px;margin-bottom:10px">This will delete the city and all its boroughs. Data in non-main boroughs is lost.</div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn danger" onclick="confirmDeleteCity('${id}')">Delete</button>
    </div>`);
}
function confirmDeleteCity(id) {
  D.world.cities = D.world.cities.filter(x => x.id !== id);
  // Fix selection if deleted city was current
  if (D.world.currentCityId === id) {
    const first = D.world.cities[0];
    D.world.currentCityId = first ? first.id : null;
    D.world.currentBoroughId = first?.boroughs[0]?.id || null;
  }
  if (expandedCityId === id) expandedCityId = null;
  closeModal(); save(); renderWorld();
  toast('City deleted.');
}

// ── Borough management ──
function openAddBorough(cityId) {
  openModal(`
    <h3>Add Borough</h3>
    <div class="form-row"><label>NAME</label><input id="ab-name" placeholder="e.g. Delfshaven"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddBorough('${cityId}')">Add</button>
    </div>`);
}
function submitAddBorough(cityId) {
  const c = D.world.cities.find(x => x.id === cityId);
  if (!c) return;
  const name = (document.getElementById('ab-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  c.boroughs.push(defaultBorough(name));
  closeModal(); save(); renderWorld();
  toast(`Added ${name}.`);
}

function renameBorough(cityId, borId) {
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  if (!b) return;
  openModal(`
    <h3>Rename Borough</h3>
    <div class="form-row"><label>NAME</label><input id="rb-name" value="${escapeHtml(b.name)}"/></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitRenameBorough('${cityId}','${borId}')">Save</button>
    </div>`);
}
function submitRenameBorough(cityId, borId) {
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  if (!b) return;
  const name = (document.getElementById('rb-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  b.name = name;
  closeModal(); save(); renderWorld();
}

function deleteBorough(cityId, borId) {
  const c = D.world.cities.find(x => x.id === cityId);
  if (!c) return;
  if (c.boroughs.length <= 1) { toast("Can't delete last borough."); return; }
  const b = c.boroughs.find(x => x.id === borId);
  if (!b) return;
  if (b.id === D.world.mainBoroughId) {
    toast("Unset as main first."); return;
  }
  openModal(`
    <h3>Delete ${escapeHtml(b.name)}?</h3>
    <div class="desc" style="color:var(--text-secondary);font-size:12px;margin-bottom:10px">Borough data (activities, leads) for this non-main borough will be lost.</div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn danger" onclick="confirmDeleteBorough('${cityId}','${borId}')">Delete</button>
    </div>`);
}
function confirmDeleteBorough(cityId, borId) {
  const c = D.world.cities.find(x => x.id === cityId);
  if (!c) return;
  c.boroughs = c.boroughs.filter(x => x.id !== borId);
  if (D.world.currentBoroughId === borId) {
    D.world.currentBoroughId = c.boroughs[0]?.id || null;
  }
  closeModal(); save(); renderWorld();
  toast('Borough deleted.');
}

function selectCity(id) {
  // Legacy compat — open city detail
  openCityDetail(id);
}

// ── City detail page ──
function renderCityDetail() {
  const c = D.world.cities.find(x => x.id === currentCityDetailId);
  if (!c) { navigateTo('world'); return; }
  const titleEl = document.getElementById('citydetail-title');
  if (titleEl) titleEl.textContent = c.name.toUpperCase();
  const el = document.getElementById('citydetail-content');
  if (!el) return;

  const isCurrent = c.id === D.world.currentCityId;

  el.innerHTML = c.boroughs.map(b => {
    const bCount = boroughUnlockCount(b);
    const isActive = b.id === D.world.currentBoroughId && isCurrent;
    const isMain = b.id === D.world.mainBoroughId;
    const places = b.places || [];
    const visited = places.filter(p => p.visited).length;

    const placesHtml = places.length
      ? places.map(p => `
          <div class="place-item ${p.visited ? 'visited' : ''}">
            <button class="place-visit-btn" onclick="togglePlaceVisited('${c.id}','${b.id}','${p.id}')" title="${p.visited ? 'Mark unvisited' : 'Mark visited'}">
              ${p.visited ? '✓' : '○'}
            </button>
            <div class="place-info" onclick="openEditPlace('${c.id}','${b.id}','${p.id}')">
              <div class="place-name">${escapeHtml(p.name)}</div>
              ${p.type ? `<div class="place-type">${escapeHtml(p.type)}</div>` : ''}
              ${p.notes ? `<div class="place-notes">${escapeHtml(p.notes)}</div>` : ''}
            </div>
            <button class="place-del-btn" onclick="deletePlace('${c.id}','${b.id}','${p.id}')">×</button>
          </div>`).join('')
      : '<div class="empty-state" style="margin:6px 0">No places yet. Add one!</div>';

    return `
      <div class="borough-section">
        <div class="borough-section-head">
          <div>
            <span class="borough-section-name">${escapeHtml(b.name)}</span>
            ${isMain ? '<span class="main-badge">MAIN</span>' : ''}
            <span class="borough-section-count">${bCount} unlocked · ${visited}/${places.length} visited</span>
          </div>
          <div class="borough-section-actions">
            <button class="bor-act-btn main-toggle ${isMain ? 'is-main' : ''}" onclick="toggleMainBorough('${b.id}');renderCityDetail()">${isMain ? '★' : '☆'}</button>
            <button class="bor-act-btn" onclick="selectBorough('${c.id}','${b.id}')">📍</button>
            <button class="bor-act-btn" onclick="renameBorough('${c.id}','${b.id}')">✎</button>
            <button class="bor-act-btn" onclick="deleteBorough('${c.id}','${b.id}')">×</button>
          </div>
        </div>
        <div class="place-list">${placesHtml}</div>
        <button class="add-place-btn" onclick="openAddPlace('${c.id}','${b.id}')">+ Place</button>
      </div>`;
  }).join('') + `
    <button class="add-borough-btn" style="width:100%;margin-top:10px" onclick="openAddBorough('${c.id}')">+ Borough</button>
  `;
}

// ── Place management ──
function openAddPlace(cityId, borId) {
  openModal(`
    <h3>Add Place</h3>
    <div class="form-row"><label>NAME</label><input id="ap-name" placeholder="e.g. Ramen shop on Witte de With"/></div>
    <div class="form-row"><label>TYPE (optional)</label><input id="ap-type" placeholder="e.g. Restaurant, Gym, Shop..."/></div>
    <div class="form-row"><label>NOTES (optional)</label><textarea id="ap-notes" rows="2" placeholder="Looks good, want to try it"></textarea></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddPlace('${cityId}','${borId}')">Add</button>
    </div>`);
}
function submitAddPlace(cityId, borId) {
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  if (!b) return;
  const name = (document.getElementById('ap-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  const type = (document.getElementById('ap-type').value || '').trim();
  const notes = (document.getElementById('ap-notes').value || '').trim();
  if (!b.places) b.places = [];
  b.places.push({ id: uid('pl'), name, type, notes, visited: false });
  closeModal(); save(); renderCityDetail();
  toast(`Added ${name}.`);
}

function openEditPlace(cityId, borId, placeId) {
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  const p = b?.places?.find(x => x.id === placeId);
  if (!p) return;
  openModal(`
    <h3>Edit Place</h3>
    <div class="form-row"><label>NAME</label><input id="ep-name" value="${escapeHtml(p.name)}"/></div>
    <div class="form-row"><label>TYPE</label><input id="ep-type" value="${escapeHtml(p.type || '')}"/></div>
    <div class="form-row"><label>NOTES</label><textarea id="ep-notes" rows="2">${escapeHtml(p.notes || '')}</textarea></div>
    <div class="form-row">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="ep-visited" ${p.visited ? 'checked' : ''} style="width:18px;height:18px"/>
        Visited
      </label>
    </div>
    <div class="row">
      <button class="pill-btn danger" onclick="deletePlace('${cityId}','${borId}','${placeId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditPlace('${cityId}','${borId}','${placeId}')">Save</button>
    </div>`);
}
function submitEditPlace(cityId, borId, placeId) {
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  const p = b?.places?.find(x => x.id === placeId);
  if (!p) return;
  p.name = (document.getElementById('ep-name').value || '').trim() || p.name;
  p.type = (document.getElementById('ep-type').value || '').trim();
  p.notes = (document.getElementById('ep-notes').value || '').trim();
  p.visited = document.getElementById('ep-visited').checked;
  closeModal(); save(); renderCityDetail();
}

function togglePlaceVisited(cityId, borId, placeId) {
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  const p = b?.places?.find(x => x.id === placeId);
  if (!p) return;
  p.visited = !p.visited;
  save(); renderCityDetail();
  toast(p.visited ? `Visited ${p.name}!` : `Unmarked ${p.name}.`);
}

function deletePlace(cityId, borId, placeId) {
  const c = D.world.cities.find(x => x.id === cityId);
  const b = c?.boroughs.find(x => x.id === borId);
  if (!b) return;
  const p = b.places?.find(x => x.id === placeId);
  b.places = (b.places || []).filter(x => x.id !== placeId);
  closeModal(); save(); renderCityDetail();
  if (p) toast(`Removed ${p.name}.`);
}

// ── Next Moves ──
function renderNextMoves() {
  const el = document.getElementById('next-moves-list');
  if (!el) return;
  if (D.nextMoves.length === 0) {
    el.innerHTML = '<div class="empty-state">No planned moves. Add one like "Join judo class".</div>';
    return;
  }
  el.innerHTML = D.nextMoves.map(m => `
    <div class="move-card">
      <div class="move-body">
        <div class="move-name">${escapeHtml(m.name)}</div>
        <div class="move-meta">${statEffectsStr(m.statEffects)}${m.city ? ` ·  ${escapeHtml(cityName(m.city))}` : ''}</div>
      </div>
      <div class="row">
        <button class="pill-btn good" onclick="executeMove('${m.id}')">Execute</button>
        <button class="pill-btn" onclick="openEditMove('${m.id}')">Edit</button>
        <button class="pill-btn danger" onclick="deleteMove('${m.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}
function cityName(id) { return D.world.cities.find(c => c.id === id)?.name || '?'; }
function openAddMove() {
  const statOpts = STAT_KEYS.map(k => `<option value="${k}">${STAT_EMOJI[k]} ${STAT_LABELS[k]}</option>`).join('');
  const cityOpts = '<option value="">— none —</option>' +
    D.world.cities.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  openModal(`
    <h3> Plan a Next Move</h3>
    <div class="form-row"><label>NAME</label><input id="nm-name" placeholder="e.g. Join judo class"/></div>
    <div class="form-row"><label>STATS IMPROVED (hold Ctrl/Cmd to multi-select)</label>
      <select id="nm-stats" multiple size="6">${statOpts}</select></div>
    <div class="form-row"><label>MAGNITUDE (applied to each selected stat)</label>
      <input id="nm-mag" type="number" min="1" max="10" value="2"/></div>
    <div class="form-row"><label>CITY (optional)</label><select id="nm-city">${cityOpts}</select></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddMove()">Add</button>
    </div>`);
}
function submitAddMove() {
  const name = (document.getElementById('nm-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  const mag = Number(document.getElementById('nm-mag').value) || 1;
  const selected = Array.from(document.getElementById('nm-stats').selectedOptions).map(o => o.value);
  if (selected.length === 0) { toast('Pick at least one stat.'); return; }
  const statEffects = {};
  selected.forEach(k => statEffects[k] = mag);
  const city = document.getElementById('nm-city').value || null;
  D.nextMoves.push({ id: uid('nm'), name, statEffects, city, done: false });
  closeModal();
  save(); renderNextMoves();
  toast(`Planned: ${name}`);
}
function openEditMove(id) {
  const m = D.nextMoves.find(x => x.id === id);
  if (!m) return;
  const statOpts = STAT_KEYS.map(k => `<option value="${k}" ${m.statEffects[k] ? 'selected' : ''}>${STAT_EMOJI[k]} ${STAT_LABELS[k]}</option>`).join('');
  const firstMag = Object.values(m.statEffects)[0] || 2;
  const cityOpts = '<option value="">— none —</option>' +
    D.world.cities.map(c => `<option value="${c.id}" ${m.city === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  openModal(`
    <h3> Edit Move</h3>
    <div class="form-row"><label>NAME</label><input id="nm-name" value="${escapeHtml(m.name)}"/></div>
    <div class="form-row"><label>STATS IMPROVED</label>
      <select id="nm-stats" multiple size="6">${statOpts}</select></div>
    <div class="form-row"><label>MAGNITUDE</label><input id="nm-mag" type="number" min="1" max="10" value="${firstMag}"/></div>
    <div class="form-row"><label>CITY</label><select id="nm-city">${cityOpts}</select></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditMove('${id}')">Save</button>
    </div>`);
}
function submitEditMove(id) {
  const m = D.nextMoves.find(x => x.id === id);
  if (!m) return;
  m.name = document.getElementById('nm-name').value || m.name;
  const mag = Number(document.getElementById('nm-mag').value) || 1;
  const selected = Array.from(document.getElementById('nm-stats').selectedOptions).map(o => o.value);
  m.statEffects = {};
  selected.forEach(k => m.statEffects[k] = mag);
  m.city = document.getElementById('nm-city').value || null;
  closeModal();
  save(); renderNextMoves();
}
function executeMove(id) {
  const m = D.nextMoves.find(x => x.id === id);
  if (!m) return;
  applyEffects(m.statEffects);
  addXP(10, `Executed: ${m.name}`);
  addLog(`Executed planned move: ${m.name}.`, 'activity');
  if (m.city) {
    const c = D.world.cities.find(x => x.id === m.city);
    if (c) addLog(`Executed move in ${c.name}.`, 'world');
  }
  D.nextMoves = D.nextMoves.filter(x => x.id !== id);
  tickDay();
  toast(`Did: ${m.name}`);
}
function deleteMove(id) {
  D.nextMoves = D.nextMoves.filter(x => x.id !== id);
  save(); renderNextMoves();
}

// ── Abilities ──
function abilitiesForTarget(type, methodId, itemId) {
  return (D.abilities || []).filter(a =>
    (a.assignments || []).some(x => x.type === type && x.methodId === methodId && x.itemId === itemId)
  );
}

function renderAbilities() {
  const el = document.getElementById('abilities-list');
  const cnt = document.getElementById('abilities-count');
  const list = D.abilities || [];
  if (cnt) cnt.textContent = `ABILITIES (${list.length})`;
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No abilities yet. Tap "+ Add" to define one.</div>';
    return;
  }
  el.innerHTML = list.map(a => {
    const assigns = (a.assignments || []).map(x => {
      const label = assignmentLabel(x);
      return `<span class="ability-chip ${a.unlocked ? 'unlocked' : 'locked'}">${escapeHtml(label)}<button class="ability-chip-x" onclick="unassignAbility('${a.id}','${x.type}','${x.methodId}','${x.itemId}')">×</button></span>`;
    }).join('');
    return `
      <div class="ability-row ${a.unlocked ? 'unlocked' : 'locked'}">
        <div class="ability-head">
          <div class="ability-name">${a.unlocked ? '◆' : '◇'} ${escapeHtml(a.name)}</div>
          <div class="ability-actions">
            <button class="small-btn" onclick="toggleAbilityUnlock('${a.id}')">${a.unlocked ? 'Lock' : 'Unlock'}</button>
            <button class="small-btn" onclick="openAssignAbility('${a.id}')">Assign</button>
            <button class="small-btn" onclick="openEditAbility('${a.id}')">Edit</button>
          </div>
        </div>
        ${a.desc ? `<div class="ability-desc">${escapeHtml(a.desc)}</div>` : ''}
        <div class="ability-chips">${assigns || '<span class="ability-empty">Not assigned yet.</span>'}</div>
      </div>`;
  }).join('');
}

function allActivityCategoriesWithScope() {
  const out = [];
  (D.activityCategories || []).forEach(cat => out.push({ cat, scope: 'Main' }));
  (D.world.cities || []).forEach(c => (c.boroughs || []).forEach(b => {
    if (b.id === D.world.mainBoroughId) return;
    (b.activityCategories || []).forEach(cat => out.push({ cat, scope: `${c.name} · ${b.name}` }));
  }));
  return out;
}
function allLeadMethodsWithScope() {
  const out = [];
  (D.leadgen?.methods || []).forEach(m => out.push({ m, scope: 'Main' }));
  (D.world.cities || []).forEach(c => (c.boroughs || []).forEach(b => {
    if (b.id === D.world.mainBoroughId) return;
    ((b.leadgen && b.leadgen.methods) || []).forEach(m => out.push({ m, scope: `${c.name} · ${b.name}` }));
  }));
  return out;
}
function findCatAnywhere(catId) {
  const all = allActivityCategoriesWithScope();
  return all.find(x => x.cat.id === catId) || null;
}
function findLeadMethodAnywhere(methodId) {
  const all = allLeadMethodsWithScope();
  return all.find(x => x.m.id === methodId) || null;
}

function assignmentLabel(x) {
  if (x.type === 'activity') {
    const hit = findCatAnywhere(x.methodId);
    if (!hit) return 'ACT · (missing)';
    const it = hit.cat.inventory.find(i => i.id === x.itemId);
    return it ? `ACT · ${hit.cat.name} / ${it.name}` : 'ACT · (missing)';
  }
  if (x.type === 'leadmethod') {
    const hit = findLeadMethodAnywhere(x.methodId);
    if (!hit) return 'LEAD · (missing)';
    const it = hit.m.inventory.find(i => i.id === x.itemId);
    return it ? `LEAD · ${hit.m.name} / ${it.name}` : 'LEAD · (missing)';
  }
  return '(unknown)';
}

function openAddAbility() {
  openModal(`
    <h3>◆ Add Ability</h3>
    <div class="form-row"><label>NAME</label><input id="ab-name" placeholder="e.g. Defend yourself in a fight"/></div>
    <div class="form-row"><label>DESCRIPTION</label><textarea id="ab-desc" rows="3" placeholder="What it means to have this ability"></textarea></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddAbility()">Add</button>
    </div>`);
}
function submitAddAbility() {
  const name = (document.getElementById('ab-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  D.abilities = D.abilities || [];
  D.abilities.push({
    id: uid('ab'), name,
    desc: (document.getElementById('ab-desc').value || '').trim(),
    unlocked: false,
    assignments: [],
  });
  save(); closeModal(); renderAbilities();
  toast('Ability added.');
}

function openEditAbility(id) {
  const a = D.abilities.find(x => x.id === id);
  if (!a) return;
  openModal(`
    <h3>◆ Edit Ability</h3>
    <div class="form-row"><label>NAME</label><input id="ab-name" value="${escapeHtml(a.name)}"/></div>
    <div class="form-row"><label>DESCRIPTION</label><textarea id="ab-desc" rows="3">${escapeHtml(a.desc || '')}</textarea></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteAbility('${id}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditAbility('${id}')">Save</button>
    </div>`);
}
function submitEditAbility(id) {
  const a = D.abilities.find(x => x.id === id);
  if (!a) return;
  a.name = document.getElementById('ab-name').value || a.name;
  a.desc = document.getElementById('ab-desc').value || '';
  save(); closeModal(); renderAbilities();
}
function deleteAbility(id) {
  if (!confirm('Delete this ability?')) return;
  D.abilities = (D.abilities || []).filter(x => x.id !== id);
  save(); closeModal(); renderAbilities();
}
function toggleAbilityUnlock(id) {
  const a = D.abilities.find(x => x.id === id);
  if (!a) return;
  a.unlocked = !a.unlocked;
  save(); renderAbilities();
  toast(a.unlocked ? `Unlocked: ${a.name}` : `Locked: ${a.name}`);
}

function openAssignAbility(id) {
  const a = D.abilities.find(x => x.id === id);
  if (!a) return;
  const actRows = allActivityCategoriesWithScope().flatMap(({ cat, scope }) =>
    cat.inventory.map(it => {
      const on = (a.assignments || []).some(x => x.type === 'activity' && x.methodId === cat.id && x.itemId === it.id);
      return `<button class="assign-row ${on ? 'on' : ''}" onclick="toggleAssignAbility('${id}','activity','${cat.id}','${it.id}')">
        <span class="ar-type">ACT</span> ${escapeHtml(cat.name)} <span class="ar-sep">/</span> ${escapeHtml(it.name)} <span class="ar-scope">@ ${escapeHtml(scope)}</span> ${on ? '✓' : ''}
      </button>`;
    })
  ).join('');
  const leadRows = allLeadMethodsWithScope().flatMap(({ m, scope }) =>
    m.inventory.map(it => {
      const on = (a.assignments || []).some(x => x.type === 'leadmethod' && x.methodId === m.id && x.itemId === it.id);
      return `<button class="assign-row ${on ? 'on' : ''}" onclick="toggleAssignAbility('${id}','leadmethod','${m.id}','${it.id}')">
        <span class="ar-type">LEAD</span> ${escapeHtml(m.name)} <span class="ar-sep">/</span> ${escapeHtml(it.name)} <span class="ar-scope">@ ${escapeHtml(scope)}</span> ${on ? '✓' : ''}
      </button>`;
    })
  ).join('');
  openModal(`
    <h3>◆ Assign: ${escapeHtml(a.name)}</h3>
    <div class="desc" style="color:var(--text-secondary);font-size:11px;margin-bottom:8px">Tap a target to attach/detach this ability. You gain this ability by doing things there.</div>
    <div class="section-header" style="padding-top:0"><span>ACTIVITIES</span></div>
    <div class="assign-list">${actRows || '<div class="empty-state">No activity items.</div>'}</div>
    <div class="section-header"><span>LEAD GEN</span></div>
    <div class="assign-list">${leadRows || '<div class="empty-state">No lead items.</div>'}</div>
    <div class="row"><button class="pill-btn" onclick="closeModal()">Close</button></div>`);
}
function toggleAssignAbility(abId, type, methodId, itemId) {
  const a = D.abilities.find(x => x.id === abId);
  if (!a) return;
  a.assignments = a.assignments || [];
  const idx = a.assignments.findIndex(x => x.type === type && x.methodId === methodId && x.itemId === itemId);
  if (idx >= 0) a.assignments.splice(idx, 1);
  else a.assignments.push({ type, methodId, itemId });
  save();
  openAssignAbility(abId); // refresh modal
}
function unassignAbility(abId, type, methodId, itemId) {
  const a = D.abilities.find(x => x.id === abId);
  if (!a) return;
  a.assignments = (a.assignments || []).filter(x => !(x.type === type && x.methodId === methodId && x.itemId === itemId));
  save(); renderAbilities();
}

// ── Total Stats ──
function computeActivityBalance() {
  let maint = 0, exp = 0;
  (actCats() || []).forEach(cat => {
    cat.slots.forEach(sid => {
      if (!sid) return;
      const it = cat.inventory.find(x => x.id === sid);
      if (!it) return;
      if (it.kind === 'maintenance') maint++;
      else exp++;
    });
  });
  // Lead methods always count as expansion slots
  let leadExp = 0;
  (leadMethods() || []).forEach(m => {
    leadExp += m.slots.filter(Boolean).length;
  });
  return { maintenance: maint, expansion: exp, leadExpansion: leadExp };
}

function renderTotalStats() {
  const el = document.getElementById('totalstats-content');
  if (!el) return;
  const bal = computeActivityBalance();
  const totalExp = bal.expansion + bal.leadExpansion;
  const total = bal.maintenance + totalExp;
  const maintPct = total > 0 ? Math.round(bal.maintenance / total * 100) : 0;
  const expPct = 100 - maintPct;
  let verdict;
  if (total === 0) verdict = 'No active activities slotted. Slot some items to see your balance.';
  else if (expPct >= 70) verdict = 'Heavy on expansion — you are pushing growth hard. Don\'t burn out.';
  else if (expPct >= 45) verdict = 'Healthy mix of expansion and maintenance.';
  else if (expPct >= 25) verdict = 'Maintenance-heavy. Go expand — slot a lead or a skill-building activity.';
  else verdict = 'Almost all maintenance. You are coasting. Add expansion activities.';

  const unlockedAbils = (D.abilities || []).filter(a => a.unlocked).length;
  const totalAbils = (D.abilities || []).length;

  el.innerHTML = `
    <div class="section-header"><span>ALL STATS</span></div>
    <div class="quick-stats-grid">
      ${STAT_KEYS.map(k => `
        <div class="qstat ${STAT_CSS[k]}">
          <div class="qstat-label">${STAT_EMOJI[k] || ''} ${STAT_LABELS[k]}</div>
          <div class="qstat-value">${Math.round(D.player.stats[k])}</div>
        </div>`).join('')}
    </div>

    <div class="section-header"><span>MAINTENANCE ⇄ EXPANSION</span></div>
    <div class="balance-card">
      <div class="balance-bar">
        <div class="balance-maint" style="width:${maintPct}%" title="Maintenance">
          <span class="balance-label">■ ${bal.maintenance}</span>
        </div>
        <div class="balance-exp" style="width:${expPct}%" title="Expansion">
          <span class="balance-label">▲ ${totalExp}</span>
        </div>
      </div>
      <div class="balance-legend">
        <span><span class="dot dot-maint"></span>Maintenance ${maintPct}%</span>
        <span><span class="dot dot-exp"></span>Expansion ${expPct}% <span class="sub">(${bal.expansion} act + ${bal.leadExpansion} lead)</span></span>
      </div>
      <div class="balance-verdict">${verdict}</div>
    </div>

    <div class="section-header"><span>ABILITIES</span>
      <button class="small-btn" onclick="hideOverlay();showOverlay('abilities')">Open</button>
    </div>
    <div class="quick-stats-grid">
      <div class="qstat"><div class="qstat-label">Unlocked</div><div class="qstat-value">${unlockedAbils}</div></div>
      <div class="qstat"><div class="qstat-label">Total</div><div class="qstat-value">${totalAbils}</div></div>
    </div>
  `;
}

// ── Birthday timer ──
function computeBirthdayElapsed(birthdayStr) {
  const bd = new Date(birthdayStr + 'T00:00:00');
  if (isNaN(bd.getTime())) return null;
  const now = new Date();
  if (bd > now) return null;
  let years = now.getFullYear() - bd.getFullYear();
  let months = now.getMonth() - bd.getMonth();
  let days = now.getDate() - bd.getDate();
  let hours = now.getHours() - bd.getHours();
  let minutes = now.getMinutes() - bd.getMinutes();
  let seconds = now.getSeconds() - bd.getSeconds();
  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
    months--;
  }
  if (months < 0) { months += 12; years--; }
  const totalMonths = years * 12 + months;
  const weeks = Math.floor(days / 7);
  days = days % 7;
  return { months: totalMonths, weeks, days, hours, minutes, seconds };
}

function renderBirthday() {
  const el = document.getElementById('home-birthday');
  if (!el) return;
  const bd = D.settings && D.settings.birthday;
  if (!bd) {
    el.classList.remove('set');
    el.innerHTML = '<div class="empty-state">No birthday set. Tap "Set" to start the timer.</div>';
    return;
  }
  const e = computeBirthdayElapsed(bd);
  if (!e) {
    el.classList.remove('set');
    el.innerHTML = '<div class="empty-state">Birthday is in the future. Set a past date.</div>';
    return;
  }
  el.classList.add('set');
  el.innerHTML = `
    <div class="birthday-date">Born ${escapeHtml(bd)} — counting up to today</div>
    <div class="birthday-grid">
      <div class="birthday-unit"><div class="v">${e.months}</div><div class="l">Mo</div></div>
      <div class="birthday-unit"><div class="v">${e.weeks}</div><div class="l">Wk</div></div>
      <div class="birthday-unit"><div class="v">${e.days}</div><div class="l">Dy</div></div>
      <div class="birthday-unit"><div class="v">${String(e.hours).padStart(2, '0')}</div><div class="l">Hr</div></div>
      <div class="birthday-unit"><div class="v">${String(e.minutes).padStart(2, '0')}</div><div class="l">Mn</div></div>
      <div class="birthday-unit"><div class="v">${String(e.seconds).padStart(2, '0')}</div><div class="l">Sc</div></div>
    </div>
  `;
}

function openBirthdayModal() {
  const current = (D.settings && D.settings.birthday) || '';
  openModal(`
    <h3>Set Birthday</h3>
    <div class="desc" style="color:var(--text-secondary);font-size:12px;margin-bottom:10px">Pick the date you were born. The timer counts up from midnight of that day.</div>
    <input type="date" id="birthday-input" value="${escapeHtml(current)}" max="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;font-family:var(--font-mono);font-size:14px;background:var(--bg-card);color:var(--text-primary);border:1px solid var(--border-accent);border-radius:8px;margin-bottom:12px" />
    <div class="row">
      ${current ? '<button class="pill-btn danger" onclick="clearBirthday()">Clear</button>' : ''}
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="saveBirthday()">Save</button>
    </div>
  `);
}

function saveBirthday() {
  const val = document.getElementById('birthday-input').value;
  if (!val) { toast('Pick a date.'); return; }
  if (!D.settings) D.settings = {};
  D.settings.birthday = val;
  save();
  closeModal();
  renderBirthday();
  toast('Birthday saved.');
}

function clearBirthday() {
  if (D.settings) D.settings.birthday = null;
  save();
  closeModal();
  renderBirthday();
}

let birthdayTimer = null;
function startBirthdayTimer() {
  if (birthdayTimer) return;
  birthdayTimer = setInterval(() => {
    if (currentPage === 'home') renderBirthday();
  }, 1000);
}

// ── Init ──
// ────────────────────────────────────────────────────────────────
// NORTHSTAR
// ────────────────────────────────────────────────────────────────
function renderNorthstar() {
  const el = document.getElementById('home-northstar');
  if (!el) return;
  const ns = D.northstar;
  if (!ns || !ns.text) {
    el.innerHTML = '<div class="empty-state">No northstar set. What are you heading toward?</div>';
    return;
  }
  el.innerHTML = `
    <div class="northstar-inner">
      <div class="northstar-icon">✦</div>
      <div class="northstar-text">${escapeHtml(ns.text)}</div>
      <div class="northstar-actions">
        <button class="small-btn" onclick="openNorthstarModal()">Edit</button>
        <button class="small-btn" onclick="clearNorthstar()">Clear</button>
      </div>
    </div>`;
}
function openNorthstarModal() {
  const current = (D.northstar && D.northstar.text) || '';
  openModal(`
    <h3>✦ Northstar</h3>
    <div class="desc" style="color:var(--text-secondary);font-size:12px;margin-bottom:8px">One sentence. The direction everything else serves.</div>
    <div class="form-row">
      <label>NORTHSTAR</label>
      <textarea id="ns-text" rows="3" placeholder="e.g. Build a life where I choose who I spend my time with.">${escapeHtml(current)}</textarea>
    </div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitNorthstar()">Save</button>
    </div>`);
}
function submitNorthstar() {
  const text = (document.getElementById('ns-text').value || '').trim();
  if (!text) { toast('Enter a northstar or Cancel.'); return; }
  D.northstar = { text, updatedAt: Date.now() };
  save(); closeModal(); renderNorthstar();
  toast('Northstar set.');
}
function clearNorthstar() {
  if (!confirm('Clear your northstar?')) return;
  D.northstar = null;
  save(); renderNorthstar();
}

// ────────────────────────────────────────────────────────────────
// ERAS
// ────────────────────────────────────────────────────────────────
const ERA_PALETTE = [
  '#ff6b6b', '#ffa94d', '#ffd43b', '#8ce99a', '#4dd4ac',
  '#63e6be', '#74c0fc', '#9775fa', '#da77f2', '#f783ac',
];
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function dayDiff(a, b) {
  // whole days between two Date objects (b - a), ignoring time
  const ms = 24 * 60 * 60 * 1000;
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((B - A) / ms);
}
function eraIsActive(e, now) {
  const s = parseYMD(e.start), en = parseYMD(e.end);
  if (!s || !en) return false;
  return now >= s && now <= en;
}
function eraIsUpcoming(e, now) {
  const s = parseYMD(e.start);
  return s && now < s;
}
function getCurrentEra() {
  const now = new Date();
  const active = (D.eras || []).filter(e => eraIsActive(e, now));
  if (active.length) {
    // Earliest start among active
    active.sort((a, b) => parseYMD(a.start) - parseYMD(b.start));
    return active[0];
  }
  return null;
}
function renderCurrentEraWidget() {
  const el = document.getElementById('home-current-era');
  if (!el) return;
  const e = getCurrentEra();
  if (!e) {
    // Show next upcoming if any
    const now = new Date();
    const upcoming = (D.eras || [])
      .filter(x => eraIsUpcoming(x, now))
      .sort((a, b) => parseYMD(a.start) - parseYMD(b.start))[0];
    if (upcoming) {
      const days = dayDiff(now, parseYMD(upcoming.start));
      el.innerHTML = `
        <div class="era-home-inner" style="--era-color:${upcoming.color || '#8ce99a'}">
          <div class="era-home-dot"></div>
          <div class="era-home-body">
            <div class="era-home-label">UPCOMING · starts in ${days} day${days === 1 ? '' : 's'}</div>
            <div class="era-home-name">${escapeHtml(upcoming.name)}</div>
            <div class="era-home-range">${escapeHtml(upcoming.start)} → ${escapeHtml(upcoming.end)}</div>
          </div>
          <div class="era-home-actions">
            <button class="small-btn" onclick="openEditEra('${upcoming.id}')">Edit</button>
          </div>
        </div>`;
      return;
    }
    el.innerHTML = '<div class="empty-state">No era planned. Tap "+ Plan" to start one.</div>';
    return;
  }
  const start = parseYMD(e.start), end = parseYMD(e.end), now = new Date();
  const total = dayDiff(start, end) + 1;
  const passed = Math.min(total, dayDiff(start, now) + 1);
  const left = Math.max(0, total - passed);
  const pct = total ? Math.min(100, (passed / total) * 100) : 0;
  el.innerHTML = `
    <div class="era-home-inner" style="--era-color:${e.color || '#74c0fc'}">
      <div class="era-home-dot"></div>
      <div class="era-home-body">
        <div class="era-home-label">CURRENT PROJECT</div>
        <div class="era-home-name">${escapeHtml(e.name)}</div>
        <div class="era-home-range">${escapeHtml(e.start)} → ${escapeHtml(e.end)}</div>
        <div class="era-progress"><div class="era-progress-fill" style="width:${pct}%"></div></div>
        <div class="era-home-meta">${passed} day${passed === 1 ? '' : 's'} passed · ${left} day${left === 1 ? '' : 's'} left</div>
      </div>
      <div class="era-home-actions">
        <button class="small-btn" onclick="openEditEra('${e.id}')">Edit</button>
      </div>
    </div>`;
}

function openAddEra() {
  const start = todayYMD();
  const end = todayYMD();
  const swatches = ERA_PALETTE.map((c, i) =>
    `<button type="button" class="color-swatch ${i === 0 ? 'selected' : ''}" style="background:${c}" data-color="${c}" onclick="pickEraColor(this)"></button>`
  ).join('');
  openModal(`
    <h3>+ Plan Era</h3>
    <div class="form-row"><label>NAME</label><input id="era-name" placeholder="e.g. Cold approach sprint"/></div>
    <div class="form-row"><label>START</label><input id="era-start" type="date" value="${start}"/></div>
    <div class="form-row"><label>END</label><input id="era-end" type="date" value="${end}"/></div>
    <div class="form-row"><label>COLOR</label><div class="color-swatches" id="era-color-row">${swatches}</div></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddEra()">Add</button>
    </div>`);
}
function pickEraColor(btn) {
  const row = btn.parentElement;
  row.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}
function submitAddEra() {
  const name = (document.getElementById('era-name').value || '').trim();
  const start = document.getElementById('era-start').value;
  const end = document.getElementById('era-end').value;
  if (!name) { toast('Name required.'); return; }
  if (!start || !end) { toast('Dates required.'); return; }
  if (parseYMD(end) < parseYMD(start)) { toast('End must be on/after start.'); return; }
  const colorBtn = document.querySelector('#era-color-row .color-swatch.selected');
  const color = colorBtn ? colorBtn.dataset.color : ERA_PALETTE[0];
  D.eras = D.eras || [];
  D.eras.push({ id: uid('era'), name, start, end, color, createdAt: Date.now() });
  closeModal(); save(); renderCurrentEraWidget();
  if (currentPage === 'home') renderHome();
  const calPage = document.getElementById('page-calendar');
  if (calPage && calPage.classList.contains('active')) renderCalendar();
  toast(`Era planned: ${name}`);
}
function openEditEra(id) {
  const e = (D.eras || []).find(x => x.id === id);
  if (!e) return;
  const swatches = ERA_PALETTE.map(c =>
    `<button type="button" class="color-swatch ${c === e.color ? 'selected' : ''}" style="background:${c}" data-color="${c}" onclick="pickEraColor(this)"></button>`
  ).join('');
  openModal(`
    <h3>Edit Era</h3>
    <div class="form-row"><label>NAME</label><input id="era-name" value="${escapeHtml(e.name)}"/></div>
    <div class="form-row"><label>START</label><input id="era-start" type="date" value="${e.start}"/></div>
    <div class="form-row"><label>END</label><input id="era-end" type="date" value="${e.end}"/></div>
    <div class="form-row"><label>COLOR</label><div class="color-swatches" id="era-color-row">${swatches}</div></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteEra('${id}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditEra('${id}')">Save</button>
    </div>`);
}
function submitEditEra(id) {
  const e = (D.eras || []).find(x => x.id === id);
  if (!e) return;
  const name = (document.getElementById('era-name').value || '').trim();
  const start = document.getElementById('era-start').value;
  const end = document.getElementById('era-end').value;
  if (!name) { toast('Name required.'); return; }
  if (!start || !end) { toast('Dates required.'); return; }
  if (parseYMD(end) < parseYMD(start)) { toast('End must be on/after start.'); return; }
  const colorBtn = document.querySelector('#era-color-row .color-swatch.selected');
  e.name = name; e.start = start; e.end = end;
  if (colorBtn) e.color = colorBtn.dataset.color;
  closeModal(); save(); renderCurrentEraWidget();
  const calPage = document.getElementById('page-calendar');
  if (calPage && calPage.classList.contains('active')) renderCalendar();
  toast('Era updated.');
}
function deleteEra(id) {
  if (!confirm('Delete this era?')) return;
  D.eras = (D.eras || []).filter(x => x.id !== id);
  save(); closeModal(); renderCurrentEraWidget();
  const calPage = document.getElementById('page-calendar');
  if (calPage && calPage.classList.contains('active')) renderCalendar();
  toast('Era deleted.');
}

// ────────────────────────────────────────────────────────────────
// CALENDAR
// ────────────────────────────────────────────────────────────────
let calendarYear = null;

function eraCoveredYears() {
  const years = new Set();
  (D.eras || []).forEach(e => {
    const s = parseYMD(e.start), en = parseYMD(e.end);
    if (!s || !en) return;
    for (let y = s.getFullYear(); y <= en.getFullYear(); y++) years.add(y);
  });
  // Always include the current real year, and the game year
  years.add(new Date().getFullYear());
  const gm = currentMonthInfo();
  if (gm && gm.year) years.add(gm.year);
  return Array.from(years).sort((a, b) => a - b);
}

function renderCalendar() {
  // Year dropdown
  const sel = document.getElementById('calendar-year-select');
  const years = eraCoveredYears();
  if (calendarYear == null || !years.includes(calendarYear)) {
    calendarYear = new Date().getFullYear();
    if (!years.includes(calendarYear)) calendarYear = years[years.length - 1];
  }
  if (sel) {
    sel.innerHTML = years.map(y => `<option value="${y}" ${y === calendarYear ? 'selected' : ''}>${y}</option>`).join('');
  }

  // Eras list
  const listEl = document.getElementById('calendar-eras-list');
  if (listEl) {
    const eras = (D.eras || []).slice().sort((a, b) => parseYMD(a.start) - parseYMD(b.start));
    if (!eras.length) {
      listEl.innerHTML = '<div class="empty-state">No eras yet. Tap "+ Plan" above.</div>';
    } else {
      const now = new Date();
      listEl.innerHTML = eras.map(e => {
        const s = parseYMD(e.start), en = parseYMD(e.end);
        const total = dayDiff(s, en) + 1;
        let status = 'planned';
        if (eraIsActive(e, now)) status = 'current';
        else if (now > en) status = 'past';
        return `
          <div class="era-row" style="--era-color:${e.color}">
            <div class="era-row-swatch"></div>
            <div class="era-row-body">
              <div class="era-row-name">${escapeHtml(e.name)}</div>
              <div class="era-row-meta">${escapeHtml(e.start)} → ${escapeHtml(e.end)} · ${total}d · ${status}</div>
            </div>
            <button class="small-btn" onclick="openEditEra('${e.id}')">Edit</button>
          </div>`;
      }).join('');
    }
  }

  // Year grid
  renderCalendarYearGrid();
}

function onCalendarYearChange() {
  const sel = document.getElementById('calendar-year-select');
  calendarYear = parseInt(sel.value, 10);
  renderCalendarYearGrid();
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function erasCoveringDate(date) {
  return (D.eras || []).filter(e => {
    const s = parseYMD(e.start), en = parseYMD(e.end);
    if (!s || !en) return false;
    return date >= new Date(s.getFullYear(), s.getMonth(), s.getDate())
      && date <= new Date(en.getFullYear(), en.getMonth(), en.getDate());
  });
}

function renderCalendarYearGrid() {
  const el = document.getElementById('calendar-year-grid');
  if (!el) return;
  const year = calendarYear;
  const today = new Date();
  const todayIsThisYear = today.getFullYear() === year;

  const monthsHtml = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    // Monday-first: shift Sunday(0) -> 6
    const firstDow = (first.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push('<div class="cal-cell empty"></div>');
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d);
      const covering = erasCoveringDate(date);
      const primary = covering[0];
      const isToday = todayIsThisYear && today.getMonth() === m && today.getDate() === d;
      let style = '';
      let classes = 'cal-cell';
      if (primary) {
        classes += ' in-era';
        style = `--era-color:${primary.color}`;
        // Detect edges for rounded corners
        const prev = new Date(year, m, d - 1);
        const next = new Date(year, m, d + 1);
        const prevHas = erasCoveringDate(prev).some(x => x.id === primary.id);
        const nextHas = erasCoveringDate(next).some(x => x.id === primary.id);
        if (!prevHas) classes += ' era-start';
        if (!nextHas) classes += ' era-end';
        if (covering.length > 1) classes += ' era-multi';
      }
      if (isToday) classes += ' today';
      const title = primary ? `${primary.name} (${primary.start} → ${primary.end})` : '';
      cells.push(`<div class="${classes}" style="${style}" title="${escapeHtml(title)}">${d}</div>`);
    }

    monthsHtml.push(`
      <div class="cal-month">
        <div class="cal-month-head">${MONTH_SHORT[m]}</div>
        <div class="cal-dow">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>
        <div class="cal-grid">${cells.join('')}</div>
      </div>
    `);
  }
  el.innerHTML = monthsHtml.join('');
}

function init() {
  load();
  // ensure current month exists
  const m = currentMonthInfo();
  if (!D.months[m.key]) D.months[m.key] = { name: m.name, year: m.year, events: [], summary: null };
  save();
  navigateTo('home');
  startBirthdayTimer();
  // Refresh current-era widget every minute so "days left" ticks over after midnight.
  setInterval(() => { if (currentPage === 'home') renderCurrentEraWidget(); }, 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);
