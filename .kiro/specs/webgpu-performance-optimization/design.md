# Design Document: WebGPU Performance Optimization

## Overview

This design document describes the technical architecture for integrating the OptimizedWebGPUPhysicsEngine into SimulationEngine, implementing performance benchmarks, and adding instanced rendering support. The goal is to achieve 5000+ particles at 60 FPS while maintaining backward compatibility and providing graceful fallbacks.

### Context

The simulation currently uses a hybrid approach with Web Workers for multi-threaded CPU physics. An OptimizedWebGPUPhysicsEngine has been implemented with buffer pooling, double-buffering, and async pipeline features, but it is not yet integrated into the main SimulationEngine. Additionally, the current rendering approach creates individual meshes for each particle, resulting in many draw calls that limit rendering performance.

### Goals

1. Integrate OptimizedWebGPUPhysicsEngine into SimulationEngine with automatic WebGPU detection and fallback
2. Create comprehensive performance benchmarks to measure physics and rendering improvements
3. Implement instanced rendering to reduce draw calls and improve rendering performance
4. Achieve 60 FPS with 5000+ particles on WebGPU-capable hardware
5. Maintain backward compatibility with existing CPU-based physics
6. Provide clear diagnostics and error handling for WebGPU initialization failures

### Non-Goals

- Implementing WebGPU-based collision detection (remains CPU-based)
- Migrating conglomerate physics to GPU (complex data structures remain CPU-based)
- Supporting browsers without WebGPU (graceful fallback is sufficient)
- Implementing persistent GPU buffers (future optimization)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SimulationEngine                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Physics Engine Selection (Runtime)                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   WebGPU     │  │   Workers    │  │   CPU Only   │ │ │
│  │  │  Available?  │→ │  Available?  │→ │   Fallback   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │         ↓                  ↓                  ↓         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Optimized    │  │  Parallel    │  │   Physics    │ │ │
│  │  │ WebGPU       │  │  Physics     │  │   Engine     │ │ │
│  │  │ Engine       │  │  Engine      │  │   (Base)     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Renderer                             │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Rendering Mode Selection                         │  │ │
│  │  │  ┌────────────────┐      ┌────────────────┐      │  │ │
│  │  │  │   Instanced    │  or  │  Individual    │      │  │ │
│  │  │  │   Rendering    │      │    Meshes      │      │  │ │
│  │  │  │  (1 draw call) │      │ (N draw calls) │      │  │ │
│  │  │  └────────────────┘      └────────────────┘      │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Benchmark Tool                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Test Configurations                                    │ │
│  │  • Particle counts: 1000, 2500, 5000, 10000           │ │
│  │  • Physics modes: CPU, Workers, GPU                    │ │
│  │  • Rendering modes: Individual, Instanced              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Metrics Collection                                     │ │
│  │  • Physics time per frame                              │ │
│  │  • Rendering time per frame                            │ │
│  │  • Total frame time & FPS                              │ │
│  │  • Performance improvement ratios                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
Initialization:
1. SimulationEngine.initialize()
   ├─> Detect WebGPU availability
   ├─> Create OptimizedWebGPUPhysicsEngine if available
   ├─> Fall back to ParallelPhysicsEngine if not
   └─> Initialize Renderer with instanced rendering option

Game Loop (per frame):
1. SimulationEngine.update(deltaTime)
   ├─> PhysicsEngine.applyGravity(entities, deltaTime)
   │   ├─> If GPU: OptimizedWebGPUPhysicsEngine
   │   │   ├─> Apply forces from previous frame (double-buffer)
   │   │   ├─> Start async GPU compute for next frame
   │   │   └─> Handle conglomerates on CPU
   │   ├─> If Workers: ParallelPhysicsEngine
   │   │   └─> Distribute work across worker pool
   │   └─> If CPU: PhysicsEngine
   │       └─> Sequential O(n²) computation
   ├─> CollisionDetector.detectCollisions(entities)
   └─> PhysicsEngine.resolveCollision(collisions)

2. SimulationEngine.render()
   └─> Renderer.render(entities)
       ├─> If Instanced: Update instance matrices in batch
       │   └─> Single draw call per particle type
       └─> If Individual: Update each mesh separately
           └─> N draw calls for N particles
```

## Components and Interfaces

### 1. SimulationEngine Extensions

The SimulationEngine will be extended to support physics engine selection and runtime switching.

```typescript
interface PhysicsEngineConfig {
  preferGPU: boolean;           // User preference for GPU acceleration
  gpuThreshold: number;         // Minimum particles for GPU (default: 200)
  forceMode?: 'gpu' | 'workers' | 'cpu';  // Force specific mode (for testing)
}

class SimulationEngine {
  private physicsEngine: PhysicsEngine;
  private physicsConfig: PhysicsEngineConfig;
  private currentPhysicsMode: 'gpu' | 'workers' | 'cpu';
  
  // New initialization method
  async initializePhysicsEngine(
    gravityFormula: GravityFormula,
    config: PhysicsEngineConfig
  ): Promise<void>;
  
