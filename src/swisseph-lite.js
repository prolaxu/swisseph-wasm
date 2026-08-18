/**
 * Swiss Ephemeris WebAssembly - lite variant.
 *
 * Same API as the default entry point, but backed by a build that omits the
 * ~2.0 MB of binary ephemeris files (sepl_18.se1, semo_18.se1, seas_18.se1).
 * Calculations therefore use the Moshier ephemeris (SEFLG_MOSEPH), which is
 * analytical and needs no data files.
 *
 * Precision trade-off: Moshier is accurate to roughly 0.1 arcsec for the
 * planets over 3000 BC - 3000 AD (Moon somewhat worse), versus ~0.001 arcsec
 * for the Swiss ephemeris files. Use the full entry point when you need that
 * last bit of accuracy or JPL-level agreement.
 *
 * Methods that take an ephemeris flag default it to SEFLG_MOSEPH, and add
 * SEFLG_MOSEPH when the flags you pass select no ephemeris at all. Explicitly
 * Passing SEFLG_SWIEPH explicitly is not an error: the C library silently
 * falls back to Moshier when the .se1 files are absent, so you get the same
 * numbers as the default with no warning. Do not rely on it to signal that
 * you are on the lite build.
 *
 * @license GPL-3.0-or-later
 */

import SwissEph, { SwissEphError } from './swisseph.js';

// Methods that take an ephemeris flag, and the index of that argument.
const EPHEMERIS_FLAG_ARG = {
  calc: 2,
  calc_ut: 2,
  calc_pctr: 3,
  fixstar: 2,
  fixstar_ut: 2,
  fixstar2: 2,
  fixstar2_ut: 2,
  nod_aps: 2,
  nod_aps_ut: 2,
  get_orbital_elements: 2,
  orbit_max_min_true_distance: 2,
  pheno: 2,
  pheno_ut: 2,
  get_ayanamsa_ex: 1,
  get_ayanamsa_ex_ut: 1,
};

// SEFLG_JPLEPH | SEFLG_SWIEPH | SEFLG_MOSEPH
const EPHEMERIS_MASK = 1 | 2 | 4;

class SwissEphLite extends SwissEph {
  static async loadWasmFactory() {
    const { default: factory } = await import('../wasm/swisseph-lite.js');
    return factory;
  }
}

for (const [name, index] of Object.entries(EPHEMERIS_FLAG_ARG)) {
  SwissEphLite.prototype[name] = function (...args) {
    const flags = args[index];
    args[index] = flags === undefined || flags === null
      ? this.SEFLG_MOSEPH
      : (flags & EPHEMERIS_MASK) === 0
        ? flags | this.SEFLG_MOSEPH
        : flags;
    return SwissEph.prototype[name].apply(this, args);
  };
}

export { SwissEphError };
export default SwissEphLite;
