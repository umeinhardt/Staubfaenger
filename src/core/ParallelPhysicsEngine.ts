/**
 * Parallel Physics Engine using Web Workers
 * Extends PhysicsEngine with multi-threaded gravity computation
 */

import { PhysicsEngine, Entity } from './PhysicsEngine';
import { PhysicsWorkerPool } from './PhysicsWorkerPool';
import { GravityFormula } from './GravityFormula';
import { Vector3D } from './Vector3D';

/**
 * Physics engine with Web Worker parallelization
 */
export class ParallelPhysicsEngine extends PhysicsEngine {
  private workerPool: PhysicsWorkerPool;
  private useWorkers: boolean = true;
  private workerThreshold: number = 50; // Use workers only if more than 50 entities

  /**
   * Create a parallel physics engine
   * @param gravityFormula - Gravity formula to use
   * @param elasticity - Collision elasticity
   * @param separateOnCollision - Whether to separate overlapping entities
   * @param numWorkers - Number of worker threads (default: auto-detect)
   */
  constructor(
    gravityFormula: GravityFormula,
    elasticity: number = 0,
    separateOnCollision: boolean = false,
    numWorkers?: number
  ) {
    super(gravityFormula, elasticity, separateOnCollision);
    this.workerPool = new PhysicsWorkerPool(numWorkers);
  }

  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    await this.workerPool.initialize();
    if (this.workerPool.isEnabled()) {
      const sabStatus = this.workerPool.isUsingSharedArrayBuffer() ? 'with SharedArrayBuffer (zero-copy)' : 'with postMessage';
      console.log(`Parallel Physics Engine: Workers enabled ${sabStatus}`);
    } else {
      console.log('Parallel Physics Engine: Workers disabled, using single-threaded');
    }
  }

  /**
   * Set whether to use workers
   */
  setUseWorkers(use: boolean): void {
    this.useWorkers = use;
  }

  /**
   * Get whether workers are being used
   */
  isUsingWorkers(): boolean {
    return this.useWorkers && this.workerPool.isEnabled();
  }

  /**
   * Set the threshold for using workers
   */
  setWorkerThreshold(threshold: number): void {
    this.workerThreshold = threshold;
    this.workerPool.setThreshold(threshold);
  }

  /**
   * Apply gravitational forces (with optional parallelization)
   * @param entities - Array of entities
   * @param deltaTime - Time step
   */
  override applyGravity(entities: Entity[], deltaTime: number): void {
    // Use workers if enabled and above threshold
    if (this.useWorkers && this.workerPool.isEnabled() && entities.length >= this.workerThreshold) {
      this.applyGravityParallel(entities, deltaTime);
    } else {
      // Fall back to single-threaded
      super.applyGravity(entities, deltaTime);
    }
  }

  /**
   * Apply gravity using parallel workers
   * This is async but we don't await it - forces are applied in next frame
   */
  private applyGravityParallel(entities: Entity[], deltaTime: number): void {
    // Get gravitational constant from formula
    const G = (this.gravityFormula as any).G || 1.0;
    const epsilon = (this.gravityFormula as any).epsilon || 0.01;

    // Compute forces in parallel
    this.workerPool.computeGravityParallel(entities, G, epsilon, deltaTime)
      .then(forceMap => {
        // Apply forces to entities
        for (const entity of entities) {
          const force = forceMap.get(entity.id);
          if (force) {
            entity.applyForce(force, deltaTime);
          }
        }
      })
      .catch(error => {
        console.warn('Worker computation failed, falling back to CPU:', error);
        // Fall back to single-threaded
        super.applyGravity(entities, deltaTime);
      });
  }

  /**
   * Cleanup workers
   */
  dispose(): void {
    this.workerPool.terminate();
  }
}
