# Verification

Proof that the WebAssembly wrappers return the **same numbers as the native
Swiss Ephemeris C library** — in both Node and the browser.

## Files

| File | Role |
| --- | --- |
| `generate_all_outputs.c` | C program that computes reference values by calling the real Swiss Ephemeris directly. |
| `reference.json` | **Committed** expected values, generated from `generate_all_outputs.c` against the vendored C source. The single source of truth for the tests. |
| `checks.js` | Shared check list (`runChecks(swe, reference)`) used by both harnesses, so Node and the browser run the exact same comparison. |
| `compare_wasm_vs_c.mjs` | Node harness: init the wasm module, run every method, diff against `reference.json`. |
| `browser_test.html` | Same comparison, in a real browser (fetches `reference.json`). |
| `swegen` | Compiled `generate_all_outputs.c` (git-ignored build artifact). |

## Run it

```bash
# Node: diff every wrapped method against reference.json
node verification/compare_wasm_vs_c.mjs

# Full pipeline: recompile the C reference, regenerate reference.json, then diff.
# (needs gcc; emcc is NOT required)
npm run verify

# Browser: serve the repo and open the page
npm run demo   # http://localhost:8000
# -> http://localhost:8000/verification/browser_test.html
```

`npm test` also uses `reference.json` for its assertions.

## How `reference.json` stays honest

`npm run verify` recompiles the vendored C source and regenerates
`reference.json` in place. Because the C output is deterministic, the file is
**byte-identical unless the vendored Swiss Ephemeris source changes** — in
which case the git diff on `reference.json` is exactly the signal that expected
values moved, and it should be reviewed and committed.
