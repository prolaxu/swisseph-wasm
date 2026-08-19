/**
 * Swiss Ephemeris WebAssembly Library
 *
 * A high-precision astronomical calculation library for JavaScript,
 * compiled from the renowned Swiss Ephemeris C library to WebAssembly.
 *
 * Features:
 * - Planetary positions and velocities
 * - House calculations
 * - Time conversions (Julian Day, sidereal time)
 * - Coordinate transformations
 * - Eclipse and occultation calculations
 * - Fixed star positions
 * - And much more...
 *
 * @author prolaxu
 * @version 0.2.0
 * @license GPL-3.0-or-later
 *
 * IMPORTANT LICENSING INFORMATION:
 *
 * This library incorporates the Swiss Ephemeris, which is subject to dual licensing:
 *
 * 1. GNU General Public License (GPL) v2 or later
 *    - Free for open source projects
 *    - Requires derivative works to also be GPL licensed
 *
 * 2. Commercial License (from Astrodienst AG)
 *    - Required for proprietary/commercial applications
 *    - Contact: swisseph@astro.ch
 *    - Website: https://www.astro.com/swisseph/
 *
 * For commercial use, you may need to obtain a commercial license for Swiss Ephemeris
 * from Astrodienst AG. This WebAssembly wrapper is provided under GPL v3.
 *
 * The author is not affiliated with Astrodienst AG and cannot provide commercial
 * licenses for Swiss Ephemeris.
 */

/**
 * Error thrown by every wrapper when the underlying C function reports a
 * failure. `method` is the C function name (e.g. 'swe_calc_ut') and `code` is
 * the return flag from that function when one was available.
 */
export class SwissEphError extends Error {
  constructor(message, { method, code } = {}) {
    super(message);
    this.name = 'SwissEphError';
    this.method = method;
    this.code = code;
  }
}

class SwissEph {
  // Backing store for the Emscripten module; populated by initSwissEph().
  #module;

  // Last error string written by the C library (via its serr buffer). Kept in
  // sync on every throw path for the deprecated getLastError() accessor.
  #lastError = '';

  // #region Constants
  SE_AUNIT_TO_KM = 149597870.7;
  SE_AUNIT_TO_LIGHTYEAR = 1.5812507409819728411242766893179e-5; // = 1.0 / 63241.07708427
  SE_AUNIT_TO_PARSEC = 4.8481368110952742659276431719005e-6; // = 1.0 / 206264.8062471

  SE_MAX_STNAME = 256;

  SE_SIDBITS = 256;
  SE_SIDBIT_ECL_T0 = 256;
  SE_SIDBIT_SSY_PLANE = 512;
  SE_SIDBIT_USER_UT = 1024;

  SE_BIT_DISC_CENTER = 256;
  SE_BIT_DISC_BOTTOM = 8192;
  SE_BIT_GEOCTR_NO_ECL_LAT = 128;
  SE_BIT_NO_REFRACTION = 512;
  SE_BIT_CIVIL_TWILIGHT = 1024;
  SE_BIT_NAUTIC_TWILIGHT = 2048;
  SE_BIT_ASTRO_TWILIGHT = 4096;
  SE_BIT_FIXED_DISC_SIZE = 16384; // = 16 * 1024

  TJD_INVALID = 99999999.0;
  SIMULATE_VICTORVB = 1;

  SE_PHOTOPIC_FLAG = 0;
  SE_SCOTOPIC_FLAG = 1;
  SE_MIXEDOPIC_FLAG = 2;

  ephemeris= {
      swisseph: 2, // = SEFLG_SWIEPH
      moshier: 4, // = SEFLG_MOSEPH
      de200: "de200.eph",
      de405: "de405.eph",
      de406: "de406.eph",
      de406e: "de406e.eph",
      de414: "de414.eph",
      de421: "de421.eph",
      de422: "de422.eph",
      de430: "de430.eph",
      de431: "de431.eph",
  };

  // Calendar types
  SE_JUL_CAL = 0;
  SE_GREG_CAL = 1;

  // Planet numbers
  SE_SUN = 0;
  SE_MOON = 1;
  SE_MERCURY = 2;
  SE_VENUS = 3;
  SE_EARTH = 14;
  SE_MARS = 4;
  SE_JUPITER = 5;
  SE_SATURN = 6;
  SE_URANUS = 7;
  SE_NEPTUNE = 8;
  SE_PLUTO = 9;

  // Moon nodes
  SE_MEAN_NODE = 10;
  SE_TRUE_NODE = 11;
  SE_MEAN_APOG = 12;
  SE_OSCU_APOG = 13;
  SE_INTP_APOG = 21;
  SE_INTP_PERG = 22;

  // Base asteroids
  SE_CHIRON = 15;
  SE_PHOLUS = 16;
  SE_CERES = 17;
  SE_PALLAS = 18;
  SE_JUNO = 19;
  SE_VESTA = 20;

  SE_NPLANETS = 23;
  SE_AST_OFFSET = 10000;
  SE_VARUNA = 30000; // = SE_AST_OFFSET + 20000
  SE_FICT_OFFSET = 40;
  SE_FICT_OFFSET_1 = 39;
  SE_FICT_MAX = 999;
  SE_NFICT_ELEM = 15;
  SE_COMET_OFFSET = 1000;
  SE_NALL_NAT_POINTS = 38; // = SE_NPLANETS + SE_NFICT_ELEM

  // Hamburger or Uranian "planets"
  SE_CUPIDO = 40;
  SE_HADES = 41;
  SE_ZEUS = 42;
  SE_KRONOS = 43;
  SE_APOLLON = 44;
  SE_ADMETOS = 45;
  SE_VULKANUS = 46;
  SE_POSEIDON = 47;

  // Other fictitious bodies
  SE_ISIS = 48;
  SE_NIBIRU = 49;
  SE_HARRINGTON = 50;
  SE_NEPTUNE_LEVERRIER = 51;
  SE_NEPTUNE_ADAMS = 52;
  SE_PLUTO_LOWELL = 53;
  SE_PLUTO_PICKERING = 54;
  SE_VULCAN = 55;
  SE_WHITE_MOON = 56;
  SE_PROSERPINA = 57;
  SE_WALDEMATH = 58;

  SE_FIXSTAR = -10;
  SE_ASC = 0;
  SE_MC = 1;
  SE_ARMC = 2;
  SE_VERTEX = 3;
  SE_EQUASC = 4;
  SE_COASC1 = 5;
  SE_COASC2 = 6;
  SE_POLASC = 7;
  SE_NASCMC = 8;

  // Flag bits for "iflag" parameter of the "swe_calc" functions
  SEFLG_JPLEPH = 1;
  SEFLG_SWIEPH = 2;
  SEFLG_MOSEPH = 4;
  SEFLG_HELCTR = 8;
  SEFLG_TRUEPOS = 16;
  SEFLG_J2000 = 32;
  SEFLG_NONUT = 64;
  SEFLG_SPEED3 = 128;
  SEFLG_SPEED = 256;
  SEFLG_NOGDEFL = 512;
  SEFLG_NOABERR = 1024;
  SEFLG_ASTROMETRIC = 1536; // = SEFLG_NOABERR | SEFLG_NOGDEFL
  SEFLG_EQUATORIAL = 2048; // = 2  *1024
  SEFLG_XYZ = 4096; // = 4 * 1024
  SEFLG_RADIANS = 8192; // = 8 * 1024
  SEFLG_BARYCTR = 16384; // = 16 * 1024
  SEFLG_TOPOCTR = 32768; // = 32 * 1024
  SEFLG_ORBEL_AA = 32768; // = SEFLG_TOPOCTR
  SEFLG_SIDEREAL = 65536; // = 64 * 1024
  SEFLG_ICRS = 131072; // = 128 * 1024
  SEFLG_DPSIDEPS_1980 = 262144; // = 256*1024
  SEFLG_JPLHOR = 262144; // = SEFLG_DPSIDEPS_1980
  SEFLG_JPLHOR_APPROX = 524288; // = 512*1024
  SEFLG_DEFAULTEPH = 2; // = SEFLG_SWIEPH

