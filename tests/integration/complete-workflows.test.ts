/**
 * Integration tests for complete workflows
 * Tests full simulation with GPU physics, instanced rendering, benchmarks, and error recovery
 * Validates: Requirements 1.1, 2.4, 3.1, 6.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Vector3D } from '../../src/core/Vector3D';
import { Boundary } from '../../src/core/Boundary';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { Camera } from '../../src/core/Camera';
import { PerformanceBenchmark, BenchmarkConfig } from '../../src/core/PerformanceBenchmark';
import { Particle } from '../../src/core/Particle';

// Mock WebGL context
function createMockWebGLContext(canvas: HTMLCanvasElement) {
  return {
    canvas: canvas,
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    getParameter: () => 16,
    getExtension: () => null,
    createProgram: () => ({}),
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    getShaderParameter: () => true,
    useProgram: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    getUniformLocation: () => ({}),
    uniformMatrix4fv: () => {},
    uniform1f: () => {},
    uniform3fv: () => {},
    clear: () => {},
    clearColor: () => {},
    enable: () => {},
    disable: () => {},
    depthFunc: () => {},
    viewport: () => {},
    drawArrays: () => {},
    drawElements: () => {},
    createTexture: () => ({}),
    bindTexture: () => {},
    texImage2D: () => {},
    texParameteri: () => {},
    generateMipmap: () => {},
    activeTexture: () => {},
    createFramebuffer: () => ({}),
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    checkFramebufferStatus: () => 36053,
    deleteBuffer: () => {},
    deleteProgram: () => {},
    deleteShader: () => {},
    deleteTexture: () => {},
    deleteFramebuffer: () => {},
    getAttribLocation: () => 0,
    blendFunc: () => {},
    blendEquation: () => {},
  };
}

describe('Complete Workflow Integration Tests', () => {
  let particleManager: ParticleManager;
  let collisionDetector: CollisionDetector;
  let physicsEngine: PhysicsEngine;
  let renderer: Renderer;
  let cameraController: Camera;
  let simulationEngine: SimulationEngine;
  let canvas: HTMLCanvasElement;
  let boundary: Boundary;

  const particleSpawnConfig: ParticleSpawnConfig = {
    spawnRate: 5,
    massRange: [1, 10],
    energyRange: [10, 100],
    maxParticles: 0
  };

  const simulationConfig: SimulationConfig = {
    targetFPS: 60,
    timeScale: 1.0,
    accuracySteps: 1,
    adaptiveTimeSteps: false
  };

  const renderConfig: RenderConfig = {
    colorMode: 'mass',
    showVelocityVectors: false
  };

  beforeEach(() => {
    // Create 3D boundary
    boundary = new Boundary(
      new Vector3D(-100, -100, -100),
      new Vector3D(100, 100, 100)
    );

    // Create canvas element
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Mock getContext to return WebGL context
    const mockContext = createMockWebGLContext(canvas);
    canvas.getContext = vi.fn((contextType: string) => {
      if (contextType === 'webgl' || contextType === 'webgl2') {
        return mockContext as any;
      }
      return null;
    });

    // Initialize components
    particleManager = new ParticleManager(boundary, particleSpawnConfig);
    collisionDetector = new CollisionDetector(20);
    const gravityFormula = new NewtonianGravity(1.0, 0.01);
    physicsEngine = new PhysicsEngine(gravityFormula, 0);
    renderer = new Renderer(canvas, renderConfig);
    cameraController = new Camera(canvas, boundary);

    simulationEngine = new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      cameraController,
      simulationConfig
    );
  });

  afterEach(() => {
    // Clean up
    if (simulationEngine && simulationEngine.getIsRunning()) {
      simulationEngine.pause();
    }
  });

  describe('Full Simulation with GPU Physics and Instanced Rendering', () => {
    it('should run complete simulation with GPU physics and instanced rendering', async () => {
      // Initialize GPU physics if available
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: true,
        gpuThreshold: 10
      });

      // Enable instanced rendering
      simulationEngine.setInstancedRendering(true);

      // Spawn particles
      for (let i = 0; i < 50; i++) {
        particleManager.spawnParticle();
      }

      expect(particleManager.getEntityCount()).toBe(50);

      // Run physics and rendering
      const entities = particleManager.getAllEntities();
      for (let i = 0; i < 5; i++) {
        await physicsEngine.applyGravity(entities, 0.016);
        particleManager.update(0.016);
        await collisionDetector.detectCollisions(entities);
        renderer.render(entities);
      }

      // Verify rendering mode
      expect(renderer.isUsingInstancedRendering()).toBe(true);

      // Verify physics mode (GPU or fallback)
      const physicsMode = simulationEngine.getPhysicsMode();
      expect(['gpu', 'workers', 'cpu']).toContain(physicsMode);
    });

    it('should handle GPU physics with many particles', async () => {
      // Initialize GPU physics
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: true,
        gpuThreshold: 50
      });

      // Enable instanced rendering
      simulationEngine.setInstancedRendering(true);

      // Spawn many particles
      for (let i = 0; i < 100; i++) {
        particleManager.spawnParticle();
      }

      expect(particleManager.getEntityCount()).toBe(100);

      // Run physics update
      const entities = particleManager.getAllEntities();
      const startTime = performance.now();
      
      await physicsEngine.applyGravity(entities, 0.016);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(100);

      // Verify all particles still exist
      expect(particleManager.getEntityCount()).toBe(100);
    });

    it('should render with instanced rendering efficiently', async () => {
      // Enable instanced rendering
      simulationEngine.setInstancedRendering(true);

      // Spawn particles
      for (let i = 0; i < 100; i++) {
        particleManager.spawnParticle();
      }

      const entities = particleManager.getAllEntities();

      // Measure rendering time
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        renderer.render(entities);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should render efficiently (< 50ms for 10 frames)
      expect(duration).toBeLessThan(50);

      // Verify rendering stats
      const stats = renderer.getRenderingStats();
      expect(stats.mode).toBe('instanced');
      expect(stats.instanceCount).toBe(100);
    });

    it('should handle collision detection with GPU physics', async () => {
      // Initialize GPU physics
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: true,
        gpuThreshold: 10
      });

      // Create particles close together
      const p1 = particleManager.spawnParticle();
      const p2 = particleManager.spawnParticle();

      p1!.position = new Vector3D(0, 0, 0);
      p2!.position = new Vector3D(p1!.radius + p2!.radius - 0.1, 0, 0);

      const entities = particleManager.getAllEntities();

      // Apply gravity
      await physicsEngine.applyGravity(entities, 0.016);

      // Detect collisions
      const collisions = await collisionDetector.detectCollisions(entities);

      // Should detect collision
      expect(collisions.length).toBeGreaterThan(0);
    });
  });


  describe('Benchmark Suite Execution', () => {
    it('should execute benchmark suite successfully', async () => {
      const benchmarkConfig: BenchmarkConfig = {
        particleCounts: [10, 20],
        physicsModes: ['cpu'],
        renderingModes: ['individual', 'instanced'],
        durationSeconds: 0.5,
        warmupSeconds: 0.1
      };

      const benchmark = new PerformanceBenchmark(simulationEngine, benchmarkConfig);

      // Run benchmarks
      const results = await benchmark.runBenchmarks();

      // Should have results for all combinations
      expect(results.length).toBe(4); // 2 particle counts × 1 physics mode × 2 rendering modes

      // Verify result structure
      for (const result of results) {
        expect(result.particleCount).toBeGreaterThan(0);
        expect(result.physicsMode).toBeDefined();
        expect(result.renderingMode).toBeDefined();
        expect(result.metrics.avgFPS).toBeGreaterThan(0);
        expect(result.metrics.avgPhysicsTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metrics.avgRenderTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should generate benchmark report', async () => {
      const benchmarkConfig: BenchmarkConfig = {
        particleCounts: [10, 20],
        physicsModes: ['cpu'],
        renderingModes: ['individual', 'instanced'],
        durationSeconds: 0.5,
        warmupSeconds: 0.1
      };

      const benchmark = new PerformanceBenchmark(simulationEngine, benchmarkConfig);
      const results = await benchmark.runBenchmarks();

      // Generate report
      const report = benchmark.generateReport(results);

      // Verify report structure
      expect(report.summary).toBeDefined();
      expect(report.summary.bestConfiguration).toBeDefined();
      expect(report.summary.performanceImprovements).toBeDefined();
      expect(report.summary.fpsThresholds).toBeDefined();
      expect(report.detailedResults).toEqual(results);

      // Verify best configuration
      expect(report.summary.bestConfiguration.particleCount).toBeGreaterThan(0);
      expect(report.summary.bestConfiguration.fps).toBeGreaterThan(0);
    });

    it('should export benchmark results to JSON', async () => {
      const benchmarkConfig: BenchmarkConfig = {
        particleCounts: [10],
        physicsModes: ['cpu'],
        renderingModes: ['individual'],
        durationSeconds: 0.5,
        warmupSeconds: 0.1
      };

      const benchmark = new PerformanceBenchmark(simulationEngine, benchmarkConfig);
      const results = await benchmark.runBenchmarks();

      // Export to JSON
      const json = benchmark.exportToJSON(results);

      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.summary).toBeDefined();
      expect(parsed.detailedResults).toBeDefined();
    });

    it('should export benchmark results to CSV', async () => {
      const benchmarkConfig: BenchmarkConfig = {
        particleCounts: [10],
        physicsModes: ['cpu'],
        renderingModes: ['individual'],
        durationSeconds: 0.5,
        warmupSeconds: 0.1
      };

      const benchmark = new PerformanceBenchmark(simulationEngine, benchmarkConfig);
      const results = await benchmark.runBenchmarks();

      // Export to CSV
      const csv = benchmark.exportToCSV(results);

      // Should have header and data rows
      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThan(1);

      // Verify header
      expect(lines[0]).toContain('Particle Count');
      expect(lines[0]).toContain('Physics Mode');
      expect(lines[0]).toContain('Rendering Mode');
      expect(lines[0]).toContain('Avg FPS');
    });

    it('should measure performance improvements', async () => {
      const benchmarkConfig: BenchmarkConfig = {
        particleCounts: [20],
        physicsModes: ['cpu'],
        renderingModes: ['individual', 'instanced'],
        durationSeconds: 0.5,
        warmupSeconds: 0.1
      };

      const benchmark = new PerformanceBenchmark(simulationEngine, benchmarkConfig);
      const results = await benchmark.runBenchmarks();
      const report = benchmark.generateReport(results);

      // Should calculate performance improvements
      expect(report.summary.performanceImprovements.instancedVsIndividual).toBeGreaterThan(0);
    });
  });

  describe('Runtime Configuration Changes', () => {
    it('should switch physics engines at runtime', async () => {
      // Start with CPU
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      });

      expect(simulationEngine.getPhysicsMode()).toBe('cpu');

      // Spawn particles
      for (let i = 0; i < 10; i++) {
        particleManager.spawnParticle();
      }

      const initialCount = particleManager.getEntityCount();

      // Switch to workers
      await simulationEngine.switchPhysicsEngine('workers');
      expect(simulationEngine.getPhysicsMode()).toBe('workers');

      // Verify particles still exist
      expect(particleManager.getEntityCount()).toBe(initialCount);

      // Try to switch to GPU (may fall back if unavailable)
      await simulationEngine.switchPhysicsEngine('gpu');
      const finalMode = simulationEngine.getPhysicsMode();
      expect(['gpu', 'workers', 'cpu']).toContain(finalMode);
    });

    it('should toggle instanced rendering at runtime', () => {
      // Start with individual rendering
      simulationEngine.setInstancedRendering(false);
      expect(renderer.isUsingInstancedRendering()).toBe(false);

      // Spawn particles
      for (let i = 0; i < 20; i++) {
        particleManager.spawnParticle();
      }

      // Render with individual mode
      const entities = particleManager.getAllEntities();
      renderer.render(entities);

      let stats = renderer.getRenderingStats();
      expect(stats.mode).toBe('individual');

      // Switch to instanced rendering
      simulationEngine.setInstancedRendering(true);
      expect(renderer.isUsingInstancedRendering()).toBe(true);

      // Render with instanced mode
      renderer.render(entities);

      stats = renderer.getRenderingStats();
      expect(stats.mode).toBe('instanced');
    });

    it('should change GPU threshold at runtime', async () => {
      // Initialize with low threshold
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: true,
        gpuThreshold: 10
      });

      // Change threshold
      simulationEngine.setGPUThreshold(100);

      // Threshold should be updated
      // Note: We can't directly verify the threshold, but we can verify the method doesn't throw
      expect(() => simulationEngine.setGPUThreshold(200)).not.toThrow();
    });

    it('should change time scale at runtime', () => {
      // Set normal speed
      simulationEngine.setTimeScale(1.0);
      expect(simulationEngine.getConfig().timeScale).toBe(1.0);

      // Set double speed
      simulationEngine.setTimeScale(2.0);
      expect(simulationEngine.getConfig().timeScale).toBe(2.0);

      // Set half speed
      simulationEngine.setTimeScale(0.5);
      expect(simulationEngine.getConfig().timeScale).toBe(0.5);
    });

    it('should preserve simulation state during configuration changes', async () => {
      // Spawn particles
      for (let i = 0; i < 10; i++) {
        particleManager.spawnParticle();
      }

      const initialCount = particleManager.getEntityCount();
      const initialPositions = particleManager.getAllEntities()
        .filter(e => e instanceof Particle)
        .map(e => {
          const p = e as Particle;
          return {
            id: p.id,
            x: p.position.x,
            y: p.position.y,
            z: p.position.z
          };
        });

      // Change rendering mode
      simulationEngine.setInstancedRendering(true);

      // Verify particles still exist
      expect(particleManager.getEntityCount()).toBe(initialCount);

      // Verify positions unchanged
      const finalEntities = particleManager.getAllEntities().filter(e => e instanceof Particle);
      for (let i = 0; i < initialPositions.length; i++) {
        const initial = initialPositions[i];
        const final = finalEntities.find(e => e.id === initial.id) as Particle;
        expect(final).toBeDefined();
        expect(final.position.x).toBeCloseTo(initial.x, 5);
        expect(final.position.y).toBeCloseTo(initial.y, 5);
        expect(final.position.z).toBeCloseTo(initial.z, 5);
      }
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle GPU initialization failure gracefully', async () => {
      // Try to initialize GPU with forced failure scenario
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      
      // This should not throw even if GPU is unavailable
      await expect(
        simulationEngine.initializePhysicsEngine(gravityFormula, {
          preferGPU: true,
          gpuThreshold: 10
        })
      ).resolves.not.toThrow();

      // Should fall back to workers or CPU
      const mode = simulationEngine.getPhysicsMode();
      expect(['gpu', 'workers', 'cpu']).toContain(mode);
    });

    it('should continue simulation after GPU fallback', async () => {
      // Initialize with GPU preference
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: true,
        gpuThreshold: 10
      });

      // Spawn particles
      for (let i = 0; i < 20; i++) {
        particleManager.spawnParticle();
      }

      // Run simulation (should work regardless of GPU availability)
      const entities = particleManager.getAllEntities();
      
      await expect(
        physicsEngine.applyGravity(entities, 0.016)
      ).resolves.not.toThrow();

      particleManager.update(0.016);

      // Verify simulation continues
      expect(particleManager.getEntityCount()).toBe(20);
    });

    it('should handle rendering errors gracefully', () => {
      // Spawn particles
      for (let i = 0; i < 10; i++) {
        particleManager.spawnParticle();
      }

      const entities = particleManager.getAllEntities();

      // Rendering should not throw even with edge cases
      expect(() => renderer.render(entities)).not.toThrow();

      // Try with empty entities
      expect(() => renderer.render([])).not.toThrow();
    });

    it('should recover from invalid configuration', () => {
      // Try invalid time scale
      expect(() => simulationEngine.setTimeScale(-1)).toThrow();

      // Verify simulation still works with valid config
      simulationEngine.setTimeScale(1.0);
      expect(simulationEngine.getConfig().timeScale).toBe(1.0);

      // Try invalid accuracy steps
      expect(() => simulationEngine.setAccuracySteps(0)).toThrow();

      // Verify simulation still works
      simulationEngine.setAccuracySteps(1);
      expect(simulationEngine.getConfig().accuracySteps).toBe(1);
    });

    it('should handle rapid physics engine switching', async () => {
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      
      // Initialize
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      });

      // Spawn particles
      for (let i = 0; i < 10; i++) {
        particleManager.spawnParticle();
      }

      const initialCount = particleManager.getEntityCount();

      // Rapidly switch engines
      await simulationEngine.switchPhysicsEngine('workers');
      await simulationEngine.switchPhysicsEngine('cpu');
      await simulationEngine.switchPhysicsEngine('workers');

      // Verify particles still exist
      expect(particleManager.getEntityCount()).toBe(initialCount);

      // Verify simulation still works
      const entities = particleManager.getAllEntities();
      await expect(
        physicsEngine.applyGravity(entities, 0.016)
      ).resolves.not.toThrow();
    });

    it('should handle memory pressure with many particles', async () => {
      // Enable instanced rendering for efficiency
      simulationEngine.setInstancedRendering(true);

      // Spawn many particles
      for (let i = 0; i < 200; i++) {
        particleManager.spawnParticle();
      }

      expect(particleManager.getEntityCount()).toBe(200);

      // Run simulation
      const entities = particleManager.getAllEntities();
      
      // Should handle large particle count
      await expect(
        physicsEngine.applyGravity(entities, 0.016)
      ).resolves.not.toThrow();

      expect(() => renderer.render(entities)).not.toThrow();

      // Clean up
      simulationEngine.reset();
      expect(particleManager.getEntityCount()).toBe(0);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should execute complete workflow from initialization to benchmark', async () => {
      // Step 1: Initialize with GPU physics
      const gravityFormula = new NewtonianGravity(1.0, 0.01);
      await simulationEngine.initializePhysicsEngine(gravityFormula, {
        preferGPU: true,
        gpuThreshold: 10
      });

      // Step 2: Enable instanced rendering
      simulationEngine.setInstancedRendering(true);

      // Step 3: Spawn particles
      for (let i = 0; i < 30; i++) {
        particleManager.spawnParticle();
      }

      expect(particleManager.getEntityCount()).toBe(30);

      // Step 4: Run simulation frames
      const entities = particleManager.getAllEntities();
      for (let i = 0; i < 5; i++) {
        await physicsEngine.applyGravity(entities, 0.016);
        particleManager.update(0.016);
        renderer.render(entities);
      }

      // Step 5: Run benchmark
      const benchmarkConfig: BenchmarkConfig = {
        particleCounts: [10],
        physicsModes: ['cpu'],
        renderingModes: ['instanced'],
        durationSeconds: 0.5,
        warmupSeconds: 0.1
      };

      const benchmark = new PerformanceBenchmark(simulationEngine, benchmarkConfig);
      const results = await benchmark.runBenchmarks();

      // Step 6: Generate report
      const report = benchmark.generateReport(results);

      // Verify complete workflow
      expect(report.summary.bestConfiguration).toBeDefined();
      expect(report.detailedResults.length).toBeGreaterThan(0);

      // Step 7: Export results
      const json = benchmark.exportToJSON(results);
      expect(json).toBeDefined();

      const csv = benchmark.exportToCSV(results);
      expect(csv).toBeDefined();
    });
  });
});