  // Query current physics mode
  getPhysicsMode(): 'gpu' | 'workers' | 'cpu';
  
  // Runtime switching (preserves simulation state)
  async switchPhysicsEngine(mode: 'gpu' | 'workers' | 'cpu'): Promise<void>;
  
  // Configuration updates
  setGPUThreshold(threshold: number): void;
  setPreferGPU(prefer: boolean): void;
  
  // FPS measurement and reporting
  getCurrentFPS(): number;
  getAverageFPS(frames: number): number;
}
```

### 2. OptimizedWebGPUPhysicsEngine Integration

The existing OptimizedWebGPUPhysicsEngine will be integrated with enhanced error handling and diagnostics.

```typescript
class OptimizedWebGPUPhysicsEngine extends ParallelPhysicsEngine {
  // Enhanced initialization with detailed error reporting
  async initialize(): Promise<{
    success: boolean;
    mode: 'gpu' | 'workers' | 'cpu';
    error?: string;
    gpuInfo?: {
      adapter: string;
      device: string;
      limits: GPULimits;
    };
  }>;
  
  // Diagnostics
  getGPUStatus(): {
    available: boolean;
    active: boolean;
    bufferPoolSize: number;
    computeInProgress: boolean;
  };
  
  // Memory management
  getMemoryUsage(): {
    bufferPoolBytes: number;
    estimatedGPUMemory: number;
  };
}
```

### 3. Renderer Extensions for Instanced Rendering

The Renderer will be extended to support instanced rendering with a toggle for backward compatibility.

```typescript
interface InstancedRenderingConfig {
  enabled: boolean;              // Enable instanced rendering
  maxInstances: number;          // Maximum instances per mesh (default: 10000)
  updateBatchSize: number;       // Batch size for matrix updates (default: 100)
}

class Renderer {
  private instancedRenderingConfig: InstancedRenderingConfig;
  private particleInstancedMesh: THREE.InstancedMesh | null;
  private conglomerateInstancedMeshes: Map<string, THREE.InstancedMesh>;
  private instanceMatrices: Float32Array;
  private instanceColors: Float32Array;
  
  // Initialize instanced rendering
  initializeInstancedRendering(config: InstancedRenderingConfig): void;
  
  // Toggle between rendering modes
  setInstancedRendering(enabled: boolean): void;
  
  // Batch update for instanced rendering
  private updateInstancedMeshes(entities: Entity[]): void;
  
  // Resize instance capacity
  private resizeInstancedMesh(newCapacity: number): void;
  
  // Query rendering mode
  isUsingInstancedRendering(): boolean;
  getRenderingStats(): {
    mode: 'instanced' | 'individual';
    drawCalls: number;
    instanceCount: number;
  };
}
```

### 4. Performance Benchmark Tool

A new benchmark tool will be created to measure and compare performance across different configurations.

```typescript
interface BenchmarkConfig {
  particleCounts: number[];      // e.g., [1000, 2500, 5000, 10000]
  physicsModes: ('cpu' | 'workers' | 'gpu')[];
  renderingModes: ('individual' | 'instanced')[];
  durationSeconds: number;       // Duration per test (default: 10)
  warmupSeconds: number;         // Warmup before measurement (default: 2)
}

interface BenchmarkResult {
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

class PerformanceBenchmark {
  constructor(
    simulationEngine: SimulationEngine,
    config: BenchmarkConfig
  );
  
  // Run all benchmark tests
  async runBenchmarks(): Promise<BenchmarkResult[]>;
  
  // Run single test configuration
  async runSingleTest(
    particleCount: number,
    physicsMode: 'cpu' | 'workers' | 'gpu',
    renderingMode: 'individual' | 'instanced'
  ): Promise<BenchmarkResult>;
  
  // Generate comparison report
  generateReport(results: BenchmarkResult[]): BenchmarkReport;
  
  // Export results
  exportToJSON(results: BenchmarkResult[]): string;
  exportToCSV(results: BenchmarkResult[]): string;
}

interface BenchmarkReport {
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
```

### 5. Configuration Persistence

User preferences for GPU acceleration and rendering mode will be persisted to browser storage.

```typescript
interface PerformancePreferences {
  preferGPU: boolean;
  gpuThreshold: number;
  useInstancedRendering: boolean;
  lastUpdated: Date;
}

class PreferenceManager {
  private storageKey = 'simulation-performance-preferences';
  
