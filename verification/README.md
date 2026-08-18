# Verification

Proof that the WebAssembly wrappers return the **same numbers as the native
Swiss Ephemeris C library** — in both Node and the browser.

## Files

| File | Role |
| --- | --- |
| `generate_all_outputs.c` | C program that computes reference values by calling the real Swiss Ephemeris directly. |
| `reference.json` | **Committed** expected values, generated from `generate_all_outputs.c` against the vendored C source. The single source of truth for the tests. |
| `checks.js` | Shared check list (`runChecks(swe, reference)`) used by both harnesses, so Node and the browser run the exact same comparison. |
| `compare_wasm_vs_c.mjs` | Node harness: init the wasm module, run every method, diff against a reference (path via argv or `SWISSEPH_REFERENCE`, default the committed one). |
| `compare_references.mjs` | Numeric diff of two `reference.json` files, used to compare a freshly generated reference against the committed one. |
| `validate_reference.mjs` | Sanity-checks a generated `reference.json` (parses, has every section, holds finite numbers) before anything trusts it. |
| `browser_test.html` | Same comparison, in a real browser (fetches `reference.json`). |
| `swegen` | Compiled `generate_all_outputs.c` (git-ignored build artifact). |

## Run it

```bash
# Node: diff every wrapped method against reference.json
node verification/compare_wasm_vs_c.mjs

# Full pipeline: recompile the C reference into a temp dir, generate a fresh
# reference, compare it to the committed one, then diff the wasm wrappers.
# (needs gcc; emcc is NOT required)
npm run verify

# Same, with no C toolchain at all - uses the committed reference
npm run verify -- --skip-regen

# Treat a missing/broken toolchain or any drift as a failure (CI)
npm run verify -- --strict

# Adopt the fresh C output as the new committed reference
npm run verify -- --update-reference

# Browser: serve the repo and open the page
npm run demo   # http://localhost:8000
# -> http://localhost:8000/verification/browser_test.html
```

`npm test` also uses `reference.json` for its assertions.

## How `reference.json` stays honest

`reference.json` is committed so `npm test` and the browser harness work
without a C toolchain, and **`npm run verify` never writes it unless you pass
`--update-reference`**. The generator writes to a temp file; that file is
validated (parses, all sections present, all numbers finite) before anything
compares against it or copies it. A generator that crashes mid-write therefore
cannot leave a truncated reference behind — the run falls back to the committed
one and says so.

Fresh-vs-committed is a **numeric** comparison, not a byte diff: a different
compiler, optimisation level or libm moves the last few digits (~1e-7 between
gcc/clang builds here), which is not a regression. Tune it with
`--tolerance <n>` (default `1e-6`). Real changes to the vendored Swiss
Ephemeris source show up as drift far beyond that, and are the signal to rerun
with `--update-reference` and review the diff.
