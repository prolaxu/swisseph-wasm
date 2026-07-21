#!/usr/bin/env bash
#
# run_verification.sh
#
# End-to-end verification that the WebAssembly wrappers produce the SAME
# numbers as the real Swiss Ephemeris C library:
#
#   1. Compile the vendored C source (deps/swisseph) natively with gcc into a
#      reference generator.
#   2. Run it against the bundled ephemeris data to (re)generate the committed
#      verification/reference.json.
#   3. Run every wrapped JS(wasm) method with identical inputs and diff against
#      that reference (verification/compare_wasm_vs_c.mjs).
#
# reference.json is committed, so npm test and the browser harness work without
# a C toolchain. Regenerating it here is byte-identical unless the vendored C
# source changes — in which case the git diff on reference.json is the signal.
#
# Requires: gcc, node. (emcc is NOT needed - this checks the JS wrappers'
# argument marshaling against C, independent of how wasm was built.)

set -euo pipefail
cd "$(dirname "$0")/.."   # repo root

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }

command -v gcc  >/dev/null || { echo "gcc not found"; exit 1; }
command -v node >/dev/null || { echo "node not found"; exit 1; }

info "Compiling native C reference from vendored source..."
# swevents.c ships its own main(); exclude it so our generator's main links.
gcc -O2 -w -o verification/swegen \
  verification/generate_all_outputs.c \
  $(ls deps/swisseph/*.c | grep -v swevents.c | tr '\n' ' ') -lm

info "Regenerating verification/reference.json (ephemeris data = deps/sweph)..."
SE_EPHE_PATH="$(pwd)/deps/sweph" verification/swegen > verification/reference.json

info "Comparing JS(wasm) output against the reference..."
node verification/compare_wasm_vs_c.mjs

info "Verification complete."
