/**
 * Main entry point for the 3D Particle Aggregation Simulation
 * Initializes and wires all components together for 3D rendering
 * 
 * Validates: Requirements 7.1, 8.1
 */

import * as THREE from 'three';
import { Vector3D } from './core/Vector3D';
import { Particle } from './core/Particle';
import { Conglomerate } from './core/Conglomerate';
import { ParticleManager, ParticleSpawnConfig } from './core/ParticleManager';
import { CollisionDetector } from './core/CollisionDetector';
import { BarnesHutPhysicsEngine } from './core/BarnesHutPhysicsEngine';
import { NewtonianGravity } from './core/GravityFormula';
import { GravityRegistry } from './core/GravityRegistry';
import { SimulationEngine, SimulationConfig } from './core/SimulationEngine';
import { Renderer, RenderConfig } from './core/Renderer';
import { Camera } from './core/Camera';
import { GUIController } from './core/GUIController';
import { Boundary } from './core/Boundary';

/**
 * Initialize the 3D simulation with default configuration
 */
async function initializeSimulation(): Promise<void> {
  console.log('Initializing 3D Particle Aggregation Simulation...');

  // Get canvas element
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  // Get initial canvas size
  const controlsHeight = document.getElementById('controls')?.offsetHeight || 0;
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight - controlsHeight;

  // Define 3D cubic boundary based on canvas size
  // Use the smaller dimension to ensure the boundary fits in the viewport
  // Add some depth for 3D effect
  const boundarySize = Math.min(canvasWidth, canvasHeight) * 0.8; // 80% of smaller dimension
  const boundary = new Boundary(
    new Vector3D(-boundarySize / 2, -boundarySize / 2, -boundarySize / 2),
    new Vector3D(boundarySize / 2, boundarySize / 2, boundarySize / 2)
  );

  // Configure particle spawning
  const particleSpawnConfig: ParticleSpawnConfig = {
    spawnRate: 2.0,           // 2 particles per second
    massRange: [1, 10],       // Mass between 1 and 10
    energyRange: [10, 100],   // Kinetic energy between 10 and 100
    maxParticles: 0           // 0 = unlimited particles
  };

  // Configure simulation engine
  const simulationConfig: SimulationConfig = {
    targetFPS: 60,            // Target 60 frames per second
    timeScale: 1.0,           // Normal speed
    accuracySteps: 1,         // 1 physics step per frame (can be increased for accuracy)
    adaptiveTimeSteps: true   // Enable adaptive time steps for constant FPS
  };

  // Configure renderer
  const renderConfig: RenderConfig = {
    colorMode: 'mass',        // Color by mass
    showVelocityVectors: false
  };

  // Initialize gravity formula
  const gravitationalConstant = 1.0; // Scaled for simulation (not real-world value)
  const epsilon = 0.01;              // Minimum distance for numerical stability
  const gravityFormula = new NewtonianGravity(gravitationalConstant, epsilon);

  // Initialize gravity registry (for extensibility)
  const gravityRegistry = new GravityRegistry();
  gravityRegistry.register(gravityFormula);
  console.log('Registered gravity formulas:', gravityRegistry.list());

  // Initialize core components
  const particleManager = new ParticleManager(boundary, particleSpawnConfig);
  const collisionDetector = new CollisionDetector(20); // Cell size = 20 (about 2x max particle radius)
  
  // Initialize collision workers
  await collisionDetector.initializeWorkers();
  console.log('Collision Workers:', collisionDetector.isUsingWorkers() ? 'Enabled' : 'Disabled (single-threaded)');
  
  // Use Barnes-Hut physics engine (with Web Workers, SharedArrayBuffer, LOD, and Barnes-Hut)
  const physicsEngine = new BarnesHutPhysicsEngine(gravityFormula, 0); // Elasticity = 0 (fully inelastic)
  await physicsEngine.initialize(); // Initialize worker pool
  console.log('Barnes-Hut:', physicsEngine.isUsingBarnesHut() ? 'Enabled' : 'Disabled');
  console.log('LOD Physics:', physicsEngine.isUsingLOD() ? 'Enabled' : 'Disabled');
  console.log('Web Workers:', physicsEngine.isUsingWorkers() ? 'Enabled' : 'Disabled (single-threaded)');
  
  // Initialize camera controller first
  const camera = new Camera(canvas, boundary);
  
  // Set camera for LOD calculations
  physicsEngine.setCamera(camera);
  
  // Initialize renderer with the camera from the camera controller
  const renderer = new Renderer(canvas, renderConfig, camera.getCamera());

  // Set canvas size to fill viewport (must be after renderer and camera are created)
  function resizeCanvas(): void {
    const controls = document.getElementById('controls');
    // Only subtract controls height if they are visible (not hidden)
    const controlsHeight = (controls && !controls.classList.contains('hidden')) 
      ? controls.offsetHeight 
      : 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - controlsHeight;
    
    // Update renderer and camera aspect ratio
    renderer.resize(canvas.width, canvas.height);
    camera.updateAspectRatio(canvas.width, canvas.height);
  }
  resizeCanvas();

  // Initialize simulation engine
  const simulationEngine = new SimulationEngine(
    particleManager,
    collisionDetector,
    physicsEngine,
    renderer,
    camera,
    simulationConfig
  );

  // Initialize GUI controller
  const guiController = new GUIController(
    simulationEngine,
    particleManager,
    physicsEngine,
    renderer
  );
  guiController.initialize();

  // Add window resize handler for camera aspect ratio
  window.addEventListener('resize', resizeCanvas);

  console.log('3D Simulation initialized successfully!');
  console.log('Configuration:', {
    boundary: {
      min: boundary.min,
      max: boundary.max
    },
    particleSpawnConfig,
    simulationConfig,
    renderConfig,
    gravitationalConstant,
    epsilon
  });

  // Start the simulation automatically
  simulationEngine.start();
  console.log('3D Simulation started!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSimulation);
} else {
  initializeSimulation();
}
