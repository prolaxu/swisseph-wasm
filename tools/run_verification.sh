#!/usr/bin/env bash
#
# run_verification.sh
#
# End-to-end verification that the WebAssembly wrappers produce the SAME
# numbers as the real Swiss Ephemeris C library:
#
#   1. Compile the vendored C source (deps/swisseph) natively with gcc into a
#      reference generator (built in a temp dir, never in the work tree).
#   2. Run it against the bundled ephemeris data to produce a fresh reference.
#   3. Run every wrapped JS(wasm) method with identical inputs and compare
#      against that reference (verification/compare_wasm_vs_c.mjs).
#
# verification/reference.json is committed so npm test and the browser harness
# work without a C toolchain. It is NEVER written by this script unless you ask
# for it with --update-reference: the fresh output goes to a temp file, gets
# validated, and is only then used. Last-digit differences between platforms
# are normal, so the fresh-vs-committed check is numeric (tolerance-based), not
# a byte diff.
#
# If the C toolchain is missing or the generator fails, the script says so and
# still runs the JS comparison against the committed reference, so you always
# get the wrapper check. Use --strict to turn those warnings into failures.
#
# Usage: bash tools/run_verification.sh [options]
#   --skip-regen         do not build/run the C generator; use the committed
#                        reference (no compiler needed)
#   --update-reference   overwrite verification/reference.json with the fresh
#                        output once it has been validated
#   --strict             fail if the reference cannot be regenerated, or if
#                        fresh vs committed drift exceeds the tolerance
#   --tolerance <n>      numeric tolerance for the drift check (default 1e-6)
#
# Requires: node, and gcc unless --skip-regen. (emcc is NOT needed - this
# checks the JS wrappers' argument marshaling against C, independent of how
# wasm was built.)

set -Eeuo pipefail
cd "$(dirname "$0")/.."   # repo root

SKIP_REGEN=0
UPDATE_REFERENCE=0
STRICT=0
TOLERANCE=1e-6

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-regen)       SKIP_REGEN=1 ;;
    --update-reference) UPDATE_REFERENCE=1 ;;
    --strict)           STRICT=1 ;;
    --tolerance)        TOLERANCE="${2:?--tolerance needs a value}"; shift ;;
    -h|--help)          sed -n '2,36p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)                  echo "unknown option: $1 (try --help)" >&2; exit 2 ;;
  esac
  shift
done

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

# Downgrade to a warning unless --strict, so a broken C toolchain never hides
# the result of the JS comparison.
soft_fail() { if [ "$STRICT" = 1 ]; then fail "$*"; else warn "$* (continuing; --strict to fail)"; fi; }

command -v node >/dev/null || fail "node not found"

COMMITTED=verification/reference.json
[ -f "$COMMITTED" ] || fail "$COMMITTED is missing - restore it with: git checkout -- $COMMITTED"

TMPDIR_RUN=$(mktemp -d "${TMPDIR:-/tmp}/swisseph-verify.XXXXXX")
trap 'rm -rf "$TMPDIR_RUN"' EXIT

REFERENCE=$COMMITTED   # what the JS comparison runs against
FRESH=$TMPDIR_RUN/reference.json

regenerate() {
  command -v gcc >/dev/null || { soft_fail "gcc not found - cannot regenerate the reference"; return 1; }

  info "Compiling native C reference from vendored source..."
  # swevents.c ships its own main(); exclude it so our generator's main links.
  if ! gcc -O2 -w -o "$TMPDIR_RUN/swegen" \
       verification/generate_all_outputs.c \
       $(ls deps/swisseph/*.c | grep -v swevents.c | tr '\n' ' ') -lm 2>"$TMPDIR_RUN/cc.log"; then
    sed 's/^/    /' "$TMPDIR_RUN/cc.log" >&2 || true
    soft_fail "the reference generator failed to compile"
    return 1
  fi

  info "Generating a fresh reference (ephemeris data = deps/sweph)..."
  # Straight into a temp file: a crash here must not touch the committed one.
  # `if ! cmd` would leave $? as the negated status, so capture it directly.
  status=0
  SE_EPHE_PATH="$PWD/deps/sweph" "$TMPDIR_RUN/swegen" >"$FRESH" 2>"$TMPDIR_RUN/gen.log" || status=$?
  if [ "$status" != 0 ]; then
    sed 's/^/    /' "$TMPDIR_RUN/gen.log" >&2 || true
    soft_fail "the reference generator exited $status (output discarded)"
    return 1
  fi

  # A generator that dies mid-write still leaves a truncated file behind, so
  # check the JSON actually parses and carries the sections we compare.
  if ! node verification/validate_reference.mjs "$FRESH"; then
    soft_fail "the freshly generated reference is not valid"
    return 1
  fi

  REFERENCE=$FRESH
  return 0
}

if [ "$SKIP_REGEN" = 1 ]; then
  info "Skipping regeneration (--skip-regen); using the committed reference."
elif regenerate; then
  info "Checking fresh vs committed reference (tolerance $TOLERANCE)..."
  if node verification/compare_references.mjs "$COMMITTED" "$FRESH" "$TOLERANCE"; then
    :
  else
    soft_fail "fresh C output drifts from the committed reference beyond $TOLERANCE"
  fi

  if [ "$UPDATE_REFERENCE" = 1 ]; then
    cp "$FRESH" "$COMMITTED"
    info "Updated $COMMITTED (review the git diff before committing)."
  fi
else
  warn "Falling back to the committed reference for the JS comparison."
fi

info "Comparing JS(wasm) output against the reference..."
SWISSEPH_REFERENCE="$REFERENCE" node verification/compare_wasm_vs_c.mjs

info "Verification complete."
