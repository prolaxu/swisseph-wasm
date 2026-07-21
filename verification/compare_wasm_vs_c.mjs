import SwissEph from '../src/swisseph.js';
import { readFileSync } from 'fs';
import { runChecks } from './checks.js';

const C = JSON.parse(readFileSync('./verification/reference.json', 'utf8'));

const s = new SwissEph();
await s.initSwissEph();
const { pass, fail, fails } = runChecks(s, C);
s.close();

console.log(`\n=== JS(wasm) vs C reference ===`);
console.log(`PASS ${pass}  FAIL ${fail}`);
if (fails.length) { console.log('\nMISMATCHES:'); fails.forEach(f => console.log('  ✗ ' + f)); }
process.exit(fail ? 1 : 0);
