import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { ParticleManager, ParticleSpawnConfig, Rectangle } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { NewtonianGravity } from '../../src/core/GravityFormula';

// Mock canvas and context
class MockCanvasRenderingContext2D {
  fillStyle: string = '#000000';
  strokeStyle: string = '#000000';
  lineWidth: number = 1;
  
  fillRect = vi.fn();
  beginPath = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
}

class MockHTMLCanvasElement {
  width: number = 800;
  height: number = 600;
  private context: MockCanvasRenderingContext2D;

  constructor() {
    this.context = new MockCanvasRenderingContext2D();
  }

  getContext(contextType: string): MockCanvasRenderingContext2D | null {
    if (contextType === '2d') {
      return this.context;
    }
    return null;
  }
}

describe('SimulationEngine', () => {
  let simulationEngine: SimulationEngine;
  let particleManager: ParticleManager;
  let collisionDetector: CollisionDetector;
  let physicsEngine: PhysicsEngine;
  let renderer: Renderer;
  let config: SimulationConfig;

  beforeEach(() => {
    // Create mock canvas
    const canvas = new MockHTMLCanvasElement();

    // Create bounds
    const bounds: Rectangle = { x: 0, y: 0, width: 1000, height: 1000 };

    // Create particle spawn config
    const spawnConfig: ParticleSpawnConfig = {
      spawnRate: 1,
      massRange: [1, 10],
      energyRange: [10, 100]
    };

    // Create render config
    const renderConfig: RenderConfig = {
      colorMode: 'mass',
      showVelocityVectors: false,
      showRotation: false
    };

    // Create simulation config
    config = {
      targetFPS: 60,
      timeScale: 1.0,
      accuracySteps: 1
    };

    // Create components
    particleManager = new ParticleManager(bounds, spawnConfig);
    collisionDetector = new CollisionDetector(50);
    physicsEngine = new PhysicsEngine(new NewtonianGravity(1.0), 0);
    renderer = new Renderer(canvas as any, renderConfig);

    // Create simulation engine
    simulationEngine = new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      config
    );
  });

  describe('initialization', () => {
    it('should initialize with isRunning = false', () => {
      expect(simulationEngine.getIsRunning()).toBe(false);
    });

    it('should store the configuration', () => {
      const storedConfig = simulationEngine.getConfig();
      expect(storedConfig.targetFPS).toBe(60);
      expect(storedConfig.timeScale).toBe(1.0);
      expect(storedConfig.accuracySteps).toBe(1);
    });

    it('should provide access to components', () => {
      expect(simulationEngine.getParticleManager()).toBe(particleManager);
      expect(simulationEngine.getRenderer()).toBe(renderer);
      expect(simulationEngine.getPhysicsEngine()).toBe(physicsEngine);
    });
  });

  describe('start', () => {
    it('should set isRunning to true', () => {
      simulationEngine.start();
      expect(simulationEngine.getIsRunning()).toBe(true);
      simulationEngine.pause(); // Clean up
    });

    it('should not start twice if already running', () => {
      simulationEngine.start();
      const firstStart = simulationEngine.getIsRunning();
      simulationEngine.start();
      const secondStart = simulationEngine.getIsRunning();
      
      expect(firstStart).toBe(true);
      expect(secondStart).toBe(true);
      simulationEngine.pause(); // Clean up
    });
  });

  describe('pause', () => {
    it('should set isRunning to false', () => {
      simulationEngine.start();
      expect(simulationEngine.getIsRunning()).toBe(true);
      
      simulationEngine.pause();
      expect(simulationEngine.getIsRunning()).toBe(false);
    });

    it('should do nothing if already paused', () => {
      expect(simulationEngine.getIsRunning()).toBe(false);
      
      simulationEngine.pause();
      expect(simulationEngine.getIsRunning()).toBe(false);
    });

    it('should stop the game loop', () => {
      simulationEngine.start();
      simulationEngine.pause();
      
      // After pause, isRunning should be false
      expect(simulationEngine.getIsRunning()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all particles and conglomerates', () => {
      // Add some particles
      particleManager.spawnParticle();
      particleManager.spawnParticle();
      particleManager.spawnParticle();
      
      expect(particleManager.getEntityCount()).toBe(3);
      
      simulationEngine.reset();
      
      expect(particleManager.getEntityCount()).toBe(0);
    });

    it('should maintain running state after reset', () => {
      simulationEngine.start();
      expect(simulationEngine.getIsRunning()).toBe(true);
      
      simulationEngine.reset();
      
      // Should still be running after reset
      expect(simulationEngine.getIsRunning()).toBe(true);
      simulationEngine.pause(); // Clean up
    });

    it('should maintain paused state after reset', () => {
      expect(simulationEngine.getIsRunning()).toBe(false);
      
      simulationEngine.reset();
      
      expect(simulationEngine.getIsRunning()).toBe(false);
    });

    it('should reset with particles present', () => {
      particleManager.spawnParticle();
      particleManager.spawnParticle();
      
      simulationEngine.reset();
      
      expect(particleManager.particles.length).toBe(0);
      expect(particleManager.conglomerates.length).toBe(0);
    });
  });

  describe('setTimeScale', () => {
    it('should update the time scale', () => {
      simulationEngine.setTimeScale(2.0);
      
      const config = simulationEngine.getConfig();
      expect(config.timeScale).toBe(2.0);
    });

    it('should accept zero time scale (pause simulation)', () => {
      simulationEngine.setTimeScale(0);
      
      const config = simulationEngine.getConfig();
      expect(config.timeScale).toBe(0);
    });

    it('should accept fractional time scale (slow motion)', () => {
      simulationEngine.setTimeScale(0.5);
      
      const config = simulationEngine.getConfig();
      expect(config.timeScale).toBe(0.5);
    });

    it('should throw error for negative time scale', () => {
      expect(() => simulationEngine.setTimeScale(-1.0)).toThrow('Time scale must be non-negative');
    });

    it('should accept very large time scale', () => {
      simulationEngine.setTimeScale(100.0);
      
      const config = simulationEngine.getConfig();
      expect(config.timeScale).toBe(100.0);
    });
  });

  describe('setAccuracySteps', () => {
    it('should update the accuracy steps', () => {
      simulationEngine.setAccuracySteps(5);
      
      const config = simulationEngine.getConfig();
      expect(config.accuracySteps).toBe(5);
    });

    it('should accept minimum value of 1', () => {
      simulationEngine.setAccuracySteps(1);
      
      const config = simulationEngine.getConfig();
      expect(config.accuracySteps).toBe(1);
    });

    it('should throw error for zero steps', () => {
      expect(() => simulationEngine.setAccuracySteps(0)).toThrow('Accuracy steps must be at least 1');
    });

    it('should throw error for negative steps', () => {
      expect(() => simulationEngine.setAccuracySteps(-5)).toThrow('Accuracy steps must be at least 1');
    });

    it('should floor fractional values', () => {
      simulationEngine.setAccuracySteps(3.7);
      
      const config = simulationEngine.getConfig();
      expect(config.accuracySteps).toBe(3);
    });

    it('should accept large values', () => {
      simulationEngine.setAccuracySteps(100);
      
      const config = simulationEngine.getConfig();
      expect(config.accuracySteps).toBe(100);
    });
  });

  describe('configuration immutability', () => {
    it('should return a copy of config, not the original', () => {
      const config1 = simulationEngine.getConfig();
      config1.timeScale = 999;
      
      const config2 = simulationEngine.getConfig();
      expect(config2.timeScale).toBe(1.0); // Should not be affected
    });
  });

  describe('edge cases', () => {
    it('should handle start-pause-start cycle', () => {
      simulationEngine.start();
      expect(simulationEngine.getIsRunning()).toBe(true);
      
      simulationEngine.pause();
      expect(simulationEngine.getIsRunning()).toBe(false);
      
      simulationEngine.start();
      expect(simulationEngine.getIsRunning()).toBe(true);
      
      simulationEngine.pause(); // Clean up
    });

    it('should handle multiple resets', () => {
      particleManager.spawnParticle();
      simulationEngine.reset();
      
      particleManager.spawnParticle();
      particleManager.spawnParticle();
      simulationEngine.reset();
      
      expect(particleManager.getEntityCount()).toBe(0);
    });

    it('should handle configuration changes while running', () => {
      simulationEngine.start();
      
      simulationEngine.setTimeScale(2.0);
      simulationEngine.setAccuracySteps(3);
      
      expect(simulationEngine.getIsRunning()).toBe(true);
      expect(simulationEngine.getConfig().timeScale).toBe(2.0);
      expect(simulationEngine.getConfig().accuracySteps).toBe(3);
      
      simulationEngine.pause(); // Clean up
    });
  });
});
