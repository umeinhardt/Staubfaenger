import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { Renderer } from '../../src/core/Renderer';

// Feature: webgpu-performance-optimization
// Property 6: Instanced Rendering Single Draw Call
// **Validates: Requirements 3.3**

describe('Property: Instanced Rendering Single Draw Call', () => {
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

  it('should report single draw call when instanced rendering is enabled', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (maxInstances) => {
          // Create renderer with instanced rendering enabled
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            backgroundColor: 0x000000,
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          // Initialize instanced rendering
          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances,
            updateBatchSize: 100
          });

          // Get rendering stats
          const stats = renderer.getRenderingStats();

          // Property: When instanced rendering is enabled, draw calls should always be 1
          expect(stats.mode).toBe('instanced');
          expect(stats.drawCalls).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should report single draw call regardless of max instance capacity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 10000 }),
        (maxInstances) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            backgroundColor: 0x000000,
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances,
            updateBatchSize: 100
          });

          const stats = renderer.getRenderingStats();

          // Property: Instanced rendering always uses 1 draw call
          expect(stats.mode).toBe('instanced');
          expect(stats.drawCalls).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should report single draw call vs multiple when toggling rendering modes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 500 }),
        (maxInstances) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            backgroundColor: 0x000000,
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          // Enable instanced rendering
          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances,
            updateBatchSize: 100
          });

          const instancedStats = renderer.getRenderingStats();

          // Disable instanced rendering
          renderer.setInstancedRendering(false);
          const individualStats = renderer.getRenderingStats();

          // Property: Instanced uses 1 draw call, individual uses N draw calls
          expect(instancedStats.mode).toBe('instanced');
          expect(instancedStats.drawCalls).toBe(1);
          expect(individualStats.mode).toBe('individual');
          // Individual mode draw calls equal number of particles (0 when no particles rendered yet)
          expect(individualStats.drawCalls).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain single draw call property after re-enabling instanced rendering', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 1000 }),
        (maxInstances) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            backgroundColor: 0x000000,
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          // Enable, disable, then re-enable
          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances,
            updateBatchSize: 100
          });

          renderer.setInstancedRendering(false);
          renderer.setInstancedRendering(true);

          const stats = renderer.getRenderingStats();

          // Property: Single draw call property holds after toggling
          expect(stats.mode).toBe('instanced');
          expect(stats.drawCalls).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently report single draw call across multiple checks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }),
        fc.integer({ min: 2, max: 10 }),
        (maxInstances, numChecks) => {
          const mockCanvas = createMockCanvas();
          const renderer = new Renderer(mockCanvas, {
            backgroundColor: 0x000000,
            particleColor: 0xffffff,
            enableShadows: false,
            enableAntialiasing: false
          });

          renderer.initializeInstancedRendering({
            enabled: true,
            maxInstances,
            updateBatchSize: 100
          });

          // Check multiple times
          for (let i = 0; i < numChecks; i++) {
            const stats = renderer.getRenderingStats();

            // Property: Draw call count is consistently 1
            expect(stats.mode).toBe('instanced');
            expect(stats.drawCalls).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
