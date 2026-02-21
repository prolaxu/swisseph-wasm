# SwissEph WebAssembly Library

A high-precision JavaScript wrapper for the Swiss Ephemeris WebAssembly module, providing professional-grade astronomical calculations for astrology, astronomy, and related applications.

## 🌟 Features

- **🎯 High Precision**: Based on the renowned Swiss Ephemeris
- **⚡ WebAssembly Performance**: Fast calculations in browser and Node.js
- **🌐 Cross-Platform**: Works in Node.js, browsers, Vue.js, React, and more
- **📦 Zero Dependencies**: Self-contained with embedded WASM
- **🔧 Easy Integration**: Simple import, works with all modern bundlers
- **📚 Comprehensive API**: Full access to Swiss Ephemeris functions
- **💻 Modern JavaScript**: ES6+ with async/await support
- **🧪 Well Tested**: 106 tests with 86% coverage
- **📖 Complete Documentation**: Extensive guides and examples
- **🏢 Professional Grade**: Suitable for commercial applications
- **🔄 CDN Ready**: Available via jsdelivr CDN for quick prototyping

---

**☕ Enjoying this project?** [Support development on Ko-fi](https://ko-fi.com/prolaxu) to help keep it free and actively maintained!

---

## 🚀 Live Demo

**Try it now**: [Interactive SwissEph Demo](https://prolaxu.github.io/swisseph-wasm/examples/demo.html)

Experience all features including:
- 🌍 Real-time planetary positions
- 🎂 Birth chart calculations
- ⚖️ Sidereal vs Tropical comparisons
- 🏠 House system calculations
- 📐 Planetary aspects analysis
- 🔧 Interactive API explorer
- 📊 Visual astrological charts

## 📦 Installation

### npm
```bash
npm install swisseph-wasm
```

### yarn
```bash
yarn add swisseph-wasm
```

### pnpm
```bash
pnpm add swisseph-wasm
```

### CDN (Browser)
```html
<script type="module">
  import SwissEph from 'https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js';
  // Your code here
</script>
```

## 📦 What's Included

- **Core Library** (`src/swisseph.js`) - Main JavaScript wrapper
- **WebAssembly Module** (`wasm/`) - Compiled Swiss Ephemeris
- **Comprehensive Tests** (`tests/`) - 106 tests covering all functionality
- **Documentation** - Complete API reference and guides
- **Examples** - Practical usage examples and patterns
- **Quick Reference** - Handy developer reference
- **TypeScript Definitions** - Full type support

## 🚀 Quick Start

> **👀 Want to see it in action first?** Try the [Interactive Demo](https://prolaxu.github.io/swisseph-wasm/examples/demo.html)

### Basic Usage

```javascript
import SwissEph from 'swisseph-wasm';

// Create and initialize
const swe = new SwissEph();
await swe.initSwissEph();

// Calculate planetary position
const jd = swe.julday(2023, 6, 15, 12.0); // June 15, 2023, 12:00 UTC
const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);

console.log(`Sun longitude: ${sunPos[0]}°`);

// Clean up
swe.close();
```

### Birth Chart Example

```javascript
import SwissEph from 'swisseph-wasm';

// You can also import the example calculator
// import { BirthChartCalculator } from 'swisseph-wasm/examples/birth-chart.js';

const calculator = new BirthChartCalculator();

const chart = await calculator.calculateBirthChart({
  year: 1990, month: 5, day: 15,
  hour: 14, minute: 30, timezone: -5,
  latitude: 40.7128, longitude: -74.0060
});

console.log('Planetary Positions:');
Object.entries(chart.planets).forEach(([name, planet]) => {
  console.log(`${planet.symbol} ${name}: ${planet.zodiacSign.formatted}`);
});

calculator.destroy();
```

## 🌐 Cross-Platform Usage

SwissEph WebAssembly works seamlessly across different environments. Here are platform-specific setup instructions:

### Node.js
```javascript
import SwissEph from 'swisseph-wasm';

async function nodeExample() {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const jd = swe.julday(2023, 6, 15, 12.0);
  const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);

  console.log(`Sun longitude: ${sunPos[0].toFixed(2)}°`);
  swe.close();
}

nodeExample().catch(console.error);
```

### Vite (Vue.js, React, etc.)
Add this configuration to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // or react, etc.

export default defineConfig({
  plugins: [vue()],
  server: {
    fs: {
      allow: ['..']
    }
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['swisseph-wasm']
  }
})
```

### Vue.js Component
```vue
<script setup>
import SwissEph from 'swisseph-wasm';
import { onMounted, onUnmounted, ref } from 'vue';

const swe = ref(null);
const isInitialized = ref(false);
const result = ref('');

onMounted(async () => {
  try {
    swe.value = new SwissEph();
    await swe.value.initSwissEph();
    isInitialized.value = true;
  } catch (error) {
    console.error('Failed to initialize SwissEph:', error);
  }
});

onUnmounted(() => {
  if (swe.value) {
    swe.value.close();
  }
});

const calculate = () => {
  if (!isInitialized.value) return;

  const jd = swe.value.julday(2023, 6, 15, 12.0);
  const sunPos = swe.value.calc_ut(jd, swe.value.SE_SUN, swe.value.SEFLG_SWIEPH);
  result.value = `Sun: ${sunPos[0].toFixed(2)}°`;
};
</script>

<template>
  <div>
    <button @click="calculate" :disabled="!isInitialized">
      Calculate Sun Position
    </button>
    <p>{{ result }}</p>
  </div>
</template>
```

### React Component
```jsx
import React, { useState, useEffect } from 'react';
import SwissEph from 'swisseph-wasm';

function AstrologyCalculator() {
  const [swe, setSwe] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    const initSwissEph = async () => {
      try {
        const swissEph = new SwissEph();
        await swissEph.initSwissEph();
        setSwe(swissEph);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize SwissEph:', error);
      }
    };

    initSwissEph();

    return () => {
      if (swe) {
        swe.close();
      }
    };
  }, []);

  const calculate = () => {
    if (!isInitialized || !swe) return;

    const jd = swe.julday(2023, 6, 15, 12.0);
    const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
    setResult(`Sun: ${sunPos[0].toFixed(2)}°`);
  };

  return (
    <div>
      <button onClick={calculate} disabled={!isInitialized}>
        Calculate Sun Position
      </button>
      <p>{result}</p>
    </div>
  );
}

export default AstrologyCalculator;
```

### Vanilla HTML + JavaScript
```html
<!DOCTYPE html>
<html>
<head>
    <title>SwissEph Example</title>
</head>
<body>
    <button id="calculate">Calculate Sun Position</button>
    <div id="result"></div>

    <script type="module">
        import SwissEph from 'https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js';

        let swe = null;
        let isInitialized = false;

        // Initialize SwissEph
        (async () => {
            try {
                swe = new SwissEph();
                await swe.initSwissEph();
                isInitialized = true;
                console.log('SwissEph initialized successfully');
            } catch (error) {
                console.error('Failed to initialize SwissEph:', error);
            }
        })();

        // Calculate button handler
        document.getElementById('calculate').addEventListener('click', () => {
            if (!isInitialized || !swe) {
                document.getElementById('result').textContent = 'SwissEph not initialized';
                return;
            }

            const jd = swe.julday(2023, 6, 15, 12.0);
            const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
            document.getElementById('result').textContent = `Sun: ${sunPos[0].toFixed(2)}°`;
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (swe) {
                swe.close();
            }
        });
    </script>
</body>
</html>
```

### Webpack Configuration
If using Webpack, add this to your `webpack.config.js`:

```javascript
module.exports = {
  // ... other config
  experiments: {
    asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
    ],
  },
};
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**DOCUMENTATION.md**](DOCUMENTATION.md) | Complete API reference and usage guide |
| [**QUICK_REFERENCE.md**](QUICK_REFERENCE.md) | Quick developer reference |
| [**examples/README.md**](examples/README.md) | Example usage patterns |
| [**tests/README.md**](tests/README.md) | Test suite documentation |

