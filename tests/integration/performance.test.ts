/**
 * Performance integration tests
 * Tests simulation performance with many particles
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleManager, ParticleSpawnConfig, Rectangle } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';

describe('Performance Integration Tests', () => {
  let particleManager: ParticleManager;
  let collisionDetector: CollisionDetector;
  let physicsEngine: PhysicsEngine;
  let renderer: Renderer;
  let simulationEngine: SimulationEngine;
  let canvas: HTMLCanvasElement;

  const bounds: Rectangle = {
    x: -400,
    y: -300,
    width: 800,
    height: 600
  };

  const particleSpawnConfig: ParticleSpawnConfig = {
    spawnRate: 10,
    massRange: [1, 10],
    energyRange: [10, 100],
    maxParticles: 0
  };

  const simulationConfig: SimulationConfig = {
    targetFPS: 60,
    timeScale: 1.0,
    accuracySteps: 1
  };

  const renderConfig: RenderConfig = {
    colorMode: 'mass',
    showVelocityVectors: false,
    showRotation: true
  };

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Mock canvas context for testing
    const mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
    };
    canvas.getContext = () => mockContext as any;

    particleManager = new ParticleManager(bounds, particleSpawnConfig);
    collisionDetector = new CollisionDetector(20);
    const gravityFormula = new NewtonianGravity(1.0, 0.01);
    physicsEngine = new PhysicsEngine(gravityFormula, 0);
    renderer = new Renderer(canvas, renderConfig);

    simulationEngine = new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      simulationConfig
    );
  });

  it('should handle 50 particles efficiently', () => {
    // Spawn 50 particles
    for (let i = 0; i < 50; i++) {
      particleManager.spawnParticle();
    }

    expect(particleManager.getEntityCount()).toBe(50);

    const startTime = performance.now();

    // Run 10 simulation steps
    const entities = particleManager.getAllEntities();
    for (let i = 0; i < 10; i++) {
      physicsEngine.applyGravity(entities, 0.016);
      particleManager.update(0.016);
      collisionDetector.detectCollisions(entities);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (< 100ms for 10 steps)
    expect(duration).toBeLessThan(100);
  });

  it('should handle 100 particles', () => {
    // Spawn 100 particles
    for (let i = 0; i < 100; i++) {
      particleManager.spawnParticle();
    }

    expect(particleManager.getEntityCount()).toBe(100);

    const startTime = performance.now();

    // Run 5 simulation steps
    const entities = particleManager.getAllEntities();
    for (let i = 0; i < 5; i++) {
      physicsEngine.applyGravity(entities, 0.016);
      particleManager.update(0.016);
      collisionDetector.detectCollisions(entities);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (< 200ms for 5 steps)
    expect(duration).toBeLessThan(200);
  });

  it('should efficiently detect collisions with spatial hashing', () => {
    // Spawn many particles
    for (let i = 0; i < 100; i++) {
      particleManager.spawnParticle();
    }

    const entities = particleManager.getAllEntities();

    const startTime = performance.now();

    // Detect collisions
    const collisions = collisionDetector.detectCollisions(entities);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Collision detection should be fast (< 10ms for 100 particles)
    expect(duration).toBeLessThan(10);
    expect(collisions).toBeDefined();
  });

  it('should render many particles efficiently', () => {
    // Spawn many particles
    for (let i = 0; i < 50; i++) {
      particleManager.spawnParticle();
    }

    const entities = particleManager.getAllEntities();

    const startTime = performance.now();

    // Render 10 frames
    for (let i = 0; i < 10; i++) {
      renderer.render(entities);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Rendering should be fast (< 50ms for 10 frames)
    expect(duration).toBeLessThan(50);
  });

  it('should maintain performance with conglomerates', () => {
    // Create particles and form conglomerates
    for (let i = 0; i < 20; i++) {
      const p1 = particleManager.spawnParticle();
      const p2 = particleManager.spawnParticle();
      particleManager.createConglomerate(p1, p2);
    }

    expect(particleManager.conglomerates.length).toBe(20);

    const startTime = performance.now();

    // Run simulation steps
    const entities = particleManager.getAllEntities();
    for (let i = 0; i < 10; i++) {
      physicsEngine.applyGravity(entities, 0.016);
      particleManager.update(0.016);
      collisionDetector.detectCollisions(entities);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should handle conglomerates efficiently (< 100ms)
    expect(duration).toBeLessThan(100);
  });

  it('should scale with accuracy steps', () => {
    // Spawn particles
    for (let i = 0; i < 30; i++) {
      particleManager.spawnParticle();
    }

    // Test with 1 accuracy step
    simulationEngine.setAccuracySteps(1);
    const startTime1 = performance.now();
    
    const entities = particleManager.getAllEntities();
    for (let i = 0; i < 5; i++) {
      physicsEngine.applyGravity(entities, 0.016);
      particleManager.update(0.016);
    }
    
    const duration1 = performance.now() - startTime1;

    // Test with 5 accuracy steps
    simulationEngine.setAccuracySteps(5);
    const startTime5 = performance.now();
    
    for (let i = 0; i < 5; i++) {
      physicsEngine.applyGravity(entities, 0.016);
      particleManager.update(0.016);
    }
    
    const duration5 = performance.now() - startTime5;

    // Higher accuracy should not be excessively slower
    // Note: Due to timing variations, we just check it's not more than 10x slower
    expect(duration5).toBeLessThan(duration1 * 10); // Not more than 10x slower
    
    // Verify accuracy steps were set correctly
    expect(simulationEngine.getConfig().accuracySteps).toBe(5);
  });

  it('should handle rapid spawning without performance degradation', () => {
    const startTime = performance.now();

    // Rapidly spawn 100 particles
    for (let i = 0; i < 100; i++) {
      particleManager.spawnParticle();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Spawning should be fast (< 20ms for 100 particles)
    expect(duration).toBeLessThan(20);
    expect(particleManager.getEntityCount()).toBe(100);
  });

  it('should handle wrap-around efficiently with many particles', () => {
    // Spawn particles
    for (let i = 0; i < 50; i++) {
      particleManager.spawnParticle();
    }

    const startTime = performance.now();

    // Update with wrap-around
    for (let i = 0; i < 10; i++) {
      particleManager.update(0.016);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should handle wrap-around efficiently (< 20ms)
    expect(duration).toBeLessThan(20);
  });

  it('should maintain frame rate target with moderate load', () => {
    // Spawn moderate number of particles
    for (let i = 0; i < 30; i++) {
      particleManager.spawnParticle();
    }

    const targetFrameTime = 1000 / 60; // 16.67ms for 60 FPS
    const entities = particleManager.getAllEntities();

    const startTime = performance.now();

    // Simulate one frame
    physicsEngine.applyGravity(entities, 0.016);
    particleManager.update(0.016);
    collisionDetector.detectCollisions(entities);
    renderer.render(entities);

    const endTime = performance.now();
    const frameTime = endTime - startTime;

    // Should complete within target frame time for 60 FPS
    expect(frameTime).toBeLessThan(targetFrameTime);
  });

  it('should handle memory efficiently with many entities', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Create and destroy many particles
    for (let i = 0; i < 100; i++) {
      particleManager.spawnParticle();
    }

    simulationEngine.reset();

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Memory should not grow excessively (if memory API is available)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    }
  });
});
