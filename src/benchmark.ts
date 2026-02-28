/**
 * Standalone benchmark script for testing WebGPU performance optimization
 * Can be run from browser console or as a separate page
 * 
 * Usage in browser console:
 * 1. Open the simulation in browser
 * 2. Open developer console (F12)
 * 3. Run: runQuickBenchmark()
 */

import { PerformanceBenchmark, BenchmarkConfig } from './core/PerformanceBenchmark';
import { SimulationEngine } from './core/SimulationEngine';

/**
 * Quick benchmark with minimal configuration
 * Tests GPU vs CPU with small particle counts
 */
export async function runQuickBenchmark(simulationEngine: SimulationEngine): Promise<void> {
  console.log('=== Starting Quick Benchmark ===');
  console.log('This will test GPU vs CPU performance with different particle counts');
  console.log('Estimated time: ~2 minutes');
  console.log('');

  const config: BenchmarkConfig = {
    particleCounts: [500, 1000, 2000],
    physicsModes: ['cpu', 'gpu'],
    renderingModes: ['individual', 'instanced'],
    durationSeconds: 5,
    warmupSeconds: 1
  };

  const benchmark = new PerformanceBenchmark(simulationEngine, config);
  
  try {
    const results = await benchmark.runBenchmarks();
    const report = benchmark.generateReport(results);
    
    console.log('');
    console.log('=== Benchmark Results ===');
    console.log('');
    console.log('Best Configuration:');
    console.log(`  Particle Count: ${report.summary.bestConfiguration.particleCount}`);
    console.log(`  Physics Mode: ${report.summary.bestConfiguration.physicsMode}`);
    console.log(`  Rendering Mode: ${report.summary.bestConfiguration.renderingMode}`);
    console.log(`  FPS: ${report.summary.bestConfiguration.fps.toFixed(1)}`);
    console.log('');
    console.log('Performance Improvements:');
    console.log(`  GPU vs CPU: ${report.summary.performanceImprovements.gpuVsCPU.toFixed(2)}x`);
    console.log(`  GPU vs Workers: ${report.summary.performanceImprovements.gpuVsWorkers.toFixed(2)}x`);
    console.log(`  Instanced vs Individual: ${report.summary.performanceImprovements.instancedVsIndividual.toFixed(2)}x`);
    console.log('');
    console.log('FPS Thresholds:');
    console.log(`  60 FPS: ${report.summary.fpsThresholds.particleCountAt60FPS} particles`);
    console.log(`  30 FPS: ${report.summary.fpsThresholds.particleCountAt30FPS} particles`);
    console.log('');
    console.log('Detailed Results:');
    console.table(results.map(r => ({
      'Particles': r.particleCount,
      'Physics': r.physicsMode,
      'Rendering': r.renderingMode,
      'Avg FPS': r.metrics.avgFPS.toFixed(1),
      'Min FPS': r.metrics.minFPS.toFixed(1),
      'Physics (ms)': r.metrics.avgPhysicsTimeMs.toFixed(2),
      'Render (ms)': r.metrics.avgRenderTimeMs.toFixed(2)
    })));
    
    // Export results
    console.log('');
    console.log('=== Export Results ===');
    console.log('JSON results available in: benchmarkResults.json');
    console.log('CSV results available in: benchmarkResults.csv');
    
    // Save to window for easy access
    (window as any).benchmarkResults = results;
    (window as any).benchmarkReport = report;
    (window as any).benchmarkJSON = benchmark.exportToJSON(results);
    (window as any).benchmarkCSV = benchmark.exportToCSV(results);
    
    console.log('');
    console.log('Results saved to window object:');
    console.log('  window.benchmarkResults - Raw results array');
    console.log('  window.benchmarkReport - Full report with summary');
    console.log('  window.benchmarkJSON - JSON export string');
    console.log('  window.benchmarkCSV - CSV export string');
    
  } catch (error) {
    console.error('Benchmark failed:', error);
    throw error;
  }
}

/**
 * Full benchmark with comprehensive testing
 * Tests all combinations with larger particle counts
 */
export async function runFullBenchmark(simulationEngine: SimulationEngine): Promise<void> {
  console.log('=== Starting Full Benchmark ===');
  console.log('This will test all combinations with larger particle counts');
  console.log('Estimated time: ~10 minutes');
  console.log('');

  const config: BenchmarkConfig = {
    particleCounts: [1000, 2500, 5000, 10000],
    physicsModes: ['cpu', 'workers', 'gpu'],
    renderingModes: ['individual', 'instanced'],
    durationSeconds: 10,
    warmupSeconds: 2
  };

  const benchmark = new PerformanceBenchmark(simulationEngine, config);
  
  try {
    const results = await benchmark.runBenchmarks();
    const report = benchmark.generateReport(results);
    
    console.log('');
    console.log('=== Full Benchmark Results ===');
    console.log('');
    console.log('Best Configuration:');
    console.log(`  Particle Count: ${report.summary.bestConfiguration.particleCount}`);
    console.log(`  Physics Mode: ${report.summary.bestConfiguration.physicsMode}`);
    console.log(`  Rendering Mode: ${report.summary.bestConfiguration.renderingMode}`);
    console.log(`  FPS: ${report.summary.bestConfiguration.fps.toFixed(1)}`);
    console.log('');
    console.log('Performance Improvements:');
    console.log(`  GPU vs CPU: ${report.summary.performanceImprovements.gpuVsCPU.toFixed(2)}x`);
    console.log(`  GPU vs Workers: ${report.summary.performanceImprovements.gpuVsWorkers.toFixed(2)}x`);
    console.log(`  Instanced vs Individual: ${report.summary.performanceImprovements.instancedVsIndividual.toFixed(2)}x`);
    console.log('');
    console.log('FPS Thresholds:');
    console.log(`  60 FPS: ${report.summary.fpsThresholds.particleCountAt60FPS} particles`);
    console.log(`  30 FPS: ${report.summary.fpsThresholds.particleCountAt30FPS} particles`);
    console.log('');
    console.log('Detailed Results:');
    console.table(results.map(r => ({
      'Particles': r.particleCount,
      'Physics': r.physicsMode,
      'Rendering': r.renderingMode,
      'Avg FPS': r.metrics.avgFPS.toFixed(1),
      'Min FPS': r.metrics.minFPS.toFixed(1),
      'Physics (ms)': r.metrics.avgPhysicsTimeMs.toFixed(2),
      'Render (ms)': r.metrics.avgRenderTimeMs.toFixed(2)
    })));
    
    // Save results
    (window as any).benchmarkResults = results;
    (window as any).benchmarkReport = report;
    (window as any).benchmarkJSON = benchmark.exportToJSON(results);
    (window as any).benchmarkCSV = benchmark.exportToCSV(results);
    
    console.log('');
    console.log('Results saved to window object (see window.benchmarkResults, etc.)');
    
  } catch (error) {
    console.error('Benchmark failed:', error);
    throw error;
  }
}

/**
 * Download benchmark results as JSON file
 */
export function downloadBenchmarkJSON(): void {
  const json = (window as any).benchmarkJSON;
  if (!json) {
    console.error('No benchmark results available. Run a benchmark first.');
    return;
  }
  
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `benchmark-results-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('Downloaded benchmark results as JSON');
}

/**
 * Download benchmark results as CSV file
 */
export function downloadBenchmarkCSV(): void {
  const csv = (window as any).benchmarkCSV;
  if (!csv) {
    console.error('No benchmark results available. Run a benchmark first.');
    return;
  }
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `benchmark-results-${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('Downloaded benchmark results as CSV');
}
