#!/usr/bin/env bash
#
# init-dependency.sh
#
# Initialize / verify the build dependencies for swisseph-wasm.
#
#   * deps/swisseph : git submodule -> official Swiss Ephemeris C source
#                     (https://github.com/aloistr/swisseph). Compiled to
#                     WebAssembly by ./compile.sh.
#   * deps/sweph    : ephemeris data files (*.se1, *.txt) that compile.sh
#                     preloads into the Emscripten virtual filesystem at
#                     /sweph via  --preload-file ./deps/sweph@/sweph
#
# Usage:
#   ./init-dependency.sh            # shallow-init the submodule + verify data
#   UPDATE=1 ./init-dependency.sh   # also advance deps/swisseph to latest master
#
# After this succeeds, run ./compile.sh (needs the Emscripten SDK / emcc) to
# rebuild wasm/. The prebuilt wasm/ committed in this repo works without a
# rebuild, so emcc is only required when you change the C sources or bundled
# ephemeris files.

set -euo pipefail

cd "$(dirname "$0")"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; }

# --- 1. Swiss Ephemeris C source (git submodule) ---------------------------
if [ -f .gitmodules ] && grep -q 'deps/swisseph' .gitmodules; then
  info "Initializing Swiss Ephemeris source submodule (deps/swisseph)..."
  # Shallow clone: the upstream repo bundles large ephemeris data, so a full
  # history clone is slow. --depth 1 keeps the download minimal.
  git submodule update --init --depth 1 deps/swisseph

  if [ "${UPDATE:-0}" = "1" ]; then
    info "UPDATE=1 -> advancing deps/swisseph to latest origin/master..."
    git -C deps/swisseph fetch --depth 1 origin master
    git -C deps/swisseph checkout --detach FETCH_HEAD
  fi
else
  warn ".gitmodules has no deps/swisseph entry; skipping submodule step."
fi

if [ -f deps/swisseph/swephexp.h ]; then
  ver="$(grep -E '#define[[:space:]]+SE_VERSION' deps/swisseph/swephexp.h \
         | sed -E 's/.*"([^"]+)".*/\1/' | head -1 || true)"
  info "Swiss Ephemeris source present (version ${ver:-unknown})."
else
  err "deps/swisseph source missing after init. Check your network / git access."
  exit 1
fi

# --- 2. Ephemeris data files -----------------------------------------------
# These must exist under deps/sweph so compile.sh can preload them to /sweph.
required=(sepl_18.se1 semo_18.se1 seas_18.se1 sefstars.txt seorbel.txt seleapsec.txt)
missing=()
for f in "${required[@]}"; do
  [ -f "deps/sweph/$f" ] || missing+=("$f")
done

if [ ${#missing[@]} -eq 0 ]; then
  info "Ephemeris data present in deps/sweph (bundled coverage ~1800-2400 AD)."
else
  warn "Missing ephemeris files in deps/sweph: ${missing[*]}"
  echo "     Download them from https://www.astro.com/ftp/swisseph/ephe/"
  echo "     and place them in deps/sweph/ before running ./compile.sh"
fi

# --- 3. Toolchain check ----------------------------------------------------
if command -v emcc >/dev/null 2>&1; then
  info "Emscripten found: $(emcc --version 2>/dev/null | head -1)"
  echo "     Next: ./compile.sh    # rebuilds wasm/"
else
  warn "emcc (Emscripten) not found - required only to rebuild wasm/."
  echo "     Install: https://emscripten.org/docs/getting_started/downloads.html"
  echo "     The prebuilt wasm/ in this repo works without rebuilding."
fi

info "Dependencies ready."
