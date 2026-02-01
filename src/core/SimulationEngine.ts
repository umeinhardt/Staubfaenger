import { ParticleManager } from './ParticleManager';
import { CollisionDetector } from './CollisionDetector';
import { PhysicsEngine } from './PhysicsEngine';
import { Renderer } from './Renderer';
import { Camera } from './Camera';
import { Boundary } from './Boundary';

/**
 * Configuration for the simulation engine
 */
export interface SimulationConfig {
  targetFPS: number;        // Target frames per second
  timeScale: number;        // Simulation speed multiplier (1.0 = normal speed)
  accuracySteps: number;    // Number of physics sub-steps per frame
  adaptiveTimeSteps: boolean; // Enable adaptive time steps for constant FPS
}

/**
 * Main simulation engine that coordinates the game loop
 * Manages the simulation lifecycle and coordinates between physics, collision detection, rendering, and camera
 * 
 * Validates: Requirements 1.3, 2.2, 2.5, 6.1, 6.8, 8.1, 10.1, 10.2, 10.3, 10.7
 */
export class SimulationEngine {
  private particleManager: ParticleManager;
  private collisionDetector: CollisionDetector;
  private physicsEngine: PhysicsEngine;
  private renderer: Renderer;
  private cameraController: Camera;
  private config: SimulationConfig;

  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private disableSticking: boolean = false; // When true, particles bounce instead of sticking
  
  // Adaptive time step tracking
  private frameTimeHistory: number[] = []; // Last N frame times for averaging
  private readonly frameHistorySize: number = 10; // Number of frames to average
  private currentAdaptiveScale: number = 1.0; // Current adaptive time scale

  /**
   * Create a new simulation engine
   * @param particleManager - Manages particles and conglomerates
   * @param collisionDetector - Detects collisions between entities
   * @param physicsEngine - Handles physics calculations
   * @param renderer - Renders the 3D simulation
   * @param cameraController - Manages 3D camera controls
   * @param config - Simulation configuration
   */
  constructor(
    particleManager: ParticleManager,
    collisionDetector: CollisionDetector,
    physicsEngine: PhysicsEngine,
    renderer: Renderer,
    cameraController: Camera,
    config: SimulationConfig
  ) {
    this.particleManager = particleManager;
    this.collisionDetector = collisionDetector;
    this.physicsEngine = physicsEngine;
    this.renderer = renderer;
    this.cameraController = cameraController;
    this.config = config;
  }

