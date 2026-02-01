/**
 * Collision Worker Pool for parallel collision detection
 * Manages multiple Web Workers for optimal CPU utilization
 * Supports SharedArrayBuffer for zero-copy data transfer
 */

import { Entity } from './SpatialHash';
import { Particle } from './Particle';
import { Vector3D } from './Vector3D';

interface SerializedEntity {
  id: string;
  position: { x: number; y: number; z: number };
  radius: number;
}

interface CollisionPair {
  id1: string;
  id2: string;
}

/**
 * Pool of Web Workers for parallel collision detection
 */
export class CollisionWorkerPool {
  private workers: Worker[] = [];
  private numWorkers: number;
  private enabled: boolean = false;
  private threshold: number = 100; // Use workers only if more than 100 entities
  
  // SharedArrayBuffer support
  private useSharedArrayBuffer: boolean = false;
  private sharedPositions: SharedArrayBuffer | null = null;
  private sharedRadii: SharedArrayBuffer | null = null;
  private sharedCollisions: SharedArrayBuffer | null = null;
  private maxEntities: number = 2000; // Pre-allocate for up to 2000 entities
  private maxCollisions: number = 10000; // Pre-allocate for up to 10000 collision pairs

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
        // Radii: 1 float per entity
        this.sharedRadii = new SharedArrayBuffer(this.maxEntities * Float64Array.BYTES_PER_ELEMENT);
        // Collisions: pairs of entity indices [id1, id2, id1, id2, ...]
        this.sharedCollisions = new SharedArrayBuffer(this.maxCollisions * 2 * Int32Array.BYTES_PER_ELEMENT);
        
        console.log('Collision Worker Pool: SharedArrayBuffer support ENABLED (zero-copy mode)');
      } else {
        console.log('Collision Worker Pool: SharedArrayBuffer support DISABLED (fallback to postMessage)');
      }

      // Create workers
      for (let i = 0; i < this.numWorkers; i++) {
        const worker = new Worker(
          new URL('../workers/collision.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Send shared buffers to worker if available
        if (this.useSharedArrayBuffer && this.sharedPositions && this.sharedRadii && this.sharedCollisions) {
          worker.postMessage({
            type: 'initSharedBuffers',
            positions: this.sharedPositions,
            radii: this.sharedRadii,
            collisions: this.sharedCollisions,
            maxEntities: this.maxEntities,
            maxCollisions: this.maxCollisions
          });
        }
        
        this.workers.push(worker);
      }

      this.enabled = true;
      console.log(`Collision Worker Pool initialized with ${this.numWorkers} workers`);
    } catch (error) {
      console.warn('Failed to initialize Collision Workers, falling back to single-threaded:', error);
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
   * Detect collisions in parallel using workers
   * @param entities - Array of entities
   * @param cellSize - Spatial hash cell size
   * @returns Array of collision pairs with entity IDs
   */
  async detectCollisionsParallel(
    entities: Entity[],
    cellSize: number
  ): Promise<CollisionPair[]> {
    // Don't use workers if below threshold or not enabled
    if (!this.enabled || entities.length < this.threshold) {
      return [];
    }

    // Use SharedArrayBuffer if available
    if (this.useSharedArrayBuffer && this.sharedPositions && this.sharedRadii && this.sharedCollisions) {
      return this.detectCollisionsShared(entities, cellSize);
    } else {
      return this.detectCollisionsPostMessage(entities, cellSize);
    }
  }

  /**
   * Detect collisions using SharedArrayBuffer (zero-copy)
   */
  private async detectCollisionsShared(
    entities: Entity[],
    cellSize: number
  ): Promise<CollisionPair[]> {
    const n = Math.min(entities.length, this.maxEntities);
    
    // Write entity data to shared buffers
    const positions = new Float64Array(this.sharedPositions!);
    const radii = new Float64Array(this.sharedRadii!);
    const collisions = new Int32Array(this.sharedCollisions!);
    
    // Clear collisions
    collisions.fill(-1);
    
    // Write positions and radii
    for (let i = 0; i < n; i++) {
      const e = entities[i];
      const pos = this.getPosition(e);
      
      positions[i * 3 + 0] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      radii[i] = e.radius;
    }
    
    // Split work among workers
    const chunkSize = Math.ceil(n / this.workers.length);
    const promises: Promise<number>[] = [];
    
    for (let i = 0; i < this.workers.length; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, n);
      
      if (start >= n) break;
      
      const promise = new Promise<number>((resolve) => {
        const worker = this.workers[i];
        
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'collisionsComplete') {
            worker.removeEventListener('message', handler);
            resolve(e.data.count);
          }
        };
        
        worker.addEventListener('message', handler);
        
        worker.postMessage({
          type: 'detectCollisionsShared',
          start,
          end,
          numEntities: n,
          cellSize
        });
      });
      
      promises.push(promise);
    }
    
    // Wait for all workers
    await Promise.all(promises);
    
    // Read collisions from shared buffer
    const result: CollisionPair[] = [];
    for (let i = 0; i < this.maxCollisions; i++) {
      const idx1 = collisions[i * 2 + 0];
      const idx2 = collisions[i * 2 + 1];
      
      if (idx1 === -1 || idx2 === -1) break;
      
      result.push({
        id1: entities[idx1].id,
        id2: entities[idx2].id
      });
    }
    
    return result;
  }

  /**
   * Detect collisions using postMessage (fallback)
   */
  private async detectCollisionsPostMessage(
    entities: Entity[],
    cellSize: number
  ): Promise<CollisionPair[]> {
    // Serialize entities for transfer to workers
    const serialized: SerializedEntity[] = entities.map(e => {
      const pos = this.getPosition(e);
      return {
        id: e.id,
        position: { x: pos.x, y: pos.y, z: pos.z },
        radius: e.radius
      };
    });

    // Split work among workers
    const chunkSize = Math.ceil(serialized.length / this.workers.length);
    const promises: Promise<CollisionPair[]>[] = [];

    for (let i = 0; i < this.workers.length; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, serialized.length);
      
      if (start >= serialized.length) break;

      // Send work to worker
      const promise = new Promise<CollisionPair[]>((resolve) => {
        const worker = this.workers[i];
        
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'collisionsResult') {
            worker.removeEventListener('message', handler);
            resolve(e.data.collisions);
          }
        };
        
        worker.addEventListener('message', handler);
        
        worker.postMessage({
          type: 'detectCollisions',
          entities: serialized,
          cellSize
        });
      });

      promises.push(promise);
    }

    // Wait for all workers to complete
    const results = await Promise.all(promises);

    // Combine results (remove duplicates)
    const collisionSet = new Set<string>();
    const finalCollisions: CollisionPair[] = [];

    for (const workerResults of results) {
      for (const collision of workerResults) {
        // Create unique key
        const key = collision.id1 < collision.id2 
          ? `${collision.id1}:${collision.id2}` 
          : `${collision.id2}:${collision.id1}`;
        
        if (!collisionSet.has(key)) {
          collisionSet.add(key);
          finalCollisions.push(collision);
        }
      }
    }

    return finalCollisions;
  }

  /**
   * Get position of an entity
   */
  private getPosition(entity: Entity): Vector3D {
    if (entity instanceof Particle) {
      return entity.position;
    } else {
      // Conglomerate uses Vector2D, convert to Vector3D
      const pos2d = entity.centerOfMass as any;
      return new Vector3D(pos2d.x, pos2d.y, 0);
    }
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
