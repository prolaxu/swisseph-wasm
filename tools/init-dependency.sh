#!/usr/bin/env bash
#
# init-dependency.sh
#
# Preflight check for a source build of swisseph-wasm.
#
# The Swiss Ephemeris C source is VENDORED in this repo (deps/swisseph),
# so there is nothing to download to build. This script just verifies the
# pieces compile.sh needs are present and reports whether the Emscripten
# toolchain is available.
#
#   * deps/swisseph : vendored Swiss Ephemeris C source (*.c / *.h)
#   * deps/sweph    : ephemeris data files preloaded into the Emscripten
#                     virtual filesystem at /sweph by compile.sh
#
# To change the vendored Swiss Ephemeris version, use ./tools/update-swisseph.sh.

set -euo pipefail
cd "$(dirname "$0")/.."

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; }

fail=0

# --- 1. Vendored C source --------------------------------------------------
if [ -f deps/swisseph/sweph.h ] && ls deps/swisseph/*.c >/dev/null 2>&1; then
  ver="$(grep -E '#define[[:space:]]+SE_VERSION' deps/swisseph/sweph.h \
         | sed -E 's/.*"([^"]+)".*/\1/' | head -1 || true)"
  n="$(ls deps/swisseph/*.c | wc -l | tr -d ' ')"
  info "Vendored Swiss Ephemeris source present: version ${ver:-unknown}, ${n} .c files."
else
  err "deps/swisseph C source missing. Run ./tools/update-swisseph.sh to fetch it."
  fail=1
fi

# --- 2. Ephemeris data files -----------------------------------------------
required=(sepl_18.se1 semo_18.se1 seas_18.se1 sefstars.txt seorbel.txt seleapsec.txt)
missing=()
for f in "${required[@]}"; do
  [ -f "deps/sweph/$f" ] || missing+=("$f")
done
if [ ${#missing[@]} -eq 0 ]; then
  info "Ephemeris data present in deps/sweph (bundled coverage ~1800-2400 AD)."
else
  err "Missing ephemeris files in deps/sweph: ${missing[*]}"
  echo "     Download from https://www.astro.com/ftp/swisseph/ephe/ into deps/sweph/"
  fail=1
fi

# --- 3. Toolchain ----------------------------------------------------------
if command -v emcc >/dev/null 2>&1; then
  info "Emscripten found: $(emcc --version 2>/dev/null | head -1)"
  echo "     Next: ./tools/compile.sh    # rebuilds wasm/"
else
  warn "emcc (Emscripten) not found - required only to rebuild wasm/."
  echo "     Install: https://emscripten.org/docs/getting_started/downloads.html"
  echo "     The prebuilt wasm/ in this repo works without rebuilding."
fi

if [ "$fail" -ne 0 ]; then
  err "Preflight failed. Resolve the items above before running ./tools/compile.sh."
  exit 1
fi
info "All build dependencies present."
