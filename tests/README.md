# Tests

No dependencies — plain `node`, with a stubbed browser built in `vm`.

```sh
node tests/persistence.test.js   # save / snapshot / recovery / quota behaviour
node tests/history.test.js       # stat history: recording, capping, deltas, rewind
node tests/escaping.test.js      # user text must not reach innerHTML unescaped
node tests/smoke.test.js         # boots init() and renders all 32 pages
```

`smoke.test.js` seeds a fake DOM from the real `index.html`, so if a render
function reaches for an element id that no longer exists in the markup, it
fails there rather than in the browser.

`escaping.test.js` plants `<b id=PWN>` in every field a human types into,
renders every page, and fails if the raw markup survives into any `innerHTML`
write. It is an empirical check — it finds the sites that actually render,
rather than guessing from grep.
