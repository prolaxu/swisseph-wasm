/**
 * Swiss Ephemeris WebAssembly TypeScript Definitions
 * High-precision astronomical calculations for JavaScript
 */

declare module 'swisseph-wasm' {
  /**
   * Main Swiss Ephemeris class
   */
  export default class SwissEph {
    // Constants - Planets
    readonly SE_SUN: 0;
    readonly SE_MOON: 1;
    readonly SE_MERCURY: 2;
    readonly SE_VENUS: 3;
    readonly SE_MARS: 4;
    readonly SE_JUPITER: 5;
    readonly SE_SATURN: 6;
    readonly SE_URANUS: 7;
    readonly SE_NEPTUNE: 8;
    readonly SE_PLUTO: 9;
    readonly SE_EARTH: 14;

    // Constants - Lunar Nodes
    readonly SE_MEAN_NODE: 10;
    readonly SE_TRUE_NODE: 11;
    readonly SE_MEAN_APOG: 12;
    readonly SE_OSCU_APOG: 13;

    // Constants - Asteroids
    readonly SE_CHIRON: 15;
    readonly SE_PHOLUS: 16;
    readonly SE_CERES: 17;
    readonly SE_PALLAS: 18;
    readonly SE_JUNO: 19;
    readonly SE_VESTA: 20;

    // Constants - Calculation Flags
    readonly SEFLG_JPLEPH: 1;
    readonly SEFLG_SWIEPH: 2;
    readonly SEFLG_MOSEPH: 4;
    readonly SEFLG_HELCTR: 8;
    readonly SEFLG_TRUEPOS: 16;
    readonly SEFLG_J2000: 32;
    readonly SEFLG_NONUT: 64;
    readonly SEFLG_SPEED: 256;
    readonly SEFLG_NOGDEFL: 512;
    readonly SEFLG_NOABERR: 1024;
    readonly SEFLG_EQUATORIAL: 2048;
    readonly SEFLG_XYZ: 4096;
    readonly SEFLG_RADIANS: 8192;
    readonly SEFLG_BARYCTR: 16384;
    readonly SEFLG_TOPOCTR: 32768;
    readonly SEFLG_SIDEREAL: 65536;

    // Constants - Sidereal Modes
    readonly SE_SIDM_FAGAN_BRADLEY: 0;
    readonly SE_SIDM_LAHIRI: 1;
    readonly SE_SIDM_DELUCE: 2;
    readonly SE_SIDM_RAMAN: 3;
    readonly SE_SIDM_KRISHNAMURTI: 5;

    // Constants - Calendar Types
    readonly SE_JUL_CAL: 0;
    readonly SE_GREG_CAL: 1;

    // Constants - Degree Splitting
    readonly SE_SPLIT_DEG_ROUND_SEC: 1;
    readonly SE_SPLIT_DEG_ROUND_MIN: 2;
    readonly SE_SPLIT_DEG_ROUND_DEG: 4;
    readonly SE_SPLIT_DEG_ZODIACAL: 8;

    /**
     * Initialize the Swiss Ephemeris WebAssembly module
     */
    initSwissEph(): Promise<void>;

    /**
     * Calculate Julian Day Number
     */
    julday(year: number, month: number, day: number, hour: number): number;

    /**
     * Calculate planetary positions (Universal Time)
     */
    calc_ut(jd: number, planet: number, flags: number): Float64Array;

    /**
     * Calculate planetary positions with detailed output
     */
    calc(jd: number, planet: number, flags: number): {
      longitude: number;
      latitude: number;
      distance: number;
      longitudeSpeed: number;
      latitudeSpeed: number;
      distanceSpeed: number;
    };

    /**
     * Calculate Delta T (difference between Terrestrial Time and Universal Time)
     */
    deltat(jd: number): number;

    /**
     * Calculate sidereal time
     */
    sidtime(jd: number): number;

