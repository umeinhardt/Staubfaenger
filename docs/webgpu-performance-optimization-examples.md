# WebGPU Performance Optimization - Usage Examples

This document provides examples of how to use the WebGPU performance optimization features.

## Table of Contents

1. [Enabling GPU Acceleration](#enabling-gpu-acceleration)
2. [Enabling Instanced Rendering](#enabling-instanced-rendering)
3. [Runtime Physics Engine Switching](#runtime-physics-engine-switching)
4. [Running Performance Benchmarks](#running-performance-benchmarks)
5. [Configuration Persistence](#configuration-persistence)
6. [Monitoring FPS](#monitoring-fps)

## Enabling GPU Acceleration

### Basic Setup

```typescript
import { SimulationEngine } from './core/SimulationEngine';
import { GravityFormula } from './core/GravityFormula';

// Create simulation engine with existing setup
const simulationEngine = new SimulationEngine(
  particleManager,
  collisionDetector,
  physicsEngine,
  renderer,
  cameraController,
  config
);

// Initialize WebGPU physics engine
const gravityFormula = new GravityFormula(/* ... */);
await simulationEngine.initializePhysicsEngine(gravityFormula, {
  preferGPU: true,
  gpuThreshold: 200  // Use GPU when particle count >= 200
});

// Check which physics mode is active
console.log('Physics mode:', simulationEngine.getPhysicsMode());
// Output: 'gpu', 'workers', or 'cpu'
```

### Force Specific Physics Mode

```typescript
// Force GPU mode (for testing)
await simulationEngine.initializePhysicsEngine(gravityFormula, {
  preferGPU: true,
  gpuThreshold: 200,
  forceMode: 'gpu'
});

// Force CPU mode (for compatibility testing)
await simulationEngine.initializePhysicsEngine(gravityFormula, {
  preferGPU: false,
  gpuThreshold: 200,
  forceMode: 'cpu'
});
```

### Adjusting GPU Threshold

```typescript
// Set GPU threshold to 500 particles
simulationEngine.setGPUThreshold(500);

// Disable GPU preference
simulationEngine.setPreferGPU(false);
```

## Enabling Instanced Rendering

### Basic Setup

```typescript
import { Renderer } from './core/Renderer';

// Initialize instanced rendering
renderer.initializeInstancedRendering({
  enabled: true,
  maxInstances: 10000,
  updateBatchSize: 100
});

// Check if instanced rendering is active
console.log('Using instanced rendering:', renderer.isUsingInstancedRendering());

// Get rendering statistics
const stats = renderer.getRenderingStats();
console.log('Rendering mode:', stats.mode);
console.log('Draw calls:', stats.drawCalls);
console.log('Instance count:', stats.instanceCount);
```

### Toggle Rendering Mode

```typescript
// Enable instanced rendering
simulationEngine.setInstancedRendering(true);

// Disable instanced rendering (use individual meshes)
simulationEngine.setInstancedRendering(false);
```

## Runtime Physics Engine Switching

```typescript
// Switch to GPU physics
await simulationEngine.switchPhysicsEngine('gpu');

// Switch to Web Workers physics
await simulationEngine.switchPhysicsEngine('workers');

// Switch to CPU physics
await simulationEngine.switchPhysicsEngine('cpu');

// Simulation state is preserved during switching
```

## Running Performance Benchmarks

### Basic Benchmark

```typescript
import { PerformanceBenchmark } from './core/PerformanceBenchmark';

// Create benchmark configuration
const benchmarkConfig = {
  particleCounts: [1000, 2500, 5000, 10000],
  physicsModes: ['cpu', 'workers', 'gpu'],
  renderingModes: ['individual', 'instanced'],
  durationSeconds: 10,
  warmupSeconds: 2
};

// Create benchmark instance
const benchmark = new PerformanceBenchmark(simulationEngine, benchmarkConfig);

// Run all benchmarks
const results = await benchmark.runBenchmarks();

// Generate report
const report = benchmark.generateReport(results);
console.log('Best configuration:', report.summary.bestConfiguration);
console.log('GPU vs CPU improvement:', report.summary.performanceImprovements.gpuVsCPU);
console.log('Instanced vs Individual improvement:', report.summary.performanceImprovements.instancedVsIndividual);
console.log('60 FPS threshold:', report.summary.fpsThresholds.particleCountAt60FPS);
```

### Export Benchmark Results

```typescript
// Export to JSON
const jsonResults = benchmark.exportToJSON(results);
console.log(jsonResults);

// Export to CSV
const csvResults = benchmark.exportToCSV(results);
console.log(csvResults);

// Save to file (in browser)
const blob = new Blob([jsonResults], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'benchmark-results.json';
a.click();
```

### Run Single Test

```typescript
// Run a single benchmark test
const result = await benchmark.runSingleTest(
  5000,        // particle count
  'gpu',       // physics mode
  'instanced'  // rendering mode
);

console.log('Average FPS:', result.metrics.avgFPS);
console.log('Min FPS:', result.metrics.minFPS);
console.log('Max FPS:', result.metrics.maxFPS);
console.log('Average physics time:', result.metrics.avgPhysicsTimeMs, 'ms');
console.log('Average render time:', result.metrics.avgRenderTimeMs, 'ms');
```

## Configuration Persistence

Preferences are automatically saved to browser localStorage when you change settings:

```typescript
// These actions automatically save preferences
simulationEngine.setGPUThreshold(500);
simulationEngine.setPreferGPU(true);
simulationEngine.setInstancedRendering(true);

// Preferences are automatically loaded on next page load
```

### Manual Preference Management

```typescript
import { PreferenceManager } from './core/PreferenceManager';

const preferenceManager = new PreferenceManager();

// Load preferences
const prefs = preferenceManager.loadPreferences();
if (prefs) {
  console.log('Loaded preferences:', prefs);
}

// Save preferences manually
preferenceManager.savePreferences({
  preferGPU: true,
  gpuThreshold: 500,
  useInstancedRendering: true,
  lastUpdated: new Date()
});

// Clear preferences
preferenceManager.clearPreferences();
```

## Monitoring FPS

```typescript
// Get current FPS
const currentFPS = simulationEngine.getCurrentFPS();
console.log('Current FPS:', currentFPS);

// Get average FPS over last 60 frames
const avgFPS = simulationEngine.getAverageFPS(60);
console.log('Average FPS (60 frames):', avgFPS);

// Get average FPS over last 30 frames
const avgFPS30 = simulationEngine.getAverageFPS(30);
console.log('Average FPS (30 frames):', avgFPS30);
```

### Performance Warnings

The simulation automatically logs performance warnings when FPS drops below 30 with more than 100 particles:

```
Performance warning: 25.3 FPS with 5000 particles. Consider reducing particle count or enabling GPU acceleration.
```

## Complete Example

```typescript
import { SimulationEngine } from './core/SimulationEngine';
import { GravityFormula } from './core/GravityFormula';
import { PerformanceBenchmark } from './core/PerformanceBenchmark';

async function setupOptimizedSimulation() {
  // Create simulation engine
  const simulationEngine = new SimulationEngine(
    particleManager,
    collisionDetector,
    physicsEngine,
    renderer,
    cameraController,
    config
  );

  // Initialize WebGPU physics
  const gravityFormula = new GravityFormula(/* ... */);
  await simulationEngine.initializePhysicsEngine(gravityFormula, {
    preferGPU: true,
    gpuThreshold: 200
  });

  // Enable instanced rendering
  renderer.initializeInstancedRendering({
    enabled: true,
    maxInstances: 10000,
    updateBatchSize: 100
  });

  // Log status
  console.log('Physics mode:', simulationEngine.getPhysicsMode());
  console.log('Instanced rendering:', renderer.isUsingInstancedRendering());

  // Start simulation
  simulationEngine.start();

  // Monitor FPS
  setInterval(() => {
    const fps = simulationEngine.getAverageFPS(60);
    console.log('FPS:', fps.toFixed(1));
  }, 1000);
}

// Run setup
setupOptimizedSimulation();
```

## GPU Diagnostics

```typescript
import { OptimizedWebGPUPhysicsEngine } from './core/OptimizedWebGPUPhysicsEngine';

// Get GPU status (if using OptimizedWebGPUPhysicsEngine)
if (simulationEngine.getPhysicsEngine() instanceof OptimizedWebGPUPhysicsEngine) {
  const gpuEngine = simulationEngine.getPhysicsEngine() as OptimizedWebGPUPhysicsEngine;
  
  const status = gpuEngine.getGPUStatus();
  console.log('GPU available:', status.available);
  console.log('GPU active:', status.active);
  console.log('Buffer pool size:', status.bufferPoolSize);
  console.log('Compute in progress:', status.computeInProgress);
  
  const memory = gpuEngine.getMemoryUsage();
  console.log('Buffer pool bytes:', memory.bufferPoolBytes);
  console.log('Estimated GPU memory:', memory.estimatedGPUMemory);
}
```

## Error Handling

```typescript
try {
  // Initialize WebGPU
  await simulationEngine.initializePhysicsEngine(gravityFormula, {
    preferGPU: true,
    gpuThreshold: 200
  });
  
  if (simulationEngine.getPhysicsMode() === 'gpu') {
    console.log('WebGPU enabled successfully');
  } else {
    console.log('WebGPU not available, using fallback:', simulationEngine.getPhysicsMode());
  }
} catch (error) {
  console.error('Failed to initialize physics engine:', error);
  // Simulation will continue with CPU/Workers fallback
}
```

## Best Practices

1. **GPU Threshold**: Set the GPU threshold based on your target hardware. Lower-end GPUs may perform better with a higher threshold (e.g., 500-1000 particles).

2. **Instanced Rendering**: Always enable instanced rendering for better performance. It provides 2-3x rendering improvement with no downsides.

3. **Benchmarking**: Run benchmarks on your target hardware to find optimal settings.

4. **FPS Monitoring**: Monitor FPS during development to catch performance regressions early.

5. **Preference Persistence**: Let users' preferences persist across sessions for better UX.

6. **Error Handling**: Always handle WebGPU initialization failures gracefully. The simulation will automatically fall back to CPU/Workers.

7. **Performance Warnings**: Pay attention to performance warnings and adjust particle counts or enable optimizations accordingly.