  // Sidereal modes
  SE_SIDM_FAGAN_BRADLEY = 0;
  SE_SIDM_LAHIRI = 1;
  SE_SIDM_DELUCE = 2;
  SE_SIDM_RAMAN = 3;
  SE_SIDM_USHASHASHI = 4;
  SE_SIDM_KRISHNAMURTI = 5;
  SE_SIDM_DJWHAL_KHUL = 6;
  SE_SIDM_YUKTESHWAR = 7;
  SE_SIDM_JN_BHASIN = 8;
  SE_SIDM_BABYL_KUGLER1 = 9;
  SE_SIDM_BABYL_KUGLER2 = 10;
  SE_SIDM_BABYL_KUGLER3 = 11;
  SE_SIDM_BABYL_HUBER = 12;
  SE_SIDM_BABYL_ETPSC = 13;
  SE_SIDM_ALDEBARAN_15TAU = 14;
  SE_SIDM_HIPPARCHOS = 15;
  SE_SIDM_SASSANIAN = 16;
  SE_SIDM_GALCENT_0SAG = 17;
  SE_SIDM_J2000 = 18;
  SE_SIDM_J1900 = 19;
  SE_SIDM_B1950 = 20;
  SE_SIDM_SURYASIDDHANTA = 21;
  SE_SIDM_SURYASIDDHANTA_MSUN = 22;
  SE_SIDM_ARYABHATA = 23;
  SE_SIDM_ARYABHATA_MSUN = 24;
  SE_SIDM_SS_REVATI = 25;
  SE_SIDM_SS_CITRA = 26;
  SE_SIDM_TRUE_CITRA = 27;
  SE_SIDM_TRUE_REVATI = 28;
  SE_SIDM_TRUE_PUSHYA = 29;
  SE_SIDM_GALCENT_RGILBRAND = 30;
  SE_SIDM_GALEQU_IAU1958 = 31;
  SE_SIDM_GALEQU_TRUE = 32;
  SE_SIDM_GALEQU_MULA = 33;
  SE_SIDM_GALALIGN_MARDYKS = 34;
  SE_SIDM_TRUE_MULA = 35;
  SE_SIDM_GALCENT_MULA_WILHELM = 36;
  SE_SIDM_ARYABHATA_522 = 37;
  SE_SIDM_BABYL_BRITTON = 38;
  SE_SIDM_TRUE_SHEORAN = 39;
  SE_SIDM_GALCENT_COCHRANE = 40;
  SE_SIDM_GALEQU_FIORENZA = 41;
  SE_SIDM_VALENS_MOON = 42;
  SE_SIDM_USER = 255;
  SE_NSIDM_PREDEF = 43;

  // Used for "swe_nod_aps" function
  SE_NODBIT_MEAN = 1;
  SE_NODBIT_OSCU = 2;
  SE_NODBIT_OSCU_BAR = 4;
  SE_NODBIT_FOPOINT = 256;

  // Used for eclipse computations
  SE_ECL_NUT = -1;
  SE_ECL_CENTRAL = 1;
  SE_ECL_NONCENTRAL = 2;
  SE_ECL_TOTAL = 4;
  SE_ECL_ANNULAR = 8;
  SE_ECL_PARTIAL = 16;
  SE_ECL_ANNULAR_TOTAL = 32;
  SE_ECL_PENUMBRAL = 64;
  SE_ECL_ALLTYPES_SOLAR = 63; // = SE_ECL_CENTRAL | SE_ECL_NONCENTRAL | SE_ECL_TOTAL | SE_ECL_ANNULAR | SE_ECL_PARTIAL | SE_ECL_ANNULAR_TOTAL
  SE_ECL_ALLTYPES_LUNAR = 84; // = SE_ECL_TOTAL | SE_ECL_PARTIAL | SE_ECL_PENUMBRAL
  SE_ECL_VISIBLE = 128;
  SE_ECL_MAX_VISIBLE = 256;
  SE_ECL_1ST_VISIBLE = 512;
  SE_ECL_PARTBEG_VISIBLE = 512;
  SE_ECL_2ND_VISIBLE = 1024;
  SE_ECL_TOTBEG_VISIBLE = 1024;
  SE_ECL_3RD_VISIBLE = 2048;
  SE_ECL_TOTEND_VISIBLE = 2048;
  SE_ECL_4TH_VISIBLE = 4096;
  SE_ECL_PARTEND_VISIBLE = 4096;
  SE_ECL_PENUMBBEG_VISIBLE = 8192;
  SE_ECL_PENUMBEND_VISIBLE = 16384;
  SE_ECL_OCC_BEG_DAYLIGHT = 8192;
  SE_ECL_OCC_END_DAYLIGHT = 16384;
  SE_ECL_ONE_TRY = 32768; // = 32 * 1024

  // Used for "swe_rise_transit"
  SE_CALC_RISE = 1;
  SE_CALC_SET = 2;
  SE_CALC_MTRANSIT = 4;
  SE_CALC_ITRANSIT = 8;

  // Used for "swe_azalt" and "swe_azalt_rev" functions
  SE_ECL2HOR = 0;
  SE_EQU2HOR = 1;
  SE_HOR2ECL = 0;
  SE_HOR2EQU = 1;

  // Used for "swe_refrac" function
  SE_TRUE_TO_APP = 0;
  SE_APP_TO_TRUE = 1;

  // Rounding flags for "swe_split_deg" function
  SE_SPLIT_DEG_ROUND_SEC = 1;
  SE_SPLIT_DEG_ROUND_MIN = 2;
  SE_SPLIT_DEG_ROUND_DEG = 4;
  SE_SPLIT_DEG_ZODIACAL = 8;
  SE_SPLIT_DEG_KEEP_SIGN = 16;
  SE_SPLIT_DEG_KEEP_DEG= 32;
  SE_SPLIT_DEG_NAKSHATRA = 1024;

  // Used for heliacal functions
  SE_HELIACAL_RISING = 1;
  SE_HELIACAL_SETTING = 2;
  SE_MORNING_FIRST = 1; // = SE_HELIACAL_RISING
  SE_EVENING_LAST = 2; // = SE_HELIACAL_SETTING
  SE_EVENING_FIRST = 3;
  SE_MORNING_LAST = 4;
  SE_ACRONYCHAL_RISING = 5;
  SE_ACRONYCHAL_SETTING = 6;
  SE_COSMICAL_SETTING = 6; // = SE_ACRONYCHAL_SETTING

  SE_HELFLAG_LONG_SEARCH = 128;
  SE_HELFLAG_HIGH_PRECISION = 256;
  SE_HELFLAG_OPTICAL_PARAMS = 512;
  SE_HELFLAG_NO_DETAILS = 1024;
  SE_HELFLAG_SEARCH_1_PERIOD = 2048; // = 1 << 11
  SE_HELFLAG_VISLIM_DARK = 4096; // = 1 << 12
  SE_HELFLAG_VISLIM_NOMOON = 8192; // = 1 << 13
  SE_HELFLAG_VISLIM_PHOTOPIC = 16384; // = 1 << 14
  SE_HELFLAG_AVKIND_VR = 32768; // = 1 << 15
  SE_HELFLAG_AVKIND_PTO = 65536; // = 1 << 16
  SE_HELFLAG_AVKIND_MIN7 = 131072; // = 1 << 17
  SE_HELFLAG_AVKIND_MIN9 = 262144; // = 1 << 18
  SE_HELFLAG_AVKIND = 491520; // = SE_HELFLAG_AVKIND_VR | SE_HELFLAG_AVKIND_PTO | SE_HELFLAG_AVKIND_MIN7 | SE_HELFLAG_AVKIND_MIN9
  // #endregion Constants

  // Guarded accessor for the underlying Emscripten module. Every public
  // method reads the module through this getter, so calling any of them
  // before initSwissEph() throws a clear error instead of a cryptic
  // "Cannot read properties of undefined (reading 'ccall')".
  get SweModule() {
    if (!this.#module) {
      throw new Error('SwissEph not initialized. Call await initSwissEph() first.');
    }
    return this.#module;
  }

  // The most recent error message from the C library, or '' if the last
  // serr-returning call succeeded.
  // @deprecated since 0.2.0 - failures now throw SwissEphError, whose message
  // carries the same text. Kept for one release.
  getLastError() {
    return this.#lastError;
  }