    /**
     * Convert UTC time to Julian Day
     */
    utc_to_jd(year: number, month: number, day: number, hour: number, minute: number, second: number, gregflag: number): {
      julianDayET: number;
      julianDayUT: number;
    };

    /**
     * Convert Julian Day back to calendar date
     */
    revjul(jd: number, gregflag: number): {
      year: number;
      month: number;
      day: number;
      hour: number;
    };

    /**
     * Convert calendar date to Julian Day
     */
    date_conversion(year: number, month: number, day: number, hour: number, gregflag: number): number;

    /**
     * Normalize degrees to 0-360 range
     */
    degnorm(degrees: number): number;

    /**
     * Split decimal degrees into components
     */
    split_deg(degrees: number, roundflag: number): {
      degree: number;
      min: number;
      second: number;
      fraction: number;
      sign: number;
    };

    /**
     * Get day of week for Julian Day
     */
    day_of_week(jd: number): number;

    /**
     * Set sidereal calculation mode
     */
    set_sid_mode(sidmode: number, t0: number, ayan_t0: number): void;

    /**
     * Get ayanamsa value for sidereal calculations
     */
    get_ayanamsa(jd: number): number;

    /**
     * Get Swiss Ephemeris version
     */
    version(): string;

    /**
     * Get planet name
     */
    get_planet_name(planet: number): string;

    /**
     * Set topocentric location
     */
    set_topo(longitude: number, latitude: number, altitude: number): void;

    /**
     * Calculate fixed star positions. Returns null on error.
     */
    fixstar(starname: string, jd: number, flags: number): Float64Array | null;

    /**
     * Calculate fixed star positions (UT). Returns null on error.
     */
    fixstar_ut(starname: string, jd: number, flags: number): Float64Array | null;

    /**
     * Get fixed star magnitude. Returns null on error.
     */
    fixstar_mag(starname: string): number | null;

    /**
     * Calculate fixed star positions (faster catalog variant). Returns null on error.
     */
    fixstar2(starname: string, jd: number, flags: number): Float64Array | null;

    /**
     * Calculate fixed star positions (faster catalog variant, UT). Returns null on error.
     */
    fixstar2_ut(starname: string, jd: number, flags: number): Float64Array | null;

    /**
     * Get fixed star magnitude (faster catalog variant). Returns null on error.
     */
    fixstar2_mag(starname: string): number | null;

    /**
     * Calculate house cusps and ascendant/mc points
     */
    houses(jd: number, latitude: number, longitude: number, hsys: string): HousesResult;

    /**
     * Calculate house cusps with an ephemeris flag (e.g. sidereal)
     */
    houses_ex(jd: number, iflag: number, latitude: number, longitude: number, hsys: string): HousesResult;

    /**
     * Calculate house cusps (extended, with speeds available in the C API)
     */
    houses_ex2(jd: number, iflag: number, latitude: number, longitude: number, hsys: string): HousesResult;

    /**
     * Calculate house cusps directly from ARMC (sidereal time) and obliquity
     */
    houses_armc(armc: number, geolat: number, eps: number, hsys: string): HousesResult;

    /**
     * Calculate house cusps from ARMC (extended variant)
     */
    houses_armc_ex2(armc: number, geolat: number, eps: number, hsys: string): HousesResult;

    /**
     * Calculate house position for a planet
     */
    house_pos(armc: number, geolat: number, eps: number, hsys: string, lon: number, lat: number): number;

    /**
     * Convert ecliptic/equatorial coordinates to horizontal (azimuth/altitude)
     */
    azalt(tjd_ut: number, calc_flag: number, geopos: number[], atpress: number, attemp: number, xin: number[]): HorizontalCoordinates;

    /**
     * Convert horizontal coordinates back to ecliptic/equatorial
     */
    azalt_rev(tjd_ut: number, calc_flag: number, geopos: number[], xin: number[]): EquatorialCoordinates;

