import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { SimulationEngine } from '../../src/core/SimulationEngine';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';
import { ParticleManager } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Renderer } from '../../src/core/Renderer';
import { Camera } from '../../src/core/Camera';
import { Boundary } from '../../src/core/Boundary';

// Feature: webgpu-performance-optimization
// Property 1: Physics Engine Switching Preserves State
// **Validates: Requirements 1.5**

describe('Property: Physics Engine Switching Preserves State', () => {
  let originalNavigator: any;
  let originalWorker: any;

  beforeEach(() => {
    // Store original globals
    originalNavigator = globalThis.navigator;
    originalWorker = globalThis.Worker;
  });

  afterEach(() => {
    // Restore original globals
    (globalThis as any).navigator = originalNavigator;
    (globalThis as any).Worker = originalWorker;
  });

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

  // Helper to create a properly initialized SimulationEngine
  const createEngine = (): SimulationEngine => {
    const boundary = new Boundary(
      new Vector3D(-100, -100, -100),
      new Vector3D(100, 100, 100)
    );
    const particleManager = new ParticleManager(boundary, { spawnRate: 0, initialCount: 0 });
    const collisionDetector = new CollisionDetector();
    const gravityFormula = new NewtonianGravity(1.0);
    const physicsEngine = new PhysicsEngine(gravityFormula, 0.8, false);
    
    // Create mock canvas with all required methods
    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn((contextType: string) => {
        if (contextType === 'webgl' || contextType === 'webgl2') {
          return createMockWebGLContext();
        }
        return null;
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      getRootNode: vi.fn(() => mockCanvas),
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })),
      style: {},
      ownerDocument: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    } as unknown as HTMLCanvasElement;
    
    const renderer = new Renderer(mockCanvas, {
      backgroundColor: 0x000000,
      particleColor: 0xffffff,
      enableShadows: false,
      enableAntialiasing: false
    });
    
    const camera = new Camera(mockCanvas, boundary);
    
    const config = {
      targetFPS: 60,
      timeScale: 1.0,
      accuracySteps: 1,
      adaptiveTimeSteps: false
    };

    return new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      camera,
      config
    );
  };

  // Helper to capture particle state
  interface ParticleState {
    id: string;
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    mass: number;
    radius: number;
  }

  const captureState = (particles: Particle[]): ParticleState[] => {
    return particles.map(p => ({
      id: p.id,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      velocity: { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z },
      mass: p.mass,
      radius: p.radius
    }));
  };

  // Helper to compare states within epsilon tolerance
  const statesEqual = (state1: ParticleState[], state2: ParticleState[], epsilon: number): boolean => {
    if (state1.length !== state2.length) {
      return false;
    }

    for (let i = 0; i < state1.length; i++) {
      const p1 = state1[i];
      const p2 = state2[i];

      // Compare IDs (should be exact match)
      if (p1.id !== p2.id) {
        return false;
      }

      // Compare positions within epsilon
      if (Math.abs(p1.position.x - p2.position.x) > epsilon ||
          Math.abs(p1.position.y - p2.position.y) > epsilon ||
          Math.abs(p1.position.z - p2.position.z) > epsilon) {
        return false;
      }

      // Compare velocities within epsilon
      if (Math.abs(p1.velocity.x - p2.velocity.x) > epsilon ||
          Math.abs(p1.velocity.y - p2.velocity.y) > epsilon ||
          Math.abs(p1.velocity.z - p2.velocity.z) > epsilon) {
        return false;
      }

      // Compare mass and radius (should be exact)
      if (p1.mass !== p2.mass || p1.radius !== p2.radius) {
        return false;
      }
    }

    return true;
  };

  // Arbitrary generator for Vector3D
  const vector3DArbitrary = () => fc.record({
    x: fc.float({ min: -100, max: 100, noNaN: true }),
    y: fc.float({ min: -100, max: 100, noNaN: true }),
    z: fc.float({ min: -100, max: 100, noNaN: true })
  });

  // Arbitrary generator for particles
  const particleArbitrary = () => fc.record({
    position: vector3DArbitrary(),
    velocity: vector3DArbitrary(),
    mass: fc.float({ min: 1, max: 100, noNaN: true })
  }).map(({ position, velocity, mass }) => 
    new Particle(
      new Vector3D(position.x, position.y, position.z),
      new Vector3D(velocity.x, velocity.y, velocity.z),
      mass
    )
  );

  it('should preserve state when switching from CPU to Workers and back', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(particleArbitrary(), { minLength: 5, maxLength: 20 }),
        async (particles) => {
          // Mock environment: WebGPU unavailable, Workers available
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          const engine = createEngine();
          const particleManager = engine.getParticleManager();

          // Add particles to the simulation
          particleManager.clear();
          
          // Manually add particles to the internal arrays
          for (const particle of particles) {
            (particleManager as any).particles.push(particle);
          }

          // Capture initial state
          const initialState = captureState(particles);

          // Switch to workers
          await engine.switchPhysicsEngine('workers');
          
          // Switch back to CPU
          await engine.switchPhysicsEngine('cpu');

          // Capture final state
          const finalParticles = particleManager.getAllEntities().filter(e => e instanceof Particle) as Particle[];
          const finalState = captureState(finalParticles);

          // States should be equivalent within epsilon
          expect(statesEqual(initialState, finalState, 1e-6)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve state when switching from Workers to CPU and back', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(particleArbitrary(), { minLength: 5, maxLength: 20 }),
        async (particles) => {
          // Mock environment: WebGPU unavailable, Workers available
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          const engine = createEngine();
          const particleManager = engine.getParticleManager();

          // Add particles to the simulation
          particleManager.clear();
          
          for (const particle of particles) {
            (particleManager as any).particles.push(particle);
          }

          // Capture initial state
          const initialState = captureState(particles);

          // Switch to CPU (from default)
          await engine.switchPhysicsEngine('cpu');
          
          // Switch to workers
          await engine.switchPhysicsEngine('workers');
          
          // Switch back to CPU
          await engine.switchPhysicsEngine('cpu');

          // Capture final state
          const finalParticles = particleManager.getAllEntities().filter(e => e instanceof Particle) as Particle[];
          const finalState = captureState(finalParticles);

          // States should be equivalent within epsilon
          expect(statesEqual(initialState, finalState, 1e-6)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve state with varying particle counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        async (particleCount) => {
          // Generate specific number of particles
          const particles = await fc.sample(particleArbitrary(), particleCount);

          // Mock environment: WebGPU unavailable, Workers available
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          const engine = createEngine();
          const particleManager = engine.getParticleManager();

          // Add particles to the simulation
          particleManager.clear();
          
          for (const particle of particles) {
            (particleManager as any).particles.push(particle);
          }

          // Capture initial state
          const initialState = captureState(particles);

          // Switch engines multiple times
          await engine.switchPhysicsEngine('workers');
          await engine.switchPhysicsEngine('cpu');
          await engine.switchPhysicsEngine('workers');
          await engine.switchPhysicsEngine('cpu');

          // Capture final state
          const finalParticles = particleManager.getAllEntities().filter(e => e instanceof Particle) as Particle[];
          const finalState = captureState(finalParticles);

          // States should be equivalent within epsilon
          expect(statesEqual(initialState, finalState, 1e-6)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve state when no switching occurs (idempotency)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(particleArbitrary(), { minLength: 5, maxLength: 20 }),
        async (particles) => {
          // Mock environment: WebGPU unavailable, Workers available
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          const engine = createEngine();
          const particleManager = engine.getParticleManager();

          // Add particles to the simulation
          particleManager.clear();
          
          for (const particle of particles) {
            (particleManager as any).particles.push(particle);
          }

          // Capture initial state
          const initialState = captureState(particles);

          // Switch to same mode (should be no-op)
          await engine.switchPhysicsEngine('cpu');
          await engine.switchPhysicsEngine('cpu');

          // Capture final state
          const finalParticles = particleManager.getAllEntities().filter(e => e instanceof Particle) as Particle[];
          const finalState = captureState(finalParticles);

          // States should be equivalent within epsilon
          expect(statesEqual(initialState, finalState, 1e-6)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
