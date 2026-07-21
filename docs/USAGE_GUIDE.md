# SwissEph WebAssembly Usage Guide

> [Docs index](README.md) · [Full API](DOCUMENTATION.md) · [Quick Reference](QUICK_REFERENCE.md) · [▶ Live Playground](https://prolaxu.github.io/swisseph-wasm/examples/playground.html) · [Install & overview](../README.md)

This guide provides comprehensive instructions for using SwissEph WebAssembly across different platforms and frameworks.

## 🚀 Quick Start

### 1. Installation
```bash
npm install swisseph-wasm
```

### 2. Basic Usage
```javascript
import SwissEph from 'swisseph-wasm';

async function example() {
  const swe = new SwissEph();
  await swe.initSwissEph();
  
  const jd = swe.julday(2023, 6, 15, 12.0);
  const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
  
  console.log(`Sun longitude: ${sunPos[0].toFixed(2)}°`);
  swe.close();
}

example().catch(console.error);
```

## 🌐 Platform-Specific Setup

### Node.js
Works out of the box with ES modules:

```javascript
// package.json should have "type": "module"
import SwissEph from 'swisseph-wasm';

async function nodeExample() {
  const swe = new SwissEph();
  await swe.initSwissEph();
  
  // Your calculations here
  
  swe.close();
}
```

### Vite (Vue.js, React, Svelte)
Add to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  // ... your existing config
  server: {
    fs: { allow: ['..'] }
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['swisseph-wasm']
  }
})
```

### Create React App
For CRA, you may need to eject or use CRACO to configure webpack for WASM support.

### Next.js
Add to your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

module.exports = nextConfig;
```

### Webpack
Add to your `webpack.config.js`:

```javascript
module.exports = {
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

## 🔧 Framework Examples

### Vue.js Composition API
```vue
<script setup>
import SwissEph from 'swisseph-wasm';
import { onMounted, onUnmounted, ref } from 'vue';

const swe = ref(null);
const isReady = ref(false);
const result = ref('');

onMounted(async () => {
  try {
    swe.value = new SwissEph();
    await swe.value.initSwissEph();
    isReady.value = true;
  } catch (error) {
    console.error('SwissEph initialization failed:', error);
  }
});

onUnmounted(() => {
  if (swe.value) {
    swe.value.close();
  }
});

const calculateSun = () => {
  if (!isReady.value) return;
  
  const jd = swe.value.julday(2023, 6, 15, 12.0);
  const pos = swe.value.calc_ut(jd, swe.value.SE_SUN, swe.value.SEFLG_SWIEPH);
  result.value = `Sun: ${pos[0].toFixed(2)}°`;
};
</script>

<template>
  <div>
    <button @click="calculateSun" :disabled="!isReady">
      Calculate Sun Position
    </button>
    <p v-if="result">{{ result }}</p>
  </div>
</template>
```

### React Hook
```jsx
import { useState, useEffect, useCallback } from 'react';
import SwissEph from 'swisseph-wasm';

function useSwissEph() {
  const [swe, setSwe] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initSwissEph = async () => {
      try {
        const swissEph = new SwissEph();
        await swissEph.initSwissEph();
        
        if (mounted) {
          setSwe(swissEph);
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      }
    };

    initSwissEph();

    return () => {
      mounted = false;
      if (swe) {
        swe.close();
      }
    };
  }, []);

  const calculate = useCallback((callback) => {
    if (!isReady || !swe) return null;
    return callback(swe);
  }, [swe, isReady]);

  return { swe, isReady, error, calculate };
}

// Usage in component
function AstrologyComponent() {
  const { calculate, isReady } = useSwissEph();
  const [result, setResult] = useState('');

  const handleCalculate = () => {
    const sunPos = calculate((swe) => {
      const jd = swe.julday(2023, 6, 15, 12.0);
      return swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
    });
    
    if (sunPos) {
      setResult(`Sun: ${sunPos[0].toFixed(2)}°`);
    }
  };

  return (
    <div>
      <button onClick={handleCalculate} disabled={!isReady}>
        Calculate Sun Position
      </button>
      {result && <p>{result}</p>}
    </div>
  );
}
```

## 🌍 CDN Usage

### Basic HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>SwissEph CDN Example</title>
</head>
<body>
    <div id="app">
        <button id="calculate">Calculate</button>
        <div id="result"></div>
    </div>

    <script type="module">
        import SwissEph from 'https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js';
        
        let swe = null;

        // Initialize
        (async () => {
            try {
                swe = new SwissEph();
                await swe.initSwissEph();
                console.log('SwissEph ready!');
            } catch (error) {
                console.error('Initialization failed:', error);
            }
        })();

        // Calculate button
        document.getElementById('calculate').addEventListener('click', () => {
            if (!swe) return;
            
            const jd = swe.julday(2023, 6, 15, 12.0);
            const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
            
            document.getElementById('result').textContent = 
                `Sun: ${sunPos[0].toFixed(2)}°`;
        });

        // Cleanup
        window.addEventListener('beforeunload', () => {
            if (swe) swe.close();
        });
    </script>
</body>
</html>
```

## 🔍 Best Practices

### 1. Resource Management
Always clean up resources:

```javascript
// ✅ Good
try {
  const swe = new SwissEph();
  await swe.initSwissEph();
  // ... calculations
} finally {
  swe.close(); // Always clean up
}

// ✅ Better - with error handling
async function safeCalculation() {
  let swe = null;
  try {
    swe = new SwissEph();
    await swe.initSwissEph();
    return performCalculations(swe);
  } catch (error) {
    console.error('Calculation failed:', error);
    throw error;
  } finally {
    if (swe) swe.close();
  }
}
```

### 2. Reuse Instances
For multiple calculations, reuse the same instance:

```javascript
// ✅ Efficient
const swe = new SwissEph();
await swe.initSwissEph();

for (const date of dates) {
  const jd = swe.julday(date.year, date.month, date.day, date.hour);
  const sunPos = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
  // Process result
}

swe.close();
```

### 3. Error Handling
Handle initialization and calculation errors:

```javascript
async function robustCalculation() {
  let swe = null;
  
  try {
    swe = new SwissEph();
    await swe.initSwissEph();
    
    const jd = swe.julday(2023, 6, 15, 12.0);
    const result = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
    
    if (!result || result.length < 4) {
      throw new Error('Invalid calculation result');
    }
    
    return result;
  } catch (error) {
    console.error('SwissEph error:', error);
    throw new Error(`Astronomical calculation failed: ${error.message}`);
  } finally {
    if (swe) swe.close();
  }
}
```

## 🚨 Common Pitfalls

1. **Forgetting to initialize**: Always call `await swe.initSwissEph()`
2. **Not cleaning up**: Always call `swe.close()` when done
3. **Wrong date format**: Use UTC dates and proper Julian Day conversion
4. **Missing WASM config**: Configure your bundler for WASM support
5. **Blocking the main thread**: Use Web Workers for heavy calculations

## 📞 Support

- **Documentation**: [DOCUMENTATION.md](DOCUMENTATION.md)
- **Examples**: [examples/](../examples/)
- **Issues**: [GitHub Issues](https://github.com/prolaxu/swisseph-wasm/issues)
- **Quick Reference**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
