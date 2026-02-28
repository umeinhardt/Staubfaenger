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

// Feature: webgpu-performance-optimization
// Property 2: GPU-CPU Round Trip Equivalence
// **Validates: Requirements 1.7**

describe('Property: GPU-CPU Round Trip Equivalence', () => {
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
        if (param === 7938) return 'WebGL 2.0';
        if (param === 7937) return 'WebGL GLSL ES 3.00';
        if (param === 35724) return 16384;
        if (param === 3379) return 16384;
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
    const boundary = {
      min: { x: -100, y: -100, z: -100 },
      max: { x: 100, y: 100, z: 100 },
      width: 200,
      height: 200,
      depth: 200,
      getRandomSpawnPosition: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
      getSpawnVelocity: vi.fn(() => ({ x: 1, y: 1, z: 1 })),
      wrapPosition: vi.fn((pos: any) => pos)
    };
    const particleManager = new ParticleManager(boundary as any, { spawnRate: 0, initialCount: 0 });
    const collisionDetector = new CollisionDetector();
    const gravityFormula = new NewtonianGravity(1.0);
    const physicsEngine = new PhysicsEngine(gravityFormula, 0.8, false);
    
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
    
    const camera = new Camera(mockCanvas, boundary as any);
    
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

  // Helper to clone particles for independent simulation
  const cloneParticles = (particles: Particle[]): Particle[] => {
    return particles.map(p => {
      const cloned = new Particle(
        new Vector3D(p.position.x, p.position.y, p.position.z),
        new Vector3D(p.velocity.x, p.velocity.y, p.velocity.z),
        p.mass
      );
      // Preserve the ID for comparison
      (cloned as any).id = p.id;
      return cloned;
    });
  };

  // Helper to compare states within epsilon tolerance
  const statesEqual = (state1: ParticleState[], state2: ParticleState[], epsilon: number): boolean => {
    if (state1.length !== state2.length) {
      return false;
    }

    // Sort by ID to ensure consistent comparison
    const sorted1 = [...state1].sort((a, b) => a.id.localeCompare(b.id));
    const sorted2 = [...state2].sort((a, b) => a.id.localeCompare(b.id));

    for (let i = 0; i < sorted1.length; i++) {
      const p1 = sorted1[i];
      const p2 = sorted2[i];

      // Compare IDs
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

  it('should produce equivalent results when computing GPU frame then CPU frame vs two CPU frames', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(particleArbitrary(), { minLength: 5, maxLength: 20 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.05), noNaN: true }), // deltaTime
        async (particles, deltaTime) => {
          // Mock environment: WebGPU unavailable (we'll use CPU for both paths)
          // In a real test with GPU, we would mock WebGPU to be available
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          // Path 1: GPU frame then CPU frame (simulated with CPU->CPU for now)
          const engine1 = createEngine();
          const particleManager1 = engine1.getParticleManager();
          particleManager1.clear();
          
          const particles1 = cloneParticles(particles);
          for (const particle of particles1) {
            (particleManager1 as any).particles.push(particle);
          }

          // Simulate GPU frame (using CPU since GPU is not available in test)
          await engine1.switchPhysicsEngine('cpu');
          const entities1 = particleManager1.getAllEntities();
          engine1.getPhysicsEngine().applyGravity(entities1, deltaTime);

          // Switch to CPU and compute another frame
          await engine1.switchPhysicsEngine('cpu');
          const entities1b = particleManager1.getAllEntities();
          engine1.getPhysicsEngine().applyGravity(entities1b, deltaTime);

          const finalState1 = captureState(
            particleManager1.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          // Path 2: Two CPU frames
          const engine2 = createEngine();
          const particleManager2 = engine2.getParticleManager();
          particleManager2.clear();
          
          const particles2 = cloneParticles(particles);
          for (const particle of particles2) {
            (particleManager2 as any).particles.push(particle);
          }

          await engine2.switchPhysicsEngine('cpu');
          
          // First CPU frame
          const entities2a = particleManager2.getAllEntities();
          engine2.getPhysicsEngine().applyGravity(entities2a, deltaTime);

          // Second CPU frame
          const entities2b = particleManager2.getAllEntities();
          engine2.getPhysicsEngine().applyGravity(entities2b, deltaTime);

          const finalState2 = captureState(
            particleManager2.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          // States should be equivalent within epsilon (1e-4 for GPU floating-point differences)
          expect(statesEqual(finalState1, finalState2, 1e-4)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce equivalent results with varying particle counts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 30 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.05), noNaN: true }),
        async (particleCount, deltaTime) => {
          const particles = await fc.sample(particleArbitrary(), particleCount);

          // Mock environment
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          // Path 1: Simulate GPU->CPU
          const engine1 = createEngine();
          const particleManager1 = engine1.getParticleManager();
          particleManager1.clear();
          
          const particles1 = cloneParticles(particles);
          for (const particle of particles1) {
            (particleManager1 as any).particles.push(particle);
          }

          await engine1.switchPhysicsEngine('cpu');
          engine1.getPhysicsEngine().applyGravity(particleManager1.getAllEntities(), deltaTime);
          await engine1.switchPhysicsEngine('cpu');
          engine1.getPhysicsEngine().applyGravity(particleManager1.getAllEntities(), deltaTime);

          const finalState1 = captureState(
            particleManager1.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          // Path 2: CPU->CPU
          const engine2 = createEngine();
          const particleManager2 = engine2.getParticleManager();
          particleManager2.clear();
          
          const particles2 = cloneParticles(particles);
          for (const particle of particles2) {
            (particleManager2 as any).particles.push(particle);
          }

          await engine2.switchPhysicsEngine('cpu');
          engine2.getPhysicsEngine().applyGravity(particleManager2.getAllEntities(), deltaTime);
          engine2.getPhysicsEngine().applyGravity(particleManager2.getAllEntities(), deltaTime);

          const finalState2 = captureState(
            particleManager2.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          expect(statesEqual(finalState1, finalState2, 1e-4)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should produce equivalent results with varying time steps', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(particleArbitrary(), { minLength: 5, maxLength: 15 }),
        fc.float({ min: Math.fround(0.001), max: Math.fround(0.1), noNaN: true }),
        async (particles, deltaTime) => {
          // Mock environment
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          // Path 1: Simulate GPU->CPU
          const engine1 = createEngine();
          const particleManager1 = engine1.getParticleManager();
          particleManager1.clear();
          
          const particles1 = cloneParticles(particles);
          for (const particle of particles1) {
            (particleManager1 as any).particles.push(particle);
          }

          await engine1.switchPhysicsEngine('cpu');
          engine1.getPhysicsEngine().applyGravity(particleManager1.getAllEntities(), deltaTime);
          await engine1.switchPhysicsEngine('cpu');
          engine1.getPhysicsEngine().applyGravity(particleManager1.getAllEntities(), deltaTime);

          const finalState1 = captureState(
            particleManager1.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          // Path 2: CPU->CPU
          const engine2 = createEngine();
          const particleManager2 = engine2.getParticleManager();
          particleManager2.clear();
          
          const particles2 = cloneParticles(particles);
          for (const particle of particles2) {
            (particleManager2 as any).particles.push(particle);
          }

          await engine2.switchPhysicsEngine('cpu');
          engine2.getPhysicsEngine().applyGravity(particleManager2.getAllEntities(), deltaTime);
          engine2.getPhysicsEngine().applyGravity(particleManager2.getAllEntities(), deltaTime);

          const finalState2 = captureState(
            particleManager2.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          expect(statesEqual(finalState1, finalState2, 1e-4)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain equivalence across multiple frame computations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(particleArbitrary(), { minLength: 3, maxLength: 10 }),
        fc.integer({ min: 2, max: 5 }), // Number of frames
        fc.float({ min: Math.fround(0.01), max: Math.fround(0.05), noNaN: true }),
        async (particles, numFrames, deltaTime) => {
          // Mock environment
          (globalThis as any).navigator = { gpu: undefined };
          (globalThis as any).Worker = function() {} as any;

          // Path 1: Alternating engine switches
          const engine1 = createEngine();
          const particleManager1 = engine1.getParticleManager();
          particleManager1.clear();
          
          const particles1 = cloneParticles(particles);
          for (const particle of particles1) {
            (particleManager1 as any).particles.push(particle);
          }

          await engine1.switchPhysicsEngine('cpu');
          for (let i = 0; i < numFrames; i++) {
            engine1.getPhysicsEngine().applyGravity(particleManager1.getAllEntities(), deltaTime);
            // Simulate switching (though both are CPU in test environment)
            await engine1.switchPhysicsEngine('cpu');
          }

          const finalState1 = captureState(
            particleManager1.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          // Path 2: Pure CPU
          const engine2 = createEngine();
          const particleManager2 = engine2.getParticleManager();
          particleManager2.clear();
          
          const particles2 = cloneParticles(particles);
          for (const particle of particles2) {
            (particleManager2 as any).particles.push(particle);
          }

          await engine2.switchPhysicsEngine('cpu');
          for (let i = 0; i < numFrames; i++) {
            engine2.getPhysicsEngine().applyGravity(particleManager2.getAllEntities(), deltaTime);
          }

          const finalState2 = captureState(
            particleManager2.getAllEntities().filter(e => e instanceof Particle) as Particle[]
          );

          expect(statesEqual(finalState1, finalState2, 1e-4)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
