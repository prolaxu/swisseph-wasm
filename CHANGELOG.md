# Changelog

All notable changes to this project are documented here. This project adheres
to [Semantic Versioning](https://semver.org/) (pre-1.0: breaking changes bump
the minor version).

## [0.2.0] - 2026-08-18

Robustness and packaging release: one error convention, no heap leaks, and a
lite build that drops the 2 MB ephemeris payload.

### Breaking changes

- **Every wrapper now throws `SwissEphError` when the C library reports an
  error.** Methods that previously returned `null` (and stashed the message
  for `getLastError()`) or `{ error: retFlag }` (`nod_aps`, `nod_aps_ut`) no
  longer do. The error carries `message` (`swe_<name>: <serr text>`), `method`
  (the C function name) and `code` (the C return flag). Replace null checks
  with `try`/`catch`:

  ```javascript
  import SwissEph, { SwissEphError } from 'swisseph-wasm';

  try {
    const star = swe.fixstar_ut('Aldebaran', jd, swe.SEFLG_SWIEPH);
  } catch (e) {
    if (e instanceof SwissEphError) console.error(e.method, e.code, e.message);
  }
  ```

- **`date_conversion`** throws `SwissEphError` on an invalid date instead of a
  bare `Error('Invalid date')`. (Its old `this.ERR` check was dead code, so
  invalid dates previously slipped through.)
- **`getLastError()` is deprecated.** Throw paths still set it, so it keeps
  working for this release; it will be removed in 0.3.0.
- **The npm tarball no longer contains `docs/` and `examples/`.** Both remain
  in the repository and on GitHub Pages.

### Added

- **Lite build**, exported as `swisseph-wasm/lite`. Same API, compiled without
  the binary ephemeris files (`sepl_18.se1`, `semo_18.se1`, `seas_18.se1`), so
  there is no `.data` file to fetch. Ephemeris flags default to
  `SEFLG_MOSEPH`; accuracy is ~0.1″ instead of ~0.001″. `sefstars.txt`,
  `seorbel.txt` and `seleapsec.txt` (~139 KB) are still bundled, so fixed
  stars and orbital elements work. `tools/compile.sh` builds both variants.
- **`initSwissEph({ wasmUrl, dataUrl, locateFile, wasmFactory })`** for
  bundlers that hash or relocate assets (e.g. Vite `?url` imports). Without
  options the previous resolution relative to `wasm/` is unchanged.
- `swisseph-wasm/wasm/*` is exported, so those URLs can be imported directly.
- Error-path tests (invalid date, unknown planet id, unknown fixed star,
  unknown body) and a lite-build smoke test (`npm run test:lite`, skipped when
  the lite artifact has not been built).

### Fixed

- **`npm run verify` crashed and destroyed the committed reference.** The C
  reference generator smashed its stack — `swe_pheno[_ut]` write 20 doubles
  into a 6-element array, and `swe_fixstar*`/`swe_gauquelin_sector` need
  `2 * SE_MAX_STNAME` bytes for the name they write back — so it aborted
  partway through while its output was being redirected straight onto
  `verification/reference.json`, truncating it. The generator now uses
  correctly sized buffers, and the script writes to a temp file that is
  validated before use; `reference.json` is only overwritten with
  `--update-reference`.
- **Fresh-vs-committed reference comparison is numeric, not a byte diff.** A
  different compiler or libm moves the last digits (~1e-7 here), which was
  reported as a failure. New `--tolerance` (default `1e-6`), `--skip-regen`
  (no C toolchain needed) and `--strict` (CI) flags; a missing or broken
  toolchain now warns and still runs the wasm comparison instead of aborting.

- **WASM heap leaks.** Every wrapper allocated its buffers by hand and freed
  them on each return path; a throwing `ccall` leaked them for the lifetime of
  the module. All ~62 buffer-using methods now go through a private
  `#withBuffers()` helper that frees in a `finally` block. `_free` is now
  called in exactly one place.

### Packaging

- `npm pack --dry-run`: 2.3 MB packed / 3.0 MB unpacked / 20 files →
  2.2 MB / 2.9 MB / 11 files (before the lite artifacts are added by the
  build; those add ~0.6 MB to the tarball and are never fetched by consumers
  of the full entry point).

