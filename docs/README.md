# swisseph-wasm — Documentation

High-precision Swiss Ephemeris astronomy/astrology for JavaScript, compiled to
WebAssembly. Start here to find the right page.

## ▶ Try it first (interactive)

- **[Playground](https://prolaxu.github.io/swisseph-wasm/examples/playground.html)** — a live code editor with **autocomplete on the full API**. Run any method in the browser, no install.
- **[Interactive demo](https://prolaxu.github.io/swisseph-wasm/examples/demo.html)** — planetary positions, birth charts, houses, aspects.

## 📚 Guides

| Read this | When you want to |
| --- | --- |
| [**Quick Reference**](QUICK_REFERENCE.md) | A one-page cheatsheet: setup, essential functions, constants, common patterns. |
| [**API Documentation**](DOCUMENTATION.md) | The complete method reference, grouped by area, with examples. |
| [**Usage Guide**](USAGE_GUIDE.md) | Framework/platform integration (Node, Vite, React, Vue, Next.js, Webpack, CDN). |

For install, a 30-second overview, and building from source, see the
[**root README**](../README.md). Release notes are in the
[**CHANGELOG**](../CHANGELOG.md). An LLM-oriented API summary lives in
[`llm.txt`](../llm.txt).

## The two rules that trip everyone up

1. **`initSwissEph()` is async** and downloads ~2.1 MB of ephemeris data.
   `await` it before calling any method:
   ```js
   const swe = new SwissEph();
   await swe.initSwissEph();
   ```
2. **Constants live on the instance** (`swe.SE_SUN`, `swe.SEFLG_SWIEPH`), so
   they only exist after `new SwissEph()`.

## Verification

Every wrapped method is checked against the native Swiss Ephemeris C library
(`npm run verify`) in both Node and the browser. See the root README's
**Testing** section.
