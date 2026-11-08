/* Stat history: recording, capping, deltas, and the rewind that a snapshot
 * restore causes. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = path.join(__dirname, '..', 'app.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' :: ' + extra : '')); }
}

function boot() {
  const store = new Map();
  const el = () => ({
    innerHTML: '', textContent: '', value: '', style: {}, dataset: {},
    classList: { add() { }, remove() { }, toggle() { }, contains: () => false },
    appendChild() { }, removeChild() { }, addEventListener() { }, remove() { },
    querySelector: () => null, querySelectorAll: () => [], setAttribute() { }, focus() { }
  });
  const sandbox = {
    console: { log() { }, warn() { }, error() { } },
    document: {
      addEventListener() { }, getElementById: () => null, createElement: () => el(),
      querySelector: () => null, querySelectorAll: () => [], body: el(), visibilityState: 'visible'
    },
    localStorage: {
      getItem: k => store.has(k) ? store.get(k) : null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    },
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval,
    JSON, Math, Date, Object, Array, String, Number, Boolean, Error, isNaN, parseInt, parseFloat, Promise,
    navigator: {}, alert() { }, confirm: () => true,
    Blob: class { }, URL: { createObjectURL: () => '', revokeObjectURL() { } },
    FileReader: class { }, requestAnimationFrame: fn => setTimeout(fn, 0)
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.addEventListener = () => { };
  vm.createContext(sandbox);
  const shim = `globalThis.__api = {
    get D(){return D}, set D(v){D=v},
    get STAT_HISTORY_CAP(){return STAT_HISTORY_CAP},
    get STAT_KEYS(){return STAT_KEYS},
    save, load, runMigrations, recordStatHistory, statSeries, statDelta,
    statTrendSvg, statDeltaChip, statChangeRow, statGainIsGood, tickDay,
    set render(f){render = f;}, set toast(f){toast = f;}
  };`;
  vm.runInContext(fs.readFileSync(SRC, 'utf8') + shim, sandbox, { filename: 'app.js' });
  const api = sandbox.__api;
  api.render = () => { };
  api.toast = () => { };
  api.runMigrations();
  return api;
}

console.log('\n1. a point is recorded per day, not per save');
{
  const s = boot();
  s.D.day = 1;
  s.save(); s.save(); s.save();
  ok('one point for one day', s.D.statHistory.length === 1, 'got ' + s.D.statHistory.length);
  s.D.player.stats.charm = 9;
  s.save();
  ok('same-day point is updated in place', s.D.statHistory.length === 1);
  ok('point holds the newest value', s.statSeries('charm')[0].v === 9);
  s.D.day = 2;
  s.save();
  ok('a new day appends', s.D.statHistory.length === 2);
}

console.log('\n2. values are stored positionally against STAT_KEYS');
{
  const s = boot();
  s.D.player.stats.vibe = 7;
  s.D.player.stats.money = 1234;
  s.save();
  const e = s.D.statHistory[0];
  ok('entry has one slot per stat', e.s.length === s.STAT_KEYS.length);
  ok('vibe reads back', s.statSeries('vibe')[0].v === 7);
  ok('money reads back', s.statSeries('money')[0].v === 1234);
  ok('unknown key yields nothing', s.statSeries('nope').length === 0);
}

console.log('\n3. history is capped');
{
  const s = boot();
  for (let d = 1; d <= s.STAT_HISTORY_CAP + 50; d++) { s.D.day = d; s.save(); }
  ok('length capped', s.D.statHistory.length === s.STAT_HISTORY_CAP, 'got ' + s.D.statHistory.length);
  ok('oldest days dropped', s.D.statHistory[0].d === 51, 'first=' + s.D.statHistory[0].d);
  ok('newest day kept', s.D.statHistory[s.D.statHistory.length - 1].d === s.STAT_HISTORY_CAP + 50);
}

console.log('\n4. deltas measure against the right past point');
{
  const s = boot();
  for (let d = 1; d <= 40; d++) {
    s.D.day = d;
    s.D.player.stats.charm = d;     // +1 per day
    s.save();
  }
  const d7 = s.statDelta('charm', 7);
  ok('7-day delta is 7', d7 && d7.delta === 7, d7 && String(d7.delta));
  const d30 = s.statDelta('charm', 30);
  ok('30-day delta is 30', d30 && d30.delta === 30, d30 && String(d30.delta));
  const d999 = s.statDelta('charm', 999);
  ok('over-long window falls back to the first point', d999 && d999.delta === 39, d999 && String(d999.delta));
}

console.log('\n5. a single point yields no delta');
{
  const s = boot();
  s.D.day = 1; s.save();
  ok('no delta from one point', s.statDelta('charm', 7) === null);
  ok('chip is empty', s.statDeltaChip('charm') === '');
  ok('chart explains itself instead of drawing', s.statTrendSvg('charm').includes('No trend yet'));
}

console.log('\n6. falling fear counts as progress');
{
  const s = boot();
  ok('fear down is good', s.statGainIsGood('fear', -2) === true);
  ok('fear up is bad', s.statGainIsGood('fear', 2) === false);
  ok('charm up is good', s.statGainIsGood('charm', 2) === true);
  ok('charm down is bad', s.statGainIsGood('charm', -2) === false);
}

console.log('\n7. restoring an older snapshot rewinds the series');
{
  const s = boot();
  for (let d = 1; d <= 20; d++) { s.D.day = d; s.D.player.stats.charm = d; s.save(); }
  ok('20 points before rewind', s.D.statHistory.length === 20);
  // Simulate a restore back to day 10.
  s.D.day = 10;
  s.D.player.stats.charm = 10;
  s.save();
  const days = s.D.statHistory.map(e => e.d);
  ok('no points past the restored day', Math.max(...days) === 10, 'max=' + Math.max(...days));
  ok('series is strictly ascending', days.every((d, i) => i === 0 || d > days[i - 1]), days.join(','));
  s.D.day = 11; s.D.player.stats.charm = 99; s.save();
  ok('play resumes cleanly after rewind', s.statSeries('charm').slice(-1)[0].v === 99);
}

console.log('\n8. chart output is well-formed');
{
  const s = boot();
  for (let d = 1; d <= 15; d++) { s.D.day = d; s.D.player.stats.charm = d % 7; s.save(); }
  const svg = s.statTrendSvg('charm');
  ok('emits an svg', svg.includes('<svg') && svg.includes('</svg>'));
  ok('carries the stat accent class', svg.includes('st-trend charm'));
  ok('has an accessible label', svg.includes('aria-label='));
  ok('no NaN coordinates', !/NaN/.test(svg), svg.slice(0, 200));
  const flat = boot();
  for (let d = 1; d <= 5; d++) { flat.D.day = d; flat.D.player.stats.charm = 3; flat.save(); }
  ok('a flat series still renders without NaN', !/NaN/.test(flat.statTrendSvg('charm')));
  const money = boot();
  for (let d = 1; d <= 5; d++) { money.D.day = d; money.D.player.stats.money = 0; money.save(); }
  ok('all-zero money renders without NaN', !/NaN/.test(money.statTrendSvg('money')));
  ok('change row renders three spans', (s.statChangeRow('charm').match(/st-change-k/g) || []).length === 3);
}

console.log('\n9. history survives a save/load round trip');
{
  const s = boot();
  for (let d = 1; d <= 6; d++) { s.D.day = d; s.D.player.stats.charm = d * 2; s.save(); }
  const raw = JSON.parse(JSON.stringify(s.D));
  const s2 = boot();
  s2.D = raw;
  s2.runMigrations();
  ok('points survive', s2.D.statHistory.length === 6);
  ok('values survive', s2.statSeries('charm').slice(-1)[0].v === 12);
}

console.log('\n10. an old save with no history migrates cleanly');
{
  const s = boot();
  s.D = { player: { level: 1, xp: 0, stats: { charm: 4 } }, day: 3, months: {}, log: [] };
  s.runMigrations();
  ok('history array created', Array.isArray(s.D.statHistory));
  s.save();
  ok('recording starts from the current day', s.D.statHistory.length === 1 && s.D.statHistory[0].d === 3);
}

console.log('\n' + (fail ? 'FAILED' : 'ALL PASS') + ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
