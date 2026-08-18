// Compare two reference.json files numerically. The committed reference and a
// freshly generated one routinely disagree in the last few digits — different
// compiler, optimisation level or libm — so a byte diff is the wrong signal.
// This reports only differences that exceed the tolerance, plus any key that
// appears in one file and not the other.
//
// Usage: node verification/compare_references.mjs <committed> <fresh> [tolerance]

import { readFileSync } from 'fs';

const [, , aPath, bPath, tolArg] = process.argv;
if (!aPath || !bPath) {
  console.error('usage: node verification/compare_references.mjs <committed> <fresh> [tolerance]');
  process.exit(2);
}
const TOL = Number(tolArg ?? 1e-6);

const load = p => JSON.parse(readFileSync(p, 'utf8'));
const a = load(aPath);
const b = load(bPath);

const drift = [];   // beyond tolerance
const shape = [];   // present in one side only, or type mismatch
let compared = 0;
let maxDelta = 0;
let maxDeltaKey = '';

const walk = (x, y, path) => {
  if (typeof x === 'number' && typeof y === 'number') {
    compared++;
    const d = Math.abs(x - y);
    if (d > maxDelta) { maxDelta = d; maxDeltaKey = path; }
    if (d > TOL) drift.push(`${path}: committed=${x} fresh=${y} delta=${d.toExponential(3)}`);
    return;
  }
  if (typeof x === 'string' && typeof y === 'string') {
    compared++;
    if (x !== y) drift.push(`${path}: committed=${JSON.stringify(x)} fresh=${JSON.stringify(y)}`);
    return;
  }
  if (x && y && typeof x === 'object' && typeof y === 'object') {
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (!(k in x)) { shape.push(`${path}${path ? '.' : ''}${k}: only in fresh`); continue; }
      if (!(k in y)) { shape.push(`${path}${path ? '.' : ''}${k}: only in committed`); continue; }
      walk(x[k], y[k], `${path}${path ? '.' : ''}${k}`);
    }
    return;
  }
  if (x !== y) shape.push(`${path}: committed=${JSON.stringify(x)} fresh=${JSON.stringify(y)}`);
};

walk(a, b, '');

console.log(`    compared ${compared} values, largest delta ${maxDelta.toExponential(3)}` +
  (maxDeltaKey ? ` at ${maxDeltaKey}` : ''));

if (shape.length) {
  console.log('    STRUCTURE MISMATCH:');
  shape.forEach(s => console.log('      ✗ ' + s));
}
if (drift.length) {
  console.log(`    DRIFT beyond ${TOL}:`);
  drift.forEach(s => console.log('      ✗ ' + s));
  console.log('    If the vendored C source changed, this is expected - rerun with --update-reference.');
}

process.exit(shape.length || drift.length ? 1 : 0);
