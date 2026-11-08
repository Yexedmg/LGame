/* Plants HTML metacharacters in every user-typed field, renders every page,
 * and reports which innerHTML writes emitted the raw markup. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const DIR = require('path').join(__dirname, '..') + '/';
const html = fs.readFileSync(DIR + 'index.html', 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);

const MARK = '<b id=PWN>';   // raw if unescaped, &lt;b... if escaped

const made = new Map();
const writes = [];           // every innerHTML write, with the element id
function el(id) {
  if (id && made.has(id)) return made.get(id);
  const e = {
    id: id || '', _html: '', textContent: '', value: '', checked: false,
    style: new Proxy({}, { get: () => '', set: () => true }),
    dataset: {}, children: [], offsetWidth: 320, scrollTop: 0,
    classList: { _s: new Set(), add() { }, remove() { }, toggle() { }, contains: () => false },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); writes.push({ id: this.id, html: this._html }); },
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { return c; }, insertBefore(c) { return c; }, remove() { },
    addEventListener() { }, removeEventListener() { },
    setAttribute() { }, getAttribute: () => null, removeAttribute() { },
    querySelector: () => el(), querySelectorAll: () => [],
    closest: () => null, focus() { }, blur() { }, click() { }, scrollIntoView() { },
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 320, height: 40, bottom: 40, right: 320 })
  };
  if (id) made.set(id, e);
  return e;
}
ids.forEach(el);

const doc = {
  readyState: 'complete', visibilityState: 'visible',
  addEventListener() { }, removeEventListener() { },
  getElementById: id => made.get(id) || null,
  querySelector: () => el(),
  querySelectorAll: s => (String(s).includes('dock') || String(s).includes('data-page')) ? [el(), el(), el(), el(), el()] : [],
  createElement: () => el(), createDocumentFragment: () => el(),
  body: el('__body'), documentElement: el('__html'), head: el('__head')
};
const sandbox = {
  console: { log() { }, warn() { }, error() { } }, document: doc,
  localStorage: (() => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; })(),
  setTimeout, clearTimeout, setInterval: () => 0, clearInterval,
  JSON, Math, Date, Object, Array, String, Number, Boolean, Error, isNaN, parseInt, parseFloat, Promise,
  navigator: {}, alert() { }, confirm: () => true, prompt: () => null,
  Blob: class { }, URL: { createObjectURL: () => '', revokeObjectURL() { } },
  FileReader: class { readAsText() { } },
  requestAnimationFrame: fn => setTimeout(fn, 0), getComputedStyle: () => ({ getPropertyValue: () => '' })
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
sandbox.addEventListener = () => { }; sandbox.removeEventListener = () => { };
vm.createContext(sandbox);
const shim = `globalThis.__api = { init, render, navigateTo, showOverlay, get D(){return D}, set D(v){D=v},
  addLog, uid, save, runMigrations, selectMonth, openGirlDetails, openFriendDetails };`;
vm.runInContext(fs.readFileSync(DIR + 'app.js', 'utf8') + shim, sandbox, { filename: 'app.js' });
const api = sandbox.__api;

api.init();
const D = api.D;

// ── Plant the marker everywhere a human types ──
D.girls.push({
  id: api.uid('g'), name: MARK + 'Girl', rarity: 4, origin: MARK + 'Bar', status: 'Talking',
  affinity: 20, dates: 5, looksLikeYou: 7, socialStar: 3, note: MARK
});
D.friends.push({ id: api.uid('f'), name: MARK + 'Friend', rarity: 3, origin: MARK, socialStar: 4 });
// theOne / commons hold girl IDS, not girl objects.
const common = { ...D.girls[0], id: api.uid('g'), name: MARK + 'Common' };
D.girls.push(common);
D.relationships.theOne = D.girls[0].id;
D.relationships.commons.push(common.id);
D.customActivities.push({ id: api.uid('a'), name: MARK + 'Act', desc: MARK, emoji: '★', statEffects: {} });
D.northstar = { text: MARK + 'North', updatedAt: Date.now() };
D.eras.push({ id: api.uid('e'), name: MARK + 'Era', start: '2026-01-01', end: '2026-12-31', color: '#fff' });
D.manifests.push({
  id: api.uid('mf'), name: MARK + 'Manifest', emoji: '★', collapsed: false,
  milestones: [{ id: api.uid('ms'), name: MARK + 'Stone', collapsed: false, tasks: [{ id: api.uid('t'), name: MARK + 'Task', done: false }] }]
});
D.lifestyles.push({
  id: api.uid('ls'), name: MARK + 'Lifestyle', emoji: '★', activities: [],
  schedule: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }
});
D.activeLifestyleId = D.lifestyles[0].id;
D.meStats.push({ id: api.uid('s'), title: MARK + 'MeStat', desc: MARK, stars: 4, createdAt: Date.now() });
D.socialMedia.push({ id: api.uid('sm'), title: MARK + 'Platform', desc: MARK, level: 5 });
D.incomes.push({ id: api.uid('i'), title: MARK + 'Income', desc: MARK, status: 'active', amount: 100, hoursPerWeek: 5, projections: [] });
D.abilities.push({ id: api.uid('ab'), name: MARK + 'Ability', desc: MARK, unlocked: true, assignments: [] });
D.nextMoves.push({ id: api.uid('mv'), name: MARK + 'Move', desc: MARK });
D.ratings[0].name = MARK + 'Rating';
D.ratings[0].desc = MARK;
if (D.world.cities[0]) {
  D.world.cities[0].name = MARK + 'City';
  if (D.world.cities[0].boroughs && D.world.cities[0].boroughs[0]) {
    D.world.cities[0].boroughs[0].name = MARK + 'Borough';
    (D.world.cities[0].boroughs[0].places || []).push({ id: api.uid('p'), name: MARK + 'Place', visited: true });
  }
}
(D.activityCategories || []).forEach(c => {
  c.name = MARK + 'Cat';
  (c.inventory || []).forEach(it => { it.name = MARK + 'Item'; it.desc = MARK; });
});
(D.leadgen.methods || []).forEach(m => {
  m.name = MARK + 'Method';
  (m.inventory || []).forEach(it => { it.name = MARK + 'LeadItem'; });
});
(D.vibeComponents || []).forEach(c => {
  c.name = MARK + 'Vibe'; c.desc = MARK;
  (c.inventory || []).forEach(it => { it.name = MARK + 'VibeItem'; });
});
(D.timeAllocs || []).forEach(t => { t.name = MARK + 'Alloc'; });
D.log.push({ t: Date.now(), day: D.day, msg: MARK + 'LogLine', tag: 'meet' });

// ── Render everything and inspect what got written ──
const pages = [...html.matchAll(/id="page-([a-z0-9]+)"/g)].map(m => m[1]);
const hits = new Map();
for (const p of pages) {
  writes.length = 0;
  try { api.navigateTo(p); } catch (e) { }
  for (const w of writes) {
    if (w.html.includes(MARK)) {
      const key = w.id || '(anonymous element)';
      if (!hits.has(key)) hits.set(key, { pages: new Set(), sample: '' });
      const h = hits.get(key);
      h.pages.add(p);
      if (!h.sample) {
        const i = w.html.indexOf(MARK);
        h.sample = w.html.slice(Math.max(0, i - 60), i + 40).replace(/\s+/g, ' ');
      }
    }
  }
}
// Detail modals too
writes.length = 0;
try { api.openGirlDetails(D.girls[0].id); } catch (e) { }
try { api.openFriendDetails(D.friends[0].id); } catch (e) { }
for (const w of writes) {
  if (w.html.includes(MARK)) {
    const key = (w.id || '(modal)') + ' [detail]';
    if (!hits.has(key)) hits.set(key, { pages: new Set(['detail']), sample: w.html.slice(Math.max(0, w.html.indexOf(MARK) - 60), w.html.indexOf(MARK) + 40).replace(/\s+/g, ' ') });
  }
}

if (!hits.size) {
  console.log('CLEAN — no unescaped user text reached innerHTML');
  process.exit(0);
}
console.log('UNESCAPED user text reached ' + hits.size + ' render target(s):\n');
for (const [id, h] of [...hits].sort()) {
  console.log('  #' + id);
  console.log('     pages: ' + [...h.pages].join(', '));
  console.log('     ...' + h.sample + '...\n');
}
process.exit(1);