    /**
     * Calculate rise, set and transit times. Returns null on error.
     */
    rise_trans(jd: number, planet: number, longitude: number, latitude: number, altitude: number, flags: number): Float64Array | null;

    /**
     * Calculate rise/set/transit using true horizon. Returns null on error.
     */
    rise_trans_true_hor(jd: number, planet: number, longitude: number, latitude: number, altitude: number, flags: number): Float64Array | null;

    /**
     * Phase, phase angle, elongation, apparent diameter and magnitude (ET). Returns null on error.
     */
    pheno(jd: number, planet: number, flags: number): Float64Array | null;

    /**
     * Phase and related data (UT). Returns null on error.
     */
    pheno_ut(jd: number, planet: number, flags: number): Float64Array | null;

    /**
     * Atmospheric refraction. `calcFlag` is SE_TRUE_TO_APP or SE_APP_TO_TRUE.
     * Returns the converted altitude in degrees.
     */
    refrac(inalt: number, atpress: number, attemp: number, calcFlag: number): number;

    /**
     * Extended atmospheric refraction. Returns the converted altitude plus the
     * detailed dret components.
     */
    refrac_extended(inalt: number, geoalt: number, atpress: number, attemp: number, lapseRate: number, calcFlag: number): RefracExtendedResult;

    /**
     * Nodes and apsides (ET). Returns { error } on failure.
     */
    nod_aps(jd: number, planet: number, flags: number, method: number): NodesApsidesResult;

    /**
     * Nodes and apsides (UT). Returns { error } on failure.
     */
    nod_aps_ut(jd: number, planet: number, flags: number, method: number): NodesApsidesResult;

    /**
     * Osculating orbital elements (up to 50 values). Returns null on error.
     */
    get_orbital_elements(jd: number, planet: number, flags: number): Float64Array | null;

    /**
     * Max, min and true distance of a planet over its orbit. Returns null on error.
     */
    orbit_max_min_true_distance(jd: number, planet: number, flags: number): OrbitDistance | null;

    /**
     * Heliacal rising/setting event times. Returns null on error.
     * geoPos = [lon, lat, alt]; atmosData = [pressure, temp, humidity, meteoRange];
     * observerData = 6 observer parameters.
     */
    heliacal_ut(jdStart: number, geoPos: number[], atmosData: number[], observerData: number[], objectName: string, eventType: number, flags: number): Float64Array | null;

    /**
     * Heliacal phenomena details. Returns null on error.
     */
    heliacal_pheno_ut(jd: number, geoPos: number[], atmosData: number[], observerData: number[], objectName: string, eventType: number, heliacalFlag: number): Float64Array | null;

    /**
     * Visual limiting magnitude for an object. Returns null on error.
     */
    vis_limit_mag(jd: number, geoPos: number[], atmosData: number[], observerData: number[], objectName: string, heliacalFlag: number): Float64Array | null;

    /**
     * Geographic position where a solar eclipse is central/maximal. Returns null on error.
     */
    sol_eclipse_where(jd: number, flags: number): Float64Array | null;

    /**
     * Geographic position of a lunar occultation. Returns null on error.
     */
    lun_occult_where(jd: number, planet: number, starName: string, flags: number): Float64Array | null;

    /**
     * Attributes of a solar eclipse for a given location. Returns null on error.
     */
    sol_eclipse_how(jd: number, flags: number, longitude: number, latitude: number, altitude: number): Float64Array | null;

    /**
     * Local circumstances of the next/previous solar eclipse. Returns null on error.
     */
    sol_eclipse_when_loc(jdStart: number, flags: number, longitude: number, latitude: number, altitude: number, backward: number): Float64Array | null;

    /**
     * Local circumstances of the next/previous lunar occultation. Returns null on error.
     */
    lun_occult_when_loc(jdStart: number, planet: number, starName: string, flags: number, longitude: number, latitude: number, altitude: number, backward: number): Float64Array | null;

