/**
 * Physics Worker Pool for parallel computation
 * Manages multiple Web Workers for optimal CPU utilization
 * Supports SharedArrayBuffer for zero-copy data transfer
 */

import { Vector3D } from './Vector3D';
import { Particle } from './Particle';
import { Conglomerate } from './Conglomerate';

export type Entity = Particle | Conglomerate;

interface SerializedEntity {
  id: string;
  type: 'particle' | 'conglomerate';
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  mass: number;
}

interface GravityResult {
  id: string;
  force: { x: number; y: number; z: number };
}

/**
 * Pool of Web Workers for parallel physics computation
 */
export class PhysicsWorkerPool {
  private workers: Worker[] = [];
  private numWorkers: number;
  private enabled: boolean = false;
  private threshold: number = 50; // Use workers only if more than 50 entities
  
  // SharedArrayBuffer support
  private useSharedArrayBuffer: boolean = false;
  private sharedPositions: SharedArrayBuffer | null = null;
  private sharedMasses: SharedArrayBuffer | null = null;
  private sharedForces: SharedArrayBuffer | null = null;
  private maxEntities: number = 2000; // Pre-allocate for up to 2000 entities

  /**
   * Create a worker pool
   * @param numWorkers - Number of workers (default: CPU cores - 1)
   */
  constructor(numWorkers?: number) {
    // Use number of CPU cores minus 1 (leave one for main thread)
    this.numWorkers = numWorkers || Math.max(1, navigator.hardwareConcurrency - 1);
  }

  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    try {
      // Check SharedArrayBuffer support
      this.useSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
      
      if (this.useSharedArrayBuffer) {
        // Allocate shared buffers
        // Positions: 3 floats per entity (x, y, z)
        this.sharedPositions = new SharedArrayBuffer(this.maxEntities * 3 * Float64Array.BYTES_PER_ELEMENT);
        // Masses: 1 float per entity
        this.sharedMasses = new SharedArrayBuffer(this.maxEntities * Float64Array.BYTES_PER_ELEMENT);
        // Forces: 3 floats per entity (fx, fy, fz)
        this.sharedForces = new SharedArrayBuffer(this.maxEntities * 3 * Float64Array.BYTES_PER_ELEMENT);
        
        console.log('SharedArrayBuffer support: ENABLED (zero-copy mode)');
      } else {
        console.log('SharedArrayBuffer support: DISABLED (fallback to postMessage)');
      }

      // Create workers
      for (let i = 0; i < this.numWorkers; i++) {
        const worker = new Worker(
          new URL('../workers/physics.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Send shared buffers to worker if available
        if (this.useSharedArrayBuffer && this.sharedPositions && this.sharedMasses && this.sharedForces) {
          worker.postMessage({
            type: 'initSharedBuffers',
            positions: this.sharedPositions,
            masses: this.sharedMasses,
            forces: this.sharedForces,
            maxEntities: this.maxEntities
          });
        }
        
        this.workers.push(worker);
      }

      this.enabled = true;
      console.log(`Physics Worker Pool initialized with ${this.numWorkers} workers`);
    } catch (error) {
      console.warn('Failed to initialize Web Workers, falling back to single-threaded:', error);
      this.enabled = false;
    }
  }

  /**
   * Check if workers are enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.workers.length > 0;
  }

  /**
   * Check if using SharedArrayBuffer
   */
  isUsingSharedArrayBuffer(): boolean {
    return this.useSharedArrayBuffer;
  }

  /**
   * Set the threshold for using workers
   */
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  /**
   * Compute gravity forces in parallel using workers
   * @param entities - Array of entities
   * @param G - Gravitational constant
   * @param epsilon - Softening parameter
   * @param deltaTime - Time step
   * @returns Map of entity ID to force vector
   */
  async computeGravityParallel(
    entities: Entity[],
    G: number,
    epsilon: number,
    deltaTime: number
  ): Promise<Map<string, Vector3D>> {
    // Don't use workers if below threshold or not enabled
    if (!this.enabled || entities.length < this.threshold) {
      return new Map();
    }

    // Use SharedArrayBuffer if available
    if (this.useSharedArrayBuffer && this.sharedPositions && this.sharedMasses && this.sharedForces) {
      return this.computeGravityShared(entities, G, epsilon, deltaTime);
    } else {
      return this.computeGravityPostMessage(entities, G, epsilon, deltaTime);
    }
  }

  /**
   * Compute gravity using SharedArrayBuffer (zero-copy)
   */
  private async computeGravityShared(
    entities: Entity[],
    G: number,
    epsilon: number,
    deltaTime: number
  ): Promise<Map<string, Vector3D>> {
    const n = Math.min(entities.length, this.maxEntities);
    
    // Write entity data to shared buffers
    const positions = new Float64Array(this.sharedPositions!);
    const masses = new Float64Array(this.sharedMasses!);
    const forces = new Float64Array(this.sharedForces!);
    
    // Clear forces
    forces.fill(0);
    
    // Write positions and masses
    for (let i = 0; i < n; i++) {
      const e = entities[i];
      const pos = e instanceof Particle ? e.position : e.centerOfMass;
      const mass = e instanceof Particle ? e.mass : e.totalMass;
      
      positions[i * 3 + 0] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      masses[i] = mass;
    }
    
    // Split work among workers
    const chunkSize = Math.ceil(n / this.workers.length);
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < this.workers.length; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, n);
      
      if (start >= n) break;
      
      const promise = new Promise<void>((resolve) => {
        const worker = this.workers[i];
        
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'gravityComplete') {
            worker.removeEventListener('message', handler);
            resolve();
          }
        };
        
        worker.addEventListener('message', handler);
        
        worker.postMessage({
          type: 'computeGravityShared',
          start,
          end,
          numEntities: n,
          G,
          epsilon
        });
      });
      
      promises.push(promise);
    }
    
    // Wait for all workers
    await Promise.all(promises);
    
    // Read forces from shared buffer
    const forceMap = new Map<string, Vector3D>();
    for (let i = 0; i < n; i++) {
      const fx = forces[i * 3 + 0];
      const fy = forces[i * 3 + 1];
      const fz = forces[i * 3 + 2];
      forceMap.set(entities[i].id, new Vector3D(fx, fy, fz));
    }
    
    return forceMap;
  }

  /**
   * Compute gravity using postMessage (fallback)
   */
  private async computeGravityPostMessage(
    entities: Entity[],
    G: number,
    epsilon: number,
    deltaTime: number
  ): Promise<Map<string, Vector3D>> {
    // Serialize entities for transfer to workers
    const serialized: SerializedEntity[] = entities.map(e => ({
      id: e.id,
      type: e instanceof Particle ? 'particle' : 'conglomerate',
      position: {
        x: e instanceof Particle ? e.position.x : e.centerOfMass.x,
        y: e instanceof Particle ? e.position.y : e.centerOfMass.y,
        z: e instanceof Particle ? e.position.z : e.centerOfMass.z
      },
      velocity: {
        x: e.velocity.x,
        y: e.velocity.y,
        z: e.velocity.z
      },
      mass: e instanceof Particle ? e.mass : e.totalMass
    }));

    // Split work among workers
    const chunkSize = Math.ceil(serialized.length / this.workers.length);
    const promises: Promise<GravityResult[]>[] = [];

    for (let i = 0; i < this.workers.length; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, serialized.length);
      
      if (start >= serialized.length) break;

      const chunk = serialized.slice(start, end);
      
      // Send work to worker
      const promise = new Promise<GravityResult[]>((resolve) => {
        const worker = this.workers[i];
        
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'gravityResults') {
            worker.removeEventListener('message', handler);
            resolve(e.data.results);
          }
        };
        
        worker.addEventListener('message', handler);
        
        worker.postMessage({
          type: 'computeGravity',
          entities: serialized, // Send all entities (each worker computes for its chunk)
          G,
          epsilon,
          deltaTime
        });
      });

      promises.push(promise);
    }

    // Wait for all workers to complete
    const results = await Promise.all(promises);

    // Combine results
    const forceMap = new Map<string, Vector3D>();
    for (const workerResults of results) {
      for (const result of workerResults) {
        forceMap.set(result.id, new Vector3D(
          result.force.x,
          result.force.y,
          result.force.z
        ));
      }
    }

    return forceMap;
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.enabled = false;
  }
}
