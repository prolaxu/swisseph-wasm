#!/usr/bin/env node
/**
 * Smoke test for the lite build (swisseph-wasm/lite).
 *
 * The lite wasm is produced by tools/compile.sh, which needs emsdk; when the
 * artifact is missing this test reports "skipped" and exits 0 so a plain
 * checkout can still run `npm test`.
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const liteGlue = join(here, '../wasm/swisseph-lite.js');

let totalTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.log(`  ✗ ${message}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  assert(diff < tolerance, `${message} (expected: ${expected}, got: ${actual}, diff: ${diff})`);
}

async function runTests() {
  console.log('\n=== Swiss Ephemeris WASM - Lite Build Smoke Test ===\n');

  if (!existsSync(liteGlue)) {
    const message = 'wasm/swisseph-lite.js not built - run tools/compile.sh (needs emsdk)';
    // Publishing without the lite artifacts would ship a broken ./lite export,
    // so prepublishOnly sets SWISSEPH_REQUIRE_LITE=1 to turn the skip into a failure.
    if (process.env.SWISSEPH_REQUIRE_LITE === '1') {
      failedTests++;
      totalTests++;
      console.log(`  ✗ ${message}\n`);
      return;
    }
    console.log(`  ⏭  ${message}. Skipping.\n`);
    return;
  }

  const { default: SwissEphLite } = await import('../src/swisseph-lite.js');
  const { default: SwissEph } = await import('../src/swisseph.js');

  const lite = new SwissEphLite();
  await lite.initSwissEph();

  const full = new SwissEph();
  await full.initSwissEph();

  console.log('📅 Julian Day');
  const jd = lite.julday(2000, 1, 1, 12.0);
  assertClose(jd, 2451545.0, 1e-9, 'julday(2000-01-01 12:00 UT) = 2451545.0');

  console.log('\n🪐 Positions (Moshier by default, no .data file)');
  const bodies = [
    ['Sun', lite.SE_SUN],
    ['Moon', lite.SE_MOON],
    ['Mars', lite.SE_MARS],
    ['Saturn', lite.SE_SATURN],
  ];
  for (const [name, body] of bodies) {
    const liteResult = lite.calc_ut(jd, body); // flags default to SEFLG_MOSEPH
    const moshier = full.calc_ut(jd, body, full.SEFLG_MOSEPH);
    const swiss = full.calc_ut(jd, body, full.SEFLG_SWIEPH);

    assert(liteResult instanceof Float64Array && liteResult.length === 6,
      `${name}: calc_ut returns 6 doubles`);
    assertClose(liteResult[0], moshier[0], 1e-9,
      `${name}: lite default matches full build with SEFLG_MOSEPH`);
    // Moshier vs Swiss ephemeris files: sub-arcsecond for planets, a bit more
    // for the Moon. 0.01 deg = 36 arcsec is a generous smoke-test bound.
    assertClose(liteResult[0], swiss[0], 0.01,
      `${name}: lite longitude agrees with the Swiss ephemeris`);
  }

  console.log('\n⭐ Text data files are still bundled');
  const star = lite.fixstar_ut('Aldebaran', jd);
  assert(star instanceof Float64Array && star.length === 6,
    'fixstar_ut works (sefstars.txt is preloaded in the lite build)');

  console.log('\n🏠 Houses');
  const houses = lite.houses(jd, 51.5, -0.13, 'P');
  assert(houses && houses.cusps && houses.cusps.length === 13, 'houses returns the cusp array');

  lite.close();
  full.close();
}

runTests()
  .then(() => {
    console.log(`\n📊 Lite results: ${totalTests - failedTests}/${totalTests} passed\n`);
    process.exit(failedTests === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
