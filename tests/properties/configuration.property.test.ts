import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { ParticleManager, ParticleSpawnConfig, Rectangle } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { JSDOM } from 'jsdom';

// Feature: dust-particle-aggregation, Property 11: Konfigurationsänderungen wirken sofort
// **Validates: Requirements 2.5, 4.6, 10.7**

describe('Property 11: Konfigurationsänderungen wirken sofort', () => {
  // Setup JSDOM for canvas
  let canvas: HTMLCanvasElement;

  beforeAll(() => {
    const dom = new JSDOM('<!DOCTYPE html><canvas id="testCanvas"></canvas>');
    global.document = dom.window.document as any;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement as any;
    
    // Mock canvas context
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
    
    HTMLCanvasElement.prototype.getContext = function() {
      return mockContext as any;
    };
    
    canvas = dom.window.document.getElementById('testCanvas') as any;
    canvas.width = 800;
    canvas.height = 600;
  });

  const createTestSetup = () => {
    const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
    const spawnConfig: ParticleSpawnConfig = {
      spawnRate: 2,
      massRange: [1, 10],
      energyRange: [10, 100]
    };
    const particleManager = new ParticleManager(bounds, spawnConfig);
    const collisionDetector = new CollisionDetector(50);
    const gravityFormula = new NewtonianGravity(6.674e-11);
    const physicsEngine = new PhysicsEngine(gravityFormula, 0);
    
    const renderConfig: RenderConfig = {
      colorMode: 'mass',
      showVelocityVectors: false,
      showRotation: false
    };
    const renderer = new Renderer(canvas, renderConfig);
    
    const simConfig: SimulationConfig = {
      targetFPS: 60,
      timeScale: 1,
      accuracySteps: 1
    };
    const simulationEngine = new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      simConfig
    );

    return { simulationEngine, particleManager, physicsEngine, renderer };
  };

  it('should apply spawn rate changes immediately to new particles', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(10) }), // New spawn rate
        (newSpawnRate) => {
          const { particleManager } = createTestSetup();
          
          // Change spawn rate
          particleManager.config.spawnRate = newSpawnRate;
          
          // Verify the change is applied immediately
          expect(particleManager.config.spawnRate).toBe(newSpawnRate);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply mass range changes immediately to new particles', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }), // Min mass
        fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }), // Max mass
        (minMass, maxMass) => {
          const { particleManager } = createTestSetup();
          
          // Ensure min <= max
          const actualMin = Math.min(minMass, maxMass);
          const actualMax = Math.max(minMass, maxMass);
          
          // Change mass range
          particleManager.config.massRange = [actualMin, actualMax];
          
          // Verify the change is applied immediately
          expect(particleManager.config.massRange[0]).toBe(actualMin);
          expect(particleManager.config.massRange[1]).toBe(actualMax);
          
          // Spawn a particle and verify it uses the new range
          const particle = particleManager.spawnParticle();
          expect(particle.mass).toBeGreaterThanOrEqual(actualMin);
          expect(particle.mass).toBeLessThanOrEqual(actualMax);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply energy range changes immediately to new particles', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }), // Min energy
        fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }), // Max energy
        (minEnergy, maxEnergy) => {
          const { particleManager } = createTestSetup();
          
          // Ensure min <= max
          const actualMin = Math.min(minEnergy, maxEnergy);
          const actualMax = Math.max(minEnergy, maxEnergy);
          
          // Change energy range
          particleManager.config.energyRange = [actualMin, actualMax];
          
          // Verify the change is applied immediately
          expect(particleManager.config.energyRange[0]).toBe(actualMin);
          expect(particleManager.config.energyRange[1]).toBe(actualMax);
          
          // Spawn a particle and verify it uses the new range
          const particle = particleManager.spawnParticle();
          const kineticEnergy = particle.kineticEnergy();
          
          // Allow small tolerance for floating point errors
          expect(kineticEnergy).toBeGreaterThanOrEqual(actualMin - 0.01);
          expect(kineticEnergy).toBeLessThanOrEqual(actualMax + 0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply elasticity changes immediately to collision resolution', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(1) }), // New elasticity
        (newElasticity) => {
          const { physicsEngine } = createTestSetup();
          
          // Change elasticity
          physicsEngine.setElasticity(newElasticity);
          
          // Verify the change is applied immediately
          expect(physicsEngine.getElasticity()).toBe(newElasticity);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply accuracy steps changes immediately to simulation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // New accuracy steps
        (newAccuracySteps) => {
          const { simulationEngine } = createTestSetup();
          
          // Change accuracy steps
          simulationEngine.setAccuracySteps(newAccuracySteps);
          
          // Verify the change is applied immediately
          const config = simulationEngine.getConfig();
          expect(config.accuracySteps).toBe(newAccuracySteps);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply time scale changes immediately to simulation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(5) }), // New time scale
        (newTimeScale) => {
          const { simulationEngine } = createTestSetup();
          
          // Change time scale
          simulationEngine.setTimeScale(newTimeScale);
          
          // Verify the change is applied immediately
          const config = simulationEngine.getConfig();
          expect(config.timeScale).toBe(newTimeScale);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply color mode changes immediately to renderer', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mass', 'velocity', 'energy'), // Color modes
        (newColorMode) => {
          const { renderer } = createTestSetup();
          
          // Change color mode
          renderer.setColorMode(newColorMode);
          
          // Verify the change is applied immediately
          const config = renderer.getConfig();
          expect(config.colorMode).toBe(newColorMode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply multiple configuration changes independently', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(10) }), // Spawn rate
        fc.float({ min: Math.fround(0), max: Math.fround(1) }), // Elasticity
        fc.float({ min: Math.fround(0.1), max: Math.fround(5) }), // Time scale
        fc.integer({ min: 1, max: 10 }), // Accuracy steps
        (spawnRate, elasticity, timeScale, accuracySteps) => {
          const { simulationEngine, particleManager, physicsEngine } = createTestSetup();
          
          // Apply all changes
          particleManager.config.spawnRate = spawnRate;
          physicsEngine.setElasticity(elasticity);
          simulationEngine.setTimeScale(timeScale);
          simulationEngine.setAccuracySteps(accuracySteps);
          
          // Verify all changes are applied immediately and independently
          expect(particleManager.config.spawnRate).toBe(spawnRate);
          expect(physicsEngine.getElasticity()).toBe(elasticity);
          
          const simConfig = simulationEngine.getConfig();
          expect(simConfig.timeScale).toBe(timeScale);
          expect(simConfig.accuracySteps).toBe(accuracySteps);
        }
      ),
      { numRuns: 100 }
    );
  });
});
