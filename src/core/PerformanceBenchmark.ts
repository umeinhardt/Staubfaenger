import { SimulationEngine } from './SimulationEngine';
import { Particle } from './Particle';
import { Vector3D } from './Vector3D';

/**
 * Configuration for benchmark tests
 */
export interface BenchmarkConfig {
  particleCounts: number[];      // e.g., [1000, 2500, 5000, 10000]
  physicsModes: ('cpu' | 'workers' | 'gpu')[];
  renderingModes: ('individual' | 'instanced')[];
  durationSeconds: number;       // Duration per test (default: 10)
  warmupSeconds: number;         // Warmup before measurement (default: 2)
}

/**
 * Metrics for a single frame
 */
export interface FrameMetrics {
  frameNumber: number;
  timestamp: number;
  physicsTimeMs: number;
  renderTimeMs: number;
  totalFrameTimeMs: number;
  fps: number;
}

/**
 * Aggregate metrics over multiple frames
 */
export interface AggregateMetrics {
  avgPhysicsTimeMs: number;
  avgRenderTimeMs: number;
  avgTotalFrameTimeMs: number;
  avgFPS: number;
  minFPS: number;
  maxFPS: number;
  p50FPS: number;
  p95FPS: number;
  p99FPS: number;
  frameTimeStdDev: number;
  sampleCount: number;
}

/**
 * Result of a single benchmark test
 */
export interface BenchmarkResult {
  particleCount: number;
  physicsMode: 'cpu' | 'workers' | 'gpu';
  renderingMode: 'individual' | 'instanced';
  metrics: {
    avgPhysicsTimeMs: number;
    avgRenderTimeMs: number;
    avgTotalFrameTimeMs: number;
    avgFPS: number;
    minFPS: number;
    maxFPS: number;
    frameTimeStdDev: number;
  };
  timestamp: Date;
}

/**
 * Benchmark report with summary and detailed results
 */
export interface BenchmarkReport {
  summary: {
    bestConfiguration: {
      particleCount: number;
      physicsMode: string;
      renderingMode: string;
      fps: number;
    };
    performanceImprovements: {
      gpuVsCPU: number;          // Ratio
      gpuVsWorkers: number;      // Ratio
      instancedVsIndividual: number;  // Ratio
    };
    fpsThresholds: {
      particleCountAt60FPS: number;
      particleCountAt30FPS: number;
    };
  };
  detailedResults: BenchmarkResult[];
}

/**
 * Performance benchmark tool for measuring physics and rendering performance
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8
 */
export class PerformanceBenchmark {
  private simulationEngine: SimulationEngine;
  private config: BenchmarkConfig;

  constructor(
    simulationEngine: SimulationEngine,
    config: BenchmarkConfig
  ) {
    this.simulationEngine = simulationEngine;
    this.config = config;
  }

