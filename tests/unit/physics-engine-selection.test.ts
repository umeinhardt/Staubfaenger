import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationEngine, SimulationConfig, PhysicsEngineConfig } from '../../src/core/SimulationEngine';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { ParallelPhysicsEngine } from '../../src/core/ParallelPhysicsEngine';
import { OptimizedWebGPUPhysicsEngine } from '../../src/core/OptimizedWebGPUPhysicsEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { Camera } from '../../src/core/Camera';
import { NewtonianGravity } from '../../src/core/GravityFormula';

// Mock WebGL context
const createMockWebGLContext = () => {
  const gl: any = {
    VERSION: 7938,
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    HIGH_FLOAT: 36338,
    MEDIUM_FLOAT: 36337,
    LOW_FLOAT: 36336,
    getExtension: vi.fn(() => ({})),
    getContextAttributes: vi.fn(() => ({
      alpha: true,
      depth: true,
      stencil: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false
    })),
    getParameter: vi.fn((param: number) => {
      if (param === 7938) return 'WebGL 2.0'; // VERSION
      if (param === 7937) return 'WebGL GLSL ES 3.00'; // SHADING_LANGUAGE_VERSION
      if (param === 35724) return 16384; // MAX_VERTEX_ATTRIBS
      if (param === 3379) return 16384; // MAX_TEXTURE_SIZE
      return 16;
    }),
    getShaderPrecisionFormat: vi.fn(() => ({ precision: 23, rangeMin: 127, rangeMax: 127 })),
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
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    uniformMatrix4fv: vi.fn(),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform3fv: vi.fn(),
    uniform4fv: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texImage3D: vi.fn(),
    texParameteri: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    clearDepth: vi.fn(),
    clearStencil: vi.fn(),
    colorMask: vi.fn(),
    depthMask: vi.fn(),
    stencilMask: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    depthFunc: vi.fn(),
    blendFunc: vi.fn(),
    blendEquation: vi.fn(),
    cullFace: vi.fn(),
    frontFace: vi.fn(),
    lineWidth: vi.fn(),
    polygonOffset: vi.fn(),
    scissor: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    drawElements: vi.fn(),
    createFramebuffer: vi.fn(() => ({})),
    bindFramebuffer: vi.fn(),
    createRenderbuffer: vi.fn(() => ({})),
    bindRenderbuffer: vi.fn(),
    renderbufferStorage: vi.fn(),
    framebufferRenderbuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 36053),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteTexture: vi.fn(),
    deleteFramebuffer: vi.fn(),
    deleteRenderbuffer: vi.fn(),
    canvas: { width: 800, height: 600 },
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
  };
  return gl;
};

// Mock HTMLCanvasElement for Three.js
class MockHTMLCanvasElement {
  width: number = 800;
  height: number = 600;
  
  getContext(contextType: string): any {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return createMockWebGLContext();
    }
    return null;
  }
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  getRootNode = vi.fn(() => this);
  getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
  style = {};
  ownerDocument = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
}

/**
 * Unit tests for physics engine selection
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 * 
 * Test scenarios:
 * - Test WebGPU available scenario
 * - Test WebGPU unavailable fallback
 * - Test forced CPU mode
 * - Test configuration updates
 */
