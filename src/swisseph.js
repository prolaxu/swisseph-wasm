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
 * @version 0.1.0
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

import WasmSwissEph from '../wasm/swisseph.js';

class SwissEph {
  // Backing store for the Emscripten module; populated by initSwissEph().
  #module;

  // Last error string written by the C library (via its serr buffer). Set by
  // methods that return null / { error } on failure; read via getLastError().
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
  // serr-returning call succeeded. Useful when a method returns null / { error }.
  getLastError() {
    return this.#lastError;
  }

  // Read the C serr buffer into #lastError and return it. Called by methods on
  // their failure path before freeing the buffer.
  #captureError(serrPtr) {
    this.#lastError = serrPtr ? this.SweModule.UTF8ToString(serrPtr) : '';
    return this.#lastError;
  }

  // Allocate a heap buffer and copy a JS array of doubles into it. Returns the
  // pointer; caller is responsible for _free().
  #allocDoubles(values) {
    const ptr = this.SweModule._malloc(values.length * 8);
    const base = ptr >> 3;
    for (let i = 0; i < values.length; i++) {
      this.SweModule.HEAPF64[base + i] = values[i];
    }
    return ptr;
  }

  // Initializes the Swiss Ephemeris WebAssembly module
  async initSwissEph() {
    let moduleConfig = {};
    
    // In Node.js environment, we need to help locate the WASM and data files
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const { fileURLToPath } = await import('url');
        const { dirname, join } = await import('path');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        
        moduleConfig.locateFile = (path, prefix) => {
          if (path.endsWith('.data') || path.endsWith('.wasm')) {
            return join(__dirname, '../wasm', path);
          }
          return prefix + path;
        };
      } catch (e) {
        console.warn('Failed to configure path resolution for SwissEph WASM:', e);
      }
    } else {
      // Browser environment
      moduleConfig.locateFile = (path, prefix) => {
        if (path.endsWith('.data') || path.endsWith('.wasm')) {
          return new URL('../wasm/' + path, import.meta.url).href;
        }
        return prefix + path;
      };
    }

    this.#module = await WasmSwissEph(moduleConfig);

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
    const xpinPtr = this.SweModule._malloc(2 * 8);
    const HEAPF64 = this.SweModule.HEAPF64;
    HEAPF64[xpinPtr >> 3] = lon;
    HEAPF64[(xpinPtr >> 3) + 1] = lat;
    
    const serr = this.SweModule._malloc(256);
    const result = this.SweModule.ccall(
      'swe_house_pos',
      'number',
      ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [armc, geoLat, eps, hsys.charCodeAt(0), xpinPtr, serr]
    );
    
    this.SweModule._free(xpinPtr);
    this.SweModule._free(serr);
    return result;
  }

  julday(year, month, day, hour) {
    return this.SweModule.ccall('swe_julday', 'number', ['number', 'number', 'number', 'number', 'number'], [year, month, day, hour, 1]);
  }
  
  date_conversion(year, month, day, hour, calendar) {
    const tjdPtr = this.SweModule._malloc(8);
    // calendar is a char, pass char code
    const result = this.SweModule.ccall(
      'swe_date_conversion',
      'number',
      ['number', 'number', 'number', 'number', 'number', 'pointer'],
      [year, month, day, hour, calendar.charCodeAt(0), tjdPtr]
    );
    const tjd = this.SweModule.HEAPF64[tjdPtr >> 3];
    this.SweModule._free(tjdPtr);
    
    if (result === this.ERR) {
      throw new Error("Invalid date");
    }
    return tjd;
  }

  revjul(julianDay, gregflag) {
    const yearPtr = this.SweModule._malloc(4);
    const monthPtr = this.SweModule._malloc(4);
    const dayPtr = this.SweModule._malloc(4);
    const hourPtr = this.SweModule._malloc(8);
    
    this.SweModule.ccall(
      'swe_revjul',
      'void',
      ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer'],
      [julianDay, gregflag, yearPtr, monthPtr, dayPtr, hourPtr]
    );

    const year = this.SweModule.HEAP32[yearPtr >> 2];
    const month = this.SweModule.HEAP32[monthPtr >> 2];
    const day = this.SweModule.HEAP32[dayPtr >> 2];
    const hour = this.SweModule.HEAPF64[hourPtr >> 3];
    
    this.SweModule._free(yearPtr);
    this.SweModule._free(monthPtr);
    this.SweModule._free(dayPtr);
    this.SweModule._free(hourPtr);
    
    return { year, month, day, hour };
  }

  calc_ut(julianDay, body, flags) {
    const resultPtr = this.SweModule._malloc(6 * Float64Array.BYTES_PER_ELEMENT);
    const errorBuffer = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_calc_ut',
      'number',
      ['number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, body, flags, resultPtr, errorBuffer]
    );

    if (retFlag < 0) {
      const error = this.SweModule.UTF8ToString(errorBuffer);
      this.SweModule._free(resultPtr);
      this.SweModule._free(errorBuffer);
      this.#lastError = error;
      throw new Error(`Error in swe_calc_ut: ${error}`);
    }

    // Copy data to a safe array before freeing memory
    const start = resultPtr / 8;
    const result = this.SweModule.HEAPF64.slice(start, start + 6);
    
    this.SweModule._free(resultPtr);
    this.SweModule._free(errorBuffer);
    return result;
  }

  deltat(julianDay) {
    return this.SweModule.ccall('swe_deltat', 'number', ['number'], [julianDay]);
  }

  time_equ(julianDay) {
    const tePtr = this.SweModule._malloc(8);
    const serr = this.SweModule._malloc(256);
    this.SweModule.ccall('swe_time_equ', 'number', ['number', 'pointer', 'pointer'], [julianDay, tePtr, serr]);
    const result = this.SweModule.HEAPF64[tePtr >> 3];
    this.SweModule._free(tePtr);
    this.SweModule._free(serr);
    return result;
  }

  sidtime0(julianDay, eps, nut) {
    return this.SweModule.ccall('swe_sidtime0', 'number', ['number', 'number', 'number'], [julianDay, eps, nut]);
  }

  sidtime(julianDay) {
    return this.SweModule.ccall('swe_sidtime', 'number', ['number'], [julianDay]);
  }

  cotrans(xpo, eps) {
    const xpoPtr = this.SweModule._malloc(3 * 8); // 3 doubles
    const xpnPtr = this.SweModule._malloc(3 * 8); // 3 doubles
    
    this.SweModule.HEAPF64.set(xpo, xpoPtr >> 3);
    
    this.SweModule.ccall('swe_cotrans', 'void', ['number', 'number', 'number'], [xpoPtr, xpnPtr, eps]);
    
    const result = new Float64Array(this.SweModule.HEAPF64.buffer, xpnPtr, 3).slice();
    
    this.SweModule._free(xpoPtr);
    this.SweModule._free(xpnPtr);
    
    return Array.from(result);
  }

  cotrans_sp(xpo, eps) {
    const xpoPtr = this.SweModule._malloc(6 * 8); // 6 doubles
    const xpnPtr = this.SweModule._malloc(6 * 8); // 6 doubles
    
    this.SweModule.HEAPF64.set(xpo, xpoPtr >> 3);
    
    this.SweModule.ccall('swe_cotrans_sp', 'void', ['number', 'number', 'number'], [xpoPtr, xpnPtr, eps]);
    
    const result = new Float64Array(this.SweModule.HEAPF64.buffer, xpnPtr, 6).slice();
    
    this.SweModule._free(xpoPtr);
    this.SweModule._free(xpnPtr);
    
    return Array.from(result);
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
    const degPtr = this.SweModule._malloc(4);
    const minPtr = this.SweModule._malloc(4);
    const secPtr = this.SweModule._malloc(4);
    const dsecfrPtr = this.SweModule._malloc(8);
    const isgnPtr = this.SweModule._malloc(4);
    
    this.SweModule.ccall(
      'swe_split_deg',
      'void',
      ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
      [ddeg, roundFlag, degPtr, minPtr, secPtr, dsecfrPtr, isgnPtr]
    );
    
    const HEAP32 = new Int32Array(this.SweModule.HEAPF64.buffer);
    const HEAPF64 = new Float64Array(this.SweModule.HEAPF64.buffer);
    
    const result = {
      degree: HEAP32[degPtr >> 2],
      min: HEAP32[minPtr >> 2],
      second: HEAP32[secPtr >> 2],
      fraction: HEAPF64[dsecfrPtr >> 3],
      sign: HEAP32[isgnPtr >> 2],
    };
    
    this.SweModule._free(degPtr);
    this.SweModule._free(minPtr);
    this.SweModule._free(secPtr);
    this.SweModule._free(dsecfrPtr);
    this.SweModule._free(isgnPtr);
    
    return result;
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
    const bufPtr = this.SweModule._malloc(256);
    this.SweModule.ccall('swe_cs2timestr', 'void', ['number', 'number', 'number', 'pointer'], [t, sep.charCodeAt(0), suppressZero ? 1 : 0, bufPtr]);
    const result = this.SweModule.UTF8ToString(bufPtr);
    this.SweModule._free(bufPtr);
    return result;
  }

  cs2lonlatstr(t, pChar, mChar) {
    const bufPtr = this.SweModule._malloc(256);
    this.SweModule.ccall('swe_cs2lonlatstr', 'void', ['number', 'number', 'number', 'pointer'], [t, pChar.charCodeAt(0), mChar.charCodeAt(0), bufPtr]);
    const result = this.SweModule.UTF8ToString(bufPtr);
    this.SweModule._free(bufPtr);
    return result;
  }

  cs2degstr(t) {
    const bufPtr = this.SweModule._malloc(256);
    this.SweModule.ccall('swe_cs2degstr', 'void', ['number', 'pointer'], [t, bufPtr]);
    const result = this.SweModule.UTF8ToString(bufPtr);
    this.SweModule._free(bufPtr);
    return result;
  }



  utc_to_jd(year, month, day, hour, minute, second, gregflag) {
    const resultPtr = this.SweModule._malloc(2 * Float64Array.BYTES_PER_ELEMENT);
    this.SweModule.ccall(
      'swe_utc_to_jd',
      'void',
      ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'pointer'],
      [year, month, day, hour, minute, second, gregflag, resultPtr]
    );
    const result = new Float64Array(this.SweModule.HEAPF64.buffer, resultPtr, 2).slice();
    this.SweModule._free(resultPtr);
    return {
      julianDayET: result[0],
      julianDayUT: result[1],
    };
  }

  jdet_to_utc(julianDay, gregflag) {
    const yearPtr = this.SweModule._malloc(4);
    const monthPtr = this.SweModule._malloc(4);
    const dayPtr = this.SweModule._malloc(4);
    const hourPtr = this.SweModule._malloc(4);
    const minPtr = this.SweModule._malloc(4);
    const secPtr = this.SweModule._malloc(8);
    
    this.SweModule.ccall(
      'swe_jdet_to_utc',
      'void',
      ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
      [julianDay, gregflag, yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr]
    );
    
    const HEAP32 = new Int32Array(this.SweModule.HEAPF64.buffer);
    const HEAPF64 = new Float64Array(this.SweModule.HEAPF64.buffer);
    
    const result = {
      year: HEAP32[yearPtr >> 2],
      month: HEAP32[monthPtr >> 2],
      day: HEAP32[dayPtr >> 2],
      hour: HEAP32[hourPtr >> 2],
      minute: HEAP32[minPtr >> 2],
      second: HEAPF64[secPtr >> 3],
    };
    
    this.SweModule._free(yearPtr);
    this.SweModule._free(monthPtr);
    this.SweModule._free(dayPtr);
    this.SweModule._free(hourPtr);
    this.SweModule._free(minPtr);
    this.SweModule._free(secPtr);
    
    return result;
  }

  jdut1_to_utc(julianDay, gregflag) {
    const yearPtr = this.SweModule._malloc(4);
    const monthPtr = this.SweModule._malloc(4);
    const dayPtr = this.SweModule._malloc(4);
    const hourPtr = this.SweModule._malloc(4);
    const minPtr = this.SweModule._malloc(4);
    const secPtr = this.SweModule._malloc(8);
    
    this.SweModule.ccall(
      'swe_jdut1_to_utc',
      'void',
      ['number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
      [julianDay, gregflag, yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr]
    );
    
    const HEAP32 = new Int32Array(this.SweModule.HEAPF64.buffer);
    const HEAPF64 = new Float64Array(this.SweModule.HEAPF64.buffer);
    
    const result = {
      year: HEAP32[yearPtr >> 2],
      month: HEAP32[monthPtr >> 2],
      day: HEAP32[dayPtr >> 2],
      hour: HEAP32[hourPtr >> 2],
      minute: HEAP32[minPtr >> 2],
      second: HEAPF64[secPtr >> 3],
    };
    
    this.SweModule._free(yearPtr);
    this.SweModule._free(monthPtr);
    this.SweModule._free(dayPtr);
    this.SweModule._free(hourPtr);
    this.SweModule._free(minPtr);
    this.SweModule._free(secPtr);
    
    return result;
  }

  utc_time_zone(year, month, day, hour, minute, second, timezone) {
    const yearPtr = this.SweModule._malloc(4);
    const monthPtr = this.SweModule._malloc(4);
    const dayPtr = this.SweModule._malloc(4);
    const hourPtr = this.SweModule._malloc(4);
    const minPtr = this.SweModule._malloc(4);
    const secPtr = this.SweModule._malloc(8);
    
    this.SweModule.ccall(
      'swe_utc_time_zone',
      'void',
      ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
      [year, month, day, hour, minute, second, timezone, yearPtr, monthPtr, dayPtr, hourPtr, minPtr, secPtr]
    );
    
    const HEAP32 = new Int32Array(this.SweModule.HEAPF64.buffer);
    const HEAPF64 = new Float64Array(this.SweModule.HEAPF64.buffer);
    
    const result = {
      year: HEAP32[yearPtr >> 2],
      month: HEAP32[monthPtr >> 2],
      day: HEAP32[dayPtr >> 2],
      hour: HEAP32[hourPtr >> 2],
      minute: HEAP32[minPtr >> 2],
      second: HEAPF64[secPtr >> 3],
    };
    
    this.SweModule._free(yearPtr);
    this.SweModule._free(monthPtr);
    this.SweModule._free(dayPtr);
    this.SweModule._free(hourPtr);
    this.SweModule._free(minPtr);
    this.SweModule._free(secPtr);
    
    return result;
  }

  version() {
    const bufPtr = this.SweModule._malloc(256);
    this.SweModule.ccall('swe_version', 'void', ['pointer'], [bufPtr]);
    const version = this.SweModule.UTF8ToString(bufPtr);
    this.SweModule._free(bufPtr);
    return version;
  }

  calc(julianDay, body, flags) {
    const resultPtr = this.SweModule._malloc(6 * Float64Array.BYTES_PER_ELEMENT);
    const errorBuffer = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_calc',
      'number',
      ['number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, body, flags, resultPtr, errorBuffer]
    );
    if (retFlag < 0) {
      const error = this.SweModule.UTF8ToString(errorBuffer);
      this.SweModule._free(resultPtr);
      this.SweModule._free(errorBuffer);
      this.#lastError = error;
      throw new Error(`Error in swe_calc: ${error}`);
    }
    const results = new Float64Array(this.SweModule.HEAPF64.buffer, resultPtr, 6).slice();
    this.SweModule._free(resultPtr);
    this.SweModule._free(errorBuffer);
    return {
      longitude: results[0],
      latitude: results[1],
      distance: results[2],
      longitudeSpeed: results[3],
      latitudeSpeed: results[4],
      distanceSpeed: results[5],
    };
  }

  // Shared implementation for swe_fixstar / swe_fixstar_ut / swe_fixstar2 /
  // swe_fixstar2_ut. The star buffer is IN/OUT (the C library writes the full
  // catalog name back) so it must be SE_MAX_STNAME (256) bytes.
  #fixstarPos(fnName, star, julianDay, flags) {
    const resultPtr = this.SweModule._malloc(6 * 8);
    const starBuffer = this.SweModule._malloc(256);
    this.SweModule.stringToUTF8(star, starBuffer, 256);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      fnName,
      'number',
      ['pointer', 'number', 'number', 'pointer', 'pointer'],
      [starBuffer, julianDay, flags, resultPtr, serrPtr]
    );
    const results = new Float64Array(this.SweModule.HEAPF64.buffer, resultPtr, 6).slice();
    if (retFlag < 0) this.#captureError(serrPtr); else this.#lastError = '';
    this.SweModule._free(starBuffer);
    this.SweModule._free(resultPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : results;
  }

  // Shared implementation for swe_fixstar_mag / swe_fixstar2_mag.
  #fixstarMag(fnName, star) {
    const magBuffer = this.SweModule._malloc(8);
    const starBuffer = this.SweModule._malloc(256);
    this.SweModule.stringToUTF8(star, starBuffer, 256);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      fnName,
      'number',
      ['pointer', 'pointer', 'pointer'],
      [starBuffer, magBuffer, serrPtr]
    );
    const magnitude = this.SweModule.HEAPF64[magBuffer / 8];
    if (retFlag < 0) this.#captureError(serrPtr); else this.#lastError = '';
    this.SweModule._free(starBuffer);
    this.SweModule._free(magBuffer);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : magnitude;
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
    const fileBuffer = this.SweModule._malloc(filename.length + 1);
    this.SweModule.stringToUTF8(filename, fileBuffer, filename.length + 1);
    const result = this.SweModule.ccall(
      'swe_set_jpl_file',
      'string',
      ['pointer'],
      [fileBuffer]
    );
    this.SweModule._free(fileBuffer);
    return result;
  }

  get_planet_name(planetId) {
    const bufPtr = this.SweModule._malloc(256);
    this.SweModule.ccall('swe_get_planet_name', 'void', ['number', 'pointer'], [planetId, bufPtr]);
    const name = this.SweModule.UTF8ToString(bufPtr);
    this.SweModule._free(bufPtr);
    return name;
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
    const resultPtr = this.SweModule._malloc(8);
    const errorPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_get_ayanamsa_ex',
      'number',
      ['number', 'number', 'pointer', 'pointer'],
      [julianDay, ephemerisFlag, resultPtr, errorPtr]
    );
    const result = this.SweModule.HEAPF64[resultPtr / 8];
    this.SweModule._free(resultPtr);
    this.SweModule._free(errorPtr);
    return retFlag < 0 ? null : result;
  }

  get_ayanamsa_ex_ut(julianDay, ephemerisFlag) {
    const resultPtr = this.SweModule._malloc(8);
    const errorPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_get_ayanamsa_ex_ut',
      'number',
      ['number', 'number', 'pointer', 'pointer'],
      [julianDay, ephemerisFlag, resultPtr, errorPtr]
    );
    const result = this.SweModule.HEAPF64[resultPtr / 8];
    this.SweModule._free(resultPtr);
    this.SweModule._free(errorPtr);
    return retFlag < 0 ? null : result;
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
    const xnascPtr = this.SweModule._malloc(6 * 8);
    const xndscPtr = this.SweModule._malloc(6 * 8);
    const xperiPtr = this.SweModule._malloc(6 * 8);
    const xaphePtr = this.SweModule._malloc(6 * 8);
    const serrPtr = this.SweModule._malloc(256);

    const retFlag = this.SweModule.ccall(
      fnName,
      'number',
      ['number', 'number', 'number', 'number', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer'],
      [julianDay, planet, flags, method, xnascPtr, xndscPtr, xperiPtr, xaphePtr, serrPtr]
    );

    const freeAll = () => {
      this.SweModule._free(xnascPtr);
      this.SweModule._free(xndscPtr);
      this.SweModule._free(xperiPtr);
      this.SweModule._free(xaphePtr);
      this.SweModule._free(serrPtr);
    };

    if (retFlag < 0) {
      this.#captureError(serrPtr);
      freeAll();
      return { error: retFlag };
    }
    this.#lastError = '';

    const buf = this.SweModule.HEAPF64.buffer;
    const ascending = new Float64Array(buf, xnascPtr, 6).slice();
    const descending = new Float64Array(buf, xndscPtr, 6).slice();
    const perihelion = new Float64Array(buf, xperiPtr, 6).slice();
    const aphelion = new Float64Array(buf, xaphePtr, 6).slice();
    freeAll();

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
  }

  nod_aps(julianDay, planet, flags, method) {
    return this.#nodAps('swe_nod_aps', julianDay, planet, flags, method);
  }

  nod_aps_ut(julianDay, planet, flags, method) {
    return this.#nodAps('swe_nod_aps_ut', julianDay, planet, flags, method);
  }

  get_orbital_elements(julianDay, planet, flags) {
    const dretPtr = this.SweModule._malloc(50 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_get_orbital_elements',
      'number',
      ['number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, planet, flags, dretPtr, serrPtr]
    );
    const elements = new Float64Array(this.SweModule.HEAPF64.buffer, dretPtr, 50).slice();
    this.SweModule._free(dretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : elements;
  }

  orbit_max_min_true_distance(julianDay, planet, flags) {
    const dmaxPtr = this.SweModule._malloc(8);
    const dminPtr = this.SweModule._malloc(8);
    const dtruePtr = this.SweModule._malloc(8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_orbit_max_min_true_distance',
      'number',
      ['number', 'number', 'number', 'pointer', 'pointer', 'pointer', 'pointer'],
      [julianDay, planet, flags, dmaxPtr, dminPtr, dtruePtr, serrPtr]
    );
    const HEAPF64 = this.SweModule.HEAPF64;
    const result = {
      maxDistance: HEAPF64[dmaxPtr >> 3],
      minDistance: HEAPF64[dminPtr >> 3],
      trueDistance: HEAPF64[dtruePtr >> 3],
    };
    this.SweModule._free(dmaxPtr);
    this.SweModule._free(dminPtr);
    this.SweModule._free(dtruePtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : result;
  }

  heliacal_ut(julianDayStart, geoPos, atmosData, observerData, objectName, eventType, flags) {
    const geoPtr = this.#allocDoubles(geoPos);
    const atmPtr = this.#allocDoubles(atmosData);
    const obsPtr = this.#allocDoubles(observerData);
    const namePtr = this.SweModule._malloc(objectName.length + 1);
    this.SweModule.stringToUTF8(objectName, namePtr, objectName.length + 1);
    const dretPtr = this.SweModule._malloc(50 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_heliacal_ut',
      'number',
      ['number', 'pointer', 'pointer', 'pointer', 'pointer', 'number', 'number', 'pointer', 'pointer'],
      [julianDayStart, geoPtr, atmPtr, obsPtr, namePtr, eventType, flags, dretPtr, serrPtr]
    );
    const dret = new Float64Array(this.SweModule.HEAPF64.buffer, dretPtr, 50).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(atmPtr);
    this.SweModule._free(obsPtr);
    this.SweModule._free(namePtr);
    this.SweModule._free(dretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : dret;
  }

  heliacal_pheno_ut(julianDay, geoPos, atmosData, observerData, objectName, eventType, heliacalFlag) {
    const geoPtr = this.#allocDoubles(geoPos);
    const atmPtr = this.#allocDoubles(atmosData);
    const obsPtr = this.#allocDoubles(observerData);
    const namePtr = this.SweModule._malloc(objectName.length + 1);
    this.SweModule.stringToUTF8(objectName, namePtr, objectName.length + 1);
    const darrPtr = this.SweModule._malloc(50 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_heliacal_pheno_ut',
      'number',
      ['number', 'pointer', 'pointer', 'pointer', 'pointer', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, geoPtr, atmPtr, obsPtr, namePtr, eventType, heliacalFlag, darrPtr, serrPtr]
    );
    const darr = new Float64Array(this.SweModule.HEAPF64.buffer, darrPtr, 50).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(atmPtr);
    this.SweModule._free(obsPtr);
    this.SweModule._free(namePtr);
    this.SweModule._free(darrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : darr;
  }

  vis_limit_mag(julianDay, geoPos, atmosData, observerData, objectName, heliacalFlag) {
    const geoPtr = this.#allocDoubles(geoPos);
    const atmPtr = this.#allocDoubles(atmosData);
    const obsPtr = this.#allocDoubles(observerData);
    const namePtr = this.SweModule._malloc(objectName.length + 1);
    this.SweModule.stringToUTF8(objectName, namePtr, objectName.length + 1);
    const dretPtr = this.SweModule._malloc(10 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_vis_limit_mag',
      'number',
      ['number', 'pointer', 'pointer', 'pointer', 'pointer', 'number', 'pointer', 'pointer'],
      [julianDay, geoPtr, atmPtr, obsPtr, namePtr, heliacalFlag, dretPtr, serrPtr]
    );
    const dret = new Float64Array(this.SweModule.HEAPF64.buffer, dretPtr, 10).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(atmPtr);
    this.SweModule._free(obsPtr);
    this.SweModule._free(namePtr);
    this.SweModule._free(dretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : dret;
  }

  houses(julianDay, geoLat, geoLon, houseSystem) {
    const cuspsPtr = this.SweModule._malloc(13 * 8); // 13 doubles
    const ascmcPtr = this.SweModule._malloc(10 * 8); // 10 doubles
    
    this.SweModule.ccall(
      'swe_houses',
      'number',
      ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, geoLat, geoLon, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
    );

    const cusps = new Float64Array(this.SweModule.HEAPF64.buffer, cuspsPtr, 13).slice();
    const ascmc = new Float64Array(this.SweModule.HEAPF64.buffer, ascmcPtr, 10).slice();
    
    this.SweModule._free(cuspsPtr);
    this.SweModule._free(ascmcPtr);
    
    return { cusps, ascmc };
  }

  houses_ex(julianDay, iflag, geoLat, geoLon, houseSystem) {
    const cuspsPtr = this.SweModule._malloc(13 * 8);
    const ascmcPtr = this.SweModule._malloc(10 * 8);
    
    this.SweModule.ccall(
      'swe_houses_ex',
      'number',
      ['number', 'number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, iflag, geoLat, geoLon, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
    );

    const cusps = new Float64Array(this.SweModule.HEAPF64.buffer, cuspsPtr, 13).slice();
    const ascmc = new Float64Array(this.SweModule.HEAPF64.buffer, ascmcPtr, 10).slice();
    
    this.SweModule._free(cuspsPtr);
    this.SweModule._free(ascmcPtr);
    
    return { cusps, ascmc };
  }

  houses_ex2(julianDay, iflag, geoLat, geoLon, houseSystem) {
    const cuspsPtr = this.SweModule._malloc(13 * 8);
    const ascmcPtr = this.SweModule._malloc(10 * 8);
    
    this.SweModule.ccall(
      'swe_houses_ex2',
      'number',
      ['number', 'number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, iflag, geoLat, geoLon, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
    );

    const cusps = new Float64Array(this.SweModule.HEAPF64.buffer, cuspsPtr, 13).slice();
    const ascmc = new Float64Array(this.SweModule.HEAPF64.buffer, ascmcPtr, 10).slice();
    
    this.SweModule._free(cuspsPtr);
    this.SweModule._free(ascmcPtr);
    
    return { cusps, ascmc };
  }

  houses_armc(armc, geoLat, eps, houseSystem) {
    const cuspsPtr = this.SweModule._malloc(13 * 8);
    const ascmcPtr = this.SweModule._malloc(10 * 8);
    
    this.SweModule.ccall(
      'swe_houses_armc',
      'number',
      ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [armc, geoLat, eps, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
    );

    const cusps = new Float64Array(this.SweModule.HEAPF64.buffer, cuspsPtr, 13).slice();
    const ascmc = new Float64Array(this.SweModule.HEAPF64.buffer, ascmcPtr, 10).slice();
    
    this.SweModule._free(cuspsPtr);
    this.SweModule._free(ascmcPtr);
    
    return { cusps, ascmc };
  }

  houses_armc_ex2(armc, geoLat, eps, houseSystem) {
    const cuspsPtr = this.SweModule._malloc(13 * 8);
    const ascmcPtr = this.SweModule._malloc(10 * 8);
    
    this.SweModule.ccall(
      'swe_houses_armc_ex2',
      'number',
      ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [armc, geoLat, eps, houseSystem.charCodeAt(0), cuspsPtr, ascmcPtr]
    );

    const cusps = new Float64Array(this.SweModule.HEAPF64.buffer, cuspsPtr, 13).slice();
    const ascmc = new Float64Array(this.SweModule.HEAPF64.buffer, ascmcPtr, 10).slice();
    
    this.SweModule._free(cuspsPtr);
    this.SweModule._free(ascmcPtr);
    
    return { cusps, ascmc };
  }

  // swe_sol_eclipse_where(tjd, ifl, double *geopos[out], double *attr[out], serr)
  // geopos = [lon, lat] of greatest eclipse; attr = 20 eclipse attributes.
  sol_eclipse_where(julianDay, flags) {
    const geoPtr = this.SweModule._malloc(10 * 8);
    const attrPtr = this.SweModule._malloc(20 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_sol_eclipse_where',
      'number',
      ['number', 'number', 'pointer', 'pointer', 'pointer'],
      [julianDay, flags, geoPtr, attrPtr, serrPtr]
    );
    const buf = this.SweModule.HEAPF64.buffer;
    const geopos = new Float64Array(buf, geoPtr, 10).slice();
    const attr = new Float64Array(buf, attrPtr, 20).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(attrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, geopos, attr };
  }

  // swe_lun_occult_where(tjd, ipl, starname, ifl, double *geopos[out], double *attr[out], serr)
  lun_occult_where(julianDay, planet, starName, flags) {
    const name = starName || '';
    const nameBuf = this.SweModule._malloc(name.length + 1);
    this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
    const geoPtr = this.SweModule._malloc(10 * 8);
    const attrPtr = this.SweModule._malloc(20 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_lun_occult_where',
      'number',
      ['number', 'number', 'pointer', 'number', 'pointer', 'pointer', 'pointer'],
      [julianDay, planet, nameBuf, flags, geoPtr, attrPtr, serrPtr]
    );
    const buf = this.SweModule.HEAPF64.buffer;
    const geopos = new Float64Array(buf, geoPtr, 10).slice();
    const attr = new Float64Array(buf, attrPtr, 20).slice();
    this.SweModule._free(nameBuf);
    this.SweModule._free(geoPtr);
    this.SweModule._free(attrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, geopos, attr };
  }

  // swe_sol_eclipse_how(tjd, ifl, double *geopos[in], double *attr[out], serr)
  // geopos = [lon, lat, alt] of the observer.
  sol_eclipse_how(julianDay, flags, geopos) {
    const geoPtr = this.#allocDoubles(geopos);
    const attrPtr = this.SweModule._malloc(20 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_sol_eclipse_how',
      'number',
      ['number', 'number', 'pointer', 'pointer', 'pointer'],
      [julianDay, flags, geoPtr, attrPtr, serrPtr]
    );
    const attr = new Float64Array(this.SweModule.HEAPF64.buffer, attrPtr, 20).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(attrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, attr };
  }

  // swe_sol_eclipse_when_loc(tjd_start, ifl, geopos[in], tret[out], attr[out], backward, serr)
  sol_eclipse_when_loc(julianDayStart, flags, geopos, backward) {
    const geoPtr = this.#allocDoubles(geopos);
    const tretPtr = this.SweModule._malloc(10 * 8);
    const attrPtr = this.SweModule._malloc(20 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_sol_eclipse_when_loc',
      'number',
      ['number', 'number', 'pointer', 'pointer', 'pointer', 'number', 'pointer'],
      [julianDayStart, flags, geoPtr, tretPtr, attrPtr, backward, serrPtr]
    );
    const buf = this.SweModule.HEAPF64.buffer;
    const tret = new Float64Array(buf, tretPtr, 10).slice();
    const attr = new Float64Array(buf, attrPtr, 20).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(tretPtr);
    this.SweModule._free(attrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, tret, attr };
  }

  // swe_lun_occult_when_loc(tjd_start, ipl, starname, ifl, geopos[in], tret[out], attr[out], backward, serr)
  lun_occult_when_loc(julianDayStart, planet, starName, flags, geopos, backward) {
    const name = starName || '';
    const nameBuf = this.SweModule._malloc(name.length + 1);
    this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
    const geoPtr = this.#allocDoubles(geopos);
    const tretPtr = this.SweModule._malloc(10 * 8);
    const attrPtr = this.SweModule._malloc(20 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_lun_occult_when_loc',
      'number',
      ['number', 'number', 'pointer', 'number', 'pointer', 'pointer', 'pointer', 'number', 'pointer'],
      [julianDayStart, planet, nameBuf, flags, geoPtr, tretPtr, attrPtr, backward, serrPtr]
    );
    const buf = this.SweModule.HEAPF64.buffer;
    const tret = new Float64Array(buf, tretPtr, 10).slice();
    const attr = new Float64Array(buf, attrPtr, 20).slice();
    this.SweModule._free(nameBuf);
    this.SweModule._free(geoPtr);
    this.SweModule._free(tretPtr);
    this.SweModule._free(attrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, tret, attr };
  }

  // swe_sol_eclipse_when_glob(tjd_start, ifl, ifltype, tret[out], backward, serr)
  sol_eclipse_when_glob(julianDayStart, flags, eclipseType, backward) {
    const tretPtr = this.SweModule._malloc(10 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_sol_eclipse_when_glob',
      'number',
      ['number', 'number', 'number', 'pointer', 'number', 'pointer'],
      [julianDayStart, flags, eclipseType, tretPtr, backward, serrPtr]
    );
    const tret = new Float64Array(this.SweModule.HEAPF64.buffer, tretPtr, 10).slice();
    this.SweModule._free(tretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, tret };
  }

  // swe_lun_occult_when_glob(tjd_start, ipl, starname, ifl, ifltype, tret[out], backward, serr)
  lun_occult_when_glob(julianDayStart, planet, starName, flags, eclipseType, backward) {
    const name = starName || '';
    const nameBuf = this.SweModule._malloc(name.length + 1);
    this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
    const tretPtr = this.SweModule._malloc(10 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_lun_occult_when_glob',
      'number',
      ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'pointer'],
      [julianDayStart, planet, nameBuf, flags, eclipseType, tretPtr, backward, serrPtr]
    );
    const tret = new Float64Array(this.SweModule.HEAPF64.buffer, tretPtr, 10).slice();
    this.SweModule._free(nameBuf);
    this.SweModule._free(tretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, tret };
  }

  // swe_lun_eclipse_how(tjd_ut, ifl, double *geopos[in], double *attr[out], serr)
  lun_eclipse_how(julianDay, flags, geopos) {
    const geoPtr = this.#allocDoubles(geopos);
    const attrPtr = this.SweModule._malloc(20 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_lun_eclipse_how',
      'number',
      ['number', 'number', 'pointer', 'pointer', 'pointer'],
      [julianDay, flags, geoPtr, attrPtr, serrPtr]
    );
    const attr = new Float64Array(this.SweModule.HEAPF64.buffer, attrPtr, 20).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(attrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, attr };
  }

  // swe_lun_eclipse_when(tjd_start, ifl, ifltype, tret[out], backward, serr)
  lun_eclipse_when(julianDayStart, flags, eclipseType, backward) {
    const tretPtr = this.SweModule._malloc(10 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_lun_eclipse_when',
      'number',
      ['number', 'number', 'number', 'pointer', 'number', 'pointer'],
      [julianDayStart, flags, eclipseType, tretPtr, backward, serrPtr]
    );
    const tret = new Float64Array(this.SweModule.HEAPF64.buffer, tretPtr, 10).slice();
    this.SweModule._free(tretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, tret };
  }

  // swe_lun_eclipse_when_loc(tjd_start, ifl, geopos[in], tret[out], attr[out], backward, serr)
  lun_eclipse_when_loc(julianDayStart, flags, geopos, backward) {
    const geoPtr = this.#allocDoubles(geopos);
    const tretPtr = this.SweModule._malloc(10 * 8);
    const attrPtr = this.SweModule._malloc(20 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_lun_eclipse_when_loc',
      'number',
      ['number', 'number', 'pointer', 'pointer', 'pointer', 'number', 'pointer'],
      [julianDayStart, flags, geoPtr, tretPtr, attrPtr, backward, serrPtr]
    );
    const buf = this.SweModule.HEAPF64.buffer;
    const tret = new Float64Array(buf, tretPtr, 10).slice();
    const attr = new Float64Array(buf, attrPtr, 20).slice();
    this.SweModule._free(geoPtr);
    this.SweModule._free(tretPtr);
    this.SweModule._free(attrPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : { retFlag, tret, attr };
  }

  pheno(julianDay, planet, flags) {
    const resultPtr = this.SweModule._malloc(8 * Float64Array.BYTES_PER_ELEMENT);
    const retFlag = this.SweModule.ccall(
      'swe_pheno',
      'number',
      ['number', 'number', 'number', 'pointer'],
      [julianDay, planet, flags, resultPtr]
    );
    const results = new Float64Array(this.SweModule.HEAPF64.buffer, resultPtr, 8).slice();
    this.SweModule._free(resultPtr);
    return retFlag < 0 ? null : results;
  }

  pheno_ut(julianDay, planet, flags) {
    const resultPtr = this.SweModule._malloc(8 * Float64Array.BYTES_PER_ELEMENT);
    const retFlag = this.SweModule.ccall(
      'swe_pheno_ut',
      'number',
      ['number', 'number', 'number', 'pointer'],
      [julianDay, planet, flags, resultPtr]
    );
    const results = new Float64Array(this.SweModule.HEAPF64.buffer, resultPtr, 8).slice();
    this.SweModule._free(resultPtr);
    return retFlag < 0 ? null : results;
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
    const dretPtr = this.SweModule._malloc(4 * Float64Array.BYTES_PER_ELEMENT);
    const converted = this.SweModule.ccall(
      'swe_refrac_extended',
      'number',
      ['number', 'number', 'number', 'number', 'number', 'number', 'pointer'],
      [inalt, geoalt, atpress, attemp, lapseRate, calcFlag, dretPtr]
    );
    const dret = new Float64Array(this.SweModule.HEAPF64.buffer, dretPtr, 4).slice();
    this.SweModule._free(dretPtr);
    return {
      converted,
      trueAltitude: dret[0],
      apparentAltitude: dret[1],
      refraction: dret[2],
      dip: dret[3],
    };
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
    const xazPtr = this.SweModule._malloc(3 * 8);
    const xinPtr = this.SweModule._malloc(3 * 8);
    const geoposPtr = this.SweModule._malloc(3 * 8);
    
    // Copy input coordinates
    const HEAPF64 = this.SweModule.HEAPF64;
    HEAPF64[xinPtr >> 3] = xin[0];
    HEAPF64[(xinPtr >> 3) + 1] = xin[1];
    HEAPF64[(xinPtr >> 3) + 2] = xin[2];
    
    HEAPF64[geoposPtr >> 3] = geopos[0];
    HEAPF64[(geoposPtr >> 3) + 1] = geopos[1];
    HEAPF64[(geoposPtr >> 3) + 2] = geopos[2];
    
    this.SweModule.ccall(
      'swe_azalt',
      'void',
      ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'pointer'],
      [tjd_ut, calc_flag, geoposPtr, atpress, attemp, xinPtr, xazPtr]
    );
    
    const result = {
      azimuth: HEAPF64[xazPtr >> 3],
      trueAltitude: HEAPF64[(xazPtr >> 3) + 1],
      apparentAltitude: HEAPF64[(xazPtr >> 3) + 2],
    };
    
    this.SweModule._free(xazPtr);
    this.SweModule._free(xinPtr);
    this.SweModule._free(geoposPtr);
    
    return result;
  }

  azalt_rev(tjd_ut, calc_flag, geopos, xin) {
    const xoutPtr = this.SweModule._malloc(3 * 8);
    const xinPtr = this.SweModule._malloc(3 * 8);
    const geoposPtr = this.SweModule._malloc(3 * 8);
    
    // Copy input coordinates
    const HEAPF64 = this.SweModule.HEAPF64;
    HEAPF64[xinPtr >> 3] = xin[0];
    HEAPF64[(xinPtr >> 3) + 1] = xin[1];
    HEAPF64[(xinPtr >> 3) + 2] = xin[2];
    
    HEAPF64[geoposPtr >> 3] = geopos[0];
    HEAPF64[(geoposPtr >> 3) + 1] = geopos[1];
    HEAPF64[(geoposPtr >> 3) + 2] = geopos[2];
    
    this.SweModule.ccall(
      'swe_azalt_rev',
      'void',
      ['number', 'number', 'pointer', 'pointer', 'pointer'],
      [tjd_ut, calc_flag, geoposPtr, xinPtr, xoutPtr]
    );
    
    const result = {
      ra: HEAPF64[xoutPtr >> 3],
      dec: HEAPF64[(xoutPtr >> 3) + 1],
      distance: HEAPF64[(xoutPtr >> 3) + 2],
    };
    
    this.SweModule._free(xoutPtr);
    this.SweModule._free(xinPtr);
    this.SweModule._free(geoposPtr);
    
    return result;
  }

  // swe_rise_trans(tjd_ut, ipl, starname, epheflag, rsmi, geopos[3], atpress,
  //   attemp, double *tret[out], serr). rsmi selects rise/set/transit
  // (SE_CALC_RISE, SE_CALC_SET, SE_CALC_MTRANSIT, SE_CALC_ITRANSIT).
  // geopos = [lon, lat, alt]. Returns tret (event time in tret[0]) or null.
  rise_trans(julianDay, planet, starName, epheFlag, rsmi, geopos, atpress, attemp) {
    const name = starName || '';
    const nameBuf = this.SweModule._malloc(name.length + 1);
    this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
    const geoPtr = this.#allocDoubles(geopos);
    const tretPtr = this.SweModule._malloc(10 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_rise_trans',
      'number',
      ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, planet, nameBuf, epheFlag, rsmi, geoPtr, atpress, attemp, tretPtr, serrPtr]
    );
    const tret = new Float64Array(this.SweModule.HEAPF64.buffer, tretPtr, 10).slice();
    this.SweModule._free(nameBuf);
    this.SweModule._free(geoPtr);
    this.SweModule._free(tretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : tret;
  }

  // As rise_trans, but with an explicit horizon height (horhgt, in degrees).
  rise_trans_true_hor(julianDay, planet, starName, epheFlag, rsmi, geopos, atpress, attemp, horhgt) {
    const name = starName || '';
    const nameBuf = this.SweModule._malloc(name.length + 1);
    this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
    const geoPtr = this.#allocDoubles(geopos);
    const tretPtr = this.SweModule._malloc(10 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_rise_trans_true_hor',
      'number',
      ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, planet, nameBuf, epheFlag, rsmi, geoPtr, atpress, attemp, horhgt, tretPtr, serrPtr]
    );
    const tret = new Float64Array(this.SweModule.HEAPF64.buffer, tretPtr, 10).slice();
    this.SweModule._free(nameBuf);
    this.SweModule._free(geoPtr);
    this.SweModule._free(tretPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : tret;
  }

  // Delta T with an explicit ephemeris flag (recommended over deltat()).
  deltat_ex(julianDay, ephemerisFlag) {
    const serrPtr = this.SweModule._malloc(256);
    const result = this.SweModule.ccall(
      'swe_deltat_ex',
      'number',
      ['number', 'number', 'pointer'],
      [julianDay, ephemerisFlag, serrPtr]
    );
    this.SweModule._free(serrPtr);
    return result;
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
    const serrPtr = this.SweModule._malloc(256);
    const jd = this.SweModule.ccall(
      fnName,
      'number',
      ['number', 'number', 'number', 'pointer'],
      [x2cross, julianDay, flags, serrPtr]
    );
    this.SweModule._free(serrPtr);
    return jd;
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
    const xlonPtr = this.SweModule._malloc(8);
    const xlatPtr = this.SweModule._malloc(8);
    const serrPtr = this.SweModule._malloc(256);
    const jd = this.SweModule.ccall(
      fnName,
      'number',
      ['number', 'number', 'pointer', 'pointer', 'pointer'],
      [julianDay, flags, xlonPtr, xlatPtr, serrPtr]
    );
    const HEAPF64 = this.SweModule.HEAPF64;
    const lon = HEAPF64[xlonPtr >> 3];
    const lat = HEAPF64[xlatPtr >> 3];
    this.SweModule._free(xlonPtr);
    this.SweModule._free(xlatPtr);
    this.SweModule._free(serrPtr);
    return { jd, lon, lat };
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
    const jdPtr = this.SweModule._malloc(8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      fnName,
      'number',
      ['number', 'number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [planet, x2cross, julianDay, flags, direction, jdPtr, serrPtr]
    );
    const jd = this.SweModule.HEAPF64[jdPtr >> 3];
    if (retFlag < 0) this.#captureError(serrPtr); else this.#lastError = '';
    this.SweModule._free(jdPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : jd;
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
    const nameBuf = this.SweModule._malloc(name.length + 1);
    this.SweModule.stringToUTF8(name, nameBuf, name.length + 1);
    const geoPtr = this.#allocDoubles(geopos);
    const dgsectPtr = this.SweModule._malloc(8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_gauquelin_sector',
      'number',
      ['number', 'number', 'pointer', 'number', 'number', 'pointer', 'number', 'number', 'pointer', 'pointer'],
      [t_ut, planet, nameBuf, flags, method, geoPtr, atpress, attemp, dgsectPtr, serrPtr]
    );
    const dgsect = this.SweModule.HEAPF64[dgsectPtr >> 3];
    this.SweModule._free(nameBuf);
    this.SweModule._free(geoPtr);
    this.SweModule._free(dgsectPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : dgsect;
  }

  // Planetocentric position: planet as seen from body `center`. Returns 6
  // values (like calc) or null on error.
  calc_pctr(julianDay, planet, center, flags) {
    const resultPtr = this.SweModule._malloc(6 * 8);
    const serrPtr = this.SweModule._malloc(256);
    const retFlag = this.SweModule.ccall(
      'swe_calc_pctr',
      'number',
      ['number', 'number', 'number', 'number', 'pointer', 'pointer'],
      [julianDay, planet, center, flags, resultPtr, serrPtr]
    );
    const results = new Float64Array(this.SweModule.HEAPF64.buffer, resultPtr, 6).slice();
    this.SweModule._free(resultPtr);
    this.SweModule._free(serrPtr);
    return retFlag < 0 ? null : results;
  }

  // Local apparent time -> local mean time. Returns the resulting Julian Day.
  lat_to_lmt(julianDayLat, geoLon) {
    const outPtr = this.SweModule._malloc(8);
    const serrPtr = this.SweModule._malloc(256);
    this.SweModule.ccall(
      'swe_lat_to_lmt',
      'number',
      ['number', 'number', 'pointer', 'pointer'],
      [julianDayLat, geoLon, outPtr, serrPtr]
    );
    const result = this.SweModule.HEAPF64[outPtr >> 3];
    this.SweModule._free(outPtr);
    this.SweModule._free(serrPtr);
    return result;
  }

  // Local mean time -> local apparent time. Returns the resulting Julian Day.
  lmt_to_lat(julianDayLmt, geoLon) {
    const outPtr = this.SweModule._malloc(8);
    const serrPtr = this.SweModule._malloc(256);
    this.SweModule.ccall(
      'swe_lmt_to_lat',
      'number',
      ['number', 'number', 'pointer', 'pointer'],
      [julianDayLmt, geoLon, outPtr, serrPtr]
    );
    const result = this.SweModule.HEAPF64[outPtr >> 3];
    this.SweModule._free(outPtr);
    this.SweModule._free(serrPtr);
    return result;
  }

  // Path of the loaded Swiss Ephemeris shared library / module.
  get_library_path() {
    const bufPtr = this.SweModule._malloc(256);
    const result = this.SweModule.ccall('swe_get_library_path', 'string', ['pointer'], [bufPtr]);
    this.SweModule._free(bufPtr);
    return result;
  }

  // Metadata of a currently open ephemeris file (0 = planet, 1 = moon, etc.).
  get_current_file_data(fileIndex) {
    const startPtr = this.SweModule._malloc(8);
    const endPtr = this.SweModule._malloc(8);
    const denumPtr = this.SweModule._malloc(4);
    const path = this.SweModule.ccall(
      'swe_get_current_file_data',
      'string',
      ['number', 'pointer', 'pointer', 'pointer'],
      [fileIndex, startPtr, endPtr, denumPtr]
    );
    const HEAPF64 = this.SweModule.HEAPF64;
    const HEAP32 = new Int32Array(this.SweModule.HEAPF64.buffer);
    const result = {
      path,
      start: HEAPF64[startPtr >> 3],
      end: HEAPF64[endPtr >> 3],
      denum: HEAP32[denumPtr >> 2],
    };
    this.SweModule._free(startPtr);
    this.SweModule._free(endPtr);
    this.SweModule._free(denumPtr);
    return result;
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
    const samodPtr = this.SweModule._malloc(256);
    const sdetPtr = this.SweModule._malloc(256);
    this.SweModule.stringToUTF8('', samodPtr, 1); // empty input -> report defaults
    this.SweModule.ccall(
      'swe_get_astro_models',
      'void',
      ['pointer', 'pointer', 'number'],
      [samodPtr, sdetPtr, flags]
    );
    const models = this.SweModule.UTF8ToString(samodPtr);
    const details = this.SweModule.UTF8ToString(sdetPtr);
    this.SweModule._free(samodPtr);
    this.SweModule._free(sdetPtr);
    return { models, details };
  }

  // Select astronomical models (precession, nutation, ...).
  set_astro_models(models, flags) {
    const buf = this.SweModule._malloc(models.length + 1);
    this.SweModule.stringToUTF8(models, buf, models.length + 1);
    this.SweModule.ccall('swe_set_astro_models', 'void', ['pointer', 'number'], [buf, flags]);
    this.SweModule._free(buf);
  }

}

export default SwissEph;