## 🎯 Core Capabilities

### Planetary Calculations
- All major planets (Sun through Pluto)
- Lunar nodes and apogee
- Major asteroids (Chiron, Ceres, Pallas, etc.)
- Uranian planets
- Fixed stars

### Coordinate Systems
- Tropical and sidereal positions
- Geocentric, heliocentric, topocentric
- Ecliptic and equatorial coordinates
- Multiple ayanamsa systems

### Time Functions
- Julian Day calculations
- Time zone conversions
- Sidereal time
- Delta T calculations
- Calendar conversions

### Advanced Features
- Eclipse calculations
- Rise/set/transit times
- House systems
- Aspect calculations
- Atmospheric refraction
- Coordinate transformations

## 🧪 Testing

The library includes a comprehensive test suite with 106 tests:

```bash
npm install
npm test                 # Run all tests
npm run test:coverage   # Run with coverage report
npm run test:watch      # Watch mode
```

**Test Coverage:**
- ✅ 106 tests passing
- ✅ 86.1% statement coverage
- ✅ 66.66% function coverage
- ✅ All major functionality covered

## 📁 Project Structure

```
swiss-wasm/
├── src/
│   └── swisseph.js              # Main library file
├── wasm/
│   ├── swisseph.js              # WebAssembly module
│   └── swisseph.wasm            # WebAssembly binary
├── tests/
│   ├── swisseph.test.js         # Core functionality tests
│   ├── swisseph-advanced.test.js # Advanced features tests
│   ├── swisseph-integration.test.js # Integration tests
│   ├── swisseph-constants.test.js # Constants validation
│   ├── __mocks__/               # Mock implementations
│   └── README.md                # Test documentation
├── examples/
│   ├── basic-usage.js           # Basic usage examples
│   ├── birth-chart.js           # Birth chart calculator
│   └── README.md                # Examples documentation
├── DOCUMENTATION.md             # Complete API reference
├── QUICK_REFERENCE.md           # Quick developer guide
└── README.md                    # This file
```