  savePreferences(prefs: PerformancePreferences): void;
  loadPreferences(): PerformancePreferences | null;
  clearPreferences(): void;
}
```

## Data Models

### Physics Engine State

```typescript
interface PhysicsEngineState {
  mode: 'gpu' | 'workers' | 'cpu';
  gpuAvailable: boolean;
  gpuActive: boolean;
  workersAvailable: boolean;
  workersActive: boolean;
  particleCount: number;
  threshold: number;
  lastError?: string;
}
```

### Rendering State

```typescript
interface RenderingState {
  mode: 'instanced' | 'individual';
  instancedAvailable: boolean;
  particleCount: number;
  conglomerateCount: number;
  drawCalls: number;
  instanceCapacity: number;
}
```

### Performance Metrics

```typescript
interface FrameMetrics {
  frameNumber: number;
  timestamp: number;
  physicsTimeMs: number;
  renderTimeMs: number;
  totalFrameTimeMs: number;
  fps: number;
}

interface AggregateMetrics {
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
```


## Implementation Details

### WebGPU Detection and Initialization

The SimulationEngine will implement a robust detection and initialization sequence:

```typescript
async initializePhysicsEngine(
  gravityFormula: GravityFormula,
  config: PhysicsEngineConfig
): Promise<void> {
  // Step 1: Check if GPU is forced off
  if (config.forceMode === 'cpu' || config.forceMode === 'workers') {
    this.initializeFallbackEngine(gravityFormula, config.forceMode);
    return;
  }
  
  // Step 2: Try WebGPU initialization
  if (config.preferGPU && navigator.gpu) {
    try {
      const engine = new OptimizedWebGPUPhysicsEngine(
        gravityFormula,
        this.elasticity,
        this.separateOnCollision
      );
      
      const result = await engine.initialize();
      
      if (result.success && result.mode === 'gpu') {
        this.physicsEngine = engine;
        this.currentPhysicsMode = 'gpu';
        console.log('WebGPU Physics: Enabled', result.gpuInfo);
        return;
      }
      
      // GPU initialization failed, log and fall through
      console.warn('WebGPU initialization failed:', result.error);
    } catch (error) {
      console.error('WebGPU initialization error:', error);
    }
  }
  
  // Step 3: Fall back to Workers or CPU
  this.initializeFallbackEngine(gravityFormula, 'workers');
}

private initializeFallbackEngine(
  gravityFormula: GravityFormula,
  preferredMode: 'workers' | 'cpu'
): void {
  if (preferredMode === 'workers' && window.Worker) {
    this.physicsEngine = new ParallelPhysicsEngine(
      gravityFormula,
      this.elasticity,
      this.separateOnCollision
    );
    this.currentPhysicsMode = 'workers';
    console.log('Physics: Using Web Workers');
  } else {
    this.physicsEngine = new PhysicsEngine(
      gravityFormula,
      this.elasticity,
      this.separateOnCollision
    );
    this.currentPhysicsMode = 'cpu';
    console.log('Physics: Using CPU only');
  }
}
```

### Runtime Physics Engine Switching

To support runtime switching while preserving simulation state:

```typescript
async switchPhysicsEngine(mode: 'gpu' | 'workers' | 'cpu'): Promise<void> {
  // Pause simulation
  const wasRunning = this.isRunning;
  if (wasRunning) {
    this.pause();
  }
  
  // Store current configuration
  const gravityFormula = this.physicsEngine.gravityFormula;
  const elasticity = this.physicsEngine.getElasticity();
  
  // Dispose old engine
  if (this.physicsEngine.dispose) {
    this.physicsEngine.dispose();
  }
  
  // Create new engine based on mode
  const config: PhysicsEngineConfig = {
    preferGPU: mode === 'gpu',
    gpuThreshold: this.physicsConfig.gpuThreshold,
    forceMode: mode
  };
  
  await this.initializePhysicsEngine(gravityFormula, config);
  
  // Restore configuration
  this.physicsEngine.setElasticity(elasticity);
  
  // Resume if was running
  if (wasRunning) {
    this.start();
  }
  
  console.log(`Switched to ${this.currentPhysicsMode} physics`);
}
```

### Instanced Rendering Implementation

The Renderer will implement instanced rendering with dynamic capacity management:

```typescript
initializeInstancedRendering(config: InstancedRenderingConfig): void {
  this.instancedRenderingConfig = config;
  
  if (!config.enabled) {
    return;
  }
  
  // Create instanced mesh for particles
  const geometry = new THREE.SphereGeometry(1, 16, 16); // Unit sphere
  const material = new THREE.MeshPhongMaterial({
    shininess: 100,
    specular: 0x444444
  });
  
  this.particleInstancedMesh = new THREE.InstancedMesh(
    geometry,
    material,
    config.maxInstances
  );
  
  // Allocate instance attribute arrays
  this.instanceMatrices = new Float32Array(config.maxInstances * 16);
  this.instanceColors = new Float32Array(config.maxInstances * 3);
  
  this.scene.add(this.particleInstancedMesh);
  
  console.log(`Instanced rendering initialized: ${config.maxInstances} max instances`);
}

private updateInstancedMeshes(entities: Entity[]): void {
  if (!this.instancedRenderingConfig.enabled || !this.particleInstancedMesh) {
    // Fall back to individual mesh rendering
    this.renderIndividualMeshes(entities);
    return;
  }
  
  const particles = entities.filter(e => e instanceof Particle) as Particle[];
  const conglomerates = entities.filter(e => !(e instanceof Particle)) as Conglomerate[];
  
  // Check if we need to resize
  if (particles.length > this.instancedRenderingConfig.maxInstances) {
    this.resizeInstancedMesh(Math.ceil(particles.length * 1.2));
  }
  
  // Update instance matrices and colors in batch
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    
    // Set position and scale
    matrix.makeScale(particle.radius, particle.radius, particle.radius);
    matrix.setPosition(particle.position.x, particle.position.y, particle.position.z);
    
    // Update instance matrix
    this.particleInstancedMesh.setMatrixAt(i, matrix);
    
    // Update instance color
    const particleColor = this.getColor(particle);
    this.particleInstancedMesh.setColorAt(i, particleColor);
  }
  
