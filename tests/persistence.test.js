/* Exercises the persistence layer of app.js against a stubbed browser. */
const fs = require('fs');
const vm = require('vm');

const SRC = require('path').join(__dirname, '..', 'app.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' :: ' + extra : '')); }
}

function makeStore(limitBytes) {
  const m = new Map();
  return {
    _m: m,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      v = String(v);
      if (limitBytes != null) {
        let total = v.length;
        for (const [kk, vv] of m) if (kk !== k) total += vv.length;
        if (total > limitBytes) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }
      }
      m.set(k, v);
    },
    removeItem: k => m.delete(k),
    key: i => [...m.keys()][i],
    get length() { return m.size; }
  };
}

function boot(localStorage) {
  const el = () => ({
    innerHTML: '', textContent: '', style: {}, classList: { add() { }, remove() { }, toggle() { }, contains: () => false },
    appendChild() { }, removeChild() { }, addEventListener() { }, remove() { }, querySelector: () => null,
    querySelectorAll: () => [], setAttribute() { }, focus() { }, value: '', dataset: {}, children: []
  });
  const doc = {
    addEventListener() { }, removeEventListener() { },
    getElementById: () => null,
    querySelector: () => null, querySelectorAll: () => [],
    createElement: () => el(),
    body: el(), documentElement: el(), visibilityState: 'visible'
  };
  const sandbox = {
    console, localStorage, document: doc,
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval,
    JSON, Math, Date, Object, Array, String, Number, Boolean, Error, isNaN, parseInt, parseFloat,
    Promise, Blob: class { constructor() { } }, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() { } },
    FileReader: class { readAsText() { } },
    navigator: { storage: undefined },
    alert() { }, confirm: () => true, prompt: () => null,
    requestAnimationFrame: fn => setTimeout(fn, 0)
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  // `let D` lives in script scope, not on the global object, so a shim appended
  // to the same script is the only way to reach the real bindings.
  const shim = `
    globalThis.__api = {
      get D() { return D; }, set D(v) { D = v; },
      get storageState() { return storageState; },
      get recoveredFrom() { return recoveredFrom; },
      get BACKUP_SLOTS() { return BACKUP_SLOTS; },
      save, load, listBackups, snapshotNow, manualSnapshot,
      restoreBackup, deleteBackup, runMigrations, serializeSave,
      set render(f) { render = f; }, set toast(f) { toast = f; },
      set renderSaveload(f) { renderSaveload = f; }
    };`;
  vm.runInContext(fs.readFileSync(SRC, 'utf8') + shim, sandbox, { filename: 'app.js' });
  return sandbox.__api;
}

// ── 1. Round trip ──
console.log('\n1. save/load round trip');
{
  const ls = makeStore();
  const s = boot(ls);
  s.D.day = 42;
  s.D.player.level = 7;
  s.D.player.stats.charm = 13;
  s.save();
  ok('live key written', !!ls.getItem('life-rpg-data'));
  const s2 = boot(ls);
  s2.load();
  ok('day survives', s2.D.day === 42, 'got ' + s2.D.day);
  ok('level survives', s2.D.player.level === 7);
  ok('stat survives', s2.D.player.stats.charm === 13);
}

// ── 2. Snapshot ring ──
console.log('\n2. snapshot ring rotates and caps');
{
  const ls = makeStore();
  const s = boot(ls);
  for (let d = 1; d <= 20; d++) { s.D.day = d; s.save(); }
  const ring = s.listBackups();
  ok('ring capped at BACKUP_SLOTS', ring.length === s.BACKUP_SLOTS, 'got ' + ring.length);
  const days = ring.map(b => b.day).sort((a, b) => a - b);
  ok('ring holds the newest days', days[days.length - 1] >= 19, 'days=' + days.join(','));
  ok('oldest was evicted', !days.includes(1), 'days=' + days.join(','));
}

// ── 3. Corrupt live key falls back to a snapshot ──
console.log('\n3. corrupt live save recovers from snapshot');
{
  const ls = makeStore();
  const s = boot(ls);
  s.D.day = 33; s.D.player.level = 5; s.save();
  ls.setItem('life-rpg-data', '{"player":{"level":3,'); // truncated mid-write
  const s2 = boot(ls);
  s2.load();
  ok('recovered a usable save', s2.D.day === 33, 'got ' + s2.D.day);
  ok('recoveredFrom flagged', s2.recoveredFrom && s2.recoveredFrom.day === 33);
}

// ── 4. Evicted live key falls back ──
console.log('\n4. evicted live key recovers from snapshot');
{
  const ls = makeStore();
  const s = boot(ls);
  s.D.day = 77; s.save();
  ls.removeItem('life-rpg-data');
  const s2 = boot(ls);
  s2.load();
  ok('recovered after eviction', s2.D.day === 77, 'got ' + s2.D.day);
}

