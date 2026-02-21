# SwissEph Quick Reference Guide

## Basic Setup

```javascript
import SwissEph from './src/swisseph.js';

const swe = new SwissEph();
await swe.initSwissEph();

// Your calculations here

swe.close(); // Always clean up
```

## Essential Functions

### Date & Time
```javascript
// Julian Day calculation
const jd = swe.julday(2023, 6, 15, 12.5);

// UTC to Julian Day
const result = swe.utc_to_jd(2023, 6, 15, 12, 30, 0, swe.SE_GREG_CAL);

// Julian Day to calendar date
const date = swe.revjul(jd, swe.SE_GREG_CAL);

// Sidereal time
const sidTime = swe.sidtime(jd);

// Delta T
const deltaT = swe.deltat(jd);
```

### Planet Positions
```javascript
// Basic calculation
const pos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
// Returns: [longitude, latitude, distance, speed]

// Detailed calculation
const detailed = swe.calc(jd, swe.SE_MOON, swe.SEFLG_SWIEPH);
// Returns: {longitude, latitude, distance, longitudeSpeed, latitudeSpeed, distanceSpeed}
```

### Sidereal Calculations
```javascript
// Set sidereal mode
swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);

// Calculate sidereal position
const sidereal = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL);

// Get ayanamsa
const ayanamsa = swe.get_ayanamsa(jd);
```

## Planet Constants

```javascript
// Major planets
swe.SE_SUN = 0        swe.SE_JUPITER = 5
swe.SE_MOON = 1       swe.SE_SATURN = 6
swe.SE_MERCURY = 2    swe.SE_URANUS = 7
swe.SE_VENUS = 3      swe.SE_NEPTUNE = 8
swe.SE_MARS = 4       swe.SE_PLUTO = 9

// Lunar nodes
swe.SE_MEAN_NODE = 10
swe.SE_TRUE_NODE = 11

// Asteroids
swe.SE_CHIRON = 15    swe.SE_CERES = 17
swe.SE_PHOLUS = 16    swe.SE_PALLAS = 18
```

## Calculation Flags

```javascript
// Ephemeris types
swe.SEFLG_SWIEPH = 2      // Swiss Ephemeris (default)
swe.SEFLG_JPLEPH = 1      // JPL Ephemeris
swe.SEFLG_MOSEPH = 4      // Moshier Ephemeris

// Coordinate systems
swe.SEFLG_HELCTR = 8      // Heliocentric
swe.SEFLG_BARYCTR = 16384 // Barycentric
swe.SEFLG_TOPOCTR = 32768 // Topocentric
swe.SEFLG_EQUATORIAL = 2048 // Equatorial coordinates

// Special flags
swe.SEFLG_SPEED = 256     // Include speed
swe.SEFLG_SIDEREAL = 65536 // Sidereal positions
swe.SEFLG_RADIANS = 8192  // Results in radians
swe.SEFLG_J2000 = 32      // J2000 coordinates
```

## Sidereal Modes

```javascript
swe.SE_SIDM_FAGAN_BRADLEY = 0
swe.SE_SIDM_LAHIRI = 1
swe.SE_SIDM_DELUCE = 2
swe.SE_SIDM_RAMAN = 3
swe.SE_SIDM_KRISHNAMURTI = 5
swe.SE_SIDM_USER = 255
```

## Common Patterns

### Birth Chart Calculation
```javascript
async function birthChart(year, month, day, hour, minute, timezone) {
  const swe = new SwissEph();
  await swe.initSwissEph();
  
  const utcHour = hour + minute / 60 - timezone;
  const jd = swe.julday(year, month, day, utcHour);
  
  const planets = [swe.SE_SUN, swe.SE_MOON, swe.SE_MERCURY, swe.SE_VENUS, 
                   swe.SE_MARS, swe.SE_JUPITER, swe.SE_SATURN];
  
  const chart = {};
  for (const planet of planets) {
    const pos = swe.calc_ut(jd, planet, swe.SEFLG_SWIEPH);
    chart[swe.get_planet_name(planet)] = pos[0];
  }
  
  swe.close();
  return chart;
}
```

### Current Planetary Positions
```javascript
async function currentPositions() {
  const swe = new SwissEph();
  await swe.initSwissEph();
  
  const now = new Date();
  const jd = swe.julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60
  );
  
  const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
  const moonPos = swe.calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH);
  
  swe.close();
  
  return {
    sun: sunPos[0],
    moon: moonPos[0],
    julianDay: jd
  };
}
```

### Sidereal vs Tropical
```javascript
async function comparePositions(year, month, day, hour) {
  const swe = new SwissEph();
  await swe.initSwissEph();
  
  const jd = swe.julday(year, month, day, hour);
  
  // Tropical
  const tropical = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
  
  // Sidereal (Lahiri)
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const sidereal = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL);
  
  swe.close();
  
  return {
    tropical: tropical[0],
    sidereal: sidereal[0],
    difference: tropical[0] - sidereal[0]
  };
}
```

## Utility Functions

```javascript
// Normalize degrees (0-360)
const normalized = swe.degnorm(370); // Returns 10

// Split degrees into D°M'S"
const split = swe.split_deg(123.456, swe.SE_SPLIT_DEG_ROUND_SEC);
// Returns: {degree: 123, min: 27, second: 24, sign: 4}

// Day of week (0=Monday, 6=Sunday)
const dayOfWeek = swe.day_of_week(jd);

// Planet name
const name = swe.get_planet_name(swe.SE_SUN); // Returns "Sun"

// Version info
const version = swe.version();
```

## Error Handling Template

```javascript
async function safeCalculation() {
  let swe = null;
  
  try {
    swe = new SwissEph();
    await swe.initSwissEph();
    
    // Your calculations here
    const jd = swe.julday(2023, 6, 15, 12);
    const result = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
    
    return { success: true, data: result };
    
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (swe) swe.close();
  }
}
```

## Performance Tips

1. **Reuse instances** for multiple calculations
2. **Batch calculations** in single session
3. **Always call close()** to prevent memory leaks
4. **Validate inputs** before calculation
5. **Use appropriate flags** for your needs

## Common Gotchas

- **Time zones**: Convert to UTC before calculation
- **Month numbering**: Use 1-12, not 0-11
- **Memory management**: Always call `close()`
- **Async initialization**: Always `await initSwissEph()`
- **Flag combinations**: Use bitwise OR (`|`) to combine flags

## Browser Requirements

- WebAssembly support
- ES6 modules
- Modern JavaScript (async/await)

## File Structure

```
your-project/
├── src/
│   └── swisseph.js          # Main library
├── wasm/
│   ├── swisseph.js          # WASM module
│   └── swisseph.wasm        # WASM binary
└── your-app.js              # Your application
```
