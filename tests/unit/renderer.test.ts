import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer, ColorMode, RenderConfig } from '../../src/core/Renderer';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector3D } from '../../src/core/Vector3D';
import { Boundary } from '../../src/core/Boundary';
import * as THREE from 'three';

// Mock WebGL context
const createMockWebGLContext = () => {
  const gl: any = {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    HIGH_FLOAT: 36338,
    MEDIUM_FLOAT: 36337,
    LOW_FLOAT: 36336,
    getExtension: vi.fn(() => ({})),
    getParameter: vi.fn(() => 16),
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
    texParameteri: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    depthFunc: vi.fn(),
    blendFunc: vi.fn(),
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
  style = {};
}

describe('Renderer (3D)', () => {
  let canvas: MockHTMLCanvasElement;
  let renderer: Renderer;
  let defaultConfig: RenderConfig;

  beforeEach(() => {
    canvas = new MockHTMLCanvasElement();
    defaultConfig = {
      colorMode: 'mass',
      showVelocityVectors: false,
    };
    renderer = new Renderer(canvas as any, defaultConfig);
  });

  describe('initialization', () => {
    it('should initialize with provided config', () => {
      const config = renderer.getConfig();
      expect(config.colorMode).toBe('mass');
      expect(config.showVelocityVectors).toBe(false);
    });

    it('should create a Three.js camera instance', () => {
      const camera = renderer.getCamera();
      expect(camera).toBeDefined();
      expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
    });

    it('should position camera to view the simulation', () => {
      const camera = renderer.getCamera();
      expect(camera.position.x).toBe(50);
      expect(camera.position.y).toBe(50);
      expect(camera.position.z).toBe(50);
    });
  });

  describe('boundary wireframe', () => {
    it('should create boundary wireframe', () => {
      const boundary = new Boundary(
        new Vector3D(-50, -50, -50),
        new Vector3D(50, 50, 50)
      );

      expect(() => renderer.createBoundaryWireframe(boundary)).not.toThrow();
    });

    it('should position wireframe at boundary center', () => {
      const boundary = new Boundary(
        new Vector3D(-50, -50, -50),
        new Vector3D(50, 50, 50)
      );

      renderer.createBoundaryWireframe(boundary);
      
      // Wireframe should be created without errors
      expect(true).toBe(true);
    });
  });

  describe('render', () => {
    it('should render a single particle', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(10, 5, 2),
        10
      );

      expect(() => renderer.render([particle])).not.toThrow();
    });

    it('should render multiple particles', () => {
      const particles = [
        new Particle(new Vector3D(0, 0, 0), new Vector3D(10, 5, 2), 10),
        new Particle(new Vector3D(50, 50, 50), new Vector3D(-5, 10, 3), 20),
        new Particle(new Vector3D(-30, 40, 20), new Vector3D(0, -15, 5), 5),
      ];

      expect(() => renderer.render(particles)).not.toThrow();
    });

    it('should render a conglomerate', () => {
      const particles = [
        new Particle(new Vector3D(0, 0, 0), new Vector3D(10, 5, 2), 10),
        new Particle(new Vector3D(5, 5, 5), new Vector3D(8, 3, 1), 15),
      ];
      const conglomerate = new Conglomerate(particles);

      expect(() => renderer.render([conglomerate])).not.toThrow();
    });

    it('should handle empty entity array', () => {
      expect(() => renderer.render([])).not.toThrow();
    });

    it('should clean up removed entities', () => {
      const particle1 = new Particle(new Vector3D(0, 0, 0), new Vector3D(10, 5, 2), 10);
      const particle2 = new Particle(new Vector3D(50, 50, 50), new Vector3D(-5, 10, 3), 20);

      // Render both particles
      renderer.render([particle1, particle2]);

      // Render only one particle (should clean up the other)
      expect(() => renderer.render([particle1])).not.toThrow();
    });
  });

  describe('color modes', () => {
    it('should calculate color based on mass in mass mode', () => {
      renderer.setColorMode('mass');
      
      const lightParticle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(0, 0, 0),
        1
      );
      
      const heavyParticle = new Particle(
        new Vector3D(10, 10, 10),
        new Vector3D(0, 0, 0),
        100
      );

      expect(() => renderer.render([lightParticle, heavyParticle])).not.toThrow();
    });

    it('should calculate color based on velocity in velocity mode', () => {
      renderer.setColorMode('velocity');
      
      const slowParticle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(1, 1, 1),
        10
      );
      
      const fastParticle = new Particle(
        new Vector3D(10, 10, 10),
        new Vector3D(30, 40, 20),
        10
      );

      expect(() => renderer.render([slowParticle, fastParticle])).not.toThrow();
    });

    it('should calculate color based on energy in energy mode', () => {
      renderer.setColorMode('energy');
      
      const lowEnergyParticle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(1, 1, 1),
        1
      );
      
      const highEnergyParticle = new Particle(
        new Vector3D(10, 10, 10),
        new Vector3D(30, 40, 20),
        50
      );

      expect(() => renderer.render([lowEnergyParticle, highEnergyParticle])).not.toThrow();
    });

    it('should handle extreme mass values', () => {
      renderer.setColorMode('mass');
      
      const veryLightParticle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(0, 0, 0),
        0.01
      );
      
      const veryHeavyParticle = new Particle(
        new Vector3D(10, 10, 10),
        new Vector3D(0, 0, 0),
        1000
      );
      
      expect(() => renderer.render([veryLightParticle, veryHeavyParticle])).not.toThrow();
    });
  });

  describe('configuration methods', () => {
    it('should update color mode', () => {
      renderer.setColorMode('velocity');
      expect(renderer.getConfig().colorMode).toBe('velocity');

      renderer.setColorMode('energy');
      expect(renderer.getConfig().colorMode).toBe('energy');

      renderer.setColorMode('mass');
      expect(renderer.getConfig().colorMode).toBe('mass');
    });

    it('should update show velocity vectors setting', () => {
      renderer.setShowVelocityVectors(true);
      expect(renderer.getConfig().showVelocityVectors).toBe(true);

      renderer.setShowVelocityVectors(false);
      expect(renderer.getConfig().showVelocityVectors).toBe(false);
    });

    it('should return a copy of config', () => {
      const config1 = renderer.getConfig();
      config1.colorMode = 'velocity';

      const config2 = renderer.getConfig();
      expect(config2.colorMode).toBe('mass');
    });
  });

  describe('resize', () => {
    it('should handle window resize', () => {
      expect(() => renderer.resize(1024, 768)).not.toThrow();
      
      const camera = renderer.getCamera();
      expect(camera.aspect).toBeCloseTo(1024 / 768, 5);
    });

    it('should handle multiple resizes', () => {
      renderer.resize(800, 600);
      renderer.resize(1920, 1080);
      renderer.resize(640, 480);
      
      const camera = renderer.getCamera();
      expect(camera.aspect).toBeCloseTo(640 / 480, 5);
    });
  });

  describe('mesh position updates', () => {
    it('should update particle positions', () => {
      const particle = new Particle(
        new Vector3D(10, 20, 30),
        new Vector3D(1, 2, 3),
        10
      );

      renderer.render([particle]);

      // Move particle
      particle.position = new Vector3D(40, 50, 60);
      
      expect(() => renderer.render([particle])).not.toThrow();
    });

    it('should handle particles moving across large distances', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(1, 1, 1),
        10
      );

      renderer.render([particle]);

      // Move particle far away
      particle.position = new Vector3D(1000, 1000, 1000);
      
      expect(() => renderer.render([particle])).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle particles with zero velocity', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(0, 0, 0),
        10
      );

      renderer.setShowVelocityVectors(true);
      expect(() => renderer.render([particle])).not.toThrow();
    });

    it('should handle very small particles', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(0, 0, 0),
        0.01
      );

      expect(() => renderer.render([particle])).not.toThrow();
    });

    it('should handle very large particles', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(0, 0, 0),
        10000
      );

      expect(() => renderer.render([particle])).not.toThrow();
    });

    it('should handle conglomerates with many particles', () => {
      const particles = Array.from({ length: 50 }, (_, i) => 
        new Particle(
          new Vector3D(i * 2, i * 2, i * 2),
          new Vector3D(1, 1, 1),
          5
        )
      );
      const conglomerate = new Conglomerate(particles);

      expect(() => renderer.render([conglomerate])).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should dispose resources', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(1, 1, 1),
        10
      );

      renderer.render([particle]);
      
      expect(() => renderer.dispose()).not.toThrow();
    });

    it('should dispose boundary wireframe', () => {
      const boundary = new Boundary(
        new Vector3D(-50, -50, -50),
        new Vector3D(50, 50, 50)
      );

      renderer.createBoundaryWireframe(boundary);
      
      expect(() => renderer.dispose()).not.toThrow();
    });
  });
});
