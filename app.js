/* ============================================
   LIFE — Life RPG Logic
   ============================================ */

// ── Constants ──
const XP_BASE = 100;
const XP_MULT = 1.4;

const RARITY_LABEL = {
  5: '5★ Legendary', 4: '4★ Epic', 3: '3★ Rare', 2: '2★ Common', 1: '1★ Basic',
};

const STAT_KEYS = ['money','boldness','fear','health','social','charm','sexAppeal','power','fight','looks'];
const STAT_LABELS = {
  money: 'Money', boldness: 'Boldness', fear: 'Fear', health: 'Health',
  social: 'Social', charm: 'Charm', sexAppeal: 'Sex Appeal', power: 'Power', fight: 'Fight', looks: 'Looks'
};
const STAT_CSS = {
  money: 'money', boldness: 'boldness', fear: 'fear', health: 'health',
  social: 'social', charm: 'charm', sexAppeal: 'sex', power: 'power', fight: 'fight', looks: 'looks'
};
const STAT_EMOJI = {
  money:'💰', boldness:'⚡', fear:'😨', health:'❤️', social:'🗣️',
  charm:'✨', sexAppeal:'💋', power:'💪', fight:'🥊', looks:'🪞'
};
const STAT_DESC = {
  money:'Currency. Earned from work, spent on dates, summons and lifestyle.',
  boldness:'Raised by successful cold approaches and wins. Gates risky actions.',
  fear:'Grows from failures and rejections. Offsets boldness.',
  health:'Raised by sports, rest and grooming. Drained by overwork.',
  social:'Raised by hangouts and parties. Feeds the Meet bar strongly.',
  charm:'Charisma. Grows from social wins and successful dates.',
  sexAppeal:'Grows from sports + charm combos. Major Meet driver.',
  power:'Raw strength — built by strength sports.',
  fight:'Combat skill — raised by combat activities (Judo, boxing).',
  looks:'Grooming and style. Feeds the Meet bar like Sex Appeal.'
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_PER_MONTH = 30;
const START_MONTH_INDEX = 3; // April
const START_YEAR = 2026;

const PRESET_ACTIVITIES = [
  { id:'p-job', name:'Part-time Job (shift)', desc:'Clock in a shift at your job.',
    effects:{ money:+25, health:-2 }, meetBonus:0, xp:8,
    emoji:'💼', kind:'job' },
  { id:'p-gym', name:'Gym Session', desc:'Hit the weights.',
    effects:{ health:+2, power:+2, sexAppeal:+1 }, meetBonus:1, xp:6,
    emoji:'🏋️', kind:'sport' },
  { id:'p-run', name:'Go for a Run', desc:'Cardio morning.',
    effects:{ health:+3, sexAppeal:+1 }, meetBonus:1, xp:5,
    emoji:'🏃', kind:'sport' },
  { id:'p-class', name:'Attend Classes', desc:'Show up, pay attention, meet classmates.',
    effects:{ social:+1 }, meetBonus:3, xp:8,
    emoji:'🎓', kind:'school' },
  { id:'p-party', name:'Go to a Party', desc:'Socialize at a house / club party.',
    effects:{ social:+3, charm:+2, health:-1, money:-10 }, meetBonus:2, xp:10,
    emoji:'🎉', kind:'social' },
  { id:'p-rest', name:'Rest Day', desc:'Recover health and chill.',
    effects:{ health:+3, fear:-1 }, meetBonus:0, xp:2,
    emoji:'🛌', kind:'rest' },
];

const SUMMON_COST_TABLE = [
  { label:'Cheap bar', cost:30, minRarity:1, maxRarity:3 },
  { label:'Nice lounge', cost:80, minRarity:2, maxRarity:4 },
  { label:'VIP gala', cost:200, minRarity:3, maxRarity:5 },
];

const FEMALE_NAMES = [
  'Ava','Mia','Luna','Zoe','Iris','Nora','Sofia','Lily','Emma','Isla','Aya','Rei',
  'Maya','Nia','Sasha','Yara','Lena','Ines','Kira','Juno','Hana','Leah','Vera',
  'Rosa','Noa','Ella','Elin','Selin','Selma','Mina','Clara','Amara','Alia'
];
const MALE_NAMES = [
  'Mike','Jay','Theo','Luca','Finn','Kai','Ren','Nico','Sam','Milo',
  'Noah','Liam','Ezra','Rafa','Dario','Nate','Owen','Leo','Max','Ben'
];

const GIRL_ORIGINS = [
  'Coffee shop','Campus hallway','Gym','Library','Bar','Club','Park','Bus stop',
  'Bookstore','Cold approach on street','Friend\'s party','Class project','Elevator'
];

// ── State ──
function defaultData() {
  return {
    player: {
      level: 1, xp: 0,
      stats: { money: 0, boldness: 1, fear: 1, health: 5, social: 1, charm: 1, sexAppeal: 1, power: 1, fight: 1, looks: 1 },
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
    // World map + cities
    world: defaultWorld(),
    // Planned self-moves
    nextMoves: [],
    log: [],            // { t, day, month, year, msg, tag }
    months: {},         // "2026-3" -> { events: [], summary: {...} } (index 3 = April)
    day: 1,
    settings: {},
  };
}

function defaultActivityCategories() {
  return [
    { id:'cat-sports', name:'Sports', emoji:'🏋️', maxSlots:3, slots:[null,null,null], inventory:[] },
    { id:'cat-job', name:'Part-time Job', emoji:'💼', maxSlots:1, slots:[null], inventory:[] },
    { id:'cat-school', name:'School / Classes', emoji:'🎓', maxSlots:2, slots:[null,null], inventory:[] },
    { id:'cat-combat', name:'Combat', emoji:'🥊', maxSlots:2, slots:[null,null], inventory:[] },
    { id:'cat-social', name:'Social', emoji:'🎉', maxSlots:2, slots:[null,null], inventory:[] },
    { id:'cat-grooming', name:'Grooming', emoji:'🪞', maxSlots:1, slots:[null], inventory:[] },
    { id:'cat-custom', name:'Other', emoji:'⭐', maxSlots:3, slots:[null,null,null], inventory:[] },
  ];
}

function defaultLeadgen() {
  return {
    methods: [
      { id:'lm-job', name:'Part-time Job', emoji:'💼', maxSlots:1, slots:[null],
        inventory:[
          { id:'li-ah', name:'Albert Heijn vakkenvuller', difficulty:'easy', roi:'medium' },
        ] },
      { id:'lm-cold', name:'Cold Approach', emoji:'🔥', maxSlots:2, slots:[null,null], inventory:[] },
      { id:'lm-event', name:'Event Hosting', emoji:'🎤', maxSlots:1, slots:[null], inventory:[] },
      { id:'lm-online', name:'Online Presence', emoji:'📱', maxSlots:2, slots:[null,null], inventory:[] },
    ],
  };
}

function defaultWorld() {
  return {
    currentCityId: 'city-amsterdam',
    cities: [
      { id:'city-amsterdam', name:'Amsterdam', discovered:true, completion:0 },
      { id:'city-rotterdam', name:'Rotterdam', discovered:false, completion:0 },
      { id:'city-utrecht', name:'Utrecht', discovered:false, completion:0 },
    ],
  };
}

// Gain % lookup: difficulty × ROI → gainPct contribution
const LEAD_GAIN_MATRIX = {
  easy:   { low:2, medium:4, high:6 },
  medium: { low:3, medium:5, high:8 },
  hard:   { low:4, medium:7, high:12 },
};
const DIFFICULTY_LABEL = { easy:'Easy', medium:'Medium', hard:'Hard' };
const ROI_LABEL = { low:'Low ROI', medium:'Med ROI', high:'High ROI' };

let D = defaultData();
let currentPage = 'home';
let currentRosterTab = 'girls';
let currentMonthKey = null;

// ── Persistence ──
const SAVE_KEY = 'life-rpg-data';

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(D)); } catch(e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    D = deepMerge(defaultData(), parsed);
  } catch(e) { console.warn('load failed', e); }
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
function uid(prefix='id') { return prefix + '-' + Math.random().toString(36).slice(2, 9); }
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
    emoji: data.emoji || '⭐',
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
    <h3>💎 Summon</h3>
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
  addLog(`${g.name} became The One. 💖`, 'relationship');
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
    xpGained: events.filter(e => e.tag === 'xp').reduce((a,b) => a + (parseInt((b.msg.match(/\+(\d+) XP/) || [0,0])[1]) || 0), 0),
    finalDay: D.day - 1,
    finalLevel: D.player.level,
    finalMoney: D.player.stats.money,
  };
  mo.summary = sum;

  const recap = `📅 ${info.name} recap: met ${sum.girlsMet}, dates ${sum.dates}, promotions ${sum.promotions}, XP +${sum.xpGained}.`;
  D.log.push({ t: Date.now(), day: D.day - 1, month: info.name, year: info.year, msg: recap, tag: 'monthly' });
  save();
}

