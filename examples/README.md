# Examples

Runnable examples for **swisseph-wasm**. Two interactive browser pages and two
Node scripts.

## Interactive (browser)

Served on GitHub Pages, or run locally with `npm run demo` (serves this repo on
`http://localhost:8000`).

| Example | What it is |
| --- | --- |
| [**playground.html**](playground.html) — [live](https://prolaxu.github.io/swisseph-wasm/examples/playground.html) | Code editor with **autocomplete on the full API**. Write and run any method in the browser. Opens on a complete Vedic birth-chart example. |
| [**demo.html**](demo.html) — [live](https://prolaxu.github.io/swisseph-wasm/examples/demo.html) | Guided showcase: planetary positions, birth charts, houses, sidereal vs tropical, aspects. |

## Node scripts

Run from the repo root:

```bash
node examples/basic-usage.js     # planetary positions, time functions, common patterns
node examples/birth-chart.js     # BirthChartCalculator: full natal chart from date/time/place
```

| Script | What it shows |
| --- | --- |
| [`basic-usage.js`](basic-usage.js) | The essentials — init, `julday`, `calc_ut`, houses, ayanamsa, cleanup. |
| [`birth-chart.js`](birth-chart.js) | A reusable `BirthChartCalculator` producing planet positions, signs, and houses. |

## Every example follows the same shape

```js
import SwissEph from '../src/swisseph.js';   // or 'swisseph-wasm' when installed

const swe = new SwissEph();
await swe.initSwissEph();   // async — downloads ~2.1 MB of ephemeris data
// ... use swe.<method>() ...
swe.close();                // free WASM memory
```

## More

- [Documentation index](../docs/README.md) · [API reference](../docs/DOCUMENTATION.md) · [Quick reference](../docs/QUICK_REFERENCE.md)
- [Swiss Ephemeris programmer's manual](https://www.astro.com/swisseph/swephprg.htm)