## 🌐 Browser Support

**Modern Browsers:**
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

**Requirements:**
- WebAssembly support
- ES6 modules support
- Async/await support

## 🔧 Troubleshooting

### Common Issues and Solutions

#### WASM Loading Errors in Vite/Vue.js
**Error**: `WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 64 6f`

**Solution**: Add Vite configuration to your `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [vue()],
  server: {
    fs: { allow: ['..'] }
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['swisseph-wasm']
  }
})
```

#### Import Errors in Node.js
**Error**: `Cannot read properties of undefined (reading 'ccall')`

**Solution**: Always call `await swe.initSwissEph()` before using any methods:
```javascript
const swe = new SwissEph();
await swe.initSwissEph(); // Required!
const jd = swe.julday(2023, 6, 15, 12.0);
```

#### Browser Process Errors
**Error**: `process is not defined` in browser

**Solution**: This is fixed in the latest version. Update to the latest version:
```bash
npm update swisseph-wasm
```

#### Memory Issues
**Error**: Out of memory or performance issues

**Solution**: Always call `swe.close()` when done:
```javascript
try {
  const swe = new SwissEph();
  await swe.initSwissEph();
  // ... your calculations
} finally {
  swe.close(); // Always clean up!
}
```

#### CDN Import Issues
**Error**: Module not found when using CDN

**Solution**: Use the correct CDN URL:
```javascript
// ✅ Correct
import SwissEph from 'https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js';

// ❌ Incorrect
import SwissEph from 'https://cdn.jsdelivr.net/npm/swisseph-wasm';
```

#### TypeScript Errors
**Error**: Type definitions not found

**Solution**: Types are included in the package:
```typescript
import SwissEph from 'swisseph-wasm';
// Types are automatically available
```

### Performance Tips

1. **Reuse instances**: Create one SwissEph instance and reuse it for multiple calculations
2. **Batch calculations**: Calculate multiple planets in one session rather than creating new instances
3. **Memory management**: Always call `close()` when done
4. **Async initialization**: Use `await swe.initSwissEph()` only once per instance

## 💡 Examples

