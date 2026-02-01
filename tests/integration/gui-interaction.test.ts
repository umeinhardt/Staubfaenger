/**
 * Integration tests for GUI interactions in 3D simulation
 * Tests the GUI controller's interaction with simulation components
 * 
 * Validates: Requirement 9.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { SimulationEngine, SimulationConfig } from '../../src/core/SimulationEngine';
import { Renderer, RenderConfig } from '../../src/core/Renderer';
import { GUIController } from '../../src/core/GUIController';
import { Boundary } from '../../src/core/Boundary';
import { Vector3D } from '../../src/core/Vector3D';
import { Camera } from '../../src/core/Camera';

describe('GUI Interaction Integration Tests', () => {
  let particleManager: ParticleManager;
  let collisionDetector: CollisionDetector;
  let physicsEngine: PhysicsEngine;
  let renderer: Renderer;
  let cameraController: Camera;
  let simulationEngine: SimulationEngine;
  let guiController: GUIController;
  let canvas: HTMLCanvasElement;
  let boundary: Boundary;

  const particleSpawnConfig: ParticleSpawnConfig = {
    spawnRate: 2,
    massRange: [1, 10],
    energyRange: [10, 100],
    maxParticles: 0
  };

  const simulationConfig: SimulationConfig = {
    targetFPS: 60,
    timeScale: 1.0,
    accuracySteps: 1
  };

  const renderConfig: RenderConfig = {
    colorMode: 'mass',
    showVelocityVectors: false
  };

  beforeEach(() => {
    // Create DOM elements
    document.body.innerHTML = `
      <canvas id="canvas" width="800" height="600"></canvas>
      <button id="playButton">Play</button>
      <button id="pauseButton">Pause</button>
      <button id="resetButton">Reset</button>
      <input type="range" id="spawnRate" min="0.1" max="10" step="0.1" value="2">
      <span id="spawnRateValue">2.0</span>
      <input type="number" id="maxParticles" min="0" max="10000" step="1" value="0">
      <span id="particlesSpawnedValue">0 / 0</span>
      <input type="range" id="massMin" min="0.1" max="50" step="0.1" value="1">
      <span id="massMinValue">1.0</span>
      <input type="range" id="massMax" min="0.1" max="50" step="0.1" value="10">
      <span id="massMaxValue">10.0</span>
      <input type="range" id="energyMin" min="1" max="500" step="1" value="10">
      <span id="energyMinValue">10</span>
      <input type="range" id="energyMax" min="1" max="500" step="1" value="100">
      <span id="energyMaxValue">100</span>
      <input type="range" id="elasticity" min="0" max="1" step="0.01" value="0">
      <span id="elasticityValue">0.00</span>
      <input type="range" id="accuracy" min="1" max="10" step="1" value="1">
      <span id="accuracyValue">1</span>
      <input type="range" id="timeScale" min="0.1" max="5" step="0.1" value="1">
      <span id="timeScaleValue">1.0x</span>
      <select id="colorMode">
        <option value="mass">Mass</option>
        <option value="velocity">Velocity</option>
        <option value="energy">Energy</option>
      </select>
      <input type="checkbox" id="showVelocity">
      <span id="statsParticleCount">0</span>
      <span id="statsConglomerateCount">0</span>
      <span id="statsFPS">0</span>
    `;

    canvas = document.getElementById('canvas') as HTMLCanvasElement;

    // Mock WebGL context for Three.js
    const mockWebGLContext: any = {
      canvas: canvas,
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      VERSION: 0x1F00,
      VERTEX_SHADER: 0x8B31,
      FRAGMENT_SHADER: 0x8B30,
      HIGH_FLOAT: 0x8DF2,
      MEDIUM_FLOAT: 0x8DF1,
      LOW_FLOAT: 0x8DF0,
    };
    
    mockWebGLContext.getParameter = vi.fn((param) => {
      // Return appropriate values for common parameters
      if (param === mockWebGLContext.VERSION) return 'WebGL 2.0';
      if (param === 0x8B4C) return 16; // MAX_VERTEX_UNIFORM_VECTORS
      if (param === 0x8DFD) return 16; // MAX_TEXTURE_IMAGE_UNITS
      if (param === 0x8872) return 16; // MAX_COMBINED_TEXTURE_IMAGE_UNITS
      if (param === 0x0D33) return [16384, 16384]; // MAX_VIEWPORT_DIMS
      return 0;
    });
    
    Object.assign(mockWebGLContext, {
      getExtension: vi.fn(() => ({})),
      getShaderPrecisionFormat: vi.fn(() => ({
        precision: 23,
        rangeMin: 127,
        rangeMax: 127
      })),
      createProgram: vi.fn(() => ({})),
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getShaderParameter: vi.fn(() => true),
      enable: vi.fn(),
      disable: vi.fn(),
      clear: vi.fn(),
      clearColor: vi.fn(),
      viewport: vi.fn(),
      getUniformLocation: vi.fn(() => ({})),
      getAttribLocation: vi.fn(() => 0),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      drawArrays: vi.fn(),
      drawElements: vi.fn(),
      createTexture: vi.fn(() => ({})),
      bindTexture: vi.fn(),
      texImage2D: vi.fn(),
      texParameteri: vi.fn(),
      createFramebuffer: vi.fn(() => ({})),
      bindFramebuffer: vi.fn(),
      createRenderbuffer: vi.fn(() => ({})),
      bindRenderbuffer: vi.fn(),
      renderbufferStorage: vi.fn(),
      framebufferRenderbuffer: vi.fn(),
      framebufferTexture2D: vi.fn(),
      checkFramebufferStatus: vi.fn(() => 0x8CD5), // FRAMEBUFFER_COMPLETE
      deleteBuffer: vi.fn(),
      deleteFramebuffer: vi.fn(),
      deleteProgram: vi.fn(),
      deleteRenderbuffer: vi.fn(),
      deleteShader: vi.fn(),
      deleteTexture: vi.fn(),
      depthFunc: vi.fn(),
      depthMask: vi.fn(),
      depthRange: vi.fn(),
      blendEquation: vi.fn(),
      blendFunc: vi.fn(),
      cullFace: vi.fn(),
      frontFace: vi.fn(),
      lineWidth: vi.fn(),
      polygonOffset: vi.fn(),
      scissor: vi.fn(),
    });

    // Mock getContext to return WebGL context
    canvas.getContext = vi.fn((contextType: string) => {
      if (contextType === 'webgl' || contextType === 'webgl2') {
        return mockWebGLContext as any;
      }
      return null;
    });

    // Initialize 3D boundary
    boundary = new Boundary(
      new Vector3D(-100, -100, -100),
      new Vector3D(100, 100, 100)
    );

    // Initialize components
    particleManager = new ParticleManager(boundary, particleSpawnConfig);
    collisionDetector = new CollisionDetector(20);
    const gravityFormula = new NewtonianGravity(1.0, 0.01);
    physicsEngine = new PhysicsEngine(gravityFormula, 0);
    renderer = new Renderer(canvas, renderConfig);
    cameraController = new Camera(canvas, boundary);

    simulationEngine = new SimulationEngine(
      particleManager,
      collisionDetector,
      physicsEngine,
      renderer,
      cameraController,
      simulationConfig
    );

    guiController = new GUIController(
      simulationEngine,
      particleManager,
      physicsEngine,
      renderer
    );

    guiController.initialize();
  });

  it('should initialize GUI controller', () => {
    expect(guiController).toBeDefined();
  });

  it('should start simulation when play button is clicked', () => {
    const playButton = document.getElementById('playButton') as HTMLButtonElement;
    
    expect(simulationEngine.getIsRunning()).toBe(false);
    
    playButton.click();
    
    expect(simulationEngine.getIsRunning()).toBe(true);
  });

  it('should pause simulation when pause button is clicked', () => {
    const playButton = document.getElementById('playButton') as HTMLButtonElement;
    const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
    
    playButton.click();
    expect(simulationEngine.getIsRunning()).toBe(true);
    
    pauseButton.click();
    expect(simulationEngine.getIsRunning()).toBe(false);
  });

  it('should reset simulation when reset button is clicked', () => {
    const resetButton = document.getElementById('resetButton') as HTMLButtonElement;
    
    // Add some particles
    particleManager.spawnParticle();
    particleManager.spawnParticle();
    expect(particleManager.getEntityCount()).toBe(2);
    
    resetButton.click();
    
    expect(particleManager.getEntityCount()).toBe(0);
  });

  it('should update spawn rate when slider changes', () => {
    const spawnRateSlider = document.getElementById('spawnRate') as HTMLInputElement;
    const spawnRateValue = document.getElementById('spawnRateValue') as HTMLElement;
    
    spawnRateSlider.value = '5';
    spawnRateSlider.dispatchEvent(new Event('input'));
    
    expect(particleManager.config.spawnRate).toBe(5);
    expect(spawnRateValue.textContent).toBe('5.0');
  });

  it('should update mass range when sliders change', () => {
    const massMinSlider = document.getElementById('massMin') as HTMLInputElement;
    const massMaxSlider = document.getElementById('massMax') as HTMLInputElement;
    
    massMinSlider.value = '2';
    massMinSlider.dispatchEvent(new Event('input'));
    
    massMaxSlider.value = '20';
    massMaxSlider.dispatchEvent(new Event('input'));
    
    expect(particleManager.config.massRange[0]).toBe(2);
    expect(particleManager.config.massRange[1]).toBe(20);
  });

  it('should update energy range when sliders change', () => {
    const energyMinSlider = document.getElementById('energyMin') as HTMLInputElement;
    const energyMaxSlider = document.getElementById('energyMax') as HTMLInputElement;
    
    energyMinSlider.value = '50';
    energyMinSlider.dispatchEvent(new Event('input'));
    
    energyMaxSlider.value = '200';
    energyMaxSlider.dispatchEvent(new Event('input'));
    
    expect(particleManager.config.energyRange[0]).toBe(50);
    expect(particleManager.config.energyRange[1]).toBe(200);
  });

  it('should update elasticity when slider changes', () => {
    const elasticitySlider = document.getElementById('elasticity') as HTMLInputElement;
    const elasticityValue = document.getElementById('elasticityValue') as HTMLElement;
    
    elasticitySlider.value = '0.5';
    elasticitySlider.dispatchEvent(new Event('input'));
    
    expect(physicsEngine.getElasticity()).toBe(0.5);
    expect(elasticityValue.textContent).toBe('0.50');
  });

  it('should update accuracy steps when slider changes', () => {
    const accuracySlider = document.getElementById('accuracy') as HTMLInputElement;
    const accuracyValue = document.getElementById('accuracyValue') as HTMLElement;
    
    accuracySlider.value = '5';
    accuracySlider.dispatchEvent(new Event('input'));
    
    expect(simulationEngine.getConfig().accuracySteps).toBe(5);
    expect(accuracyValue.textContent).toBe('5');
  });

  it('should update time scale when slider changes', () => {
    const timeScaleSlider = document.getElementById('timeScale') as HTMLInputElement;
    const timeScaleValue = document.getElementById('timeScaleValue') as HTMLElement;
    
    timeScaleSlider.value = '2';
    timeScaleSlider.dispatchEvent(new Event('input'));
    
    expect(simulationEngine.getConfig().timeScale).toBe(2);
    expect(timeScaleValue.textContent).toBe('2.0x');
  });

  it('should update color mode when select changes', () => {
    const colorModeSelect = document.getElementById('colorMode') as HTMLSelectElement;
    
    colorModeSelect.value = 'velocity';
    colorModeSelect.dispatchEvent(new Event('change'));
    
    expect(renderer.getConfig().colorMode).toBe('velocity');
  });

  it('should update statistics display', () => {
    const statsParticleCount = document.getElementById('statsParticleCount') as HTMLElement;
    const statsConglomerateCount = document.getElementById('statsConglomerateCount') as HTMLElement;
    
    // Initially should be 0
    expect(statsParticleCount.textContent).toBe('0');
    expect(statsConglomerateCount.textContent).toBe('0');
    
    // Spawn some particles
    particleManager.spawnParticle();
    particleManager.spawnParticle();
    
    // Trigger statistics update (normally done by interval)
    guiController['updateStatistics']();
    
    expect(statsParticleCount.textContent).toBe('2');
    expect(statsConglomerateCount.textContent).toBe('0');
  });

  it('should apply configuration changes immediately to new particles', () => {
    const massMinSlider = document.getElementById('massMin') as HTMLInputElement;
    const massMaxSlider = document.getElementById('massMax') as HTMLInputElement;
    
    // Change mass range
    massMinSlider.value = '5';
    massMinSlider.dispatchEvent(new Event('input'));
    massMaxSlider.value = '15';
    massMaxSlider.dispatchEvent(new Event('input'));
    
    // Spawn new particle
    const particle = particleManager.spawnParticle();
    
    // New particle should have mass in new range
    expect(particle.mass).toBeGreaterThanOrEqual(5);
    expect(particle.mass).toBeLessThanOrEqual(15);
  });

  it('should handle multiple rapid configuration changes', () => {
    const timeScaleSlider = document.getElementById('timeScale') as HTMLInputElement;
    
    // Rapid changes
    for (let i = 1; i <= 5; i++) {
      timeScaleSlider.value = i.toString();
      timeScaleSlider.dispatchEvent(new Event('input'));
    }
    
    expect(simulationEngine.getConfig().timeScale).toBe(5);
  });

  it('should maintain consistency between UI and simulation state', () => {
    const playButton = document.getElementById('playButton') as HTMLButtonElement;
    const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
    
    // Initially paused
    expect(simulationEngine.getIsRunning()).toBe(false);
    expect(playButton.disabled).toBe(false);
    expect(pauseButton.disabled).toBe(true);
    
    // Start simulation
    playButton.click();
    expect(simulationEngine.getIsRunning()).toBe(true);
    expect(playButton.disabled).toBe(true);
    expect(pauseButton.disabled).toBe(false);
    
    // Pause simulation
    pauseButton.click();
    expect(simulationEngine.getIsRunning()).toBe(false);
    expect(playButton.disabled).toBe(false);
    expect(pauseButton.disabled).toBe(true);
  });
});
