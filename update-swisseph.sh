#!/usr/bin/env bash
#
# update-swisseph.sh
#
# Refresh the VENDORED Swiss Ephemeris C source in deps/swisseph from upstream.
#
# The upstream repo (https://github.com/aloistr/swisseph) bundles hundreds of
# MB of ephemeris data alongside the source, so we do a shallow + blobless +
# sparse fetch of the root *.c / *.h only, then copy those files in as plain
# vendored files. No git submodule, no large download.
#
# Usage:
#   ./update-swisseph.sh              # fetch latest master
#   ./update-swisseph.sh v2.10.03     # fetch a specific tag/branch/commit
#
# After it runs, review `git diff deps/swisseph`, then rebuild:
#   ./compile.sh && npm test

set -euo pipefail
cd "$(dirname "$0")"

REPO="https://github.com/aloistr/swisseph.git"
REF="${1:-master}"
# Non-library files we intentionally do not vendor (CLI/demos/generators).
EXCLUDE=(obama.c swemini.c swetest.c swephgen4.c)

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

info "Sparse-fetching Swiss Ephemeris source '${REF}' (C sources only)..."
git clone --depth 1 --filter=blob:none --sparse --branch "$REF" "$REPO" "$tmp/swe" 2>/dev/null \
  || git clone --depth 1 --filter=blob:none --sparse "$REPO" "$tmp/swe"
git -C "$tmp/swe" sparse-checkout set --no-cone '/*.c' '/*.h'
# If a specific non-branch ref was requested, check it out explicitly.
if [ "$REF" != "master" ]; then
  git -C "$tmp/swe" fetch --depth 1 origin "$REF" 2>/dev/null && \
    git -C "$tmp/swe" checkout --detach FETCH_HEAD 2>/dev/null || true
fi

info "Replacing deps/swisseph with the fetched source..."
rm -f deps/swisseph/*.c deps/swisseph/*.h
cp "$tmp/swe"/*.c "$tmp/swe"/*.h deps/swisseph/
for f in "${EXCLUDE[@]}"; do rm -f "deps/swisseph/$f"; done

ver="$(grep -E '#define[[:space:]]+SE_VERSION' deps/swisseph/sweph.h \
       | sed -E 's/.*"([^"]+)".*/\1/' | head -1 || true)"
n="$(ls deps/swisseph/*.c | wc -l | tr -d ' ')"
info "Done. Vendored version ${ver:-unknown}, ${n} .c files."
echo "     Review: git diff deps/swisseph"
echo "     Rebuild: ./compile.sh && npm test"