    /**
     * Global search for the next/previous solar eclipse. Returns null on error.
     */
    sol_eclipse_when_glob(jdStart: number, flags: number, eclipseType: number, backward: number): Float64Array | null;

    /**
     * Global search for the next/previous lunar occultation. Returns null on error.
     */
    lun_occult_when_glob(jdStart: number, planet: number, starName: string, flags: number, eclipseType: number, backward: number): Float64Array | null;

    /**
     * Attributes of a lunar eclipse for a given location. Returns null on error.
     */
    lun_eclipse_how(jd: number, flags: number, longitude: number, latitude: number, altitude: number): Float64Array | null;

    /**
     * Global search for the next/previous lunar eclipse. Returns null on error.
     */
    lun_eclipse_when(jdStart: number, flags: number, eclipseType: number, backward: number): Float64Array | null;

    /**
     * Local circumstances of the next/previous lunar eclipse. Returns null on error.
     */
    lun_eclipse_when_loc(jdStart: number, flags: number, longitude: number, latitude: number, altitude: number, backward: number): Float64Array | null;

    /**
     * Set the ephemeris file search path (virtual filesystem path, e.g. 'sweph')
     */
    set_ephe_path(path: string): string;

    /**
     * Set the JPL ephemeris file name
     */
    set_jpl_file(filename: string): string;

    /**
     * Set atmospheric lapse rate used by refraction
     */
    set_lapse_rate(lapseRate: number): void;

    /**
     * Get the current tidal acceleration of the Moon
     */
    get_tid_acc(): number;

    /**
     * Set the tidal acceleration of the Moon
     */
    set_tid_acc(acceleration: number): void;

    /**
     * Equation of time (difference between apparent and mean solar time)
     */
    time_equ(jd: number): number;

    /**
     * Sidereal time with explicit obliquity and nutation
     */
    sidtime0(jd: number, eps: number, nut: number): number;

    /**
     * Ayanamsa (UT)
     */
    get_ayanamsa_ut(jd: number): number;

    /**
     * Ayanamsa with ephemeris flag (ET). Returns null on error.
     */
    get_ayanamsa_ex(jd: number, ephemerisFlag: number): number | null;

    /**
     * Ayanamsa with ephemeris flag (UT). Returns null on error.
     */
    get_ayanamsa_ex_ut(jd: number, ephemerisFlag: number): number | null;

    /**
     * Name of a sidereal (ayanamsa) mode
     */
    get_ayanamsa_name(siderealMode: number): string;

    /**
     * Convert ET Julian Day to UTC calendar components
     */
    jdet_to_utc(jd: number, gregflag: number): UTCDateComponents;

    /**
     * Convert UT1 Julian Day to UTC calendar components
     */
    jdut1_to_utc(jd: number, gregflag: number): UTCDateComponents;

    /**
     * Apply a timezone offset to a UTC date, returning local calendar components
     */
    utc_time_zone(year: number, month: number, day: number, hour: number, minute: number, second: number, timezone: number): UTCDateComponents;

    /**
     * Transform ecliptic/equatorial coordinates (3 values in, 3 out)
     */
    cotrans(xpo: number[], eps: number): number[];

    /**
     * Transform coordinates including speed (6 values in, 6 out)
     */
    cotrans_sp(xpo: number[], eps: number): number[];

    /**
     * Normalize an angle in radians to [0, 2π)
     */
    radnorm(angle: number): number;

    /**
     * Midpoint of two angles in radians
     */
    rad_midp(x1: number, x2: number): number;

    /**
     * Midpoint of two angles in degrees
     */
    deg_midp(x1: number, x2: number): number;

    /**
     * Normalize centiseconds to [0, 360°)
     */
    csnorm(p: number): number;

    /**
     * Round centiseconds to the nearest second
     */
    csroundsec(x: number): number;

