/**
 * Integration tests for complete 3D simulation cycle
 * Tests the interaction between all components in 3D space
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6, 3.2, 3.3, 3.4, 4.1, 5.8, 6.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3D } from '../../src/core/Vector3D';
import { Boundary } from '../../src/core/Boundary';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { Camera } from '../../src/core/Camera';

describe('3D Simulation Cycle Integration Tests', () => {
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
    accuracySteps: 1
  };

  const renderConfig: RenderConfig = {
    colorMode: 'mass',
    showVelocityVectors: false,
    showRotation: true
  };

  beforeEach(() => {
    // Create 3D boundary (cubic space)
    boundary = new Boundary(
      new Vector3D(-100, -100, -100),
      new Vector3D(100, 100, 100)
    );

    // Create canvas element
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

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

  it('should initialize all 3D components correctly', () => {
    expect(particleManager).toBeDefined();
    expect(collisionDetector).toBeDefined();
    expect(physicsEngine).toBeDefined();
    expect(renderer).toBeDefined();
    expect(cameraController).toBeDefined();
    expect(simulationEngine).toBeDefined();
    expect(boundary).toBeDefined();
  });

  it('should start and pause simulation', () => {
    expect(simulationEngine.getIsRunning()).toBe(false);

    simulationEngine.start();
    expect(simulationEngine.getIsRunning()).toBe(true);

    simulationEngine.pause();
    expect(simulationEngine.getIsRunning()).toBe(false);
  });

  it('should reset simulation to initial state', () => {
    // Spawn some particles
    particleManager.spawnParticle();
    particleManager.spawnParticle();
    expect(particleManager.getEntityCount()).toBe(2);

    // Reset
    simulationEngine.reset();
    expect(particleManager.getEntityCount()).toBe(0);
  });

  it('should spawn particles on 3D boundary faces', () => {
    const particle = particleManager.spawnParticle();
    
    expect(particle).not.toBeNull();
    if (particle) {
      // Particle should be on one of the 6 boundary faces
      const pos = particle.position;
      const onFace = 
        Math.abs(pos.x - boundary.min.x) < 0.01 ||
        Math.abs(pos.x - boundary.max.x) < 0.01 ||
        Math.abs(pos.y - boundary.min.y) < 0.01 ||
        Math.abs(pos.y - boundary.max.y) < 0.01 ||
        Math.abs(pos.z - boundary.min.z) < 0.01 ||
        Math.abs(pos.z - boundary.max.z) < 0.01;
      
      expect(onFace).toBe(true);
    }
  });

  it('should spawn particles with inward velocity in 3D', () => {
    const particle = particleManager.spawnParticle();
    
    expect(particle).not.toBeNull();
    if (particle) {
      // Calculate center of boundary
      const center = new Vector3D(
        (boundary.min.x + boundary.max.x) / 2,
        (boundary.min.y + boundary.max.y) / 2,
        (boundary.min.z + boundary.max.z) / 2
      );
      
      // Direction from spawn position to center
      const toCenter = center.subtract(particle.position);
      
      // Velocity should have positive dot product with direction to center
      const dotProduct = particle.velocity.dot(toCenter);
      expect(dotProduct).toBeGreaterThan(0);
    }
  });

  it('should spawn particles over time', () => {
    const initialCount = particleManager.getEntityCount();

    // Update for 1 second (should spawn ~5 particles at rate of 5/s)
    const deltaTime = 0.1; // 100ms
    for (let i = 0; i < 10; i++) {
      particleManager.update(deltaTime);
    }

    const finalCount = particleManager.getEntityCount();
    expect(finalCount).toBeGreaterThan(initialCount);
    expect(finalCount).toBeGreaterThanOrEqual(4); // At least 4 particles in 1 second
  });

  it('should apply gravity between particles in 3D', () => {
    // Create two particles
    const p1 = particleManager.spawnParticle();
    const p2 = particleManager.spawnParticle();

    // Set known positions and velocities in 3D
    p1!.position = new Vector3D(0, 0, 0);
    p1!.velocity = Vector3D.zero();
    p1!.mass = 10;

    p2!.position = new Vector3D(10, 0, 0);
    p2!.velocity = Vector3D.zero();
    p2!.mass = 10;

    const entities = particleManager.getAllEntities();
    const initialVelocity1 = p1!.velocity.magnitude();

    // Apply gravity
    physicsEngine.applyGravity(entities, 0.1);

    // Particles should have moved towards each other
    const finalVelocity1 = p1!.velocity.magnitude();
    expect(finalVelocity1).toBeGreaterThan(initialVelocity1);
  });

  it('should detect and resolve collisions in 3D', () => {
    // Create two particles that will collide
    const p1 = particleManager.spawnParticle();
    const p2 = particleManager.spawnParticle();

    // Position them close together in 3D space
    p1!.position = new Vector3D(0, 0, 0);
    p1!.mass = 5;
    p2!.position = new Vector3D(p1!.radius + p2!.radius - 0.1, 0, 0); // Overlapping
    p2!.mass = 5;

    const entities = particleManager.getAllEntities();
    const collisions = collisionDetector.detectCollisions(entities);

    expect(collisions.length).toBeGreaterThan(0);
  });

  it('should create conglomerates from colliding particles in 3D', () => {
    // Create two particles
    const p1 = particleManager.spawnParticle();
    const p2 = particleManager.spawnParticle();

    const initialParticleCount = particleManager.particles.length;
    const initialConglomerateCount = particleManager.conglomerates.length;

    // Merge them
    particleManager.createConglomerate(p1!, p2!);

    expect(particleManager.particles.length).toBe(initialParticleCount - 2);
    expect(particleManager.conglomerates.length).toBe(initialConglomerateCount + 1);
  });

  it('should handle wrap-around at 3D boundaries', () => {
    const particle = particleManager.spawnParticle();

    // Move particle outside left boundary (negative x)
    particle!.position = new Vector3D(boundary.min.x - 10, 0, 0);
    particleManager.wrapParticle(particle!);

    // Should wrap to right side
    expect(particle!.position.x).toBeCloseTo(boundary.max.x - 10, 1);
    
    // Test z-axis wrap (unique to 3D)
    particle!.position = new Vector3D(0, 0, boundary.max.z + 15);
    particleManager.wrapParticle(particle!);
    
    // Should wrap to negative z side
    expect(particle!.position.z).toBeCloseTo(boundary.min.z + 15, 1);
  });

  it('should handle conglomerate wrap-around in 3D', () => {
    const p1 = particleManager.spawnParticle();
    const p2 = particleManager.spawnParticle();
    const conglomerate = particleManager.createConglomerate(p1!, p2!);

    // Move conglomerate outside boundary in 3D
    conglomerate.centerOfMass = new Vector3D(
      boundary.max.x + 20,
      boundary.max.y + 10,
      boundary.max.z + 5
    );
    
    particleManager.wrapConglomerate(conglomerate);

    // Should wrap to opposite sides
    expect(conglomerate.centerOfMass.x).toBeCloseTo(boundary.min.x + 20, 1);
    expect(conglomerate.centerOfMass.y).toBeCloseTo(boundary.min.y + 10, 1);
    expect(conglomerate.centerOfMass.z).toBeCloseTo(boundary.min.z + 5, 1);
  });

  it('should use 3D spatial hash for collision detection', () => {
    // Spawn multiple particles in 3D space
    for (let i = 0; i < 10; i++) {
      const particle = particleManager.spawnParticle();
      // Distribute particles in 3D space
      particle!.position = new Vector3D(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      );
    }

    const entities = particleManager.getAllEntities();
    
    // Collision detection should work with 3D spatial hash
    expect(() => {
      collisionDetector.detectCollisions(entities);
    }).not.toThrow();
  });

  it('should update time scale', () => {
    const initialTimeScale = simulationEngine.getConfig().timeScale;
    
    simulationEngine.setTimeScale(2.0);
    
    expect(simulationEngine.getConfig().timeScale).toBe(2.0);
    expect(simulationEngine.getConfig().timeScale).not.toBe(initialTimeScale);
  });

  it('should update accuracy steps', () => {
    const initialAccuracy = simulationEngine.getConfig().accuracySteps;
    
    simulationEngine.setAccuracySteps(5);
    
    expect(simulationEngine.getConfig().accuracySteps).toBe(5);
    expect(simulationEngine.getConfig().accuracySteps).not.toBe(initialAccuracy);
  });

  it('should render 3D scene without errors', () => {
    // Spawn some particles
    particleManager.spawnParticle();
    particleManager.spawnParticle();

    const entities = particleManager.getAllEntities();

    // Should not throw
    expect(() => renderer.render(entities)).not.toThrow();
  });

  it('should handle complete 3D simulation cycle', () => {
    // Start simulation
    simulationEngine.start();
    expect(simulationEngine.getIsRunning()).toBe(true);

    // Spawn initial particles
    for (let i = 0; i < 5; i++) {
      particleManager.spawnParticle();
    }

    const initialCount = particleManager.getEntityCount();
    expect(initialCount).toBe(5);

    // Pause and verify state
    simulationEngine.pause();
    expect(simulationEngine.getIsRunning()).toBe(false);

    // Reset and verify
    simulationEngine.reset();
    expect(particleManager.getEntityCount()).toBe(0);
  });

  it('should maintain physics consistency over multiple steps in 3D', () => {
    // Create particles with known properties in 3D
    const p1 = particleManager.spawnParticle();
    const p2 = particleManager.spawnParticle();

    p1!.position = new Vector3D(-10, 0, 0);
    p1!.velocity = new Vector3D(1, 0, 0);
    p1!.mass = 5;

    p2!.position = new Vector3D(10, 0, 0);
    p2!.velocity = new Vector3D(-1, 0, 0);
    p2!.mass = 5;

    const entities = particleManager.getAllEntities();
    const initialMomentum = p1!.momentum().add(p2!.momentum());

    // Run multiple physics steps
    for (let i = 0; i < 10; i++) {
      physicsEngine.applyGravity(entities, 0.01);
      particleManager.update(0.01);
    }

    // Momentum should be approximately conserved in all 3 dimensions
    const finalMomentum = p1!.momentum().add(p2!.momentum());
    expect(finalMomentum.x).toBeCloseTo(initialMomentum.x, 0);
    expect(finalMomentum.y).toBeCloseTo(initialMomentum.y, 0);
    expect(finalMomentum.z).toBeCloseTo(initialMomentum.z, 0);
  });

  it('should test spatial hash performance with many particles in 3D', () => {
    // Spawn many particles
    for (let i = 0; i < 50; i++) {
      particleManager.spawnParticle();
    }

    const entities = particleManager.getAllEntities();
    expect(entities.length).toBe(50);

    // Measure collision detection performance
    const startTime = performance.now();
    const collisions = collisionDetector.detectCollisions(entities);
    const endTime = performance.now();

    // Should complete in reasonable time (< 100ms for 50 particles)
    expect(endTime - startTime).toBeLessThan(100);
    
    // Collisions array should be defined
    expect(collisions).toBeDefined();
    expect(Array.isArray(collisions)).toBe(true);
  });

  it('should form conglomerates from multiple particles in 3D', () => {
    // Create 3 particles close together in 3D
    const p1 = particleManager.spawnParticle();
    const p2 = particleManager.spawnParticle();
    const p3 = particleManager.spawnParticle();

    p1!.position = new Vector3D(0, 0, 0);
    p2!.position = new Vector3D(2, 0, 0);
    p3!.position = new Vector3D(0, 2, 0);

    // Create first conglomerate
    const c1 = particleManager.createConglomerate(p1!, p2!);
    expect(particleManager.conglomerates.length).toBe(1);

    // Merge third particle
    const c2 = particleManager.mergeParticleWithConglomerate(p3!, c1);
    expect(particleManager.conglomerates.length).toBe(1);
    expect(c2.particles.length).toBe(3);
  });

  it('should update camera controller in simulation loop', () => {
    // Camera controller should be accessible
    const camera = simulationEngine.getCameraController();
    expect(camera).toBeDefined();
    
    // Update should not throw
    expect(() => camera.update()).not.toThrow();
  });
});