// ── Rendering ──
function render() {
  updateXPDisplay();
  updateHeaderSubtitle();
  renderHeaderDate();
  if (currentPage === 'home') renderHome();
  if (currentPage === 'activities') { renderActivities(); renderActivitiesV2(); }
  if (currentPage === 'meet') renderMeet();
  if (currentPage === 'roster') renderRoster();
  if (currentPage === 'life') renderLife();
  if (currentPage === 'girls') renderGirls();
  if (currentPage === 'leadgen') renderLeadgen();
  if (currentPage === 'world') renderWorld();
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
  // Stats grid
  const grid = document.getElementById('home-stats-grid');
  grid.innerHTML = STAT_KEYS.map(k => `
    <button class="qstat qstat-btn ${STAT_CSS[k]}" onclick="openStatPage('${k}')">
      <div class="qstat-label">${STAT_EMOJI[k]||''} ${STAT_LABELS[k]}${k==='money'?' ($)':''}</div>
      <div class="qstat-value">${Math.round(D.player.stats[k])}</div>
    </button>
  `).join('');

  // Slots preview
  const sp = document.getElementById('home-slots-preview');
  const one = D.relationships.theOne ? girlById(D.relationships.theOne) : null;
  const commons = D.relationships.commons.map(girlById).filter(Boolean);
  if (!one && commons.length === 0) {
    sp.innerHTML = '<div class="empty-state">No one yet. Go out and meet someone.</div>';
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
      <div class="activity-item ${e.tag==='monthly'?'monthly':''}">
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
  const effectsStr = Object.entries(a.effects || {}).map(([k,v]) =>
    `${v>=0?'+':''}${v} ${STAT_LABELS[k] || k}`
  ).join(' · ');
  const meet = a.meetBonus ? `  •  Meet +${a.meetBonus}` : '';
  return `
    <div class="activity-card">
      <div class="name">${a.emoji || '⭐'} ${escapeHtml(a.name)}</div>
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
  document.getElementById('meet-chips').innerHTML = chips.map(([k,v]) =>
    `<span class="chip">${k}: <strong>${v}</strong></span>`
  ).join('');

  // Breakdown
  const bd = document.getElementById('meet-breakdown');
  bd.innerHTML = parts.map(p =>
    `<div class="brow"><span class="label">${escapeHtml(p.label)}</span><span class="val ${p.val<0?'neg':''}">${p.val>=0?'+':''}${p.val.toFixed(1)}</span></div>`
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
    .sort((a,b) => b.rarity - a.rarity || b.affinity - a.affinity);
  girlsEl.innerHTML = girls.length
    ? girls.map(girlCard).join('')
    : '<div class="empty-state">No girls match.</div>';

  const friendsEl = document.getElementById('roster-friends');
  const friends = D.friends
    .filter(f => !q || f.name.toLowerCase().includes(q))
    .slice()
    .sort((a,b) => b.rarity - a.rarity);
  friendsEl.innerHTML = friends.length
    ? friends.map(friendCard).join('')
    : '<div class="empty-state">No friends match.</div>';
}

function girlCard(g) {
  const sidelined = g.status === 'Sidelined';
  const badge = {
    Talking:'', Dating:'DATING', Common:'COMMON', TheOne:'💖 THE ONE', Sidelined:'SIDELINED'
  }[g.status] || '';
  return `
    <div class="entity-card ${sidelined?'sidelined':''}" onclick="openGirlDetails('${g.id}')">
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
    <h3>💋 ${escapeHtml(g.name)}</h3>
    <div class="meta" style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-bottom:10px">
      ${starsHtml(g.rarity)} • ${escapeHtml(g.origin)} • status: ${g.status}<br>
      affinity: ${g.affinity}% • looks-like-you: ${g.dates >= 3 ? g.looksLikeYou : '? (after 3 dates)'} • dates: ${g.dates}
    </div>
    <div class="affinity-bar" style="margin-bottom:14px"><div class="affinity-bar-fill" style="width:${g.affinity}%"></div></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      <button class="pill-btn" onclick="hangOut('${g.id}');closeModal()">Hang out ($5)</button>
      <button class="pill-btn warm" onclick="dateGirl('${g.id}');closeModal()">Date ($20)</button>
      ${gateCommon && g.status === 'Talking' ? `<button class="pill-btn good" onclick="askOut('${g.id}');closeModal()">Ask out (Slot 2)</button>` : ''}
      ${gateOne ? `<button class="pill-btn good" onclick="promoteTheOne('${g.id}');closeModal()">💖 Make her The One</button>` : ''}
      ${g.status !== 'Sidelined' ? `<button class="pill-btn danger" onclick="sideline('${g.id}');closeModal()">Sideline</button>` : ''}
      <button class="pill-btn danger" onclick="release('${g.id}');closeModal()">Release</button>
    </div>
    <div class="row"><button class="pill-btn" onclick="closeModal()">Close</button></div>
  `);
}

function openFriendDetails(id) {
  const f = friendById(id); if (!f) return;
  openModal(`
    <h3>🤝 ${escapeHtml(f.name)}</h3>
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
    <h3>${isGirl ? '💋 Add Girl' : '🤝 Add Friend'}</h3>
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
    <h3>⭐ Add Custom Activity</h3>
    <div class="form-row"><label>NAME</label><input id="ca-name" placeholder="e.g. Judo class"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ca-emoji" placeholder="🥋" maxlength="2"/></div>
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
  const emoji = document.getElementById('ca-emoji').value || '⭐';
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
          ${g.affinity >= 90 && g.looksLikeYou >= 70 ? `<button class="pill-btn good" onclick="promoteTheOne('${g.id}')">💖 Promote</button>` : ''}
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
  const keys = Object.keys(D.months).sort((a,b) => {
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
    return `<button class="month-tab ${k===currentMonthKey?'active':''}" onclick="selectMonth('${k}')">${m.name} ${m.year}</button>`;
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
    xpGained: events.filter(e => e.tag === 'xp').reduce((a,b) => a + (parseInt((b.msg.match(/\+(\d+) XP/) || [0,0])[1]) || 0), 0),
  };
}

function selectMonth(key) { currentMonthKey = key; renderMonths(); }

// ── Stats overlay ──
function renderStats() {
  const el = document.getElementById('stats-content');
  const rarityCounts = [1,2,3,4,5].map(r => D.girls.filter(g => g.rarity === r).length);
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
      ${[5,4,3,2,1].map(r => {
        const count = rarityCounts[r-1];
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
    } catch(err) { toast('Import failed.'); }
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
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Header date ──
function renderHeaderDate() {
  const el = document.getElementById('wordmark-date');
  if (!el) return;
  const info = currentMonthInfo();
  const dayInMonth = ((D.day - 1) % DAYS_PER_MONTH) + 1;
  el.textContent = `${info.year}-${String(MONTH_NAMES.indexOf(info.name)+1).padStart(2,'0')}-${String(dayInMonth).padStart(2,'0')}`;
}

// ── Stat page ──
let currentStatKey = null;
function openStatPage(key) {
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
  const related = D.activityCategories.flatMap(c => c.inventory.filter(it => it.statEffects && it.statEffects[k]));
  el.innerHTML = `
    <div class="stat-hero ${STAT_CSS[k]}">
      <div class="stat-hero-emoji">${STAT_EMOJI[k]||'✦'}</div>
      <div class="stat-hero-body">
        <div class="stat-hero-name">${STAT_LABELS[k]}${k==='money'?' ($)':''}</div>
        <div class="stat-hero-val">${val}</div>
        <div class="stat-hero-desc">${STAT_DESC[k]||''}</div>
      </div>
    </div>
    ${k==='social' ? `
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
        ${related.map(it => `<div class="activity-card"><div class="name">${it.emoji||'⭐'} ${escapeHtml(it.name)}</div><div class="meta">${statEffectsStr(it.statEffects)}</div></div>`).join('')}
      </div>` : ''}
  `;
}

function statEffectsStr(effs) {
  if (!effs) return '';
  return Object.entries(effs).map(([k,v]) => `${v>=0?'+':''}${v} ${STAT_LABELS[k]||k}`).join(' · ');
}

// ── Girls hub ──
function renderGirls() {
  const girlsCount = D.girls.filter(g => g.status !== 'Sidelined').length;
  const taken = (D.relationships.theOne ? 1 : 0) + D.relationships.commons.length;
  const leadPct = computeLeadBar().percent.toFixed(0);
  const el = document.getElementById('girls-hub');
  if (!el) return;
  el.innerHTML = `
    <button class="hub-card" onclick="navigateTo('roster')">
      <div class="hub-icon">💋</div>
      <div class="hub-body"><div class="hub-title">Roster</div><div class="hub-desc">${girlsCount} girls · ${D.friends.length} friends</div></div>
    </button>
    <button class="hub-card" onclick="navigateTo('life')">
      <div class="hub-icon">💞</div>
      <div class="hub-body"><div class="hub-title">Life (Slots)</div><div class="hub-desc">${taken} girlfriend${taken===1?'':'s'}</div></div>
    </button>
    <button class="hub-card" onclick="navigateTo('meet')">
      <div class="hub-icon">💘</div>
      <div class="hub-body"><div class="hub-title">Meet</div><div class="hub-desc">${computeMeetBar().percent.toFixed(0)}% chance bar</div></div>
    </button>
    <button class="hub-card" onclick="navigateTo('leadgen')">
      <div class="hub-icon">🎯</div>
      <div class="hub-body"><div class="hub-title">Lead Generation</div><div class="hub-desc">Total gain ${leadPct}%</div></div>
    </button>
  `;
}

// ── Lead Generation ──
function leadItemGain(item) {
  if (!item) return 0;
  return (LEAD_GAIN_MATRIX[item.difficulty]?.[item.roi]) || 0;
}
function computeLeadBar() {
  const slotted = [];
  D.leadgen.methods.forEach(m => {
    m.slots.forEach(itemId => {
      if (!itemId) return;
      const item = m.inventory.find(x => x.id === itemId);
      if (item) slotted.push({ method:m, item });
    });
  });
  if (slotted.length === 0) return { percent: 0, parts: [], slotted };
  const gains = slotted.map(s => leadItemGain(s.item));
  const avg = gains.reduce((a,b)=>a+b,0) / gains.length;
  const parts = slotted.map(s => ({
    label: `${s.method.name}: ${s.item.name}`,
    val: leadItemGain(s.item),
  }));
  return { percent: clamp(avg, 0, 100), parts, slotted };
}
function renderLeadgen() {
  const { percent, parts, slotted } = computeLeadBar();
  const bar = document.getElementById('lead-bar-fill');
  if (bar) bar.style.width = Math.min(percent, 100) + '%';
  const pctEl = document.getElementById('lead-bar-pct');
  if (pctEl) pctEl.textContent = `${percent.toFixed(0)}% total gain`;
  const subEl = document.getElementById('lead-bar-sub');
  if (subEl) subEl.textContent = slotted.length
    ? `${slotted.length} active lead${slotted.length===1?'':'s'} — avg of their gain %`
    : 'No active leads. Drag items into a slot.';

  const methodsEl = document.getElementById('lead-methods');
  methodsEl.innerHTML = D.leadgen.methods.map(renderLeadMethod).join('');
}
function renderLeadMethod(m) {
  const slotsHtml = m.slots.map((itemId, idx) => {
    const item = itemId ? m.inventory.find(x => x.id === itemId) : null;
    return `
      <div class="slot-zone"
           ondragover="onDragOver(event,this)"
           ondragleave="onDragLeave(event,this)"
           ondrop="onDropLead(event,'${m.id}',${idx})">
        ${item ? leadItemTile(m, item, true) : '<span class="slot-empty">empty slot</span>'}
      </div>`;
  }).join('');
  const inventoryHtml = m.inventory.length
    ? m.inventory.map(it => leadItemTile(m, it, false)).join('')
    : '<div class="empty-state">No items. Add one.</div>';
  const used = m.slots.filter(Boolean).length;
  return `
    <div class="category-block">
      <div class="category-head">
        <div class="category-title">${m.emoji} ${escapeHtml(m.name)} — <span class="slot-count">${used}/${m.maxSlots}</span></div>
        <div class="category-actions">
          <button class="slot-pm" onclick="adjustLeadMax('${m.id}',-1)">−</button>
          <button class="slot-pm" onclick="adjustLeadMax('${m.id}',1)">+</button>
          <button class="small-btn" onclick="openAddLeadItem('${m.id}')">+ Item</button>
        </div>
      </div>
      <div class="slot-row">${slotsHtml}</div>
      <div class="inv-label">Inventory</div>
      <div class="inv-row"
           ondragover="onDragOver(event,this)"
           ondragleave="onDragLeave(event,this)"
           ondrop="onDropLeadInv(event,'${m.id}')">${inventoryHtml}</div>
    </div>`;
}
function leadItemTile(m, it, inSlot) {
  const gain = leadItemGain(it);
  return `
    <div class="lead-tile" draggable="true"
         ondragstart="onDragStartLead(event,'${m.id}','${it.id}')"
         ondragend="onDragEnd(event)"
         ondblclick="openEditLeadItem('${m.id}','${it.id}')">
      <div class="tile-name">${escapeHtml(it.name)}</div>
      <div class="tile-meta">
        <span class="dot dot-${it.difficulty}"></span>${DIFFICULTY_LABEL[it.difficulty]}
        · <span class="dot roi-${it.roi}"></span>${ROI_LABEL[it.roi]}
      </div>
      <div class="tile-gain">+${gain}%</div>
      ${inSlot ? `<button class="tile-x" onclick="event.stopPropagation();clearLeadSlot('${m.id}','${it.id}')">×</button>` : ''}
    </div>`;
}
function adjustLeadMax(methodId, delta) {
  const m = D.leadgen.methods.find(x => x.id === methodId);
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
  save(); renderLeadgen();
}
function openAddLeadItem(methodId) {
  openModal(`
    <h3>🎯 Add Lead Item</h3>
    <div class="form-row"><label>NAME</label><input id="li-name" placeholder="e.g. Albert Heijn vakkenvuller"/></div>
    <div class="form-row"><label>DIFFICULTY</label>
      <select id="li-diff">
        <option value="easy">🟢 Easy</option>
        <option value="medium" selected>🟡 Medium</option>
        <option value="hard">🔴 Hard</option>
      </select></div>
    <div class="form-row"><label>SOCIAL ROI</label>
      <select id="li-roi">
        <option value="low">Low</option>
        <option value="medium" selected>Medium</option>
        <option value="high">High</option>
      </select></div>
    <div class="row">
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitAddLeadItem('${methodId}')">Add</button>
    </div>`);
}
function submitAddLeadItem(methodId) {
  const m = D.leadgen.methods.find(x => x.id === methodId);
  if (!m) return;
  const name = (document.getElementById('li-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  m.inventory.push({
    id: uid('li'), name,
    difficulty: document.getElementById('li-diff').value,
    roi: document.getElementById('li-roi').value,
  });
  closeModal();
  save(); renderLeadgen();
  toast(`Added ${name}.`);
}
function openEditLeadItem(methodId, itemId) {
  const m = D.leadgen.methods.find(x => x.id === methodId);
  const it = m?.inventory.find(x => x.id === itemId);
  if (!it) return;
  openModal(`
    <h3>✏️ Edit ${escapeHtml(it.name)}</h3>
    <div class="form-row"><label>NAME</label><input id="li-name" value="${escapeHtml(it.name)}"/></div>
    <div class="form-row"><label>DIFFICULTY</label>
      <select id="li-diff">
        ${['easy','medium','hard'].map(d =>
          `<option value="${d}" ${d===it.difficulty?'selected':''}>${DIFFICULTY_LABEL[d]}</option>`).join('')}
      </select></div>
    <div class="form-row"><label>SOCIAL ROI</label>
      <select id="li-roi">
        ${['low','medium','high'].map(d =>
          `<option value="${d}" ${d===it.roi?'selected':''}>${ROI_LABEL[d]}</option>`).join('')}
      </select></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteLeadItem('${methodId}','${itemId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditLeadItem('${methodId}','${itemId}')">Save</button>
    </div>`);
}
function submitEditLeadItem(methodId, itemId) {
  const m = D.leadgen.methods.find(x => x.id === methodId);
  const it = m?.inventory.find(x => x.id === itemId);
  if (!it) return;
  it.name = document.getElementById('li-name').value || it.name;
  it.difficulty = document.getElementById('li-diff').value;
  it.roi = document.getElementById('li-roi').value;
  closeModal();
  save(); renderLeadgen();
}
function deleteLeadItem(methodId, itemId) {
  const m = D.leadgen.methods.find(x => x.id === methodId);
  if (!m) return;
  m.inventory = m.inventory.filter(x => x.id !== itemId);
  m.slots = m.slots.map(s => s === itemId ? null : s);
  closeModal();
  save(); renderLeadgen();
}
function clearLeadSlot(methodId, itemId) {
  const m = D.leadgen.methods.find(x => x.id === methodId);
  if (!m) return;
  m.slots = m.slots.map(s => s === itemId ? null : s);
  save(); renderLeadgen();
}

// ── Drag/drop state ──
let dragPayload = null; // { kind:'lead'|'activity', methodId/catId, itemId }
function onDragStartLead(e, methodId, itemId) {
  dragPayload = { kind:'lead', methodId, itemId };
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
function onDragStartActivity(e, catId, itemId) {
  dragPayload = { kind:'activity', catId, itemId };
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
function onDragOver(e, target) { e.preventDefault(); target.classList.add('drop-active'); }
function onDragLeave(e, target) { target.classList.remove('drop-active'); }
function onDragEnd(e) { e.target.classList.remove('dragging'); document.querySelectorAll('.drop-active').forEach(x=>x.classList.remove('drop-active')); }
function onDropLead(e, methodId, slotIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'lead') return;
  const srcM = D.leadgen.methods.find(x => x.id === dragPayload.methodId);
  const dstM = D.leadgen.methods.find(x => x.id === methodId);
  if (!srcM || !dstM) return;
  // Item can only move within its owning method (different methods own different items).
  if (srcM !== dstM) { toast('Item belongs to another method.'); return; }
  // Clear any existing slot occupancy for this item (dragging from another slot)
  dstM.slots = dstM.slots.map(s => s === dragPayload.itemId ? null : s);
  dstM.slots[slotIdx] = dragPayload.itemId;
  dragPayload = null;
  save(); renderLeadgen();
}
function onDropLeadInv(e, methodId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-active');
  if (!dragPayload || dragPayload.kind !== 'lead') return;
  if (dragPayload.methodId !== methodId) return;
  const m = D.leadgen.methods.find(x => x.id === methodId);
  m.slots = m.slots.map(s => s === dragPayload.itemId ? null : s);
  dragPayload = null;
  save(); renderLeadgen();
}

// ── Activity categories (drag/drop) ──
function renderActivitiesV2() {
  const el = document.getElementById('activity-categories');
  if (!el) return;
  el.innerHTML = D.activityCategories.map(renderActivityCategory).join('');
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
function activityTile(cat, it, inSlot) {
  return `
    <div class="act-tile" draggable="true"
         ondragstart="onDragStartActivity(event,'${cat.id}','${it.id}')"
         ondragend="onDragEnd(event)"
         ondblclick="openEditActivityItem('${cat.id}','${it.id}')">
      <div class="tile-name">${it.emoji||'⭐'} ${escapeHtml(it.name)}</div>
      <div class="tile-meta">${statEffectsStr(it.statEffects)}${it.meetBonus?` · Meet +${it.meetBonus}`:''}</div>
      <div class="row" style="margin-top:4px">
        <button class="pill-btn good" onclick="event.stopPropagation();doActivityItem('${cat.id}','${it.id}')">Do</button>
        ${inSlot ? `<button class="pill-btn" onclick="event.stopPropagation();clearActivitySlot('${cat.id}','${it.id}')">Unslot</button>` : ''}
      </div>
    </div>`;
}
function adjustCatMax(catId, delta) {
  const c = D.activityCategories.find(x => x.id === catId);
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
  const src = D.activityCategories.find(c => c.id === dragPayload.catId);
  const dst = D.activityCategories.find(c => c.id === catId);
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
  const c = D.activityCategories.find(x => x.id === catId);
  c.slots = c.slots.map(s => s === dragPayload.itemId ? null : s);
  dragPayload = null;
  save(); renderActivitiesV2();
}
function clearActivitySlot(catId, itemId) {
  const c = D.activityCategories.find(x => x.id === catId);
  if (!c) return;
  c.slots = c.slots.map(s => s === itemId ? null : s);
  save(); renderActivitiesV2();
}
function openAddActivityItem(catId) {
  const effRows = STAT_KEYS.map(k =>
    `<div class="eff-row"><label>${STAT_LABELS[k]}</label><input type="number" value="0" data-stat="${k}" class="eff-input"/></div>`
  ).join('');
  openModal(`
    <h3>⭐ Add Item</h3>
    <div class="form-row"><label>NAME</label><input id="ai-name" placeholder="e.g. Judo class"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ai-emoji" placeholder="🥋" maxlength="2"/></div>
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
  const c = D.activityCategories.find(x => x.id === catId);
  if (!c) return;
  const name = (document.getElementById('ai-name').value || '').trim();
  if (!name) { toast('Name required.'); return; }
  c.inventory.push({
    id: uid('ai'),
    name,
    emoji: document.getElementById('ai-emoji').value || '⭐',
    meetBonus: Number(document.getElementById('ai-meet').value) || 0,
    xp: Number(document.getElementById('ai-xp').value) || 5,
    statEffects: readEffectInputs(),
  });
  closeModal();
  save(); renderActivitiesV2();
}
function openEditActivityItem(catId, itemId) {
  const c = D.activityCategories.find(x => x.id === catId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  const effRows = STAT_KEYS.map(k =>
    `<div class="eff-row"><label>${STAT_LABELS[k]}</label><input type="number" value="${it.statEffects?.[k]||0}" data-stat="${k}" class="eff-input"/></div>`
  ).join('');
  openModal(`
    <h3>✏️ Edit ${escapeHtml(it.name)}</h3>
    <div class="form-row"><label>NAME</label><input id="ai-name" value="${escapeHtml(it.name)}"/></div>
    <div class="form-row"><label>EMOJI</label><input id="ai-emoji" value="${it.emoji||''}" maxlength="2"/></div>
    <div class="form-row"><label>MEET BAR BONUS</label><input id="ai-meet" type="number" min="0" max="15" value="${it.meetBonus||0}"/></div>
    <div class="form-row"><label>XP PER DO</label><input id="ai-xp" type="number" min="1" max="50" value="${it.xp||5}"/></div>
    <div class="form-row"><label>STAT EFFECTS</label><div class="effects-grid">${effRows}</div></div>
    <div class="row">
      <button class="pill-btn danger" onclick="deleteActivityItem('${catId}','${itemId}')">Delete</button>
      <button class="pill-btn" onclick="closeModal()">Cancel</button>
      <button class="pill-btn good" onclick="submitEditActivityItem('${catId}','${itemId}')">Save</button>
    </div>`);
}
function submitEditActivityItem(catId, itemId) {
  const c = D.activityCategories.find(x => x.id === catId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  it.name = document.getElementById('ai-name').value || it.name;
  it.emoji = document.getElementById('ai-emoji').value || it.emoji;
  it.meetBonus = Number(document.getElementById('ai-meet').value) || 0;
  it.xp = Number(document.getElementById('ai-xp').value) || 5;
  it.statEffects = readEffectInputs();
  closeModal();
  save(); renderActivitiesV2();
}
function deleteActivityItem(catId, itemId) {
  const c = D.activityCategories.find(x => x.id === catId);
  if (!c) return;
  c.inventory = c.inventory.filter(x => x.id !== itemId);
  c.slots = c.slots.map(s => s === itemId ? null : s);
  closeModal();
  save(); renderActivitiesV2();
}
function doActivityItem(catId, itemId) {
  const c = D.activityCategories.find(x => x.id === catId);
  const it = c?.inventory.find(x => x.id === itemId);
  if (!it) return;
  applyEffects(it.statEffects || {});
  addXP(it.xp || 4, it.name);
  // Track city completion
  const city = D.world.cities.find(x => x.id === D.world.currentCityId);
  if (city && city.discovered) city.completion = Math.min(100, (city.completion||0) + 2);
  addLog(`Did ${it.name} in ${city?.name||'somewhere'}.`, 'activity');
  tickDay();
}

// ── World map ──
function renderWorld() {
  const el = document.getElementById('world-grid');
  if (!el) return;
  el.innerHTML = D.world.cities.map(c => `
    <button class="city-card ${c.discovered?'':'undiscovered'} ${c.id===D.world.currentCityId?'current':''}"
            onclick="selectCity('${c.id}')">
      <div class="city-name">${c.discovered ? escapeHtml(c.name) : '???'}</div>
      <div class="city-ring"><div class="city-ring-fill" style="width:${c.completion||0}%"></div></div>
      <div class="city-pct">${c.discovered ? (c.completion||0).toFixed(0)+'%' : 'locked'}</div>
    </button>
  `).join('') + `
    <button class="city-card discover-card" onclick="discoverCity()">
      <div class="city-name">+ Discover</div>
      <div class="city-pct">$50</div>
    </button>`;
  renderNextMoves();
}
function selectCity(id) {
  const c = D.world.cities.find(x => x.id === id);
  if (!c) return;
  if (!c.discovered) { toast('Undiscovered. Use Discover to unlock.'); return; }
  D.world.currentCityId = id;
  save(); renderWorld();
  toast(`Moved to ${c.name}.`);
}
function discoverCity() {
  if (D.player.stats.money < 50) { toast('Need $50 to discover.'); return; }
  const undiscovered = D.world.cities.find(c => !c.discovered);
  if (undiscovered) {
    D.player.stats.money -= 50;
    undiscovered.discovered = true;
    addLog(`Discovered ${undiscovered.name}.`, 'world');
    toast(`Discovered ${undiscovered.name}!`);
  } else {
    // Invent a new one
    const names = ['The Hague','Groningen','Eindhoven','Leiden','Haarlem','Delft','Maastricht','Breda','Nijmegen','Tilburg'];
    const existing = new Set(D.world.cities.map(c => c.name));
    const pool = names.filter(n => !existing.has(n));
    if (pool.length === 0) { toast('Map is full.'); return; }
    D.player.stats.money -= 50;
    const name = pickRandom(pool);
    D.world.cities.push({ id: uid('city'), name, discovered:true, completion:0 });
    addLog(`Discovered ${name}.`, 'world');
    toast(`Discovered ${name}!`);
  }
  save(); renderWorld();
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
        <div class="move-meta">${statEffectsStr(m.statEffects)}${m.city?` · 📍 ${escapeHtml(cityName(m.city))}`:''}</div>
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
    D.world.cities.filter(c=>c.discovered).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  openModal(`
    <h3>📝 Plan a Next Move</h3>
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
  D.nextMoves.push({ id: uid('nm'), name, statEffects, city, done:false });
  closeModal();
  save(); renderNextMoves();
  toast(`Planned: ${name}`);
}
function openEditMove(id) {
  const m = D.nextMoves.find(x => x.id === id);
  if (!m) return;
  const statOpts = STAT_KEYS.map(k => `<option value="${k}" ${m.statEffects[k]?'selected':''}>${STAT_EMOJI[k]} ${STAT_LABELS[k]}</option>`).join('');
  const firstMag = Object.values(m.statEffects)[0] || 2;
  const cityOpts = '<option value="">— none —</option>' +
    D.world.cities.filter(c=>c.discovered).map(c => `<option value="${c.id}" ${m.city===c.id?'selected':''}>${escapeHtml(c.name)}</option>`).join('');
  openModal(`
    <h3>✏️ Edit Move</h3>
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
    if (c) c.completion = Math.min(100, (c.completion||0) + 5);
  }
  D.nextMoves = D.nextMoves.filter(x => x.id !== id);
  tickDay();
  toast(`Did: ${m.name}`);
}
function deleteMove(id) {
  D.nextMoves = D.nextMoves.filter(x => x.id !== id);
  save(); renderNextMoves();
}

// ── Init ──
function init() {
  load();
  // ensure current month exists
  const m = currentMonthInfo();
  if (!D.months[m.key]) D.months[m.key] = { name: m.name, year: m.year, events: [], summary: null };
  save();
  navigateTo('home');
}

document.addEventListener('DOMContentLoaded', init);