    /**
     * Round a double to a long (centiseconds helper)
     */
    d2l(x: number): number;

    /**
     * Difference of two angles in centiseconds, normalized [0, 360°)
     */
    difcsn(p1: number, p2: number): number;

    /**
     * Difference of two angles in degrees, normalized [0, 360°)
     */
    difdegn(p1: number, p2: number): number;

    /**
     * Difference of two angles in centiseconds, normalized [-180°, 180°)
     */
    difcs2n(p1: number, p2: number): number;

    /**
     * Difference of two angles in degrees, normalized [-180°, 180°)
     */
    difdeg2n(p1: number, p2: number): number;

    /**
     * Difference of two angles in radians, normalized [-π, π)
     */
    difrad2n(p1: number, p2: number): number;

    /**
     * Format centiseconds as a time string
     */
    cs2timestr(t: number, sep: string, suppressZero: boolean): string;

    /**
     * Format centiseconds as a longitude/latitude string
     */
    cs2lonlatstr(t: number, pChar: string, mChar: string): string;

    /**
     * Format centiseconds as a degree string
     */
    cs2degstr(t: number): string;

    /**
     * Delta T with an explicit ephemeris flag (recommended over deltat)
     */
    deltat_ex(jd: number, ephemerisFlag: number): number;

    /**
     * Name of a house system given its single-letter code (e.g. 'P')
     */
    house_name(hsys: string): string;

    /**
     * Julian Day (ET) when the Sun next crosses ecliptic longitude x2cross
     */
    solcross(x2cross: number, jdET: number, flags: number): number;

    /**
     * Julian Day (UT) when the Sun next crosses ecliptic longitude x2cross
     */
    solcross_ut(x2cross: number, jdUT: number, flags: number): number;

    /**
     * Julian Day (ET) when the Moon next crosses ecliptic longitude x2cross
     */
    mooncross(x2cross: number, jdET: number, flags: number): number;

    /**
     * Julian Day (UT) when the Moon next crosses ecliptic longitude x2cross
     */
    mooncross_ut(x2cross: number, jdUT: number, flags: number): number;

    /**
     * Julian Day (ET) when the Moon next crosses its node, with node position
     */
    mooncross_node(jdET: number, flags: number): MoonNodeCrossing;

    /**
     * Julian Day (UT) when the Moon next crosses its node, with node position
     */
    mooncross_node_ut(jdUT: number, flags: number): MoonNodeCrossing;

    /**
     * Julian Day (ET) when a planet crosses longitude x2cross heliocentrically.
     * Returns null on error.
     */
    helio_cross(planet: number, x2cross: number, jdET: number, flags: number, direction: number): number | null;

    /**
     * Julian Day (UT) when a planet crosses longitude x2cross heliocentrically.
     * Returns null on error.
     */
    helio_cross_ut(planet: number, x2cross: number, jdUT: number, flags: number, direction: number): number | null;

    /**
     * Gauquelin sector position of a planet or star. Returns null on error.
     */
    gauquelin_sector(t_ut: number, planet: number, starname: string, flags: number, method: number, geopos: number[], atpress: number, attemp: number): number | null;

    /**
     * Planetocentric position: planet as seen from body `center`. Returns 6
     * values (longitude, latitude, distance, and their speeds) or null on error.
     */
    calc_pctr(jd: number, planet: number, center: number, flags: number): Float64Array | null;

    /**
     * Local apparent time to local mean time. Returns the resulting Julian Day.
     */
    lat_to_lmt(jdLat: number, geolon: number): number;

    /**
     * Local mean time to local apparent time. Returns the resulting Julian Day.
     */
    lmt_to_lat(jdLmt: number, geolon: number): number;

    /**
     * Path of the loaded Swiss Ephemeris library/module
     */
    get_library_path(): string;

    /**
     * Metadata of a currently open ephemeris file (0 = planets, 1 = moon, ...)
     */
    get_current_file_data(fileIndex: number): CurrentFileData;