// ── 5. Quota pressure ──
console.log('\n5. quota exhaustion sheds backups, keeps the live save');
{
  const ls = makeStore();
  const s = boot(ls);
  for (let d = 1; d <= 12; d++) { s.D.day = d; s.save(); }
  const before = s.listBackups().length;
  // Shrink the budget to just over one save: backups must be sacrificed.
  const liveSize = ls.getItem('life-rpg-data').length;
  const tight = makeStore(Math.floor(liveSize * 1.5));
  for (const [k, v] of ls._m) { try { tight.setItem(k, v); } catch (e) { } }
  const s2 = boot(tight);
  s2.load();
  s2.D.day = 99;
  s2.save();
  ok('had backups to shed', before > 0);
  ok('live save still written under pressure', !!tight.getItem('life-rpg-data'));
  ok('storageState reports ok', s2.storageState.ok === true, s2.storageState.error);
  const reread = boot(tight); reread.load();
  ok('post-pressure save is readable', reread.D.day === 99, 'got ' + reread.D.day);
}

// ── 6. A broken D must not clobber a good save ──
console.log('\n6. unserializable state does not destroy the good save');
{
  const ls = makeStore();
  const s = boot(ls);
  s.D.day = 55; s.save();
  const good = ls.getItem('life-rpg-data');
  const circular = {}; circular.self = circular;
  s.D.boom = circular;
  s.save();
  ok('good save intact', ls.getItem('life-rpg-data') === good);
  ok('failure surfaced in storageState', s.storageState.ok === false);
}

// ── 7. Empty/garbage player shape rejected ──
console.log('\n7. shape check rejects a gutted save');
{
  const ls = makeStore();
  const s = boot(ls);
  s.D.day = 21; s.save();
  const good = ls.getItem('life-rpg-data');
  s.D = { nothing: true };
  s.save();
  ok('gutted state refused', ls.getItem('life-rpg-data') === good);
  ok('error recorded', s.storageState.ok === false, JSON.stringify(s.storageState));
}

// ── 8. Restore is reversible ──
console.log('\n8. restore snapshots current state first');
{
  const ls = makeStore();
  const s = boot(ls);
  s.render = () => { }; s.renderSaveload = () => { }; s.toast = () => { };
  s.D.day = 10; s.save();
  s.D.day = 90; s.save();
  const target = s.listBackups().find(b => b.day === 10);
  ok('snapshot of day 10 exists', !!target);
  if (target) {
    s.restoreBackup(target.slot);
    ok('restored to day 10', s.D.day === 10, 'got ' + s.D.day);
    ok('pre-restore snapshot kept day 90', s.listBackups().some(b => b.day === 90 && b.reason === 'pre-restore'));
  }
}

// ── 9. Migrations run on restored data ──
console.log('\n9. migrations apply to restored/imported saves');
{
  const ls = makeStore();
  const s = boot(ls);
  s.render = () => { }; s.renderSaveload = () => { }; s.toast = () => { };
  // Write a snapshot of an ancient save: no vibe stat, no abilities, no ratings.
  const ancient = { player: { level: 2, xp: 0, stats: { money: 0, boldness: 1 } }, day: 5, months: {}, log: [] };
  ls.setItem('life-rpg-backup-0', JSON.stringify({ savedAt: Date.now(), reason: 'old', day: 5, level: 2, data: ancient }));
  s.restoreBackup(0);
  ok('vibe stat migrated in', s.D.player.stats.vibe === 0, String(s.D.player.stats.vibe));
  ok('abilities array migrated in', Array.isArray(s.D.abilities));
  ok('ratings seeded', Array.isArray(s.D.ratings) && s.D.ratings.length > 0);
  ok('world migrated', !!s.D.world && Array.isArray(s.D.world.cities));
  ok('timeAllocs migrated', Array.isArray(s.D.timeAllocs) && s.D.timeAllocs.length > 0);
}

// ── 10. Repeated saves are stable ──
console.log('\n10. save is idempotent');
{
  const ls = makeStore();
  const s = boot(ls);
  s.D.day = 3;
  s.save();
  const first = ls.getItem('life-rpg-data');
  s.save(); s.save();
  ok('repeat saves produce identical bytes', ls.getItem('life-rpg-data') === first);
  ok('still ok', s.storageState.ok === true);
}

// ── 11. localStorage throwing outright (Safari private mode) ──
console.log('\n11. survives localStorage being unavailable');
{
  const dead = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('SecurityError'); },
    removeItem() { throw new Error('SecurityError'); }
  };
  let threw = null;
  try {
    const s = boot(dead);
    s.load();
    s.save();
    s.listBackups();
  } catch (e) { threw = e; }
  ok('no exception escapes', threw === null, threw && threw.message);
}

console.log('\n' + (fail ? 'FAILED' : 'ALL PASS') + ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