  /**
   * Start the simulation
   * Validates: Requirement 10.2
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  /**
   * Pause the simulation
   * Validates: Requirement 10.1
   */
  pause(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Reset the simulation to initial state
   * Validates: Requirement 10.3
   */
  reset(): void {
    const wasRunning = this.isRunning;
    
    // Pause if running
    if (wasRunning) {
      this.pause();
    }

    // Clear all entities
    this.particleManager.clear();

    // Reset time tracking
    this.lastFrameTime = 0;

    // Render empty state
    this.render();

    // Resume if it was running
    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Main game loop using requestAnimationFrame
   * Implements adaptive time steps for stable physics
   * Validates: Requirements 1.3, 2.2
   * @param currentTime - Current timestamp from requestAnimationFrame
   */
  private gameLoop(currentTime: number): void {
    if (!this.isRunning) {
      return;
    }

    // Calculate delta time in seconds
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Cap delta time to prevent spiral of death
    // If frame takes too long, limit it to avoid instability
    const cappedDeltaTime = Math.min(deltaTime, 1 / 30); // Max 33ms per frame

    // Apply adaptive time steps if enabled
    let finalDeltaTime = cappedDeltaTime;
    if (this.config.adaptiveTimeSteps) {
      finalDeltaTime = this.calculateAdaptiveDeltaTime(cappedDeltaTime);
    }

    // Update simulation (async for worker support)
    this.update(finalDeltaTime).then(() => {
      // Render current state
      this.render();

      // Schedule next frame
      this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    });
  }

  /**
   * Calculate adaptive delta time to maintain target FPS
   * Adjusts simulation speed based on actual frame time
   * @param deltaTime - Actual frame time
   * @returns Adjusted delta time
   */
  private calculateAdaptiveDeltaTime(deltaTime: number): number {
    // Add current frame time to history
    this.frameTimeHistory.push(deltaTime);
    
    // Keep only last N frames
    if (this.frameTimeHistory.length > this.frameHistorySize) {
      this.frameTimeHistory.shift();
    }

    // Calculate average frame time
    const avgFrameTime = this.frameTimeHistory.reduce((sum, t) => sum + t, 0) / this.frameTimeHistory.length;
    
    // Calculate target frame time
    const targetFrameTime = 1 / this.config.targetFPS;
    
    // Calculate how much we're behind/ahead
    const performanceRatio = avgFrameTime / targetFrameTime;
    
    // Adjust adaptive scale smoothly
    // If we're slow (ratio > 1), reduce simulation speed
    // If we're fast (ratio < 1), increase simulation speed (up to 1.0)
    if (performanceRatio > 1.0) {
      // Running slow - reduce simulation speed to maintain FPS
      // Use exponential smoothing for gradual adjustment
      const targetScale = 1.0 / performanceRatio;
      this.currentAdaptiveScale = this.currentAdaptiveScale * 0.9 + targetScale * 0.1;
      
      // Clamp to reasonable range (don't go below 0.1x speed)
      this.currentAdaptiveScale = Math.max(0.1, Math.min(1.0, this.currentAdaptiveScale));
    } else {
      // Running fast - gradually return to normal speed
      this.currentAdaptiveScale = this.currentAdaptiveScale * 0.95 + 1.0 * 0.05;
      this.currentAdaptiveScale = Math.min(1.0, this.currentAdaptiveScale);
    }
    
    // Apply adaptive scale to delta time
    return deltaTime * this.currentAdaptiveScale;
  }

  /**
   * Update simulation state with adaptive time steps
   * Divides the frame time into multiple sub-steps for accuracy
   * Validates: Requirements 2.2, 2.5, 6.1, 6.8, 10.7
   * @param deltaTime - Time elapsed since last frame (in seconds)
   */
  private async update(deltaTime: number): Promise<void> {
    // Apply time scale for simulation speed control
    const scaledDeltaTime = deltaTime * this.config.timeScale;

    // Divide into sub-steps for accuracy
    const subStepTime = scaledDeltaTime / this.config.accuracySteps;

    // Track which entity pairs have already had collisions resolved this frame
    // This prevents resolving the same collision multiple times across sub-steps
    const resolvedCollisions = new Set<string>();

    for (let i = 0; i < this.config.accuracySteps; i++) {
      // Get all entities
      const entities = this.particleManager.getAllEntities();

      // Apply gravitational forces
      this.physicsEngine.applyGravity(entities, subStepTime);

      // Update particle manager (spawning, movement, wrap-around or bouncing)
      // Use bouncing when sticking is disabled, otherwise use wrap-around
      this.particleManager.update(subStepTime, this.disableSticking, 0.8);

      // Detect collisions using 3D spatial hash (async for worker support)
      const collisions = await this.collisionDetector.detectCollisions(
        this.particleManager.getAllEntities()
      );

      // Resolve collisions and merge entities
      for (const collision of collisions) {
        // Check if entities still exist (might have been merged in previous collision)
        const allEntities = this.particleManager.getAllEntities();
        const entity1Exists = allEntities.some(e => e.id === collision.entity1.id);
        const entity2Exists = allEntities.some(e => e.id === collision.entity2.id);

        if (!entity1Exists || !entity2Exists) {
          continue;
        }

        // Create unique collision key to prevent duplicate resolution
        const collisionKey = this.createCollisionKey(collision.entity1.id, collision.entity2.id);
        
        // Skip if this collision was already resolved this frame
        if (resolvedCollisions.has(collisionKey)) {
          continue;
        }

        // Mark collision as resolved
        resolvedCollisions.add(collisionKey);

        // Resolve collision physics
        this.physicsEngine.resolveCollision(collision);

        // Only merge entities if sticking is enabled
        if (!this.disableSticking) {
          this.mergeEntities(collision.entity1, collision.entity2);
        }
      }
    }
    
    // Update camera controls (must be called every frame for damping)
    this.cameraController.update();
  }

  /**
   * Create a unique key for a collision pair
   * Ensures consistent ordering to avoid duplicates
   * @param id1 - First entity ID
   * @param id2 - Second entity ID
   * @returns Unique collision key
   */
  private createCollisionKey(id1: string, id2: string): string {
    // Sort IDs to ensure consistent ordering
    return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  }

  /**
   * Merge two entities into a conglomerate
   * Handles all combinations: particle-particle, particle-conglomerate, conglomerate-conglomerate
   * @param entity1 - First entity
   * @param entity2 - Second entity
   */
  private mergeEntities(entity1: any, entity2: any): void {
    const isParticle1 = 'mass' in entity1 && !('particles' in entity1);
    const isParticle2 = 'mass' in entity2 && !('particles' in entity2);

    if (isParticle1 && isParticle2) {
      // Both are particles
      this.particleManager.createConglomerate(entity1, entity2);
    } else if (isParticle1 && !isParticle2) {
      // entity1 is particle, entity2 is conglomerate
      this.particleManager.mergeParticleWithConglomerate(entity1, entity2);
    } else if (!isParticle1 && isParticle2) {
      // entity1 is conglomerate, entity2 is particle
      this.particleManager.mergeParticleWithConglomerate(entity2, entity1);
    } else {
      // Both are conglomerates
      this.particleManager.mergeConglomerates(entity1, entity2);
    }
  }

  /**
   * Render the current simulation state
   */
  private render(): void {
    const entities = this.particleManager.getAllEntities();
    this.renderer.render(entities);
  }

  /**
   * Set the time scale (simulation speed)
   * Validates: Requirement 10.7
   * @param scale - Time scale multiplier (1.0 = normal speed, 2.0 = double speed, 0.5 = half speed)
   */
  setTimeScale(scale: number): void {
    if (scale < 0) {
      throw new Error('Time scale must be non-negative');
    }
    this.config.timeScale = scale;
  }

  /**
   * Enable or disable adaptive time steps
   * @param enable - True to enable adaptive time steps
   */
  setAdaptiveTimeSteps(enable: boolean): void {
    this.config.adaptiveTimeSteps = enable;
    
    // Reset adaptive state when toggling
    if (enable) {
      this.frameTimeHistory = [];
      this.currentAdaptiveScale = 1.0;
    }
  }

  /**
   * Get current adaptive time scale
   * @returns Current adaptive scale (1.0 = normal, <1.0 = slowed down)
   */
  getAdaptiveScale(): number {
    return this.currentAdaptiveScale;
  }

  /**
   * Set whether particles should stick together or bounce
   * @param disable - True to disable sticking (particles bounce), false to enable sticking
   */
  setDisableSticking(disable: boolean): void {
    this.disableSticking = disable;
    
    // When disabling sticking, set elasticity to 0.8 for bouncy but damped collisions
    // When enabling sticking, set elasticity to 0.0 for inelastic collisions
    this.physicsEngine.setElasticity(disable ? 0.8 : 0.0);
  }

  /**
   * Set the number of accuracy steps per frame
   * Higher values = more accurate but slower
   * Validates: Requirement 2.5
   * @param steps - Number of sub-steps per frame (must be >= 1)
   */
  setAccuracySteps(steps: number): void {
    if (steps < 1) {
      throw new Error('Accuracy steps must be at least 1');
    }
    this.config.accuracySteps = Math.floor(steps);
  }

  /**
   * Get the current simulation configuration
   * @returns Current configuration
   */
  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  /**
   * Check if the simulation is currently running
   * @returns True if simulation is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the particle manager
   * @returns Particle manager instance
   */
  getParticleManager(): ParticleManager {
    return this.particleManager;
  }

  /**
   * Get the renderer
   * @returns Renderer instance
   */
  getRenderer(): Renderer {
    return this.renderer;
  }

  /**
   * Get the physics engine
   * @returns Physics engine instance
   */
  getPhysicsEngine(): PhysicsEngine {
    return this.physicsEngine;
  }

  /**
   * Get the camera controller
   * @returns Camera controller instance
   */
  getCameraController(): Camera {
    return this.cameraController;
  }

  /**
   * Get the collision detector
   * @returns Collision detector instance
   */
  getCollisionDetector(): CollisionDetector {
    return this.collisionDetector;
  }
}