  // Mark for update
  this.particleInstancedMesh.instanceMatrix.needsUpdate = true;
  if (this.particleInstancedMesh.instanceColor) {
    this.particleInstancedMesh.instanceColor.needsUpdate = true;
  }
  
  // Set visible instance count
  this.particleInstancedMesh.count = particles.length;
  
  // Render conglomerates separately (they have complex structure)
  this.renderConglomerates(conglomerates);
}

private resizeInstancedMesh(newCapacity: number): void {
  if (!this.particleInstancedMesh) return;
  
  console.log(`Resizing instanced mesh: ${this.instancedRenderingConfig.maxInstances} -> ${newCapacity}`);
  
  // Remove old mesh
  this.scene.remove(this.particleInstancedMesh);
  this.particleInstancedMesh.dispose();
  
  // Create new mesh with larger capacity
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  const material = new THREE.MeshPhongMaterial({
    shininess: 100,
    specular: 0x444444
  });
  
  this.particleInstancedMesh = new THREE.InstancedMesh(
    geometry,
    material,
    newCapacity
  );
  
  this.scene.add(this.particleInstancedMesh);
  this.instancedRenderingConfig.maxInstances = newCapacity;
}
```

### Performance Measurement

The benchmark tool will use high-resolution timing:

```typescript
async runSingleTest(
  particleCount: number,
  physicsMode: 'cpu' | 'workers' | 'gpu',
  renderingMode: 'individual' | 'instanced'
): Promise<BenchmarkResult> {
  // Setup
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
    await this.simulationEngine.updatePhysics(0.016);
    const physicsTime = performance.now() - physicsStart;
    
    // Measure rendering
    const renderStart = performance.now();
    this.simulationEngine.render();
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
```

### FPS Monitoring and Display

The SimulationEngine will track FPS for user display:

```typescript
class SimulationEngine {
  private fpsHistory: number[] = [];
  private readonly fpsHistorySize = 60; // Track last 60 frames
  
  private updateFPS(deltaTime: number): void {
    const fps = 1 / deltaTime;
    this.fpsHistory.push(fps);
    
    if (this.fpsHistory.length > this.fpsHistorySize) {
      this.fpsHistory.shift();
    }
  }
  
  getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory[this.fpsHistory.length - 1];
  }
  
  getAverageFPS(frames: number = 60): number {
    if (this.fpsHistory.length === 0) return 0;
    
    const count = Math.min(frames, this.fpsHistory.length);
    const recent = this.fpsHistory.slice(-count);
    return recent.reduce((sum, fps) => sum + fps, 0) / count;
  }
  
  private checkPerformanceWarning(): void {
    const avgFPS = this.getAverageFPS(30);
    const particleCount = this.particleManager.getAllEntities().length;
    
    if (avgFPS < 30 && particleCount > 100) {
      console.warn(
        `Performance warning: ${avgFPS.toFixed(1)} FPS with ${particleCount} particles. ` +
        `Consider reducing particle count or enabling GPU acceleration.`
      );
    }
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Physics Engine Switching Preserves State

*For any* valid simulation state (particle positions, velocities, masses), switching from one physics engine to another and back should preserve the state within numerical precision tolerances (epsilon = 1e-6).

**Validates: Requirements 1.5**

### Property 2: GPU-CPU Round Trip Equivalence

*For any* simulation state, computing physics for one frame with GPU, then switching to CPU and computing another frame, should produce results equivalent to computing both frames with CPU (within numerical precision epsilon = 1e-4, accounting for GPU floating-point differences).

**Validates: Requirements 1.7**

### Property 3: FPS Calculation Correctness

*For any* frame time measurement in milliseconds, the calculated FPS should equal 1000 / frameTimeMs (within rounding tolerance of 0.1 FPS).

**Validates: Requirements 2.3**

### Property 4: Performance Ratio Calculation

*For any* two benchmark results with positive FPS values, the performance improvement ratio should equal result1.fps / result2.fps.

**Validates: Requirements 2.7**

### Property 5: FPS Threshold Detection

*For any* sequence of benchmark results ordered by increasing particle count, if FPS drops below 60 at particle count N, then the reported threshold should be the largest particle count where FPS >= 60, or N if no such count exists.

**Validates: Requirements 2.8**

### Property 6: Instanced Rendering Single Draw Call

*For any* set of N particles of the same type, when instanced rendering is enabled, the number of draw calls for those particles should equal 1.

**Validates: Requirements 3.3**

### Property 7: Instance Attribute Correctness

*For any* particle at index i in the instanced mesh, the instance matrix at index i should encode the particle's position and scale (radius), and the instance color at index i should match the particle's computed color.

**Validates: Requirements 3.4**

### Property 8: Dynamic Instance Capacity Resizing

*For any* particle count N that exceeds the current instanced mesh capacity C, the renderer should resize the mesh to a new capacity C' where C' >= N.

**Validates: Requirements 3.5**

### Property 9: Visual Parity Between Rendering Modes

*For any* set of particles, rendering with instanced mode and rendering with individual mesh mode should produce visually identical output (same positions, colors, and scales for all particles).

**Validates: Requirements 3.6**

### Property 10: Performance Warning Trigger

*For any* simulation state where average FPS over 30 frames is below 30 and particle count exceeds 100, a performance warning should be logged.

**Validates: Requirements 4.4**

### Property 11: Fallback Behavior Equivalence

*For any* simulation configuration where WebGPU is unavailable, the simulation behavior (physics calculations, collision detection, rendering) should be functionally equivalent to the pre-optimization implementation.

**Validates: Requirements 5.2**

### Property 12: State Restoration Independence

*For any* saved simulation state, loading and restoring that state should produce the same particle positions, velocities, and masses regardless of which physics engine (GPU, Workers, or CPU) is active.

**Validates: Requirements 5.4**

### Property 13: Rendering Quality Preservation

*For any* set of entities (particles and conglomerates), the visual output quality (color accuracy, position accuracy, scale accuracy) should be identical between the optimized renderer and the original renderer.

**Validates: Requirements 5.5**

### Property 14: GPU Threshold Enforcement

*For any* particle count N below the configured GPU threshold T, the physics engine should use CPU-based or Worker-based computation, not GPU computation.

**Validates: Requirements 7.3**

### Property 15: Preference Persistence Round Trip

*For any* valid PerformancePreferences object, saving to browser storage and then loading should restore an equivalent preferences object (all fields equal).

**Validates: Requirements 7.6**

## Error Handling

### WebGPU Initialization Failures

The system will handle WebGPU initialization failures gracefully:

1. **Adapter Request Failure**
   - Error: `navigator.gpu.requestAdapter()` returns null
   - Handling: Log warning, fall back to ParallelPhysicsEngine
   - User Impact: Simulation continues with Web Workers

2. **Device Request Failure**
   - Error: `adapter.requestDevice()` throws or returns null
   - Handling: Log error with details, fall back to ParallelPhysicsEngine
   - User Impact: Simulation continues with Web Workers

3. **Shader Compilation Failure**
   - Error: `device.createShaderModule()` throws
   - Handling: Log shader error, fall back to ParallelPhysicsEngine
   - User Impact: Simulation continues with Web Workers

4. **Pipeline Creation Failure**
   - Error: `device.createComputePipeline()` throws
   - Handling: Log pipeline error, fall back to ParallelPhysicsEngine
   - User Impact: Simulation continues with Web Workers

### GPU Memory Allocation Failures

The OptimizedWebGPUPhysicsEngine will handle memory allocation failures:

1. **Buffer Creation Failure**
   - Error: `device.createBuffer()` throws (out of memory)
   - Handling: Log error with requested size, disable GPU for current frame
   - Fallback: Use CPU computation for that frame
   - Recovery: Retry GPU on next frame with smaller buffer pool

2. **Buffer Mapping Failure**
   - Error: `buffer.mapAsync()` throws or times out
   - Handling: Log timeout, use previous frame's forces
   - Fallback: Continue with stale data rather than crash
   - Recovery: Retry on next frame

### GPU Compute Timeouts

The system will detect and handle GPU compute timeouts:

1. **Compute Timeout Detection**
   - Threshold: 100ms for compute operation
   - Detection: Use `Promise.race()` with timeout
   - Handling: Cancel GPU operation, log timeout

2. **Timeout Recovery**
   - Immediate: Fall back to CPU for current frame
   - Short-term: Disable GPU for next 10 frames
   - Long-term: If timeouts persist, permanently disable GPU

### Instanced Rendering Failures

The Renderer will handle instanced rendering failures:

1. **InstancedMesh Creation Failure**
   - Error: Three.js throws during InstancedMesh creation
   - Handling: Log error, disable instanced rendering
   - Fallback: Use individual mesh rendering

2. **Instance Capacity Overflow**
   - Error: Particle count exceeds maximum GPU instance limit
   - Handling: Log warning, split into multiple instanced meshes
   - Fallback: If splitting fails, use individual meshes

3. **Matrix Update Failure**
   - Error: `setMatrixAt()` throws
   - Handling: Log error, skip that instance
   - Fallback: Continue with other instances

### Configuration Errors

The system will validate and handle configuration errors:

1. **Invalid GPU Threshold**
   - Error: Threshold < 0 or not a number
   - Handling: Log warning, use default (200)
   - User Impact: None, sensible default applied

2. **Invalid Physics Mode**
   - Error: Forced mode not in ['gpu', 'workers', 'cpu']
   - Handling: Log error, ignore forced mode
   - Fallback: Use automatic detection

3. **Storage Persistence Failure**
   - Error: `localStorage.setItem()` throws (quota exceeded)
   - Handling: Log warning, continue without persistence
   - User Impact: Preferences not saved across sessions

### Diagnostic Logging

All error conditions will be logged with structured information:

```typescript
interface ErrorLog {
  timestamp: Date;
  component: string;
  errorType: string;
  message: string;
  details?: any;
  fallbackAction: string;
}
```

Example error logs:

```
[WebGPU] Initialization failed: Adapter not available
  → Fallback: Using Web Workers for physics

[WebGPU] Buffer allocation failed: Out of memory (requested 40MB)
  → Fallback: Using CPU for this frame, will retry next frame

[WebGPU] Compute timeout after 100ms (5000 particles)
  → Fallback: Disabling GPU for next 10 frames

[Renderer] InstancedMesh capacity exceeded: 10000 particles, max 8192
  → Fallback: Splitting into 2 instanced meshes
```


## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomization

Both approaches are complementary and necessary. Unit tests catch concrete bugs and verify specific behaviors, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

We will use **fast-check** for JavaScript/TypeScript property-based testing:

```bash
npm install --save-dev fast-check
```

Each property test will:
- Run a minimum of 100 iterations (due to randomization)
- Reference its corresponding design document property
- Use the tag format: **Feature: webgpu-performance-optimization, Property {number}: {property_text}**

### Test Organization

```
tests/
├── unit/
│   ├── SimulationEngine.webgpu.test.ts
│   ├── OptimizedWebGPUPhysicsEngine.test.ts
│   ├── Renderer.instanced.test.ts
│   ├── PerformanceBenchmark.test.ts
│   └── PreferenceManager.test.ts
├── properties/
│   ├── physics-engine-switching.property.test.ts
│   ├── rendering-parity.property.test.ts
│   ├── benchmark-calculations.property.test.ts
│   └── state-persistence.property.test.ts
└── integration/
    ├── webgpu-integration.test.ts
    ├── instanced-rendering-integration.test.ts
    └── benchmark-integration.test.ts
```

### Unit Tests

#### 1. WebGPU Detection and Initialization

```typescript
describe('SimulationEngine WebGPU Integration', () => {
  it('should detect WebGPU availability', () => {
    // Mock navigator.gpu
    const mockGPU = { requestAdapter: vi.fn() };
    Object.defineProperty(navigator, 'gpu', { value: mockGPU });
    
    const engine = new SimulationEngine(/* ... */);
    const available = engine.isWebGPUAvailable();
    
    expect(available).toBe(true);
  });
  
  it('should instantiate OptimizedWebGPUPhysicsEngine when WebGPU is available', async () => {
    // Setup: Mock WebGPU as available
    mockWebGPUAvailable();
    
    const engine = new SimulationEngine(/* ... */);
    await engine.initializePhysicsEngine(gravityFormula, { preferGPU: true });
    
    expect(engine.getPhysicsEngine()).toBeInstanceOf(OptimizedWebGPUPhysicsEngine);
    expect(engine.getPhysicsMode()).toBe('gpu');
  });
  
  it('should fall back to CPU physics when WebGPU is unavailable', async () => {
    // Setup: Mock WebGPU as unavailable
    Object.defineProperty(navigator, 'gpu', { value: undefined });
    
    const engine = new SimulationEngine(/* ... */);
    await engine.initializePhysicsEngine(gravityFormula, { preferGPU: true });
    
    expect(engine.getPhysicsEngine()).toBeInstanceOf(ParallelPhysicsEngine);
    expect(engine.getPhysicsMode()).toBe('workers');
  });
  
  it('should respect force CPU configuration', async () => {
    // Setup: Mock WebGPU as available
    mockWebGPUAvailable();
    
    const engine = new SimulationEngine(/* ... */);
    await engine.initializePhysicsEngine(gravityFormula, { 
      preferGPU: true,
      forceMode: 'cpu'
    });
    
    expect(engine.getPhysicsEngine()).toBeInstanceOf(PhysicsEngine);
    expect(engine.getPhysicsMode()).toBe('cpu');
  });
});
```

#### 2. Instanced Rendering

```typescript
describe('Renderer Instanced Rendering', () => {
  it('should create InstancedMesh when enabled', () => {
    const renderer = new Renderer(canvas, config);
    renderer.initializeInstancedRendering({ enabled: true, maxInstances: 1000 });
    
    expect(renderer.isUsingInstancedRendering()).toBe(true);
    // Verify InstancedMesh exists in scene
  });
  
  it('should update instance matrices in batch', () => {
    const renderer = new Renderer(canvas, config);
    renderer.initializeInstancedRendering({ enabled: true, maxInstances: 1000 });
    
    const particles = createTestParticles(100);
    renderer.render(particles);
    
    // Verify setMatrixAt called 100 times
    // Verify needsUpdate set once
  });
  
  it('should toggle between instanced and individual rendering', () => {
    const renderer = new Renderer(canvas, config);
    renderer.initializeInstancedRendering({ enabled: true, maxInstances: 1000 });
    
    expect(renderer.isUsingInstancedRendering()).toBe(true);
    
    renderer.setInstancedRendering(false);
    expect(renderer.isUsingInstancedRendering()).toBe(false);
  });
});
```

#### 3. Performance Benchmark

```typescript
describe('PerformanceBenchmark', () => {
  it('should measure physics time per frame', async () => {
    const benchmark = new PerformanceBenchmark(engine, config);
    const result = await benchmark.runSingleTest(1000, 'cpu', 'individual');
    
    expect(result.metrics.avgPhysicsTimeMs).toBeGreaterThan(0);
  });
  
  it('should measure rendering time per frame', async () => {
    const benchmark = new PerformanceBenchmark(engine, config);
    const result = await benchmark.runSingleTest(1000, 'cpu', 'individual');
    
    expect(result.metrics.avgRenderTimeMs).toBeGreaterThan(0);
  });
  
  it('should run tests with specified particle counts', async () => {
    const config = {
      particleCounts: [1000, 2500, 5000],
      physicsModes: ['cpu'],
      renderingModes: ['individual'],
      durationSeconds: 1,
      warmupSeconds: 0.5
    };
    
    const benchmark = new PerformanceBenchmark(engine, config);
    const results = await benchmark.runBenchmarks();
    
    expect(results).toHaveLength(3);
    expect(results.map(r => r.particleCount)).toEqual([1000, 2500, 5000]);
  });
  
  it('should output results in structured format', async () => {
    const benchmark = new PerformanceBenchmark(engine, config);
    const results = await benchmark.runBenchmarks();
    
    const json = benchmark.exportToJSON(results);
    const parsed = JSON.parse(json);
    
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('detailedResults');
  });
});
```

#### 4. Error Handling

```typescript
describe('WebGPU Error Handling', () => {
  it('should log error when WebGPU initialization fails', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    
    // Mock WebGPU to fail
    mockWebGPUFailure();
    
    const engine = new SimulationEngine(/* ... */);
    await engine.initializePhysicsEngine(gravityFormula, { preferGPU: true });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('WebGPU initialization failed')
    );
  });
  
  it('should fall back to CPU when GPU memory allocation fails', async () => {
    const gpuEngine = new OptimizedWebGPUPhysicsEngine(/* ... */);
    await gpuEngine.initialize();
    
    // Mock buffer creation failure
    mockBufferCreationFailure();
    
    const entities = createTestParticles(1000);
    gpuEngine.applyGravity(entities, 0.016);
    
    // Should not throw, should fall back to CPU
    expect(() => gpuEngine.applyGravity(entities, 0.016)).not.toThrow();
  });
  
  it('should provide method to query active physics engine', () => {
    const engine = new SimulationEngine(/* ... */);
    
    const mode = engine.getPhysicsMode();
    expect(['gpu', 'workers', 'cpu']).toContain(mode);
  });
});
```

### Property-Based Tests

#### Property 1: Physics Engine Switching Preserves State

```typescript
import fc from 'fast-check';

describe('Property Tests: Physics Engine Switching', () => {
  it('should preserve state when switching engines', () => {
    // Feature: webgpu-performance-optimization, Property 1: Physics Engine Switching Preserves State
    
    fc.assert(
      fc.property(
        fc.array(particleArbitrary(), { minLength: 10, maxLength: 100 }),
        async (particles) => {
          const engine = new SimulationEngine(/* ... */);
          
          // Set initial state
          engine.getParticleManager().setParticles(particles);
          const initialState = captureState(particles);
          
          // Switch GPU -> CPU -> GPU
          await engine.switchPhysicsEngine('cpu');
          await engine.switchPhysicsEngine('gpu');
          
          const finalState = captureState(engine.getParticleManager().getParticles());
          
          // States should be equivalent within epsilon
          expect(statesEqual(initialState, finalState, 1e-6)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Arbitrary generator for particles
function particleArbitrary() {
  return fc.record({
    position: fc.record({
      x: fc.float({ min: -100, max: 100 }),
      y: fc.float({ min: -100, max: 100 }),
      z: fc.float({ min: -100, max: 100 })
    }),
    velocity: fc.record({
      x: fc.float({ min: -10, max: 10 }),
      y: fc.float({ min: -10, max: 10 }),
      z: fc.float({ min: -10, max: 10 })
    }),
    mass: fc.float({ min: 1, max: 100 }),
    radius: fc.float({ min: 0.5, max: 5 })
  });
}
```

#### Property 3: FPS Calculation Correctness

```typescript
describe('Property Tests: FPS Calculation', () => {
  it('should calculate FPS correctly for any frame time', () => {
    // Feature: webgpu-performance-optimization, Property 3: FPS Calculation Correctness
    
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 100 }), // Frame time in ms
        (frameTimeMs) => {
          const expectedFPS = 1000 / frameTimeMs;
          const calculatedFPS = calculateFPS(frameTimeMs);
          
          expect(Math.abs(calculatedFPS - expectedFPS)).toBeLessThan(0.1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 6: Instanced Rendering Single Draw Call

```typescript
describe('Property Tests: Instanced Rendering', () => {
  it('should use single draw call for N particles', () => {
    // Feature: webgpu-performance-optimization, Property 6: Instanced Rendering Single Draw Call
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (particleCount) => {
          const renderer = new Renderer(canvas, config);
          renderer.initializeInstancedRendering({ enabled: true, maxInstances: 2000 });
          
          const particles = createTestParticles(particleCount);
          const stats = renderer.render(particles);
          
          expect(stats.drawCalls).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 9: Visual Parity Between Rendering Modes

```typescript
describe('Property Tests: Rendering Parity', () => {
  it('should produce identical output in both rendering modes', () => {
    // Feature: webgpu-performance-optimization, Property 9: Visual Parity Between Rendering Modes
    
    fc.assert(
      fc.property(
        fc.array(particleArbitrary(), { minLength: 10, maxLength: 100 }),
        (particles) => {
          const renderer1 = new Renderer(canvas1, config);
          renderer1.setInstancedRendering(false);
          
          const renderer2 = new Renderer(canvas2, config);
          renderer2.setInstancedRendering(true);
          
          renderer1.render(particles);
          renderer2.render(particles);
          
          // Compare rendered output (pixel-by-pixel or position/color comparison)
          const output1 = captureRendererOutput(renderer1);
          const output2 = captureRendererOutput(renderer2);
          
          expect(outputsEqual(output1, output2)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 15: Preference Persistence Round Trip

```typescript
describe('Property Tests: Preference Persistence', () => {
  it('should restore preferences after save/load round trip', () => {
    // Feature: webgpu-performance-optimization, Property 15: Preference Persistence Round Trip
    
    fc.assert(
      fc.property(
        fc.record({
          preferGPU: fc.boolean(),
          gpuThreshold: fc.integer({ min: 50, max: 1000 }),
          useInstancedRendering: fc.boolean()
        }),
        (prefs) => {
          const manager = new PreferenceManager();
          
          manager.savePreferences(prefs);
          const loaded = manager.loadPreferences();
          
          expect(loaded).toEqual(prefs);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

#### WebGPU Integration Test

```typescript
describe('Integration: WebGPU Physics', () => {
  it('should run full simulation with GPU physics', async () => {
    const engine = new SimulationEngine(/* ... */);
    await engine.initializePhysicsEngine(gravityFormula, { preferGPU: true });
    
    // Add particles
    for (let i = 0; i < 500; i++) {
      engine.getParticleManager().addParticle(createRandomParticle());
    }
    
    // Run simulation for 100 frames
    for (let i = 0; i < 100; i++) {
      await engine.update(0.016);
      engine.render();
    }
    
    // Verify simulation ran without errors
    expect(engine.getPhysicsMode()).toBe('gpu');
    expect(engine.getParticleManager().getAllEntities().length).toBeGreaterThan(0);
  });
});
```

#### Benchmark Integration Test

```typescript
describe('Integration: Performance Benchmark', () => {
  it('should run complete benchmark suite', async () => {
    const config: BenchmarkConfig = {
      particleCounts: [1000, 2500],
      physicsModes: ['cpu', 'gpu'],
      renderingModes: ['individual', 'instanced'],
      durationSeconds: 2,
      warmupSeconds: 1
    };
    
    const benchmark = new PerformanceBenchmark(engine, config);
    const results = await benchmark.runBenchmarks();
    
    // Should have 2 particle counts × 2 physics modes × 2 rendering modes = 8 results
    expect(results).toHaveLength(8);
    
    // Generate report
    const report = benchmark.generateReport(results);
    
    expect(report.summary.bestConfiguration).toBeDefined();
    expect(report.summary.performanceImprovements).toBeDefined();
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% line coverage for new code
- **Property Test Coverage**: All 15 correctness properties must have corresponding property tests
- **Integration Test Coverage**: All major integration points (WebGPU init, instanced rendering, benchmarks)
- **Error Path Coverage**: All error handling paths must be tested

### Continuous Integration

Tests will run on every commit:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:properties
      - run: npm run test:integration
      - run: npm run test:coverage
```

### Manual Testing Checklist

In addition to automated tests, manual testing should verify:

- [ ] WebGPU detection works in Chrome/Edge
- [ ] Fallback to Workers works in Firefox/Safari
- [ ] Instanced rendering produces correct visual output
- [ ] FPS counter displays accurate values
- [ ] Performance warnings appear when FPS drops
- [ ] Preferences persist across browser sessions
- [ ] Benchmark tool generates readable reports
- [ ] Runtime engine switching works without crashes
- [ ] GPU memory errors are handled gracefully
- [ ] Simulation runs smoothly with 5000+ particles on GPU

