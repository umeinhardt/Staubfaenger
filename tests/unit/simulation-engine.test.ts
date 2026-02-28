import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { Boundary } from '../../src/core/Boundary';
import { Vector3D } from '../../src/core/Vector3D';

// Mock canvas and context with all required methods for Three.js WebGLRenderer
class MockHTMLCanvasElement {
  width: number = 800;
  height: number = 600;
  style: any = {};
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    width: this.width,
    height: this.height,
    right: this.width,
    bottom: this.height,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
  getRootNode = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
  
  ownerDocument = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createElement: vi.fn(() => ({
      getContext: vi.fn(() => null)
    }))
  };

  getContext(contextType: string, options?: any): any {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        canvas: this,
        drawingBufferWidth: this.width,
        drawingBufferHeight: this.height,
        getParameter: vi.fn((param) => {
          // Return mock values for common WebGL parameters
          if (param === 0x8B4C) return 16; // MAX_VERTEX_ATTRIBS
          if (param === 0x8869) return 16; // MAX_TEXTURE_IMAGE_UNITS
          if (param === 0x8DFB) return 16; // MAX_COLOR_ATTACHMENTS
          if (param === 0x8824) return 16384; // MAX_TEXTURE_SIZE
          if (param === 0x851C) return 16384; // MAX_CUBE_MAP_TEXTURE_SIZE
          if (param === 0x8073) return 8192; // MAX_VIEWPORT_DIMS
          return 0;
        }),
        getExtension: vi.fn(() => null),
        getContextAttributes: vi.fn(() => ({
          alpha: true,
          antialias: true,
          depth: true,
          stencil: false,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false
        })),
        createShader: vi.fn(() => ({})),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn(() => true),
        createProgram: vi.fn(() => ({})),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn(() => true),
        useProgram: vi.fn(),
        createBuffer: vi.fn(() => ({})),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        createTexture: vi.fn(() => ({})),
        bindTexture: vi.fn(),
        texImage2D: vi.fn(),
        texImage3D: vi.fn(),
        texParameteri: vi.fn(),
        createFramebuffer: vi.fn(() => ({})),
        bindFramebuffer: vi.fn(),
        framebufferTexture2D: vi.fn(),
        createRenderbuffer: vi.fn(() => ({})),
        bindRenderbuffer: vi.fn(),
        renderbufferStorage: vi.fn(),
        framebufferRenderbuffer: vi.fn(),
        checkFramebufferStatus: vi.fn(() => 0x8CD5), // FRAMEBUFFER_COMPLETE
        viewport: vi.fn(),
        clear: vi.fn(),
        clearColor: vi.fn(),
        clearDepth: vi.fn(),
        clearStencil: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        depthFunc: vi.fn(),
        depthMask: vi.fn(),
        colorMask: vi.fn(),
        stencilMask: vi.fn(),
        blendFunc: vi.fn(),
        blendEquation: vi.fn(),
        cullFace: vi.fn(),
        frontFace: vi.fn(),
        lineWidth: vi.fn(),
        polygonOffset: vi.fn(),
        scissor: vi.fn(),
        drawArrays: vi.fn(),
        drawElements: vi.fn(),
        getUniformLocation: vi.fn(() => ({})),
        uniform1f: vi.fn(),
        uniform1i: vi.fn(),
        uniform2f: vi.fn(),
        uniform3f: vi.fn(),
        uniform4f: vi.fn(),
        uniformMatrix4fv: vi.fn(),
        getAttribLocation: vi.fn(() => 0),
        vertexAttribPointer: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        disableVertexAttribArray: vi.fn(),
        getShaderInfoLog: vi.fn(() => ''),
        getProgramInfoLog: vi.fn(() => ''),
        getActiveUniform: vi.fn(() => ({ name: 'test', size: 1, type: 0x1406 })),
        getActiveAttrib: vi.fn(() => ({ name: 'test', size: 1, type: 0x1406 })),
        createVertexArray: vi.fn(() => ({})),
        bindVertexArray: vi.fn(),
        deleteVertexArray: vi.fn(),
        deleteShader: vi.fn(),
        deleteProgram: vi.fn(),
        deleteBuffer: vi.fn(),
        deleteTexture: vi.fn(),
        deleteFramebuffer: vi.fn(),
        deleteRenderbuffer: vi.fn()
      };
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
    renderer = new Renderer(canvas as any, renderConfig);

    // Create simulation engine
    simulationEngine = new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      config,
      'cpu' // Default physics engine type
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