    /**
     * Set a user-defined Delta T value (in days)
     */
    set_delta_t_userdef(dt: number): void;

    /**
     * Enable or disable interpolation of nutation between tabulated values
     */
    set_interpolate_nut(doInterpolate: boolean): void;

    /**
     * Query the astronomical models (precession, nutation, ...) currently in use
     */
    get_astro_models(flags: number): AstroModels;

    /**
     * Select astronomical models (precession, nutation, ...)
     */
    set_astro_models(models: string, flags: number): void;

    /**
     * Close Swiss Ephemeris and free memory
     */
    close(): void;
  }

  /**
   * Planet position result from calc_ut
   */
  export interface PlanetPosition {
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
  }

  /**
   * Detailed planet position result from calc
   */
  export interface DetailedPlanetPosition {
    longitude: number;
    latitude: number;
    distance: number;
    longitudeSpeed: number;
    latitudeSpeed: number;
    distanceSpeed: number;
  }

  /**
   * Date components
   */
  export interface DateComponents {
    year: number;
    month: number;
    day: number;
    hour: number;
  }

  /**
   * Julian Day result from UTC conversion
   */
  export interface JulianDayResult {
    julianDayET: number;
    julianDayUT: number;
  }

  /**
   * Degree splitting result
   */
  export interface DegreeSplit {
    degree: number;
    min: number;
    second: number;
    fraction: number;
    sign: number;
  }

  /**
   * House calculation result.
   *
   * `cusps` holds 13 doubles; cusps[1]..cusps[12] are the house cusps in
   * degrees and cusps[0] is unused.
   *
   * `ascmc` holds 10 doubles:
   * [0] Ascendant, [1] MC, [2] ARMC, [3] Vertex, [4] equatorial ascendant,
   * [5] co-ascendant (Koch), [6] co-ascendant (Munkasey), [7] polar ascendant,
   * [8-9] reserved.
   */
  export interface HousesResult {
    cusps: Float64Array;
    ascmc: Float64Array;
  }

  /**
   * UTC calendar components (from jdet_to_utc / jdut1_to_utc / utc_time_zone)
   */
  export interface UTCDateComponents {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }

  /**
   * Ephemeris file metadata from get_current_file_data
   */
  export interface CurrentFileData {
    path: string;
    start: number;
    end: number;
    denum: number;
  }

  /**
   * Astronomical model strings from get_astro_models
   */
  export interface AstroModels {
    models: string;
    details: string;
  }

  /**
   * Moon node-crossing result from mooncross_node / mooncross_node_ut
   */
  export interface MoonNodeCrossing {
    jd: number;
    lon: number;
    lat: number;
  }

  /**
   * Orbit distance extremes returned by orbit_max_min_true_distance
   */
  export interface OrbitDistance {
    maxDistance: number;
    minDistance: number;
    trueDistance: number;
  }

  /**
   * Horizontal coordinates returned by azalt
   */
  export interface HorizontalCoordinates {
    azimuth: number;
    trueAltitude: number;
    apparentAltitude: number;
  }

  /**
   * Equatorial coordinates returned by azalt_rev
   */
  export interface EquatorialCoordinates {
    ra: number;
    dec: number;
    distance: number;
  }

  /**
   * Nodes and apsides result. Each of the four arrays holds 6 doubles
   * (position + speed). On error only `error` (the negative C return code) is
   * present.
   */
  export type NodesApsidesResult =
    | {
        ascending: number[];
        descending: number[];
        perihelion: number[];
        aphelion: number[];
        asc_node: number;
        desc_node: number;
        peri_lon: number;
        aphe_lon: number;
      }
    | { error: number };

  /**
   * Extended refraction result from refrac_extended
   */
  export interface RefracExtendedResult {
    converted: number;
    trueAltitude: number;
    apparentAltitude: number;
    refraction: number;
    dip: number;
  }
}
