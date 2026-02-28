import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { Boundary } from '../../src/core/Boundary';
import { Vector3D } from '../../src/core/Vector3D';
import { JSDOM } from 'jsdom';
import { createWebGLMock } from '../helpers/webgl-mock';

describe('SimulationEngine', () => {
  let simulationEngine: SimulationEngine;
  let particleManager: ParticleManager;
  let collisionDetector: CollisionDetector;
  let physicsEngine: PhysicsEngine;
  let renderer: Renderer;
  let config: SimulationConfig;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Setup JSDOM for canvas
    const dom = new JSDOM('<!DOCTYPE html><canvas id="testCanvas"></canvas>');
    global.document = dom.window.document as any;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement as any;
    global.WebGLRenderingContext = {} as any;
    
    // Create comprehensive WebGL mock
    const webglMock = createWebGLMock();
    
    // Mock canvas.getContext to return our WebGL mock
    HTMLCanvasElement.prototype.getContext = function(contextType: string) {
      if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
        webglMock.canvas = this;
        return webglMock;
      }
      return null;
    } as any;
    
    canvas = dom.window.document.getElementById('testCanvas') as any;
    canvas.width = 800;
    canvas.height = 600;

    // Create bounds
    const bounds = new Boundary(
      new Vector3D(0, 0, 0),
      new Vector3D(1000, 1000, 1000)
    );

    // Create particle spawn config
    const spawnConfig: ParticleSpawnConfig = {
      spawnRate: 1,
      massRange: [1, 10],
      energyRange: [10, 100],
      maxParticles: 0
    };

    // Create render config
    const renderConfig: RenderConfig = {
      colorMode: 'mass',
      showVelocityVectors: false
    };

    // Create simulation config
    config = {
      targetFPS: 60,
      timeScale: 1.0,
      accuracySteps: 1,
      adaptiveTimeSteps: false
    };

    // Create components
    particleManager = new ParticleManager(bounds, spawnConfig);
    collisionDetector = new CollisionDetector(50);
    physicsEngine = new PhysicsEngine(new NewtonianGravity(1.0), 0);
    renderer = new Renderer(canvas, renderConfig);
    
    // Create camera controller
    const camera = renderer.getCamera();

    // Create simulation engine
    simulationEngine = new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      camera,
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