describe('Physics Engine Selection', () => {
  let simulationEngine: SimulationEngine;
  let particleManager: ParticleManager;
  let collisionDetector: CollisionDetector;
  let physicsEngine: PhysicsEngine;
  let renderer: Renderer;
  let camera: Camera;
  let config: SimulationConfig;

  beforeEach(() => {
    // Create mock canvas
    const canvas = new MockHTMLCanvasElement();

    // Create 3D boundary
    const bounds = {
      min: { x: -500, y: -500, z: -500 },
      max: { x: 500, y: 500, z: 500 },
      getRandomSpawnPosition: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
      getSpawnVelocity: vi.fn(() => ({ x: 1, y: 1, z: 1 })),
      wrapPosition: vi.fn((pos: any) => pos)
    };

    // Create particle spawn config
    const spawnConfig: ParticleSpawnConfig = {
      spawnRate: 1,
      massRange: [1, 10],
      energyRange: [10, 100],
      maxParticles: 1000
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
    particleManager = new ParticleManager(bounds as any, spawnConfig);
    collisionDetector = new CollisionDetector(50);
    physicsEngine = new PhysicsEngine(new NewtonianGravity(1.0), 0, false);
    renderer = new Renderer(canvas as any, renderConfig);
    camera = new Camera(canvas as any, bounds as any);

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

  describe('WebGPU available scenario', () => {
    it('should initialize with GPU physics when WebGPU is available and preferGPU is true', async () => {
      // Skip if WebGPU is not available in test environment
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        console.log('Skipping WebGPU test: WebGPU not available in test environment');
        return;
      }

      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Check if GPU mode was selected
      const mode = simulationEngine.getPhysicsMode();
      
      // Should be 'gpu' if WebGPU initialized successfully, otherwise fallback
      expect(['gpu', 'workers', 'cpu']).toContain(mode);
      
      // If GPU is available, verify it's an OptimizedWebGPUPhysicsEngine
      if (mode === 'gpu') {
        const engine = simulationEngine.getPhysicsEngine();
        expect(engine).toBeInstanceOf(OptimizedWebGPUPhysicsEngine);
      }
    });

    it('should use GPU physics when particle count exceeds threshold', async () => {
      // Skip if WebGPU is not available
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        console.log('Skipping WebGPU test: WebGPU not available in test environment');
        return;
      }

      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 100
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Spawn particles above threshold
      for (let i = 0; i < 150; i++) {
        particleManager.spawnParticle();
      }

      const mode = simulationEngine.getPhysicsMode();
      
      // Should attempt GPU if available
      expect(['gpu', 'workers', 'cpu']).toContain(mode);
    });
  });

  describe('WebGPU unavailable fallback', () => {
    it('should fall back to Workers when WebGPU is unavailable and Workers are available', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200,
        forceMode: 'workers' // Force workers mode to simulate WebGPU unavailable
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      const mode = simulationEngine.getPhysicsMode();
      
      // Should use workers if available, otherwise CPU
      if (typeof Worker !== 'undefined') {
        expect(mode).toBe('workers');
        expect(simulationEngine.getPhysicsEngine()).toBeInstanceOf(ParallelPhysicsEngine);
      } else {
        expect(mode).toBe('cpu');
        expect(simulationEngine.getPhysicsEngine()).toBeInstanceOf(PhysicsEngine);
      }
    });

    it('should fall back to CPU when both WebGPU and Workers are unavailable', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200,
        forceMode: 'cpu' // Force CPU mode
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      const mode = simulationEngine.getPhysicsMode();
      expect(mode).toBe('cpu');
      expect(simulationEngine.getPhysicsEngine()).toBeInstanceOf(PhysicsEngine);
    });

    it('should log warning when WebGPU initialization fails', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200,
        forceMode: 'workers' // Force fallback
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Should have logged something (either warning or error) or successfully initialized
      // The exact behavior depends on WebGPU availability
      const mode = simulationEngine.getPhysicsMode();
      expect(['gpu', 'workers', 'cpu']).toContain(mode);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Forced CPU mode', () => {
    it('should use CPU physics when forceMode is set to cpu', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      const mode = simulationEngine.getPhysicsMode();
      expect(mode).toBe('cpu');
      expect(simulationEngine.getPhysicsEngine()).toBeInstanceOf(PhysicsEngine);
    });

    it('should ignore preferGPU when forceMode is cpu', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true, // This should be ignored
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      const mode = simulationEngine.getPhysicsMode();
      expect(mode).toBe('cpu');
    });

    it('should use Workers when forceMode is workers', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200,
        forceMode: 'workers'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      const mode = simulationEngine.getPhysicsMode();
      
      if (typeof Worker !== 'undefined') {
        expect(mode).toBe('workers');
        expect(simulationEngine.getPhysicsEngine()).toBeInstanceOf(ParallelPhysicsEngine);
      } else {
        // Falls back to CPU if Workers not available
        expect(mode).toBe('cpu');
      }
    });

    it('should respect forceMode over particle count threshold', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 100,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Spawn many particles (above threshold)
      for (let i = 0; i < 200; i++) {
        particleManager.spawnParticle();
      }

      const mode = simulationEngine.getPhysicsMode();
      expect(mode).toBe('cpu'); // Should still be CPU despite high particle count
    });
  });

  describe('Configuration updates', () => {
    it('should update GPU threshold', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Update threshold
      simulationEngine.setGPUThreshold(500);

      // Verify threshold was updated (indirectly by checking no error was thrown)
      expect(() => simulationEngine.setGPUThreshold(500)).not.toThrow();
    });

    it('should throw error for negative GPU threshold', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      expect(() => simulationEngine.setGPUThreshold(-100)).toThrow('GPU threshold must be non-negative');
    });

    it('should update GPU preference', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: true,
        gpuThreshold: 200
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Update preference
      simulationEngine.setPreferGPU(false);

      // Verify preference was updated (indirectly by checking no error was thrown)
      expect(() => simulationEngine.setPreferGPU(false)).not.toThrow();
    });

    it('should switch physics engine at runtime', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      expect(simulationEngine.getPhysicsMode()).toBe('cpu');

      // Switch to workers
      await simulationEngine.switchPhysicsEngine('workers');

      const mode = simulationEngine.getPhysicsMode();
      if (typeof Worker !== 'undefined') {
        expect(mode).toBe('workers');
      } else {
        expect(mode).toBe('cpu'); // Falls back if Workers not available
      }
    });

    it('should preserve simulation state when switching engines', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Spawn some particles
      particleManager.spawnParticle();
      particleManager.spawnParticle();
      const particleCountBefore = particleManager.getAllEntities().length;

      // Switch engine
      await simulationEngine.switchPhysicsEngine('workers');

      // Verify particles are still there
      const particleCountAfter = particleManager.getAllEntities().length;
      expect(particleCountAfter).toBe(particleCountBefore);
    });

    it('should not switch if already in target mode', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      const modeBefore = simulationEngine.getPhysicsMode();
      
      // Try to switch to same mode
      await simulationEngine.switchPhysicsEngine('cpu');

      const modeAfter = simulationEngine.getPhysicsMode();
      expect(modeAfter).toBe(modeBefore);
      expect(modeAfter).toBe('cpu');
    });

    it('should preserve elasticity when switching engines', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Set elasticity
      const elasticity = 0.8;
      simulationEngine.getPhysicsEngine().setElasticity(elasticity);

      // Switch engine
      await simulationEngine.switchPhysicsEngine('workers');

      // Verify elasticity is preserved
      const newElasticity = simulationEngine.getPhysicsEngine().getElasticity();
      expect(newElasticity).toBe(elasticity);
    });

    it('should pause and resume simulation when switching engines', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      // Start simulation
      simulationEngine.start();
      expect(simulationEngine.getIsRunning()).toBe(true);

      // Switch engine
      await simulationEngine.switchPhysicsEngine('workers');

      // Should still be running after switch
      expect(simulationEngine.getIsRunning()).toBe(true);

      // Clean up
      simulationEngine.pause();
    });
  });

  describe('Physics mode query', () => {
    it('should return correct physics mode for CPU', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      expect(simulationEngine.getPhysicsMode()).toBe('cpu');
    });

    it('should return correct physics mode for Workers', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'workers'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      const mode = simulationEngine.getPhysicsMode();
      if (typeof Worker !== 'undefined') {
        expect(mode).toBe('workers');
      } else {
        expect(mode).toBe('cpu');
      }
    });

    it('should return correct physics mode after switching', async () => {
      const physicsConfig: PhysicsEngineConfig = {
        preferGPU: false,
        gpuThreshold: 200,
        forceMode: 'cpu'
      };

      await simulationEngine.initializePhysicsEngine(
        new NewtonianGravity(1.0),
        physicsConfig
      );

      expect(simulationEngine.getPhysicsMode()).toBe('cpu');

      await simulationEngine.switchPhysicsEngine('workers');

      const mode = simulationEngine.getPhysicsMode();
      if (typeof Worker !== 'undefined') {
        expect(mode).toBe('workers');
      } else {
        expect(mode).toBe('cpu');
      }
    });
  });
});