> **🌟 Interactive Examples**: Try all these examples and more in the [Live Demo](https://prolaxu.github.io/swisseph-wasm/examples/demo.html)

### Current Planetary Positions
```javascript
async function getCurrentPositions() {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const now = new Date();
  const jd = swe.julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60
  );

  const planets = [swe.SE_SUN, swe.SE_MOON, swe.SE_MERCURY];
  const positions = {};

  for (const planet of planets) {
    const pos = swe.calc_ut(jd, planet, swe.SEFLG_SWIEPH);
    positions[swe.get_planet_name(planet)] = pos[0];
  }

  swe.close();
  return positions;
}
```

### Sidereal vs Tropical
```javascript
async function compareSystems(year, month, day) {
  const swe = new SwissEph();
  await swe.initSwissEph();

  const jd = swe.julday(year, month, day, 12);

  // Tropical
  const tropical = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);

  // Sidereal (Lahiri)
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const sidereal = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL);

  swe.close();

  return {
    tropical: tropical[0],
    sidereal: sidereal[0],
    difference: tropical[0] - sidereal[0]
  };
}
```

## 🔧 Development

### Running Examples
```bash
# Basic usage examples
node examples/basic-usage.js

# Birth chart calculation
node examples/birth-chart.js
```

### Performance Tips
1. **Reuse instances** for multiple calculations
2. **Batch operations** in single sessions
3. **Always clean up** with `swe.close()`
4. **Validate inputs** before calculations
5. **Use appropriate flags** for your needs

### Error Handling
```javascript
async function safeCalculation() {
  let swe = null;
  try {
    swe = new SwissEph();
    await swe.initSwissEph();
    // calculations here
    return result;
  } catch (error) {
    console.error('Calculation failed:', error);
    return null;
  } finally {
    if (swe) swe.close();
  }
}
```

## 📄 License

This library is a wrapper around the Swiss Ephemeris, which is licensed under the GNU General Public License (GPL) for non-commercial use. For commercial use, a license from Astrodienst is required.

**Swiss Ephemeris License:**
- Non-commercial use: Free under GPL
- Commercial use: Requires license from [Astrodienst](https://www.astro.com/swisseph/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## 📞 Support

- **Documentation**: Check the comprehensive docs in this repository
- **Examples**: Review the examples directory for usage patterns
- **Tests**: Look at test files for detailed usage examples
- **Issues**: File issues on the project repository

## 🏆 Credits

- **Swiss Ephemeris**: Created by Astrodienst AG
- **WebAssembly Port**: Compiled for web use
- **JavaScript Wrapper**: Modern ES6+ interface
- **Test Suite**: Comprehensive validation
- **Documentation**: Complete developer guides

## 📜 License & Important Legal Information

### **📋 Project License**
This project is licensed under **GPL-3.0-or-later** - see the [LICENSE](LICENSE) file for details.

### **⚖️ Swiss Ephemeris Licensing**

**IMPORTANT**: This library incorporates the Swiss Ephemeris, which uses a **dual licensing model**:

#### **🆓 For Open Source Projects:**
- ✅ **Free to use** under GNU General Public License (GPL)
- ✅ Your project must also be **open source** (GPL compatible)
- ✅ No additional licensing fees required

#### **💼 For Commercial/Proprietary Projects:**
- ⚠️ **Commercial license required** from Astrodienst AG
- ⚠️ Cannot be used in closed-source applications without commercial license
- ⚠️ Contact Astrodienst AG for pricing and terms

### **📞 Commercial Licensing Contact**

For commercial use of Swiss Ephemeris:

**Astrodienst AG**
📧 Email: swisseph@astro.ch
🌐 Website: https://www.astro.com/swisseph/
📍 Address: Dammstrasse 23, CH-8702 Zollikon, Switzerland

### **🔍 License Compliance Guide**

| Use Case | License Required | Action Needed |
|----------|------------------|---------------|
| 🆓 **Open Source Project** | GPL v3 | ✅ Use freely, keep project open source |
| 💼 **Commercial Product** | Commercial License | ⚠️ Contact Astrodienst AG |
| 🎓 **Educational/Research** | GPL v3 | ✅ Use freely for non-commercial purposes |
| 🏢 **Internal Business Tools** | Commercial License | ⚠️ Contact Astrodienst AG |

### **📚 Additional Resources**

- 📖 [Swiss Ephemeris Official Documentation](https://www.astro.com/swisseph/)
- ⚖️ [GPL v3 License Text](https://www.gnu.org/licenses/gpl-3.0.html)
- 🏢 [Commercial Licensing Information](https://www.astro.com/swisseph/swephinfo_e.htm#_Toc46391649)

### **⚠️ Disclaimer**

The author of `swisseph-wasm` is not affiliated with Astrodienst AG and cannot provide commercial licenses for Swiss Ephemeris. This WebAssembly wrapper is provided "as is" under GPL v3. Users are responsible for ensuring compliance with Swiss Ephemeris licensing terms for their specific use case.

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

---

**Ready to calculate the cosmos? Start with the [Quick Reference](QUICK_REFERENCE.md) or dive into the [Complete Documentation](DOCUMENTATION.md)!** 🌟
