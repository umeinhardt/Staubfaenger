import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { Renderer } from '../../src/core/Renderer';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';
import * as THREE from 'three';

// Feature: webgpu-performance-optimization
// Property 7: Instance Attribute Correctness
// **Validates: Requirements 3.4**

describe('Property: Instance Attribute Correctness', () => {
  // Mock WebGL context with all required methods
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
      getShaderInfoLog: vi.fn(() => ''),
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getProgramInfoLog: vi.fn(() => ''),
      getActiveUniform: vi.fn(() => ({ name: 'test', size: 1, type: 35676 })),
      getActiveAttrib: vi.fn(() => ({ name: 'test', size: 1, type: 35665 })),
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
      createVertexArray: vi.fn(() => ({})),
      bindVertexArray: vi.fn(),
      deleteVertexArray: vi.fn(),
      canvas: { width: 800, height: 600 },
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
    };
    return gl;
  };

  // Helper to create a mock canvas
  const createMockCanvas = (): HTMLCanvasElement => {
    return {
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
      getRootNode: vi.fn(() => ({})),
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

  it('should encode particle position in instance matrix', () => {
    fc.assert(
      fc.property(
        fc.array(particleArbitrary(), { minLength: 1, maxLength: 50 }),
        (particles) => {
          // Create renderer with instanced rendering enabled
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances: 100,
            updateBatchSize: 100
          });

          // Update instanced meshes directly (avoid full render pipeline)
          (renderer as any).updateInstancedMeshes(particles);

          // Access the instanced mesh
          const instancedMesh = (renderer as any).particleInstancedMesh as THREE.InstancedMesh;
          expect(instancedMesh).toBeDefined();

          // Property: For each particle at index i, the instance matrix should encode its position
          const matrix = new THREE.Matrix4();
          const position = new THREE.Vector3();

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Get the instance matrix
            instancedMesh.getMatrixAt(i, matrix);
            
            // Extract position from matrix
            position.setFromMatrixPosition(matrix);

            // Verify position matches particle position
            expect(position.x).toBeCloseTo(particle.position.x, 5);
            expect(position.y).toBeCloseTo(particle.position.y, 5);
            expect(position.z).toBeCloseTo(particle.position.z, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should encode particle scale (radius) in instance matrix', () => {
    fc.assert(
      fc.property(
        fc.array(particleArbitrary(), { minLength: 1, maxLength: 50 }),
        (particles) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances: 100,
            updateBatchSize: 100
          });

          (renderer as any).updateInstancedMeshes(particles);

          const instancedMesh = (renderer as any).particleInstancedMesh as THREE.InstancedMesh;
          expect(instancedMesh).toBeDefined();

          // Property: For each particle at index i, the instance matrix should encode its scale (radius)
          const matrix = new THREE.Matrix4();
          const scale = new THREE.Vector3();

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Get the instance matrix
            instancedMesh.getMatrixAt(i, matrix);
            
            // Extract scale from matrix
            scale.setFromMatrixScale(matrix);

            // Verify scale matches particle radius (uniform scale in all dimensions)
            expect(scale.x).toBeCloseTo(particle.radius, 5);
            expect(scale.y).toBeCloseTo(particle.radius, 5);
            expect(scale.z).toBeCloseTo(particle.radius, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set instance color matching particle computed color', () => {
    fc.assert(
      fc.property(
        fc.array(particleArbitrary(), { minLength: 1, maxLength: 50 }),
        (particles) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances: 100,
            updateBatchSize: 100
          });

          (renderer as any).updateInstancedMeshes(particles);

          const instancedMesh = (renderer as any).particleInstancedMesh as THREE.InstancedMesh;
          expect(instancedMesh).toBeDefined();

          // Property: For each particle at index i, the instance color should match the computed color
          const color = new THREE.Color();

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Get the instance color
            instancedMesh.getColorAt(i, color);

            // Get the expected color from the renderer's getColor method
            const expectedColor = (renderer as any).getColor(particle) as THREE.Color;

            // Verify colors match
            expect(color.r).toBeCloseTo(expectedColor.r, 5);
            expect(color.g).toBeCloseTo(expectedColor.g, 5);
            expect(color.b).toBeCloseTo(expectedColor.b, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly encode all attributes (position, scale, color) for each particle', () => {
    fc.assert(
      fc.property(
        fc.array(particleArbitrary(), { minLength: 1, maxLength: 50 }),
        (particles) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances: 100,
            updateBatchSize: 100
          });

          (renderer as any).updateInstancedMeshes(particles);

          const instancedMesh = (renderer as any).particleInstancedMesh as THREE.InstancedMesh;
          expect(instancedMesh).toBeDefined();

          // Property: All instance attributes should be correctly set for each particle
          const matrix = new THREE.Matrix4();
          const position = new THREE.Vector3();
          const scale = new THREE.Vector3();
          const color = new THREE.Color();

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Get instance matrix and color
            instancedMesh.getMatrixAt(i, matrix);
            instancedMesh.getColorAt(i, color);
            
            // Extract position and scale
            position.setFromMatrixPosition(matrix);
            scale.setFromMatrixScale(matrix);

            // Get expected color
            const expectedColor = (renderer as any).getColor(particle) as THREE.Color;

            // Verify all attributes
            // Position
            expect(position.x).toBeCloseTo(particle.position.x, 5);
            expect(position.y).toBeCloseTo(particle.position.y, 5);
            expect(position.z).toBeCloseTo(particle.position.z, 5);

            // Scale (radius)
            expect(scale.x).toBeCloseTo(particle.radius, 5);
            expect(scale.y).toBeCloseTo(particle.radius, 5);
            expect(scale.z).toBeCloseTo(particle.radius, 5);

            // Color
            expect(color.r).toBeCloseTo(expectedColor.r, 5);
            expect(color.g).toBeCloseTo(expectedColor.g, 5);
            expect(color.b).toBeCloseTo(expectedColor.b, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain attribute correctness with varying particle counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (particleCount) => {
          const particles = fc.sample(particleArbitrary(), particleCount);

          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances: 150,
            updateBatchSize: 100
          });

          (renderer as any).updateInstancedMeshes(particles);

          const instancedMesh = (renderer as any).particleInstancedMesh as THREE.InstancedMesh;
          expect(instancedMesh).toBeDefined();

          // Property: Attribute correctness holds regardless of particle count
          const matrix = new THREE.Matrix4();
          const position = new THREE.Vector3();
          const scale = new THREE.Vector3();

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            instancedMesh.getMatrixAt(i, matrix);
            position.setFromMatrixPosition(matrix);
            scale.setFromMatrixScale(matrix);

            expect(position.x).toBeCloseTo(particle.position.x, 5);
            expect(position.y).toBeCloseTo(particle.position.y, 5);
            expect(position.z).toBeCloseTo(particle.position.z, 5);
            expect(scale.x).toBeCloseTo(particle.radius, 5);
            expect(scale.y).toBeCloseTo(particle.radius, 5);
            expect(scale.z).toBeCloseTo(particle.radius, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain attribute correctness after multiple render calls', () => {
    fc.assert(
      fc.property(
        fc.array(particleArbitrary(), { minLength: 5, maxLength: 30 }),
        fc.integer({ min: 2, max: 5 }),
        (particles, numRenders) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances: 100,
            updateBatchSize: 100
          });

          // Render multiple times
          for (let renderIdx = 0; renderIdx < numRenders; renderIdx++) {
            // Update particle positions slightly
            particles.forEach(p => {
              p.position = new Vector3D(
                p.position.x + 0.1,
                p.position.y + 0.1,
                p.position.z + 0.1
              );
            });

            (renderer as any).updateInstancedMeshes(particles);
          }

          const instancedMesh = (renderer as any).particleInstancedMesh as THREE.InstancedMesh;
          expect(instancedMesh).toBeDefined();

          // Property: After multiple renders, attributes should still be correct
          const matrix = new THREE.Matrix4();
          const position = new THREE.Vector3();
          const scale = new THREE.Vector3();

          for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            instancedMesh.getMatrixAt(i, matrix);
            position.setFromMatrixPosition(matrix);
            scale.setFromMatrixScale(matrix);

            expect(position.x).toBeCloseTo(particle.position.x, 5);
            expect(position.y).toBeCloseTo(particle.position.y, 5);
            expect(position.z).toBeCloseTo(particle.position.z, 5);
            expect(scale.x).toBeCloseTo(particle.radius, 5);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
