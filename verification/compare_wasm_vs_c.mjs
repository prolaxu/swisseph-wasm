import SwissEph from '../src/swisseph.js';
import { readFileSync } from 'fs';
import { runChecks } from './checks.js';

// run_verification.sh points this at a freshly generated reference; on its own
// it uses the committed one.
const referencePath = process.env.SWISSEPH_REFERENCE || process.argv[2] || './verification/reference.json';
const C = JSON.parse(readFileSync(referencePath, 'utf8'));

const s = new SwissEph();
await s.initSwissEph();
const { pass, fail, fails } = runChecks(s, C);
s.close();

console.log(`\n=== JS(wasm) vs C reference (${referencePath}) ===`);
console.log(`PASS ${pass}  FAIL ${fail}`);
if (fails.length) { console.log('\nMISMATCHES:'); fails.forEach(f => console.log('  ✗ ' + f)); }
process.exit(fail ? 1 : 0);
