# LIFE — life-sim RPG

Vanilla JS, no build step, no dependencies. `index.html` + `app.js` + `styles.css`
(+ `brutalist.css`) served as static files. Live at https://yexedmg.github.io/LGame/
via GitHub Pages from `main` — **pushing to `main` deploys.**

## Deploying: bump the version in two places

Every change to `app.js` or the CSS must bump **both**, to the same value:

1. `VERSION` in `sw.js`
2. all three `?v=` query strings in `index.html` (styles.css, brutalist.css, app.js)

Currently `3.2.0`. The service worker precaches the exact versioned URLs the page
requests, so if these drift apart the precache silently misses; if you skip the
bump entirely, returning players keep the old cached files with no error to
explain why. Check before pushing:

```sh
grep -o "VERSION = '[^']*'" sw.js && grep -c '?v=3.2.0' index.html   # expect 3
```

## Tests

No dependencies — plain `node`. Run all four before pushing:

```sh
for t in persistence history escaping smoke; do node tests/$t.test.js; done
```

- `smoke` boots `init()` and renders all 32 pages against a DOM seeded from the
  real `index.html`, so a render function reaching for an element id that no
  longer exists fails here rather than in the browser.
- `escaping` plants HTML metacharacters in every user-typed field and fails if
  raw markup survives into any `innerHTML` write.
- `persistence` covers save/snapshot/recovery/quota, including a stubbed
  localStorage that throws (Safari private mode).

## State and saves

All state is one object `D`, persisted to localStorage:

- `life-rpg-data` — the live save
- `life-rpg-backup-0..5` — rotating snapshots (per in-game day, on level-up, hourly)
- `life-rpg-meta` — snapshot/export bookkeeping

Rules that matter:

- **Adding a field to `D` needs two edits**: a default in `defaultData()` *and* a
  guard in `runMigrations()`. Existing saves are deep-merged over defaults, so a
  field added in only one place is `undefined` for somebody.
- `runMigrations()` also runs on restored snapshots and imported files, which can
  be arbitrarily old. Keep every migration idempotent and guarded.
- Never write to localStorage directly — go through `lsGet`/`lsSet`/`lsRemove`,
  and let `save()` do the verification and quota handling.
- `save()` is called ~150 times and is synchronous. Keep it cheap.

## Rendering

`render()` dispatches on `currentPage` to one `renderX()` per page; each rebuilds
its section with `innerHTML`. **Escape every user-typed value** with
`escapeHtml()` — names, titles, descriptions. Ids from `uid()` are safe to
interpolate into inline handlers; user text is not.

Log messages (`addLog`) are escaped at render time, not when written — don't
double-escape them. Text going to `toast()`/`confirm()`/`alert()` is plain text
and must *not* be escaped.

## Layout notes

- `revamp-0/`, `revamp/`, `revamp-2/` are archived UI mockups, browsable at
  `/revamp/`. Not part of the game — nothing links to them from it.
- Folder names don't match chronology: `revamp-0` is June, the other two are July.
