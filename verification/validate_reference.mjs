// Sanity-check a reference.json before anything is compared against it or
// copied over the committed one. A generator that crashes mid-run leaves a
// truncated file that would otherwise look like a legitimate reference.
//
// Usage: node verification/validate_reference.mjs <path>

import { readFileSync } from 'fs';

const path = process.argv[2];
if (!path) {
  console.error('usage: node verification/validate_reference.mjs <reference.json>');
  process.exit(2);
}

// Every top-level section the checks read; a partial file is missing the tail.
const SECTIONS = [
  'date_time', 'planets', 'stars', 'houses', 'math', 'transforms',
  'ayanamsa', 'phenomena', 'config', 'nodes', 'crossings', 'misc',
  'events', 'strings', 'version',
];

let data;
try {
  data = JSON.parse(readFileSync(path, 'utf8'));
} catch (e) {
  console.error(`invalid JSON in ${path}: ${e.message}`);
  process.exit(1);
}

const missing = SECTIONS.filter(s => !(s in data));
if (missing.length) {
  console.error(`${path} is missing section(s): ${missing.join(', ')}`);
  process.exit(1);
}

// Guard against a section that parsed but holds no numbers (all-zero or NaN
// output would still be structurally valid JSON).
const numbers = [];
const walk = v => {
  if (typeof v === 'number') numbers.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
walk(data);

if (numbers.length < 50) {
  console.error(`${path} holds only ${numbers.length} numbers - looks truncated`);
  process.exit(1);
}
const bad = numbers.filter(n => !Number.isFinite(n));
if (bad.length) {
  console.error(`${path} holds ${bad.length} non-finite value(s)`);
  process.exit(1);
}

console.log(`    ${path}: ${SECTIONS.length} sections, ${numbers.length} numeric values, all finite`);