  // Read the C serr buffer into #lastError and return it. Called by #error and
  // by the few functions that report failure through serr alone.
  #captureError(serrPtr) {
    this.#lastError = serrPtr ? this.#readString(serrPtr) : '';
    return this.#lastError;
  }

  // Allocate a heap buffer and copy a JS array of doubles into it. Returns the
  // pointer; caller is responsible for _free(). Only called by #withBuffers.
  #allocDoubles(values) {
    const ptr = this.SweModule._malloc(values.length * 8);
    const base = ptr >> 3;
    for (let i = 0; i < values.length; i++) {
      this.SweModule.HEAPF64[base + i] = values[i];
    }
    return ptr;
  }

  // Allocate the buffers described by spec, run fn with a { name: ptr } map,
  // and free every buffer on the way out — including when the C call, a read
  // or fn itself throws. This is the only place wrappers get heap memory from.
  // spec: { name: byteLength } or { name: [doubles to copy in] }.
  #withBuffers(spec, fn) {
    const ptrs = {};
    try {
      for (const [name, init] of Object.entries(spec)) {
        ptrs[name] = typeof init === 'number'
          ? this.SweModule._malloc(init)
          : this.#allocDoubles(init);
      }
      return fn(ptrs);
    } finally {
      for (const ptr of Object.values(ptrs)) this.SweModule._free(ptr);
    }
  }

  // Copy n doubles out of the WASM heap into a detached Float64Array.
  #readDoubles(ptr, n) {
    return new Float64Array(this.SweModule.HEAPF64.buffer, ptr, n).slice();
  }

  #readDouble(ptr) {
    return this.SweModule.HEAPF64[ptr >> 3];
  }

  #readInt(ptr) {
    return new Int32Array(this.SweModule.HEAPF64.buffer)[ptr >> 2];
  }

  #readString(ptr) {
    return this.SweModule.UTF8ToString(ptr);
  }

  // Build the SwissEphError for a failed C call, reading its serr buffer.
  // Also records the message in #lastError for the deprecated getLastError().
  #error(fnName, code, serrPtr) {
    const detail = serrPtr ? this.#captureError(serrPtr) : '';
    const message = detail
      ? `${fnName}: ${detail}`
      : `${fnName} failed (code ${code})`;
    return new SwissEphError(message, { method: fnName, code });
  }

  // Resolve .wasm/.data next to this file's ../wasm directory. Used when the
  // caller passes no wasmUrl/dataUrl/locateFile override.
  async #defaultLocateFile() {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const { fileURLToPath } = await import('url');
        const { dirname, join } = await import('path');
        const dir = dirname(fileURLToPath(import.meta.url));
        return (path, prefix) =>
          path.endsWith('.data') || path.endsWith('.wasm')
            ? join(dir, '../wasm', path)
            : prefix + path;
      } catch (e) {
        console.warn('Failed to configure path resolution for SwissEph WASM:', e);
        return (path, prefix) => prefix + path;
      }
    }
    // Browser environment
    return (path, prefix) =>
      path.endsWith('.data') || path.endsWith('.wasm')
        ? new URL('../wasm/' + path, import.meta.url).href
        : prefix + path;
  }

  // Loads the Emscripten factory for this variant. Subclasses (see
  // swisseph-lite.js) override it to load a different build. The import is
  // dynamic so bundling the lite entry never pulls in the full glue code.
  static async loadWasmFactory() {
    const { default: factory } = await import('../wasm/swisseph.js');
    return factory;
  }

  /**
   * Initializes the Swiss Ephemeris WebAssembly module.
   *
   * @param {object} [options]
   * @param {string} [options.wasmUrl]  URL/path of the .wasm file. Use with
   *   bundlers that hash assets, e.g. Vite: `import url from
   *   'swisseph-wasm/wasm/swisseph.wasm?url'`.
   * @param {string} [options.dataUrl]  URL/path of the .data file.
   * @param {(path: string, prefix: string) => string|undefined} [options.locateFile]
   *   Full control over asset resolution. Returning undefined falls through to
   *   wasmUrl/dataUrl and then to the default resolution.
   * @param {Function} [options.wasmFactory]  Pre-loaded Emscripten factory.
   */
  async initSwissEph(options = {}) {
    const { wasmUrl, dataUrl, locateFile, wasmFactory } = options;
    const defaultLocate = await this.#defaultLocateFile();

    const moduleConfig = {
      locateFile: (path, prefix) => {
        if (locateFile) {
          const resolved = locateFile(path, prefix);
          if (resolved !== undefined && resolved !== null) return resolved;
        }
        if (wasmUrl && path.endsWith('.wasm')) return wasmUrl;
        if (dataUrl && path.endsWith('.data')) return dataUrl;
        return defaultLocate(path, prefix);
      },
    };

    const factory = wasmFactory || (await this.constructor.loadWasmFactory());
    this.#module = await factory(moduleConfig);

    // Ensure HEAP32 is available
    if (!this.SweModule.HEAP32) {
      this.SweModule.HEAP32 = new Int32Array(this.SweModule.HEAPF64.buffer);
    }

    this.set_ephe_path('sweph');
  }

  set_ephe_path(path) {
    return this.SweModule.ccall('swe_set_ephe_path', 'string', ['string'], [path]);
  }

  house_pos(armc, geoLat, eps, hsys, lon, lat) {
    return this.#withBuffers({ xpinPtr: [lon, lat], serr: 256 }, ({ xpinPtr, serr }) => {
      const result = this.SweModule.ccall(
        'swe_house_pos',
        'number',
        ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [armc, geoLat, eps, hsys.charCodeAt(0), xpinPtr, serr]
      );
      // swe_house_pos has no error flag and uses serr for warnings too (e.g.
      // "using simplified algorithm"), so record it rather than throwing.
      this.#captureError(serr);
      return result;
    });
  }

  julday(year, month, day, hour) {
    return this.SweModule.ccall('swe_julday', 'number', ['number', 'number', 'number', 'number', 'number'], [year, month, day, hour, 1]);
  }

  date_conversion(year, month, day, hour, calendar) {
    return this.#withBuffers({ tjdPtr: 8 }, ({ tjdPtr }) => {
      // calendar is a char, pass char code
      const result = this.SweModule.ccall(
        'swe_date_conversion',
        'number',
        ['number', 'number', 'number', 'number', 'number', 'pointer'],
        [year, month, day, hour, calendar.charCodeAt(0), tjdPtr]
      );
      if (result < 0) {
        this.#lastError = 'invalid date';
        throw new SwissEphError(
          `swe_date_conversion: invalid date ${year}-${month}-${day} ${hour}`,
          { method: 'swe_date_conversion', code: result }
        );
      }
      this.#lastError = '';
      return this.#readDouble(tjdPtr);
    });
  }

  revjul(julianDay, gregflag) {
    return this.#withBuffers({
      yearPtr: 4,
      monthPtr: 4,
      dayPtr: 4,
      hourPtr: 8,
    }, ({ yearPtr, monthPtr, dayPtr, hourPtr }) => {
      this.SweModule.ccall(
        'swe_revjul',
        'void',
        ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer'],
        [julianDay, gregflag, yearPtr, monthPtr, dayPtr, hourPtr]
      );

      const year = this.#readInt(yearPtr);
      const month = this.#readInt(monthPtr);
      const day = this.#readInt(dayPtr);
      const hour = this.#readDouble(hourPtr);

      return { year, month, day, hour };
    });
  }

  calc_ut(julianDay, body, flags) {
    return this.#withBuffers({
      resultPtr: 6 * Float64Array.BYTES_PER_ELEMENT,
      errorBuffer: 256,
    }, ({ resultPtr, errorBuffer }) => {
      const retFlag = this.SweModule.ccall(
        'swe_calc_ut',
        'number',
        ['number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, body, flags, resultPtr, errorBuffer]
      );

      if (retFlag < 0) throw this.#error('swe_calc_ut', retFlag, errorBuffer);
      this.#lastError = '';

      return this.#readDoubles(resultPtr, 6);
    });
  }

  deltat(julianDay) {
    return this.SweModule.ccall('swe_deltat', 'number', ['number'], [julianDay]);
  }

  time_equ(julianDay) {
    return this.#withBuffers({ tePtr: 8, serr: 256 }, ({ tePtr, serr }) => {
      const retFlag = this.SweModule.ccall('swe_time_equ', 'number', ['number', 'pointer', 'pointer'], [julianDay, tePtr, serr]);
      if (retFlag < 0) throw this.#error('swe_time_equ', retFlag, serr);
      this.#lastError = '';
      return this.#readDouble(tePtr);
    });
  }

  sidtime0(julianDay, eps, nut) {
    return this.SweModule.ccall('swe_sidtime0', 'number', ['number', 'number', 'number'], [julianDay, eps, nut]);
  }

  sidtime(julianDay) {
    return this.SweModule.ccall('swe_sidtime', 'number', ['number'], [julianDay]);
  }

  cotrans(xpo, eps) {
    return this.#withBuffers({ xpoPtr: xpo, xpnPtr: 3 * 8 }, ({ xpoPtr, xpnPtr }) => {
      this.SweModule.ccall('swe_cotrans', 'void', ['number', 'number', 'number'], [xpoPtr, xpnPtr, eps]);
      return Array.from(this.#readDoubles(xpnPtr, 3));
    });
  }

  cotrans_sp(xpo, eps) {
    return this.#withBuffers({ xpoPtr: xpo, xpnPtr: 6 * 8 }, ({ xpoPtr, xpnPtr }) => {
      this.SweModule.ccall('swe_cotrans_sp', 'void', ['number', 'number', 'number'], [xpoPtr, xpnPtr, eps]);
      return Array.from(this.#readDoubles(xpnPtr, 6));
    });
  }

  get_tid_acc() {
    return this.SweModule.ccall('swe_get_tid_acc', 'number', [], []);
  }

  set_tid_acc(acceleration) {
    this.SweModule.ccall('swe_set_tid_acc', 'void', ['number'], [acceleration]);
  }

  degnorm(x) {
    return this.SweModule.ccall('swe_degnorm', 'number', ['number'], [x]);
  }

  radnorm(angle) {
    return this.SweModule.ccall('swe_radnorm', 'number', ['number'], [angle]);
  }

  rad_midp(x1, x2) {
    return this.SweModule.ccall('swe_rad_midp', 'number', ['number', 'number'], [x1, x2]);
  }

  deg_midp(x1, x2) {
    return this.SweModule.ccall('swe_deg_midp', 'number', ['number', 'number'], [x1, x2]);
  }

  split_deg(ddeg, roundFlag) {
    return this.#withBuffers({
      degPtr: 4,
      minPtr: 4,
      secPtr: 4,
      dsecfrPtr: 8,
      isgnPtr: 4,
    }, ({ degPtr, minPtr, secPtr, dsecfrPtr, isgnPtr }) => {
      this.SweModule.ccall(
        'swe_split_deg',
        'void',
        ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
        [ddeg, roundFlag, degPtr, minPtr, secPtr, dsecfrPtr, isgnPtr]
      );

      const result = {
        degree: this.#readInt(degPtr),
        min: this.#readInt(minPtr),
        second: this.#readInt(secPtr),
        fraction: this.#readDouble(dsecfrPtr),
        sign: this.#readInt(isgnPtr),
      };

      return result;
    });
  }

  csnorm(p) {
    return this.SweModule.ccall('swe_csnorm', 'number', ['number'], [p]);
  }

  difcsn(p1, p2) {
    return this.SweModule.ccall('swe_difcsn', 'number', ['number', 'number'], [p1, p2]);
  }

  difdegn(p1, p2) {
    return this.SweModule.ccall('swe_difdegn', 'number', ['number', 'number'], [p1, p2]);
  }

  difcs2n(p1, p2) {
    return this.SweModule.ccall('swe_difcs2n', 'number', ['number', 'number'], [p1, p2]);
  }

  difdeg2n(p1, p2) {
    return this.SweModule.ccall('swe_difdeg2n', 'number', ['number', 'number'], [p1, p2]);
  }

  difrad2n(p1, p2) {
    return this.SweModule.ccall('swe_difrad2n', 'number', ['number', 'number'], [p1, p2]);
  }

  csroundsec(x) {
    return this.SweModule.ccall('swe_csroundsec', 'number', ['number'], [x]);
  }

  d2l(x) {
    return this.SweModule.ccall('swe_d2l', 'number', ['number'], [x]);
  }

  day_of_week(julianDay) {
    return this.SweModule.ccall('swe_day_of_week', 'number', ['number'], [julianDay]);
  }

  cs2timestr(t, sep, suppressZero) {
    return this.#withBuffers({ bufPtr: 256 }, ({ bufPtr }) => {
      this.SweModule.ccall('swe_cs2timestr', 'void', ['number', 'number', 'number', 'pointer'], [t, sep.charCodeAt(0), suppressZero ? 1 : 0, bufPtr]);
      const result = this.#readString(bufPtr);
      return result;
    });
  }

  cs2lonlatstr(t, pChar, mChar) {
    return this.#withBuffers({ bufPtr: 256 }, ({ bufPtr }) => {
      this.SweModule.ccall('swe_cs2lonlatstr', 'void', ['number', 'number', 'number', 'pointer'], [t, pChar.charCodeAt(0), mChar.charCodeAt(0), bufPtr]);
      const result = this.#readString(bufPtr);
      return result;
    });
  }

  cs2degstr(t) {
    return this.#withBuffers({ bufPtr: 256 }, ({ bufPtr }) => {
      this.SweModule.ccall('swe_cs2degstr', 'void', ['number', 'pointer'], [t, bufPtr]);
      const result = this.#readString(bufPtr);
      return result;
    });
  }

  utc_to_jd(year, month, day, hour, minute, second, gregflag) {
    return this.#withBuffers({ resultPtr: 2 * Float64Array.BYTES_PER_ELEMENT }, ({ resultPtr }) => {
      this.SweModule.ccall(
        'swe_utc_to_jd',
        'void',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'pointer'],
        [year, month, day, hour, minute, second, gregflag, resultPtr]
      );
      const result = this.#readDoubles(resultPtr, 2);
      return {
        julianDayET: result[0],
        julianDayUT: result[1],
      };
    });
  }

  jdet_to_utc(julianDay, gregflag) {
    return this.#withBuffers({
      yearPtr: 4,
      monthPtr: 4,
      dayPtr: 4,
      hourPtr: 4,
      minPtr: 4,
      secPtr: 8,
    }, ({ yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr }) => {
      this.SweModule.ccall(
        'swe_jdet_to_utc',
        'void',
        ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
        [julianDay, gregflag, yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr]
      );

      const result = {
        year: this.#readInt(yearPtr),
        month: this.#readInt(monthPtr),
        day: this.#readInt(dayPtr),
        hour: this.#readInt(hourPtr),
        minute: this.#readInt(minPtr),
        second: this.#readDouble(secPtr),
      };

      return result;
    });
  }

  jdut1_to_utc(julianDay, gregflag) {
    return this.#withBuffers({
      yearPtr: 4,
      monthPtr: 4,
      dayPtr: 4,
      hourPtr: 4,
      minPtr: 4,
      secPtr: 8,
    }, ({ yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr }) => {
      this.SweModule.ccall(
        'swe_jdut1_to_utc',
        'void',
        ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
        [julianDay, gregflag, yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr]
      );

      const result = {
        year: this.#readInt(yearPtr),
        month: this.#readInt(monthPtr),
        day: this.#readInt(dayPtr),
        hour: this.#readInt(hourPtr),
        minute: this.#readInt(minPtr),
        second: this.#readDouble(secPtr),
      };

      return result;
    });
  }

  utc_time_zone(year, month, day, hour, minute, second, timezone) {
    return this.#withBuffers({
      yearPtr: 4,
      monthPtr: 4,
      dayPtr: 4,
      hourPtr: 4,
      minPtr: 4,
      secPtr: 8,
    }, ({ yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr }) => {
      this.SweModule.ccall(
        'swe_utc_time_zone',
        'void',
        ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
        [year, month, day, hour, minute, second, timezone, yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr]
      );

      const result = {
        year: this.#readInt(yearPtr),
        month: this.#readInt(monthPtr),
        day: this.#readInt(dayPtr),
        hour: this.#readInt(hourPtr),
        minute: this.#readInt(minPtr),
        second: this.#readDouble(secPtr),
      };

      return result;
    });
  }

  version() {
    return this.#withBuffers({ bufPtr: 256 }, ({ bufPtr }) => {
      this.SweModule.ccall('swe_version', 'void', ['pointer'], [bufPtr]);
      const version = this.#readString(bufPtr);
      return version;
    });
  }

  calc(julianDay, body, flags) {
    return this.#withBuffers({
      resultPtr: 6 * Float64Array.BYTES_PER_ELEMENT,
      errorBuffer: 256,
    }, ({ resultPtr, errorBuffer }) => {
      const retFlag = this.SweModule.ccall(
        'swe_calc',
        'number',
        ['number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, body, flags, resultPtr, errorBuffer]
      );
      if (retFlag < 0) throw this.#error('swe_calc', retFlag, errorBuffer);
      this.#lastError = '';
      const results = this.#readDoubles(resultPtr, 6);
      return {
        longitude: results[0],
        latitude: results[1],
        distance: results[2],
        longitudeSpeed: results[3],
        latitudeSpeed: results[4],
        distanceSpeed: results[5],
      };
    });
  }

  // Shared implementation for swe_fixstar / swe_fixstar_ut / swe_fixstar2 /
  // swe_fixstar2_ut. The star buffer is IN/OUT (the C library writes the full
  // catalog name back) so it must be SE_MAX_STNAME (256) bytes.
  #fixstarPos(fnName, star, julianDay, flags) {
    return this.#withBuffers({
      resultPtr: 6 * 8,
      starBuffer: 256,
      serrPtr: 256,
    }, ({ resultPtr, starBuffer, serrPtr }) => {
      this.SweModule.stringToUTF8(star, starBuffer, 256);
      const retFlag = this.SweModule.ccall(
        fnName,
        'number',
        ['pointer', 'number', 'number', 'pointer', 'pointer'],
        [starBuffer, julianDay, flags, resultPtr, serrPtr]
      );
      const results = this.#readDoubles(resultPtr, 6);
      if (retFlag < 0) throw this.#error(fnName, retFlag, serrPtr);
      this.#lastError = '';
      return results;
    });
  }

  // Shared implementation for swe_fixstar_mag / swe_fixstar2_mag.
  #fixstarMag(fnName, star) {
    return this.#withBuffers({
      magBuffer: 8,
      starBuffer: 256,
      serrPtr: 256,
    }, ({ magBuffer, starBuffer, serrPtr }) => {
      this.SweModule.stringToUTF8(star, starBuffer, 256);
      const retFlag = this.SweModule.ccall(
        fnName,
        'number',
        ['pointer', 'pointer', 'pointer'],
        [starBuffer, magBuffer, serrPtr]
      );
      const magnitude = this.#readDouble(magBuffer);
      if (retFlag < 0) throw this.#error(fnName, retFlag, serrPtr);
      this.#lastError = '';
      return magnitude;
    });
  }

  fixstar(star, julianDay, flags) {
    return this.#fixstarPos('swe_fixstar', star, julianDay, flags);
  }

  fixstar_ut(star, julianDay, flags) {
    return this.#fixstarPos('swe_fixstar_ut', star, julianDay, flags);
  }

  fixstar_mag(star) {
    return this.#fixstarMag('swe_fixstar_mag', star);
  }

  fixstar2(star, julianDay, flags) {
    return this.#fixstarPos('swe_fixstar2', star, julianDay, flags);
  }

  fixstar2_ut(star, julianDay, flags) {
    return this.#fixstarPos('swe_fixstar2_ut', star, julianDay, flags);
  }

  fixstar2_mag(star) {
    return this.#fixstarMag('swe_fixstar2_mag', star);
  }

  close() {
    this.SweModule.ccall('swe_close', 'void', [], []);
  }

  set_jpl_file(filename) {
    return this.#withBuffers({ fileBuffer: filename.length + 1 }, ({ fileBuffer }) => {
      this.SweModule.stringToUTF8(filename, fileBuffer, filename.length + 1);
      const result = this.SweModule.ccall(
        'swe_set_jpl_file',
        'string',
        ['pointer'],
        [fileBuffer]
      );
      return result;
    });
  }

  get_planet_name(planetId) {
    return this.#withBuffers({ bufPtr: 256 }, ({ bufPtr }) => {
      this.SweModule.ccall('swe_get_planet_name', 'void', ['number', 'pointer'], [planetId, bufPtr]);
      const name = this.#readString(bufPtr);
      return name;
    });
  }

  set_topo(longitude, latitude, altitude) {
    this.SweModule.ccall(
      'swe_set_topo',
      'void',
      ['number', 'number', 'number'],
      [longitude, latitude, altitude]
    );
  }

  set_sid_mode(sidMode, t0, ayanT0) {
    this.SweModule.ccall(
      'swe_set_sid_mode',
      'void',
      ['number', 'number', 'number'],
      [sidMode, t0, ayanT0]
    );
  }

  get_ayanamsa(julianDay) {
    return this.SweModule.ccall(
      'swe_get_ayanamsa',
      'number',
      ['number'],
      [julianDay]
    );
  }

  get_ayanamsa_ut(julianDay) {
    return this.SweModule.ccall(
      'swe_get_ayanamsa_ut',
      'number',
      ['number'],
      [julianDay]
    );
  }

  get_ayanamsa_ex(julianDay, ephemerisFlag) {
    return this.#withBuffers({ resultPtr: 8, errorPtr: 256 }, ({ resultPtr, errorPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_get_ayanamsa_ex',
        'number',
        ['number', 'number', 'pointer', 'pointer'],
        [julianDay, ephemerisFlag, resultPtr, errorPtr]
      );
      const result = this.#readDouble(resultPtr);
      if (retFlag < 0) throw this.#error('swe_get_ayanamsa_ex', retFlag, errorPtr);
      this.#lastError = '';
      return result;
    });
  }

  get_ayanamsa_ex_ut(julianDay, ephemerisFlag) {
    return this.#withBuffers({ resultPtr: 8, errorPtr: 256 }, ({ resultPtr, errorPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_get_ayanamsa_ex_ut',
        'number',
        ['number', 'number', 'pointer', 'pointer'],
        [julianDay, ephemerisFlag, resultPtr, errorPtr]
      );
      const result = this.#readDouble(resultPtr);
      if (retFlag < 0) throw this.#error('swe_get_ayanamsa_ex_ut', retFlag, errorPtr);
      this.#lastError = '';
      return result;
    });
  }

  get_ayanamsa_name(siderealMode) {
    return this.SweModule.ccall(
      'swe_get_ayanamsa_name',
      'string',
      ['number'],
      [siderealMode]
    );
  }

  // Shared implementation for swe_nod_aps / swe_nod_aps_ut. The C function
  // writes four output arrays of 6 doubles each: ascending node, descending
  // node, perihelion, aphelion (plus a serr buffer).
  #nodAps(fnName, julianDay, planet, flags, method) {
    return this.#withBuffers({
      xnascPtr: 6 * 8,
      xndscPtr: 6 * 8,
      xperiPtr: 6 * 8,
      xaphePtr: 6 * 8,
      serrPtr: 256,
    }, ({ xnascPtr, xndscPtr, xperiPtr, xaphePtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        fnName,
        'number',
        ['number', 'number', 'number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
        [julianDay, planet, flags, method, xnascPtr, xndscPtr, xperiPtr, xaphePtr, serrPtr]
      );
      if (retFlag < 0) throw this.#error(fnName, retFlag, serrPtr);
      this.#lastError = '';

      const ascending = this.#readDoubles(xnascPtr, 6);
      const descending = this.#readDoubles(xndscPtr, 6);
      const perihelion = this.#readDoubles(xperiPtr, 6);
      const aphelion = this.#readDoubles(xaphePtr, 6);

      return {
        ascending: Array.from(ascending),
        descending: Array.from(descending),
        perihelion: Array.from(perihelion),
        aphelion: Array.from(aphelion),
        asc_node: ascending[0],
        desc_node: descending[0],
        peri_lon: perihelion[0],
        aphe_lon: aphelion[0],
      };
    });
  }

  nod_aps(julianDay, planet, flags, method) {
    return this.#nodAps('swe_nod_aps', julianDay, planet, flags, method);
  }

  nod_aps_ut(julianDay, planet, flags, method) {
    return this.#nodAps('swe_nod_aps_ut', julianDay, planet, flags, method);
  }

  get_orbital_elements(julianDay, planet, flags) {
    return this.#withBuffers({ dretPtr: 50 * 8, serrPtr: 256 }, ({ dretPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_get_orbital_elements',
        'number',
        ['number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, planet, flags, dretPtr, serrPtr]
      );
      const elements = this.#readDoubles(dretPtr, 50);
      if (retFlag < 0) throw this.#error('swe_get_orbital_elements', retFlag, serrPtr);
      this.#lastError = '';
      return elements;
    });
  }

  orbit_max_min_true_distance(julianDay, planet, flags) {
    return this.#withBuffers({
      dmaxPtr: 8,
      dminPtr: 8,
      dtruePtr: 8,
      serrPtr: 256,
    }, ({ dmaxPtr, dminPtr, dtruePtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_orbit_max_min_true_distance',
        'number',
        ['number', 'number', 'number', 'pointer', 'pointer', 'pointer', 'pointer'],
        [julianDay, planet, flags, dmaxPtr, dminPtr, dtruePtr, serrPtr]
      );
      const result = {
        maxDistance: this.#readDouble(dmaxPtr),
        minDistance: this.#readDouble(dminPtr),
        trueDistance: this.#readDouble(dtruePtr),
      };
      if (retFlag < 0) throw this.#error('swe_orbit_max_min_true_distance', retFlag, serrPtr);
      this.#lastError = '';
      return result;
    });
  }

  heliacal_ut(julianDayStart, geoPos, atmosData, observerData, objectName, eventType, flags) {
    return this.#withBuffers({
      geoPtr: geoPos,
      atmPtr: atmosData,
      obsPtr: observerData,
      namePtr: objectName.length + 1,
      dretPtr: 50 * 8,
      serrPtr: 256,
    }, ({ geoPtr, atmPtr, obsPtr, namePtr, dretPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(objectName, namePtr, objectName.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_heliacal_ut',
        'number',
        ['number', 'pointer', 'pointer', 'pointer', 'pointer', 'number', 'number', 'pointer', 'pointer'],
        [julianDayStart, geoPtr, atmPtr, obsPtr, namePtr, eventType, flags, dretPtr, serrPtr]
      );
      const dret = this.#readDoubles(dretPtr, 50);
      if (retFlag < 0) throw this.#error('swe_heliacal_ut', retFlag, serrPtr);
      this.#lastError = '';
      return dret;
    });
  }

  heliacal_pheno_ut(julianDay, geoPos, atmosData, observerData, objectName, eventType, heliacalFlag) {
    return this.#withBuffers({
      geoPtr: geoPos,
      atmPtr: atmosData,
      obsPtr: observerData,
      namePtr: objectName.length + 1,
      darrPtr: 50 * 8,
      serrPtr: 256,
    }, ({ geoPtr, atmPtr, obsPtr, namePtr, darrPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(objectName, namePtr, objectName.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_heliacal_pheno_ut',
        'number',
        ['number', 'pointer', 'pointer', 'pointer', 'pointer', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, geoPtr, atmPtr, obsPtr, namePtr, eventType, heliacalFlag, darrPtr, serrPtr]
      );
      const darr = this.#readDoubles(darrPtr, 50);
      if (retFlag < 0) throw this.#error('swe_heliacal_pheno_ut', retFlag, serrPtr);
      this.#lastError = '';
      return darr;
    });
  }

  vis_limit_mag(julianDay, geoPos, atmosData, observerData, objectName, heliacalFlag) {
    return this.#withBuffers({
      geoPtr: geoPos,
      atmPtr: atmosData,
      obsPtr: observerData,
      namePtr: objectName.length + 1,
      dretPtr: 10 * 8,
      serrPtr: 256,
    }, ({ geoPtr, atmPtr, obsPtr, namePtr, dretPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(objectName, namePtr, objectName.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_vis_limit_mag',
        'number',
        ['number', 'pointer', 'pointer', 'pointer', 'pointer', 'number', 'pointer', 'pointer'],
        [julianDay, geoPtr, atmPtr, obsPtr, namePtr, heliacalFlag, dretPtr, serrPtr]
      );
      const dret = this.#readDoubles(dretPtr, 10);
      if (retFlag < 0) throw this.#error('swe_vis_limit_mag', retFlag, serrPtr);
      this.#lastError = '';
      return dret;
    });
  }

  houses(julianDay, geoLat, geoLon, houseSystem) {
    return this.#withBuffers({ cuspsPtr: 13 * 8, ascmcPtr: 10 * 8 }, ({ cuspsPtr, ascmcPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_houses',
        'number',
        ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, geoLat, geoLon, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
      );
      if (retFlag < 0) throw this.#error('swe_houses', retFlag, 0);
      this.#lastError = '';

      const cusps = this.#readDoubles(cuspsPtr, 13);
      const ascmc = this.#readDoubles(ascmcPtr, 10);

      return { cusps, ascmc };
    });
  }

  houses_ex(julianDay, iflag, geoLat, geoLon, houseSystem) {
    return this.#withBuffers({ cuspsPtr: 13 * 8, ascmcPtr: 10 * 8 }, ({ cuspsPtr, ascmcPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_houses_ex',
        'number',
        ['number', 'number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, iflag, geoLat, geoLon, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
      );
      if (retFlag < 0) throw this.#error('swe_houses_ex', retFlag, 0);
      this.#lastError = '';

      const cusps = this.#readDoubles(cuspsPtr, 13);
      const ascmc = this.#readDoubles(ascmcPtr, 10);

      return { cusps, ascmc };
    });
  }

  houses_ex2(julianDay, iflag, geoLat, geoLon, houseSystem) {
    return this.#withBuffers({ cuspsPtr: 13 * 8, ascmcPtr: 10 * 8 }, ({ cuspsPtr, ascmcPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_houses_ex2',
        'number',
        ['number', 'number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, iflag, geoLat, geoLon, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
      );
      if (retFlag < 0) throw this.#error('swe_houses_ex2', retFlag, 0);
      this.#lastError = '';

      const cusps = this.#readDoubles(cuspsPtr, 13);
      const ascmc = this.#readDoubles(ascmcPtr, 10);

      return { cusps, ascmc };
    });
  }

  houses_armc(armc, geoLat, eps, houseSystem) {
    return this.#withBuffers({ cuspsPtr: 13 * 8, ascmcPtr: 10 * 8 }, ({ cuspsPtr, ascmcPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_houses_armc',
        'number',
        ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [armc, geoLat, eps, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
      );
      if (retFlag < 0) throw this.#error('swe_houses_armc', retFlag, 0);
      this.#lastError = '';

      const cusps = this.#readDoubles(cuspsPtr, 13);
      const ascmc = this.#readDoubles(ascmcPtr, 10);

      return { cusps, ascmc };
    });
  }

  houses_armc_ex2(armc, geoLat, eps, houseSystem) {
    return this.#withBuffers({ cuspsPtr: 13 * 8, ascmcPtr: 10 * 8 }, ({ cuspsPtr, ascmcPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_houses_armc_ex2',
        'number',
        ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [armc, geoLat, eps, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
      );
      if (retFlag < 0) throw this.#error('swe_houses_armc_ex2', retFlag, serr);
      this.#lastError = '';

      const cusps = this.#readDoubles(cuspsPtr, 13);
      const ascmc = this.#readDoubles(ascmcPtr, 10);

      return { cusps, ascmc };
    });
  }

  // swe_sol_eclipse_where(tjd, ifl, double *geopos[out], double *attr[out], serr)
  // geopos = [lon, lat] of greatest eclipse; attr = 20 eclipse attributes.
  sol_eclipse_where(julianDay, flags) {
    return this.#withBuffers({
      geoPtr: 10 * 8,
      attrPtr: 20 * 8,
      serrPtr: 256,
    }, ({ geoPtr, attrPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_sol_eclipse_where',
        'number',
        ['number', 'number', 'pointer', 'pointer', 'pointer'],
        [julianDay, flags, geoPtr, attrPtr, serrPtr]
      );
      const geopos = this.#readDoubles(geoPtr, 10);
      const attr = this.#readDoubles(attrPtr, 20);
      if (retFlag < 0) throw this.#error('swe_sol_eclipse_where', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, geopos, attr };
    });
  }

  // swe_lun_occult_where(tjd, ipl, starname, ifl, double *geopos[out], double *attr[out], serr)
  lun_occult_where(julianDay, planet, starName, flags) {
    const name = starName || '';
    return this.#withBuffers({
      nameBuf: name.length + 1,
      geoPtr: 10 * 8,
      attrPtr: 20 * 8,
      serrPtr: 256,
    }, ({ nameBuf, geoPtr, attrPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_lun_occult_where',
        'number',
        ['number', 'number', 'pointer', 'number', 'pointer', 'pointer', 'pointer'],
        [julianDay, planet, nameBuf, flags, geoPtr, attrPtr, serrPtr]
      );
      const geopos = this.#readDoubles(geoPtr, 10);
      const attr = this.#readDoubles(attrPtr, 20);
      if (retFlag < 0) throw this.#error('swe_lun_occult_where', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, geopos, attr };
    });
  }

  // swe_sol_eclipse_how(tjd, ifl, double *geopos[in], double *attr[out], serr)
  // geopos = [lon, lat, alt] of the observer.
  sol_eclipse_how(julianDay, flags, geopos) {
    return this.#withBuffers({
      geoPtr: geopos,
      attrPtr: 20 * 8,
      serrPtr: 256,
    }, ({ geoPtr, attrPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_sol_eclipse_how',
        'number',
        ['number', 'number', 'pointer', 'pointer', 'pointer'],
        [julianDay, flags, geoPtr, attrPtr, serrPtr]
      );
      const attr = this.#readDoubles(attrPtr, 20);
      if (retFlag < 0) throw this.#error('swe_sol_eclipse_how', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, attr };
    });
  }

  // swe_sol_eclipse_when_loc(tjd_start, ifl, geopos[in], tret[out], attr[out], backward, serr)
  sol_eclipse_when_loc(julianDayStart, flags, geopos, backward) {
    return this.#withBuffers({
      geoPtr: geopos,
      tretPtr: 10 * 8,
      attrPtr: 20 * 8,
      serrPtr: 256,
    }, ({ geoPtr, tretPtr, attrPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_sol_eclipse_when_loc',
        'number',
        ['number', 'number', 'pointer', 'pointer', 'pointer', 'number', 'pointer'],
        [julianDayStart, flags, geoPtr, tretPtr, attrPtr, backward, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      const attr = this.#readDoubles(attrPtr, 20);
      if (retFlag < 0) throw this.#error('swe_sol_eclipse_when_loc', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, tret, attr };
    });
  }

  // swe_lun_occult_when_loc(tjd_start, ipl, starname, ifl, geopos[in], tret[out], attr[out], backward, serr)
  lun_occult_when_loc(julianDayStart, planet, starName, flags, geopos, backward) {
    const name = starName || '';
    return this.#withBuffers({
      nameBuf: name.length + 1,
      geoPtr: geopos,
      tretPtr: 10 * 8,
      attrPtr: 20 * 8,
      serrPtr: 256,
    }, ({ nameBuf, geoPtr, tretPtr, attrPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_lun_occult_when_loc',
        'number',
        ['number', 'number', 'pointer', 'number', 'pointer', 'pointer', 'pointer', 'number', 'pointer'],
        [julianDayStart, planet, nameBuf, flags, geoPtr, tretPtr, attrPtr, backward, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      const attr = this.#readDoubles(attrPtr, 20);
      if (retFlag < 0) throw this.#error('swe_lun_occult_when_loc', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, tret, attr };
    });
  }

  // swe_sol_eclipse_when_glob(tjd_start, ifl, ifltype, tret[out], backward, serr)
  sol_eclipse_when_glob(julianDayStart, flags, eclipseType, backward) {
    return this.#withBuffers({ tretPtr: 10 * 8, serrPtr: 256 }, ({ tretPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_sol_eclipse_when_glob',
        'number',
        ['number', 'number', 'number', 'pointer', 'number', 'pointer'],
        [julianDayStart, flags, eclipseType, tretPtr, backward, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      if (retFlag < 0) throw this.#error('swe_sol_eclipse_when_glob', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, tret };
    });
  }

  // swe_lun_occult_when_glob(tjd_start, ipl, starname, ifl, ifltype, tret[out], backward, serr)
  lun_occult_when_glob(julianDayStart, planet, starName, flags, eclipseType, backward) {
    const name = starName || '';
    return this.#withBuffers({
      nameBuf: name.length + 1,
      tretPtr: 10 * 8,
      serrPtr: 256,
    }, ({ nameBuf, tretPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_lun_occult_when_glob',
        'number',
        ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'pointer'],
        [julianDayStart, planet, nameBuf, flags, eclipseType, tretPtr, backward, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      if (retFlag < 0) throw this.#error('swe_lun_occult_when_glob', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, tret };
    });
  }

  // swe_lun_eclipse_how(tjd_ut, ifl, double *geopos[in], double *attr[out], serr)
  lun_eclipse_how(julianDay, flags, geopos) {
    return this.#withBuffers({
      geoPtr: geopos,
      attrPtr: 20 * 8,
      serrPtr: 256,
    }, ({ geoPtr, attrPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_lun_eclipse_how',
        'number',
        ['number', 'number', 'pointer', 'pointer', 'pointer'],
        [julianDay, flags, geoPtr, attrPtr, serrPtr]
      );
      const attr = this.#readDoubles(attrPtr, 20);
      if (retFlag < 0) throw this.#error('swe_lun_eclipse_how', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, attr };
    });
  }

  // swe_lun_eclipse_when(tjd_start, ifl, ifltype, tret[out], backward, serr)
  lun_eclipse_when(julianDayStart, flags, eclipseType, backward) {
    return this.#withBuffers({ tretPtr: 10 * 8, serrPtr: 256 }, ({ tretPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_lun_eclipse_when',
        'number',
        ['number', 'number', 'number', 'pointer', 'number', 'pointer'],
        [julianDayStart, flags, eclipseType, tretPtr, backward, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      if (retFlag < 0) throw this.#error('swe_lun_eclipse_when', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, tret };
    });
  }

  // swe_lun_eclipse_when_loc(tjd_start, ifl, geopos[in], tret[out], attr[out], backward, serr)
  lun_eclipse_when_loc(julianDayStart, flags, geopos, backward) {
    return this.#withBuffers({
      geoPtr: geopos,
      tretPtr: 10 * 8,
      attrPtr: 20 * 8,
      serrPtr: 256,
    }, ({ geoPtr, tretPtr, attrPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_lun_eclipse_when_loc',
        'number',
        ['number', 'number', 'pointer', 'pointer', 'pointer', 'number', 'pointer'],
        [julianDayStart, flags, geoPtr, tretPtr, attrPtr, backward, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      const attr = this.#readDoubles(attrPtr, 20);
      if (retFlag < 0) throw this.#error('swe_lun_eclipse_when_loc', retFlag, serrPtr);
      this.#lastError = '';
      return { retFlag, tret, attr };
    });
  }

  pheno(julianDay, planet, flags) {
    return this.#withBuffers({ resultPtr: 8 * Float64Array.BYTES_PER_ELEMENT }, ({ resultPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_pheno',
        'number',
        ['number', 'number', 'number', 'pointer'],
        [julianDay, planet, flags, resultPtr]
      );
      const results = this.#readDoubles(resultPtr, 8);
      if (retFlag < 0) throw this.#error('swe_pheno', retFlag, 0);
      this.#lastError = '';
      return results;
    });
  }

  pheno_ut(julianDay, planet, flags) {
    return this.#withBuffers({ resultPtr: 8 * Float64Array.BYTES_PER_ELEMENT }, ({ resultPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_pheno_ut',
        'number',
        ['number', 'number', 'number', 'pointer'],
        [julianDay, planet, flags, resultPtr]
      );
      const results = this.#readDoubles(resultPtr, 8);
      if (retFlag < 0) throw this.#error('swe_pheno_ut', retFlag, 0);
      this.#lastError = '';
      return results;
    });
  }

  // swe_refrac(double inalt, double atpress, double attemp, int32 calc_flag)
  // returns the (apparent or true) altitude in degrees.
  refrac(inalt, atpress, attemp, calcFlag) {
    return this.SweModule.ccall(
      'swe_refrac',
      'number',
      ['number', 'number', 'number', 'number'],
      [inalt, atpress, attemp, calcFlag]
    );
  }

  // swe_refrac_extended(double inalt, double geoalt, double atpress,
  //   double attemp, double lapse_rate, int32 calc_flag, double *dret)
  // returns the converted altitude; dret = [true alt, apparent alt,
  // refraction, dip of horizon].
  refrac_extended(inalt, geoalt, atpress, attemp, lapseRate, calcFlag) {
    return this.#withBuffers({ dretPtr: 4 * Float64Array.BYTES_PER_ELEMENT }, ({ dretPtr }) => {
      const converted = this.SweModule.ccall(
        'swe_refrac_extended',
        'number',
        ['number', 'number', 'number', 'number', 'number', 'number', 'pointer'],
        [inalt, geoalt, atpress, attemp, lapseRate, calcFlag, dretPtr]
      );
      const dret = this.#readDoubles(dretPtr, 4);
      return {
        converted,
        trueAltitude: dret[0],
        apparentAltitude: dret[1],
        refraction: dret[2],
        dip: dret[3],
      };
    });
  }

  set_lapse_rate(lapseRate) {
    this.SweModule.ccall(
      'swe_set_lapse_rate',
      'void',
      ['number'],
      [lapseRate]
    );
  }

  azalt(tjd_ut, calc_flag, geopos, atpress, attemp, xin) {
    return this.#withBuffers({
      xazPtr: 3 * 8,
      xinPtr: [xin[0], xin[1], xin[2]],
      geoposPtr: [geopos[0], geopos[1], geopos[2]],
    }, ({ xazPtr, xinPtr, geoposPtr }) => {
      this.SweModule.ccall(
        'swe_azalt',
        'void',
        ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'pointer'],
        [tjd_ut, calc_flag, geoposPtr, atpress, attemp, xinPtr, xazPtr]
      );
      const xaz = this.#readDoubles(xazPtr, 3);
      return {
        azimuth: xaz[0],
        trueAltitude: xaz[1],
        apparentAltitude: xaz[2],
      };
    });
  }

  azalt_rev(tjd_ut, calc_flag, geopos, xin) {
    return this.#withBuffers({
      xoutPtr: 3 * 8,
      xinPtr: [xin[0], xin[1], xin[2]],
      geoposPtr: [geopos[0], geopos[1], geopos[2]],
    }, ({ xoutPtr, xinPtr, geoposPtr }) => {
      this.SweModule.ccall(
        'swe_azalt_rev',
        'void',
        ['number', 'number', 'pointer', 'pointer', 'pointer'],
        [tjd_ut, calc_flag, geoposPtr, xinPtr, xoutPtr]
      );
      const xout = this.#readDoubles(xoutPtr, 3);
      return {
        ra: xout[0],
        dec: xout[1],
        distance: xout[2],
      };
    });
  }

  // swe_rise_trans(tjd_ut, ipl, starname, epheflag, rsmi, geopos[3], atpress,
  //   attemp, double *tret[out], serr). rsmi selects rise/set/transit
  // (SE_CALC_RISE, SE_CALC_SET, SE_CALC_MTRANSIT, SE_CALC_ITRANSIT).
  // geopos = [lon, lat, alt]. Returns tret (event time in tret[0]) or null.
  rise_trans(julianDay, planet, starName, epheFlag, rsmi, geopos, atpress, attemp) {
    const name = starName || '';
    return this.#withBuffers({
      nameBuf: name.length + 1,
      geoPtr: geopos,
      tretPtr: 10 * 8,
      serrPtr: 256,
    }, ({ nameBuf, geoPtr, tretPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_rise_trans',
        'number',
        ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, planet, nameBuf, epheFlag, rsmi, geoPtr, atpress, attemp, tretPtr, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      if (retFlag < 0) throw this.#error('swe_rise_trans', retFlag, serrPtr);
      this.#lastError = '';
      return tret;
    });
  }

  // As rise_trans, but with an explicit horizon height (horhgt, in degrees).
  rise_trans_true_hor(julianDay, planet, starName, epheFlag, rsmi, geopos, atpress, attemp, horhgt) {
    const name = starName || '';
    return this.#withBuffers({
      nameBuf: name.length + 1,
      geoPtr: geopos,
      tretPtr: 10 * 8,
      serrPtr: 256,
    }, ({ nameBuf, geoPtr, tretPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_rise_trans_true_hor',
        'number',
        ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, planet, nameBuf, epheFlag, rsmi, geoPtr, atpress, attemp, horhgt, tretPtr, serrPtr]
      );
      const tret = this.#readDoubles(tretPtr, 10);
      if (retFlag < 0) throw this.#error('swe_rise_trans_true_hor', retFlag, serrPtr);
      this.#lastError = '';
      return tret;
    });
  }

  // Delta T with an explicit ephemeris flag (recommended over deltat()).
  deltat_ex(julianDay, ephemerisFlag) {
    return this.#withBuffers({ serrPtr: 256 }, ({ serrPtr }) => {
      const result = this.SweModule.ccall(
        'swe_deltat_ex',
        'number',
        ['number', 'number', 'pointer'],
        [julianDay, ephemerisFlag, serrPtr]
      );
      return result;
    });
  }

  // Name of a house system given its single-letter code (e.g. 'P').
  house_name(houseSystem) {
    return this.SweModule.ccall(
      'swe_house_name',
      'string',
      ['number'],
      [houseSystem.charCodeAt(0)]
    );
  }

  // Shared implementation for the single-longitude crossing functions
  // (swe_solcross / swe_solcross_ut / swe_mooncross / swe_mooncross_ut).
  #cross(fnName, x2cross, julianDay, flags) {
    return this.#withBuffers({ serrPtr: 256 }, ({ serrPtr }) => {
      const jd = this.SweModule.ccall(
        fnName,
        'number',
        ['number', 'number', 'number', 'pointer'],
        [x2cross, julianDay, flags, serrPtr]
      );
      return jd;
    });
  }

  // Julian day (ET) when the Sun next crosses ecliptic longitude x2cross.
  solcross(x2cross, julianDayET, flags) {
    return this.#cross('swe_solcross', x2cross, julianDayET, flags);
  }

  // Julian day (UT) when the Sun next crosses ecliptic longitude x2cross.
  solcross_ut(x2cross, julianDayUT, flags) {
    return this.#cross('swe_solcross_ut', x2cross, julianDayUT, flags);
  }

  // Julian day (ET) when the Moon next crosses ecliptic longitude x2cross.
  mooncross(x2cross, julianDayET, flags) {
    return this.#cross('swe_mooncross', x2cross, julianDayET, flags);
  }

  // Julian day (UT) when the Moon next crosses ecliptic longitude x2cross.
  mooncross_ut(x2cross, julianDayUT, flags) {
    return this.#cross('swe_mooncross_ut', x2cross, julianDayUT, flags);
  }

  // Shared implementation for the Moon node-crossing functions.
  #mooncrossNode(fnName, julianDay, flags) {
    return this.#withBuffers({
      xlonPtr: 8,
      xlatPtr: 8,
      serrPtr: 256,
    }, ({ xlonPtr, xlatPtr, serrPtr }) => {
      const jd = this.SweModule.ccall(
        fnName,
        'number',
        ['number', 'number', 'pointer', 'pointer', 'pointer'],
        [julianDay, flags, xlonPtr, xlatPtr, serrPtr]
      );
      const lon = this.#readDouble(xlonPtr);
      const lat = this.#readDouble(xlatPtr);
      return { jd, lon, lat };
    });
  }

  // Julian day (ET) when the Moon next crosses its node, with node position.
  mooncross_node(julianDayET, flags) {
    return this.#mooncrossNode('swe_mooncross_node', julianDayET, flags);
  }

  // Julian day (UT) when the Moon next crosses its node, with node position.
  mooncross_node_ut(julianDayUT, flags) {
    return this.#mooncrossNode('swe_mooncross_node_ut', julianDayUT, flags);
  }

  // Shared implementation for the heliocentric crossing functions.
  #helioCross(fnName, planet, x2cross, julianDay, flags, direction) {
    return this.#withBuffers({ jdPtr: 8, serrPtr: 256 }, ({ jdPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        fnName,
        'number',
        ['number', 'number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [planet, x2cross, julianDay, flags, direction, jdPtr, serrPtr]
      );
      const jd = this.#readDouble(jdPtr);
      if (retFlag < 0) throw this.#error(fnName, retFlag, serrPtr);
      this.#lastError = '';
      return jd;
    });
  }

  // Julian day (ET) when a planet crosses longitude x2cross heliocentrically.
  helio_cross(planet, x2cross, julianDayET, flags, direction) {
    return this.#helioCross('swe_helio_cross', planet, x2cross, julianDayET, flags, direction);
  }

  // Julian day (UT) when a planet crosses longitude x2cross heliocentrically.
  helio_cross_ut(planet, x2cross, julianDayUT, flags, direction) {
    return this.#helioCross('swe_helio_cross_ut', planet, x2cross, julianDayUT, flags, direction);
  }

  // Gauquelin sector position of a planet or star. Returns null on error.
  gauquelin_sector(t_ut, planet, starname, flags, method, geopos, atpress, attemp) {
    const name = starname || '';
    return this.#withBuffers({
      nameBuf: name.length + 1,
      geoPtr: geopos,
      dgsectPtr: 8,
      serrPtr: 256,
    }, ({ nameBuf, geoPtr, dgsectPtr, serrPtr }) => {
      this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
      const retFlag = this.SweModule.ccall(
        'swe_gauquelin_sector',
        'number',
        ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'number', 'pointer', 'pointer'],
        [t_ut, planet, nameBuf, flags, method, geoPtr, atpress, attemp, dgsectPtr, serrPtr]
      );
      const dgsect = this.#readDouble(dgsectPtr);
      if (retFlag < 0) throw this.#error('swe_gauquelin_sector', retFlag, serrPtr);
      this.#lastError = '';
      return dgsect;
    });
  }

  // Planetocentric position: planet as seen from body `center`. Returns 6
  // values (like calc) or null on error.
  calc_pctr(julianDay, planet, center, flags) {
    return this.#withBuffers({ resultPtr: 6 * 8, serrPtr: 256 }, ({ resultPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_calc_pctr',
        'number',
        ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
        [julianDay, planet, center, flags, resultPtr, serrPtr]
      );
      const results = this.#readDoubles(resultPtr, 6);
      if (retFlag < 0) throw this.#error('swe_calc_pctr', retFlag, serrPtr);
      this.#lastError = '';
      return results;
    });
  }

  // Local apparent time -> local mean time. Returns the resulting Julian Day.
  lat_to_lmt(julianDayLat, geoLon) {
    return this.#withBuffers({ outPtr: 8, serrPtr: 256 }, ({ outPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_lat_to_lmt',
        'number',
        ['number', 'number', 'pointer', 'pointer'],
        [julianDayLat, geoLon, outPtr, serrPtr]
      );
      if (retFlag < 0) throw this.#error('swe_lat_to_lmt', retFlag, serrPtr);
      this.#lastError = '';
      const result = this.#readDouble(outPtr);
      return result;
    });
  }

  // Local mean time -> local apparent time. Returns the resulting Julian Day.
  lmt_to_lat(julianDayLmt, geoLon) {
    return this.#withBuffers({ outPtr: 8, serrPtr: 256 }, ({ outPtr, serrPtr }) => {
      const retFlag = this.SweModule.ccall(
        'swe_lmt_to_lat',
        'number',
        ['number', 'number', 'pointer', 'pointer'],
        [julianDayLmt, geoLon, outPtr, serrPtr]
      );
      if (retFlag < 0) throw this.#error('swe_lmt_to_lat', retFlag, serrPtr);
      this.#lastError = '';
      const result = this.#readDouble(outPtr);
      return result;
    });
  }

  // Path of the loaded Swiss Ephemeris shared library / module.
  get_library_path() {
    return this.#withBuffers({ bufPtr: 256 }, ({ bufPtr }) => {
      const result = this.SweModule.ccall('swe_get_library_path', 'string', ['pointer'], [bufPtr]);
      return result;
    });
  }

  // Metadata of a currently open ephemeris file (0 = planet, 1 = moon, etc.).
  get_current_file_data(fileIndex) {
    return this.#withBuffers({
      startPtr: 8,
      endPtr: 8,
      denumPtr: 4,
    }, ({ startPtr, endPtr, denumPtr }) => {
      const path = this.SweModule.ccall(
        'swe_get_current_file_data',
        'string',
        ['number', 'pointer', 'pointer', 'pointer'],
        [fileIndex, startPtr, endPtr, denumPtr]
      );
      const result = {
        path,
        start: this.#readDouble(startPtr),
        end: this.#readDouble(endPtr),
        denum: this.#readInt(denumPtr),
      };
      return result;
    });
  }

  // Set a user-defined Delta T (in days). Pass SE_TIDAL_DEFAULT-style values.
  set_delta_t_userdef(dt) {
    this.SweModule.ccall('swe_set_delta_t_userdef', 'void', ['number'], [dt]);
  }

  // Enable/disable interpolation of nutation between tabulated values.
  set_interpolate_nut(doInterpolate) {
    this.SweModule.ccall('swe_set_interpolate_nut', 'void', ['number'], [doInterpolate ? 1 : 0]);
  }

  // Query the astronomical models (precession, nutation, ...) in use.
  get_astro_models(flags) {
    return this.#withBuffers({ samodPtr: 256, sdetPtr: 256 }, ({ samodPtr, sdetPtr }) => {
      this.SweModule.stringToUTF8('', samodPtr, 1); // empty input -> report defaults
      this.SweModule.ccall(
        'swe_get_astro_models',
        'void',
        ['pointer', 'pointer', 'number'],
        [samodPtr, sdetPtr, flags]
      );
      const models = this.#readString(samodPtr);
      const details = this.#readString(sdetPtr);
      return { models, details };
    });
  }

  // Select astronomical models (precession, nutation, ...).
  set_astro_models(models, flags) {
    return this.#withBuffers({ buf: models.length + 1 }, ({ buf }) => {
      this.SweModule.stringToUTF8(models, buf, models.length + 1);
      this.SweModule.ccall('swe_set_astro_models', 'void', ['pointer', 'number'], [buf, flags]);
    });
  }

}

export default SwissEph;