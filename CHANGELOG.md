# Changelog

All notable changes to this project are documented here. This project adheres
to [Semantic Versioning](https://semver.org/) (pre-1.0: breaking changes bump
the minor version).

## [0.1.0]

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

### Added

- 20 previously-unwrapped public functions: the crossing family
  (`solcross`, `mooncross`, `mooncross_node`, `helio_cross` and `_ut`
  variants), `deltat_ex`, `house_name`, `gauquelin_sector`, `calc_pctr`,
  `lat_to_lmt`, `lmt_to_lat`, `get_library_path`, `get_current_file_data`,
  `set_delta_t_userdef`, `set_interpolate_nut`, `get_astro_models`,
  `set_astro_models`.
- Complete TypeScript definitions: all 104 wrapped methods are typed
  (`tsc --strict` clean).
- JS-vs-C verification harness (`npm run verify`) and an in-browser harness
  (`verification/browser_test.html`).

### Changed

- Swiss Ephemeris C source is now **vendored** (no git submodule); builds are
  offline and deterministic. `init-dependency.sh` verifies the toolchain;
  `update-swisseph.sh` bumps the vendored version.
- Data bundle trimmed from ~12 MB to ~2.1 MB by no longer preloading the unused
  `seasnam.txt` asteroid-name file.