## [0.1.0] - 2026-07-21

Correctness release. Every wrapped method is now verified against the genuine
Swiss Ephemeris C library (v2.10.03), in both Node and the browser.

### Breaking changes

Several wrappers had incorrect argument marshaling and returned garbage or
corrupted memory; fixing them changed their signatures and/or return shapes:

- **`refrac(inalt, atpress, attemp, calcFlag)`** — now matches the C signature
  and returns the converted altitude (a number). Previously took 6 args and
  read an unwritten buffer.
- **`refrac_extended(inalt, geoalt, atpress, attemp, lapseRate, calcFlag)`** —
  returns `{ converted, trueAltitude, apparentAltitude, refraction, dip }`.
- **`nod_aps` / `nod_aps_ut`** — return
  `{ ascending, descending, perihelion, aphelion, asc_node, desc_node,
  peri_lon, aphe_lon }`. Previously allocated too-small buffers (heap overflow)
  and mislabeled the descending node as "apsides".
- **`rise_trans` / `rise_trans_true_hor`** — signature is now
  `(jd, planet, starname, epheFlag, rsmi, geopos, atpress, attemp[, horhgt])`
  and returns `tret` (event time in `tret[0]`).
- **All `sol_eclipse_*`, `lun_eclipse_*`, `lun_occult_*`** — take a `geopos`
  array `[lon, lat, alt]` (not separate scalars) and return structured objects:
  `where` → `{ retFlag, geopos, attr }`, `how` → `{ retFlag, attr }`,
  `when`/`when_glob` → `{ retFlag, tret }`, `when_loc` → `{ retFlag, tret, attr }`.

### Fixed

- **Use-after-free** in ~20 methods that returned a live `Float64Array` view
  into just-freed WASM heap; all now copy out with `.slice()` before freeing.
- **`get_orbital_elements`, `orbit_max_min_true_distance`, `heliacal_ut`,
  `heliacal_pheno_ut`, `vis_limit_mag`** were stubs returning the raw int
  status; they now allocate proper I/O buffers and return real data.
- Removed a duplicate `houses()` definition that passed the house system as a
  string instead of a char code.
- Methods called before `initSwissEph()` now throw a clear error instead of a
  cryptic "Cannot read properties of undefined".
- `fixstar*` now use a full-size (256-byte) star buffer — the C library writes
  the resolved catalog name back into it, which could overflow the previous
  `name.length + 1` allocation.

### Added

- 20 previously-unwrapped public functions: the crossing family
  (`solcross`, `mooncross`, `mooncross_node`, `helio_cross` and `_ut`
  variants), `deltat_ex`, `house_name`, `gauquelin_sector`, `calc_pctr`,
  `lat_to_lmt`, `lmt_to_lat`, `get_library_path`, `get_current_file_data`,
  `set_delta_t_userdef`, `set_interpolate_nut`, `get_astro_models`,
  `set_astro_models`.
- Complete TypeScript definitions: all 104 wrapped methods are typed
  (`tsc --strict` clean).
- **`getLastError()`** — returns the C library's error message after a call
  that returned `null` / `{ error }` (wired into `calc*`, `fixstar*`,
  `nod_aps*`, `helio_cross*`).
- JS-vs-C verification harness (`npm run verify`), an in-browser harness
  (`verification/browser_test.html`), and a GitHub Actions CI workflow that
  runs the tests, type-check, verification, and a from-source WASM rebuild.
- Interactive **playground** (`examples/playground.html`) with a Monaco code
  editor and autocomplete driven by the package's own type definitions.
- `llms.txt` — a concise, LLM-oriented API reference.

### Changed

- Swiss Ephemeris C source is now **vendored** (no git submodule); builds are
  offline and deterministic. `init-dependency.sh` verifies the toolchain;
  `update-swisseph.sh` bumps the vendored version.
- Data bundle trimmed from ~12 MB to ~2.1 MB by no longer preloading the unused
  `seasnam.txt` asteroid-name file.