  /**
   * Run all benchmark tests
   * Validates: Requirement 2.4
   * @returns Array of benchmark results
   */
  async runBenchmarks(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const particleCount of this.config.particleCounts) {
      for (const physicsMode of this.config.physicsModes) {
        for (const renderingMode of this.config.renderingModes) {
          console.log(`Running benchmark: ${particleCount} particles, ${physicsMode} physics, ${renderingMode} rendering`);
          
          const result = await this.runSingleTest(
            particleCount,
            physicsMode,
            renderingMode
          );
          
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Run single test configuration
   * Validates: Requirements 2.1, 2.2, 2.3
   * @param particleCount - Number of particles
   * @param physicsMode - Physics mode to test
   * @param renderingMode - Rendering mode to test
   * @returns Benchmark result
   */
  async runSingleTest(
    particleCount: number,
    physicsMode: 'cpu' | 'workers' | 'gpu',
    renderingMode: 'individual' | 'instanced'
  ): Promise<BenchmarkResult> {
    // Setup test
    await this.setupTest(particleCount, physicsMode, renderingMode);
    
    // Warmup
    await this.runWarmup(this.config.warmupSeconds);
    
    // Measurement
    const metrics: FrameMetrics[] = [];
    const startTime = performance.now();
    const duration = this.config.durationSeconds * 1000;
    
    while (performance.now() - startTime < duration) {
      const frameStart = performance.now();
      
      // Measure physics
      const physicsStart = performance.now();
      await this.simulationEngine.getPhysicsEngine().applyGravity(
        this.simulationEngine.getParticleManager().getAllEntities(),
        0.016
      );
      const physicsTime = performance.now() - physicsStart;
      
      // Measure rendering
      const renderStart = performance.now();
      this.simulationEngine.getRenderer().render(
        this.simulationEngine.getParticleManager().getAllEntities()
      );
      const renderTime = performance.now() - renderStart;
      
      const totalFrameTime = performance.now() - frameStart;
      
      metrics.push({
        frameNumber: metrics.length,
        timestamp: performance.now(),
        physicsTimeMs: physicsTime,
        renderTimeMs: renderTime,
        totalFrameTimeMs: totalFrameTime,
        fps: 1000 / totalFrameTime
      });
      
      // Wait for next frame
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    // Calculate aggregate metrics
    const aggregate = this.calculateAggregateMetrics(metrics);
    
    return {
      particleCount,
      physicsMode,
      renderingMode,
      metrics: {
        avgPhysicsTimeMs: aggregate.avgPhysicsTimeMs,
        avgRenderTimeMs: aggregate.avgRenderTimeMs,
        avgTotalFrameTimeMs: aggregate.avgTotalFrameTimeMs,
        avgFPS: aggregate.avgFPS,
        minFPS: aggregate.minFPS,
        maxFPS: aggregate.maxFPS,
        frameTimeStdDev: aggregate.frameTimeStdDev
      },
      timestamp: new Date()
    };
  }

  /**
   * Setup test configuration
   * @param particleCount - Number of particles
   * @param physicsMode - Physics mode
   * @param renderingMode - Rendering mode
   */
  private async setupTest(
    particleCount: number,
    physicsMode: 'cpu' | 'workers' | 'gpu',
    renderingMode: 'individual' | 'instanced'
  ): Promise<void> {
    // Reset simulation
    this.simulationEngine.getParticleManager().clear();
    
    // Switch physics engine
    await this.simulationEngine.switchPhysicsEngine(physicsMode);
    
    // Set rendering mode
    this.simulationEngine.getRenderer().setInstancedRendering(renderingMode === 'instanced');
    
    // Create particles manually for benchmark
    // Get boundary from particle manager to spawn within bounds
    const boundary = (this.simulationEngine.getParticleManager() as any).bounds;
    
    // Create particles with random positions and velocities
    for (let i = 0; i < particleCount; i++) {
      // Random position within boundary
      const x = boundary.min.x + Math.random() * (boundary.max.x - boundary.min.x);
      const y = boundary.min.y + Math.random() * (boundary.max.y - boundary.min.y);
      const z = boundary.min.z + Math.random() * (boundary.max.z - boundary.min.z);
      const position = new Vector3D(x, y, z);
      
      // Random velocity (small values for stable simulation)
      const vx = (Math.random() - 0.5) * 20;
      const vy = (Math.random() - 0.5) * 20;
      const vz = (Math.random() - 0.5) * 20;
      const velocity = new Vector3D(vx, vy, vz);
      
      // Random mass between 1 and 10
      const mass = 1 + Math.random() * 9;
      
      // Create particle
      const particle = new Particle(position, velocity, mass);
      
      // Add to particle manager's internal arrays
      (this.simulationEngine.getParticleManager() as any).particles.push(particle);
    }
  }

  /**
   * Run warmup period
   * @param seconds - Warmup duration in seconds
   */
  private async runWarmup(seconds: number): Promise<void> {
    const startTime = performance.now();
    const duration = seconds * 1000;
    
    while (performance.now() - startTime < duration) {
      await this.simulationEngine.getPhysicsEngine().applyGravity(
        this.simulationEngine.getParticleManager().getAllEntities(),
        0.016
      );
      this.simulationEngine.getRenderer().render(
        this.simulationEngine.getParticleManager().getAllEntities()
      );
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  }

  /**
   * Calculate aggregate metrics from frame metrics
   * @param metrics - Array of frame metrics
   * @returns Aggregate metrics
   */
  private calculateAggregateMetrics(metrics: FrameMetrics[]): AggregateMetrics {
    const physicsTimesMs = metrics.map(m => m.physicsTimeMs);
    const renderTimesMs = metrics.map(m => m.renderTimeMs);
    const totalFrameTimesMs = metrics.map(m => m.totalFrameTimeMs);
    const fpsValues = metrics.map(m => m.fps);
    
    return {
      avgPhysicsTimeMs: this.average(physicsTimesMs),
      avgRenderTimeMs: this.average(renderTimesMs),
      avgTotalFrameTimeMs: this.average(totalFrameTimesMs),
      avgFPS: this.average(fpsValues),
      minFPS: Math.min(...fpsValues),
      maxFPS: Math.max(...fpsValues),
      p50FPS: this.percentile(fpsValues, 0.5),
      p95FPS: this.percentile(fpsValues, 0.95),
      p99FPS: this.percentile(fpsValues, 0.99),
      frameTimeStdDev: this.standardDeviation(totalFrameTimesMs),
      sampleCount: metrics.length
    };
  }

  /**
   * Calculate average of array
   * @param values - Array of numbers
   * @returns Average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate percentile
   * @param values - Array of numbers
   * @param p - Percentile (0-1)
   * @returns Percentile value
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index];
  }

  /**
   * Calculate standard deviation
   * @param values - Array of numbers
   * @returns Standard deviation
   */
  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.average(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  /**
   * Generate benchmark report
   * Validates: Requirements 2.7, 2.8
   * @param results - Array of benchmark results
   * @returns Benchmark report
   */
  generateReport(results: BenchmarkResult[]): BenchmarkReport {
    // Find best configuration
    const bestConfig = results.reduce((best, current) => 
      current.metrics.avgFPS > best.metrics.avgFPS ? current : best
    );

    // Calculate performance improvements
    const gpuResults = results.filter(r => r.physicsMode === 'gpu');
    const cpuResults = results.filter(r => r.physicsMode === 'cpu');
    const workersResults = results.filter(r => r.physicsMode === 'workers');
    const instancedResults = results.filter(r => r.renderingMode === 'instanced');
    const individualResults = results.filter(r => r.renderingMode === 'individual');

    const gpuVsCPU = gpuResults.length > 0 && cpuResults.length > 0
      ? this.average(gpuResults.map(r => r.metrics.avgFPS)) / this.average(cpuResults.map(r => r.metrics.avgFPS))
      : 1;

    const gpuVsWorkers = gpuResults.length > 0 && workersResults.length > 0
      ? this.average(gpuResults.map(r => r.metrics.avgFPS)) / this.average(workersResults.map(r => r.metrics.avgFPS))
      : 1;

    const instancedVsIndividual = instancedResults.length > 0 && individualResults.length > 0
      ? this.average(instancedResults.map(r => r.metrics.avgFPS)) / this.average(individualResults.map(r => r.metrics.avgFPS))
      : 1;

    // Find FPS thresholds
    const sortedByParticleCount = [...results].sort((a, b) => a.particleCount - b.particleCount);
    
    let at60FPS = sortedByParticleCount[0];
    for (const result of sortedByParticleCount) {
      if (result.metrics.avgFPS >= 60) {
        at60FPS = result;
      }
    }
    
    let at30FPS = sortedByParticleCount[0];
    for (const result of sortedByParticleCount) {
      if (result.metrics.avgFPS >= 30) {
        at30FPS = result;
      }
    }

    return {
      summary: {
        bestConfiguration: {
          particleCount: bestConfig.particleCount,
          physicsMode: bestConfig.physicsMode,
          renderingMode: bestConfig.renderingMode,
          fps: bestConfig.metrics.avgFPS
        },
        performanceImprovements: {
          gpuVsCPU,
          gpuVsWorkers,
          instancedVsIndividual
        },
        fpsThresholds: {
          particleCountAt60FPS: at60FPS?.particleCount || 0,
          particleCountAt30FPS: at30FPS?.particleCount || 0
        }
      },
      detailedResults: results
    };
  }

  /**
   * Export results to JSON
   * Validates: Requirement 2.6
   * @param results - Array of benchmark results
   * @returns JSON string
   */
  exportToJSON(results: BenchmarkResult[]): string {
    const report = this.generateReport(results);
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export results to CSV
   * Validates: Requirement 2.6
   * @param results - Array of benchmark results
   * @returns CSV string
   */
  exportToCSV(results: BenchmarkResult[]): string {
    const headers = [
      'Particle Count',
      'Physics Mode',
      'Rendering Mode',
      'Avg FPS',
      'Min FPS',
      'Max FPS',
      'Avg Physics Time (ms)',
      'Avg Render Time (ms)',
      'Avg Total Frame Time (ms)',
      'Frame Time Std Dev',
      'Timestamp'
    ];

    const rows = results.map(r => [
      r.particleCount,
      r.physicsMode,
      r.renderingMode,
      r.metrics.avgFPS.toFixed(2),
      r.metrics.minFPS.toFixed(2),
      r.metrics.maxFPS.toFixed(2),
      r.metrics.avgPhysicsTimeMs.toFixed(2),
      r.metrics.avgRenderTimeMs.toFixed(2),
      r.metrics.avgTotalFrameTimeMs.toFixed(2),
      r.metrics.frameTimeStdDev.toFixed(2),
      r.timestamp.toISOString()
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
