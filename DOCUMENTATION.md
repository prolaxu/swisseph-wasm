# SwissEph WebAssembly Library Documentation

A JavaScript wrapper for the Swiss Ephemeris WebAssembly module, providing high-precision astronomical calculations for astrology, astronomy, and related applications.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Constants](#constants)
- [Advanced Usage](#advanced-usage)
- [Testing](#testing)
- [Browser Support](#browser-support)

## Installation

### Option 1: Direct Download
Download the library files and include them in your project:

```
src/swisseph.js       # Main library file
wasm/swisseph.js      # WebAssembly module
wasm/swisseph.wasm    # WebAssembly binary
```

### Option 2: ES Module Import
```javascript
import SwissEph from './src/swisseph.js';
```

### Option 3: HTML Script Tag
```html
<script type="module">
  import SwissEph from './src/swisseph.js';
  // Your code here
</script>
```

## Quick Start

### Basic Setup

```javascript
import SwissEph from './src/swisseph.js';

// Create instance
const swe = new SwissEph();

// Initialize the WebAssembly module
await swe.initSwissEph();

// Calculate Julian Day
const jd = swe.julday(2023, 6, 15, 12.0); // June 15, 2023, 12:00 UTC

// Calculate Sun position
const sunPosition = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
console.log(`Sun longitude: ${sunPosition[0]}°`);

// Clean up when done
swe.close();
```

### Birth Chart Example

```javascript
async function calculateBirthChart(year, month, day, hour, minute, timezone) {
  const swe = new SwissEph();
  await swe.initSwissEph();
  
  // Convert local time to UTC
  const utcHour = hour + minute / 60 - timezone;
  const jd = swe.julday(year, month, day, utcHour);
  
  // Define planets to calculate
  const planets = [
    { id: swe.SE_SUN, name: 'Sun' },
    { id: swe.SE_MOON, name: 'Moon' },
    { id: swe.SE_MERCURY, name: 'Mercury' },
    { id: swe.SE_VENUS, name: 'Venus' },
    { id: swe.SE_MARS, name: 'Mars' },
    { id: swe.SE_JUPITER, name: 'Jupiter' },
    { id: swe.SE_SATURN, name: 'Saturn' },
    { id: swe.SE_URANUS, name: 'Uranus' },
    { id: swe.SE_NEPTUNE, name: 'Neptune' },
    { id: swe.SE_PLUTO, name: 'Pluto' }
  ];
  
  const chart = {};
  
  for (const planet of planets) {
    const result = swe.calc_ut(jd, planet.id, swe.SEFLG_SWIEPH);
    chart[planet.name] = {
      longitude: result[0],
      latitude: result[1],
      distance: result[2],
      speed: result[3]
    };
  }
  
  swe.close();
  return chart;
}

// Usage
const chart = await calculateBirthChart(1990, 5, 15, 14, 30, -5); // May 15, 1990, 2:30 PM, UTC-5
console.log(chart);
```

## API Reference

### Core Methods

#### `initSwissEph()`
Initializes the WebAssembly module. Must be called before using any other methods.

```javascript
await swe.initSwissEph();
```

#### `julday(year, month, day, hour)`
Calculates Julian Day Number for a given date and time.

```javascript
const jd = swe.julday(2023, 6, 15, 12.5); // June 15, 2023, 12:30 UTC
```

**Parameters:**
- `year` (number): Year (e.g., 2023)
- `month` (number): Month (1-12)
- `day` (number): Day (1-31)
- `hour` (number): Hour in decimal format (0-24)

**Returns:** Julian Day Number (number)

#### `calc_ut(jd, planet, flags)`
Calculates planetary positions for Universal Time.

```javascript
const result = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
```

**Parameters:**
- `jd` (number): Julian Day Number
- `planet` (number): Planet constant (e.g., `swe.SE_SUN`)
- `flags` (number): Calculation flags (e.g., `swe.SEFLG_SWIEPH`)

**Returns:** Float64Array with [longitude, latitude, distance, speed]

#### `calc(jd, planet, flags)`
Calculates planetary positions (alternative method with more detailed output).

```javascript
const result = swe.calc(jd, swe.SE_MOON, swe.SEFLG_SWIEPH);
```

**Returns:** Object with detailed position data:
```javascript
{
  longitude: number,
  latitude: number,
  distance: number,
  longitudeSpeed: number,
  latitudeSpeed: number,
  distanceSpeed: number
}
```

### Time Functions

#### `deltat(jd)`
Calculates Delta T (difference between Terrestrial Time and Universal Time).

```javascript
const deltaT = swe.deltat(jd);
```

#### `sidtime(jd)`
Calculates sidereal time for a given Julian Day.

```javascript
const siderealTime = swe.sidtime(jd);
```

#### `utc_to_jd(year, month, day, hour, minute, second, gregflag)`
Converts UTC time to Julian Day.

```javascript
const result = swe.utc_to_jd(2023, 6, 15, 12, 30, 0, swe.SE_GREG_CAL);
// Returns: { julianDayET: number, julianDayUT: number }
```

### Date Conversion Functions

#### `revjul(jd, gregflag)`
Converts Julian Day back to calendar date.

```javascript
const date = swe.revjul(jd, swe.SE_GREG_CAL);
// Returns: { year: number, month: number, day: number, hour: number }
```

#### `date_conversion(year, month, day, hour, gregflag)`
Converts calendar date to Julian Day.

```javascript
const jd = swe.date_conversion(2023, 6, 15, 12.5, swe.SE_GREG_CAL);
```

### Utility Functions

#### `degnorm(degrees)`
Normalizes degrees to 0-360 range.

```javascript
const normalized = swe.degnorm(370); // Returns 10
```

#### `split_deg(degrees, roundflag)`
Splits decimal degrees into degrees, minutes, seconds.

```javascript
const split = swe.split_deg(123.456789, swe.SE_SPLIT_DEG_ROUND_SEC);
// Returns: { degree: 123, min: 27, second: 24, fraction: 0, sign: 4 }
```

#### `day_of_week(jd)`
Returns day of week for a Julian Day (0=Monday, 6=Sunday).

```javascript
const dayOfWeek = swe.day_of_week(jd);
```

### Sidereal Functions

#### `set_sid_mode(sidmode, t0, ayan_t0)`
Sets sidereal calculation mode.

```javascript
swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
```

#### `get_ayanamsa(jd)`
Gets ayanamsa value for sidereal calculations.

```javascript
const ayanamsa = swe.get_ayanamsa(jd);
```

### Information Functions

#### `version()`
Returns Swiss Ephemeris version string.

```javascript
const version = swe.version();
```

#### `get_planet_name(planet)`
Returns planet name for a planet constant.

```javascript
const name = swe.get_planet_name(swe.SE_SUN); // Returns "Sun"
```

### Cleanup

#### `close()`
Closes the Swiss Ephemeris and frees memory. Call when done.

```javascript
swe.close();
```

## Examples

### Example 1: Current Planetary Positions

```javascript
async function getCurrentPlanetaryPositions() {
  const swe = new SwissEph();
  await swe.initSwissEph();
  
  const now = new Date();
  const jd = swe.julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60
  );
  
  const planets = [
    swe.SE_SUN, swe.SE_MOON, swe.SE_MERCURY, swe.SE_VENUS,
    swe.SE_MARS, swe.SE_JUPITER, swe.SE_SATURN
  ];
  
  const positions = {};
  
  for (const planet of planets) {
    const result = swe.calc_ut(jd, planet, swe.SEFLG_SWIEPH);
    const name = swe.get_planet_name(planet);
    positions[name] = result[0]; // longitude in degrees
  }
  
  swe.close();
  return positions;
}
```

### Example 2: Sidereal vs Tropical Positions

```javascript
async function compareSiderealTropical(year, month, day, hour) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const jd = swe.julday(year, month, day, hour);

  // Set Lahiri ayanamsa for sidereal calculations
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

  // Tropical position
  const tropical = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);

  // Sidereal position
  const sidereal = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL);

  // Get ayanamsa value
  const ayanamsa = swe.get_ayanamsa(jd);

  swe.close();

  return {
    tropical: tropical[0],
    sidereal: sidereal[0],
    ayanamsa: ayanamsa,
    difference: tropical[0] - sidereal[0]
  };
}
```

### Example 3: Time Zone Conversion

```javascript
async function calculateWithTimeZone(year, month, day, hour, minute, second, timezone) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  // Convert to UTC using built-in function
  const utcResult = swe.utc_to_jd(year, month, day, hour, minute, second, swe.SE_GREG_CAL);

  // Adjust for timezone
  const localJD = utcResult.julianDayUT - timezone / 24;

  // Calculate planetary positions
  const sunPos = swe.calc_ut(localJD, swe.SE_SUN, swe.SEFLG_SWIEPH);

  swe.close();

  return {
    julianDay: localJD,
    sunLongitude: sunPos[0],
    deltaT: swe.deltat(localJD)
  };
}
```

### Example 4: Moon Phases

```javascript
async function getMoonPhase(year, month, day) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const jd = swe.julday(year, month, day, 12.0);

  // Get Sun and Moon positions
  const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
  const moonPos = swe.calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH);

  // Calculate phase angle
  let phaseAngle = moonPos[0] - sunPos[0];
  if (phaseAngle < 0) phaseAngle += 360;

  // Determine phase
  let phase;
  if (phaseAngle < 45 || phaseAngle > 315) phase = "New Moon";
  else if (phaseAngle < 135) phase = "Waxing";
  else if (phaseAngle < 225) phase = "Full Moon";
  else phase = "Waning";

  swe.close();

  return {
    phaseAngle: phaseAngle,
    phase: phase,
    sunLongitude: sunPos[0],
    moonLongitude: moonPos[0]
  };
}
```

## Constants

### Planet Constants

```javascript
// Major planets
swe.SE_SUN = 0;
swe.SE_MOON = 1;
swe.SE_MERCURY = 2;
swe.SE_VENUS = 3;
swe.SE_MARS = 4;
swe.SE_JUPITER = 5;
swe.SE_SATURN = 6;
swe.SE_URANUS = 7;
swe.SE_NEPTUNE = 8;
swe.SE_PLUTO = 9;
swe.SE_EARTH = 14;

// Lunar nodes and apogee
swe.SE_MEAN_NODE = 10;
swe.SE_TRUE_NODE = 11;
swe.SE_MEAN_APOG = 12;
swe.SE_OSCU_APOG = 13;

// Major asteroids
swe.SE_CHIRON = 15;
swe.SE_PHOLUS = 16;
swe.SE_CERES = 17;
swe.SE_PALLAS = 18;
swe.SE_JUNO = 19;
swe.SE_VESTA = 20;

// Uranian planets
swe.SE_CUPIDO = 40;
swe.SE_HADES = 41;
swe.SE_ZEUS = 42;
swe.SE_KRONOS = 43;
swe.SE_APOLLON = 44;
swe.SE_ADMETOS = 45;
swe.SE_VULKANUS = 46;
swe.SE_POSEIDON = 47;
```

### Calculation Flags

```javascript
// Ephemeris types
swe.SEFLG_JPLEPH = 1;      // JPL ephemeris
swe.SEFLG_SWIEPH = 2;      // Swiss ephemeris (default)
swe.SEFLG_MOSEPH = 4;      // Moshier ephemeris

// Coordinate systems
swe.SEFLG_HELCTR = 8;      // Heliocentric
swe.SEFLG_BARYCTR = 16384; // Barycentric
swe.SEFLG_TOPOCTR = 32768; // Topocentric
swe.SEFLG_EQUATORIAL = 2048; // Equatorial coordinates
swe.SEFLG_XYZ = 4096;      // Cartesian coordinates
swe.SEFLG_RADIANS = 8192;  // Radians instead of degrees

// Special flags
swe.SEFLG_SPEED = 256;     // Calculate speed
swe.SEFLG_TRUEPOS = 16;    // True positions (no light-time correction)
swe.SEFLG_J2000 = 32;      // J2000 coordinates
swe.SEFLG_NONUT = 64;      // No nutation
swe.SEFLG_NOGDEFL = 512;   // No gravitational deflection
swe.SEFLG_NOABERR = 1024;  // No aberration
swe.SEFLG_SIDEREAL = 65536; // Sidereal positions

// Composite flags
swe.SEFLG_ASTROMETRIC = 1536; // No aberration + no gravitational deflection
```

### Sidereal Modes

```javascript
swe.SE_SIDM_FAGAN_BRADLEY = 0;
swe.SE_SIDM_LAHIRI = 1;
swe.SE_SIDM_DELUCE = 2;
swe.SE_SIDM_RAMAN = 3;
swe.SE_SIDM_USHASHASHI = 4;
swe.SE_SIDM_KRISHNAMURTI = 5;
swe.SE_SIDM_DJWHAL_KHUL = 6;
swe.SE_SIDM_YUKTESHWAR = 7;
swe.SE_SIDM_JN_BHASIN = 8;
swe.SE_SIDM_BABYL_KUGLER1 = 9;
swe.SE_SIDM_BABYL_KUGLER2 = 10;
swe.SE_SIDM_BABYL_KUGLER3 = 11;
swe.SE_SIDM_BABYL_HUBER = 12;
swe.SE_SIDM_BABYL_ETPSC = 13;
swe.SE_SIDM_ALDEBARAN_15TAU = 14;
swe.SE_SIDM_HIPPARCHOS = 15;
swe.SE_SIDM_SASSANIAN = 16;
swe.SE_SIDM_GALCENT_0SAG = 17;
swe.SE_SIDM_J2000 = 18;
swe.SE_SIDM_J1900 = 19;
swe.SE_SIDM_B1950 = 20;
swe.SE_SIDM_USER = 255;
```

### Calendar Types

```javascript
swe.SE_JUL_CAL = 0;   // Julian calendar
swe.SE_GREG_CAL = 1;  // Gregorian calendar
```

### Degree Splitting Flags

```javascript
swe.SE_SPLIT_DEG_ROUND_SEC = 1;
swe.SE_SPLIT_DEG_ROUND_MIN = 2;
swe.SE_SPLIT_DEG_ROUND_DEG = 4;
swe.SE_SPLIT_DEG_ZODIACAL = 8;
swe.SE_SPLIT_DEG_KEEP_SIGN = 16;
swe.SE_SPLIT_DEG_KEEP_DEG = 32;
```

## Advanced Usage

### Working with Fixed Stars

```javascript
async function getFixedStarPosition(starName, year, month, day) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const jd = swe.julday(year, month, day, 0);

  // Calculate fixed star position
  const starPos = swe.fixstar(starName, jd, swe.SEFLG_SWIEPH);

  if (starPos) {
    const result = {
      name: starName,
      longitude: starPos[0],
      latitude: starPos[1],
      distance: starPos[2],
      magnitude: swe.fixstar_mag(starName)
    };

    swe.close();
    return result;
  }

  swe.close();
  return null;
}

// Usage
const sirius = await getFixedStarPosition("Sirius", 2023, 6, 15);
```

### House Calculations

```javascript
async function calculateHouses(year, month, day, hour, latitude, longitude, houseSystem = 'P') {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const jd = swe.julday(year, month, day, hour);

  // Calculate houses
  const houses = swe.houses(jd, latitude, longitude, houseSystem);

  // Calculate house positions for planets
  const planets = [swe.SE_SUN, swe.SE_MOON, swe.SE_MERCURY, swe.SE_VENUS, swe.SE_MARS];
  const planetHouses = {};

  for (const planet of planets) {
    const planetPos = swe.calc_ut(jd, planet, swe.SEFLG_SWIEPH);
    const housePos = swe.house_pos(
      swe.sidtime(jd) * 15, // ARMC
      latitude,
      23.44, // obliquity
      houseSystem,
      planetPos[0],
      planetPos[1]
    );

    planetHouses[swe.get_planet_name(planet)] = {
      longitude: planetPos[0],
      house: Math.floor(housePos)
    };
  }

  swe.close();

  return {
    houses: houses,
    planetHouses: planetHouses
  };
}
```

### Eclipse Calculations

```javascript
async function findNextSolarEclipse(startYear, startMonth, startDay) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const startJD = swe.julday(startYear, startMonth, startDay, 12);

  // Find next solar eclipse
  const eclipse = swe.sol_eclipse_when_glob(
    startJD,
    swe.SEFLG_SWIEPH,
    swe.SE_ECL_TOTAL | swe.SE_ECL_ANNULAR | swe.SE_ECL_PARTIAL,
    0 // forward search
  );

  if (eclipse) {
    const eclipseDate = swe.revjul(eclipse[1], swe.SE_GREG_CAL);

    swe.close();

    return {
      julianDay: eclipse[1],
      date: eclipseDate,
      type: eclipse[0] & swe.SE_ECL_TOTAL ? 'Total' :
            eclipse[0] & swe.SE_ECL_ANNULAR ? 'Annular' : 'Partial',
      magnitude: eclipse[4]
    };
  }

  swe.close();
  return null;
}
```

### Topocentric Calculations

```javascript
async function calculateTopocentric(year, month, day, hour, latitude, longitude, altitude) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  // Set topocentric location
  swe.set_topo(longitude, latitude, altitude);

  const jd = swe.julday(year, month, day, hour);

  // Calculate topocentric positions
  const planets = [swe.SE_SUN, swe.SE_MOON, swe.SE_VENUS, swe.SE_MARS];
  const positions = {};

  for (const planet of planets) {
    // Geocentric position
    const geocentric = swe.calc_ut(jd, planet, swe.SEFLG_SWIEPH);

    // Topocentric position
    const topocentric = swe.calc_ut(jd, planet, swe.SEFLG_SWIEPH | swe.SEFLG_TOPOCTR);

    positions[swe.get_planet_name(planet)] = {
      geocentric: geocentric[0],
      topocentric: topocentric[0],
      difference: geocentric[0] - topocentric[0]
    };
  }

  swe.close();
  return positions;
}
```

## Error Handling

### Best Practices

```javascript
async function safeCalculation(year, month, day, hour) {
  let swe = null;

  try {
    swe = new SwissEph();
    await swe.initSwissEph();

    // Validate input
    if (year < -5000 || year > 5000) {
      throw new Error('Year out of valid range (-5000 to 5000)');
    }

    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    if (day < 1 || day > 31) {
      throw new Error('Day must be between 1 and 31');
    }

    if (hour < 0 || hour >= 24) {
      throw new Error('Hour must be between 0 and 23.999');
    }

    const jd = swe.julday(year, month, day, hour);

    // Check for valid Julian Day
    if (isNaN(jd) || jd === swe.TJD_INVALID) {
      throw new Error('Invalid Julian Day calculated');
    }

    const result = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);

    if (!result || result.length < 4) {
      throw new Error('Failed to calculate planetary position');
    }

    return {
      success: true,
      julianDay: jd,
      longitude: result[0],
      latitude: result[1],
      distance: result[2],
      speed: result[3]
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Always clean up
    if (swe) {
      swe.close();
    }
  }
}
```

## Performance Tips

### 1. Reuse SwissEph Instance

```javascript
class AstrologyCalculator {
  constructor() {
    this.swe = null;
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      this.swe = new SwissEph();
      await this.swe.initSwissEph();
      this.initialized = true;
    }
  }

  async calculateChart(year, month, day, hour) {
    await this.init();

    const jd = this.swe.julday(year, month, day, hour);
    const planets = [this.swe.SE_SUN, this.swe.SE_MOON, this.swe.SE_MERCURY];
    const chart = {};

    for (const planet of planets) {
      const result = this.swe.calc_ut(jd, planet, this.swe.SEFLG_SWIEPH);
      chart[this.swe.get_planet_name(planet)] = result[0];
    }

    return chart;
  }

  destroy() {
    if (this.swe) {
      this.swe.close();
      this.swe = null;
      this.initialized = false;
    }
  }
}

// Usage
const calculator = new AstrologyCalculator();
const chart1 = await calculator.calculateChart(1990, 5, 15, 14.5);
const chart2 = await calculator.calculateChart(1985, 12, 25, 8.0);
calculator.destroy(); // Clean up when done
```

### 2. Batch Calculations

```javascript
async function batchCalculatePlanets(jd, planetList, flags) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const results = {};

  // Calculate all planets in one session
  for (const planet of planetList) {
    const result = swe.calc_ut(jd, planet, flags);
    results[swe.get_planet_name(planet)] = result;
  }

  swe.close();
  return results;
}
```

## Browser Support

### Modern Browsers
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

### Requirements
- WebAssembly support
- ES6 modules support
- Async/await support

### Polyfills
For older browsers, you may need:
- WebAssembly polyfill
- ES6 module loader
- Promise polyfill

## Testing

The library includes comprehensive tests. To run them:

```bash
npm install
npm test
```

### Test Coverage
- 106 tests covering all major functionality
- 86.1% statement coverage
- Mock WebAssembly module for isolated testing
- Integration tests for real-world scenarios

## Troubleshooting

### Common Issues

1. **WebAssembly not loading**
   ```javascript
   // Ensure proper path to WASM files
   // Check browser console for loading errors
   ```

2. **Invalid Julian Day**
   ```javascript
   // Validate date inputs before calculation
   if (isNaN(jd) || jd === swe.TJD_INVALID) {
     throw new Error('Invalid date');
   }
   ```

3. **Memory leaks**
   ```javascript
   // Always call close() when done
   try {
     // calculations
   } finally {
     swe.close();
   }
   ```

4. **Incorrect time zones**
   ```javascript
   // Convert to UTC before calculation
   const utcHour = localHour - timezoneOffset;
   ```

## License

This library is a wrapper around the Swiss Ephemeris, which is licensed under the GNU General Public License (GPL) for non-commercial use. For commercial use, a license from Astrodienst is required.

## Support

For issues and questions:
- Check the test files for usage examples
- Review the Swiss Ephemeris documentation
- File issues on the project repository

## Version History

- v0.0.1: Initial release with core functionality
- Comprehensive test suite
- Full WebAssembly integration
- Modern ES6+ JavaScript API
```
