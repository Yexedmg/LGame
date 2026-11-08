/* Boots app.js against a fake DOM seeded from the real index.html, to confirm
 * init() -> navigateTo -> render runs clean and the Save/Load page populates. */
const fs = require('fs');
const vm = require('vm');

const DIR = require('path').join(__dirname, '..') + '/';
const html = fs.readFileSync(DIR + 'index.html', 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
console.log('seeded ' + ids.length + ' element ids from index.html');

const made = new Map();
function el(id) {
  if (id && made.has(id)) return made.get(id);
  const e = {
    id: id || '', _html: '', textContent: '', value: '', checked: false,
    style: new Proxy({}, { get: () => '', set: () => true }),
    dataset: {}, children: [], parentNode: null, offsetWidth: 320, scrollTop: 0,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { f === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (f ? this._s.add(c) : this._s.delete(c)); },
      contains(c) { return this._s.has(c); }
    },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); },
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); return c; },
    insertBefore(c) { this.children.push(c); return c; },
    remove() { },
    addEventListener() { }, removeEventListener() { },
    setAttribute() { }, getAttribute: () => null, removeAttribute() { },
    querySelector: () => el(), querySelectorAll: () => [],
    closest: () => null, focus() { }, blur() { }, click() { },
    scrollIntoView() { }, getBoundingClientRect: () => ({ top: 0, left: 0, width: 320, height: 40, bottom: 40, right: 320 })
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
  querySelectorAll: sel => {
    // The dock queries by [data-page]; return the dock buttons as stubs.
    if (String(sel).includes('dock-btn') || String(sel).includes('data-page')) return [el(), el(), el(), el(), el()];
    return [];
  },
  createElement: () => el(),
  createDocumentFragment: () => el(),
  body: el('__body'), documentElement: el('__html'), head: el('__head')
};

const warnings = [];
const sandbox = {
  console: { log() { }, warn: (...a) => warnings.push(a.join(' ')), error: (...a) => warnings.push('ERR ' + a.join(' ')) },
  document: doc,
  localStorage: (() => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; })(),
  setTimeout, clearTimeout, setInterval: () => 0, clearInterval,
  JSON, Math, Date, Object, Array, String, Number, Boolean, Error, isNaN, parseInt, parseFloat, Promise,
  navigator: { storage: { persisted: () => Promise.resolve(false), persist: () => Promise.resolve(true) } },
  alert() { }, confirm: () => true, prompt: () => null,
  Blob: class { }, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() { } },
  FileReader: class { readAsText() { } },
  requestAnimationFrame: fn => setTimeout(fn, 0),
  getComputedStyle: () => ({ getPropertyValue: () => '' })
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = () => { };
sandbox.removeEventListener = () => { };
vm.createContext(sandbox);

const shim = `globalThis.__api = { init, render, navigateTo, showOverlay, renderSaveload, manualSnapshot,
  get D(){return D}, get currentPage(){return currentPage}, get storageState(){return storageState} };`;
vm.runInContext(fs.readFileSync(DIR + 'app.js', 'utf8') + shim, sandbox, { filename: 'app.js' });

let failed = 0;
function step(name, fn) {
  try { fn(); console.log('  PASS ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' :: ' + e.message + '\n' + String(e.stack).split('\n').slice(1, 4).join('\n')); }
}

const api = sandbox.__api;
console.log('\nboot sequence');
step('init() runs clean', () => api.init());
step('landed on home', () => { if (api.currentPage !== 'home') throw new Error('page=' + api.currentPage); });
step('save succeeded', () => { if (!api.storageState.ok) throw new Error(api.storageState.error); });

console.log('\nevery page renders');
const pages = [...html.matchAll(/id="page-([a-z0-9]+)"/g)].map(m => m[1]);
for (const p of pages) step('render ' + p, () => api.navigateTo(p));

console.log('\nsave/load page content');
step('navigate to saveload', () => api.showOverlay('saveload'));
step('storage status populated', () => {
  const h = made.get('storage-status').innerHTML;
  if (!h.includes('Live save')) throw new Error('no status rows: ' + h.slice(0, 120));
});
step('snapshot list populated', () => {
  const h = made.get('backup-list').innerHTML;
  if (!h.includes('Restore') && !h.includes('No snapshots')) throw new Error('unexpected: ' + h.slice(0, 120));
});
step('manual snapshot then listed', () => {
  api.manualSnapshot();
  const h = made.get('backup-list').innerHTML;
  if (!h.includes('Restore')) throw new Error('snapshot not listed');
});

if (warnings.length) {
  console.log('\nconsole warnings during run:');
  [...new Set(warnings)].slice(0, 15).forEach(w => console.log('  ! ' + w.slice(0, 200)));
}
console.log('\n' + (failed ? failed + ' STEP(S) FAILED' : 'SMOKE OK'));
process.exit(failed ? 1 : 0);
