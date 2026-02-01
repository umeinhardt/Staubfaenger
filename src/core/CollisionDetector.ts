import { SpatialHash, Entity } from './SpatialHash';
import { Particle } from './Particle';
import { Conglomerate } from './Conglomerate';
import { Vector3D } from './Vector3D';
import { CollisionWorkerPool } from './CollisionWorkerPool';

/**
 * Represents a pair of entities that are colliding
 */
export interface CollisionPair {
  entity1: Entity;
  entity2: Entity;
}

/**
 * Detects collisions between particles and conglomerates using 3D spatial hashing
 * Supports parallel collision detection using Web Workers
 */
export class CollisionDetector {
  private spatialHash: SpatialHash;
  private workerPool: CollisionWorkerPool | null = null;
  private useWorkers: boolean = false;
  private cellSize: number;

  /**
   * Create a new collision detector
   * @param cellSize - Size of spatial hash cells (should be ~2x max particle radius)
   */
  constructor(cellSize: number) {
    this.spatialHash = new SpatialHash(cellSize);
    this.cellSize = cellSize;
  }

  /**
   * Initialize worker pool for parallel collision detection
   */
  async initializeWorkers(numWorkers?: number): Promise<void> {
    try {
      this.workerPool = new CollisionWorkerPool(numWorkers);
      await this.workerPool.initialize();
      console.log('Collision detection workers initialized');
    } catch (error) {
      console.warn('Failed to initialize collision workers:', error);
      this.workerPool = null;
    }
  }

  /**
   * Enable or disable parallel collision detection
   */
  setUseWorkers(use: boolean): void {
    this.useWorkers = use && this.workerPool !== null && this.workerPool.isEnabled();
    console.log('Parallel collision detection:', this.useWorkers ? 'enabled' : 'disabled');
  }

  /**
   * Check if using parallel collision detection
   */
  isUsingWorkers(): boolean {
    return this.useWorkers && this.workerPool !== null && this.workerPool.isEnabled();
  }

  /**
   * Detect all collisions among the given entities
   * Uses parallel workers if enabled and entity count is above threshold
   * @param entities - Array of particles and conglomerates to check
   * @returns Array of collision pairs
   */
  async detectCollisions(entities: Entity[]): Promise<CollisionPair[]> {
    // Try parallel detection if enabled
    if (this.useWorkers && this.workerPool) {
      try {
        const workerCollisions = await this.workerPool.detectCollisionsParallel(entities, this.cellSize);
        
        // Convert worker results to CollisionPair objects
        if (workerCollisions.length > 0) {
          const entityMap = new Map<string, Entity>();
          for (const entity of entities) {
            entityMap.set(entity.id, entity);
          }

          const collisions: CollisionPair[] = [];
          for (const collision of workerCollisions) {
            const entity1 = entityMap.get(collision.id1);
            const entity2 = entityMap.get(collision.id2);
            
            if (entity1 && entity2) {
              collisions.push({ entity1, entity2 });
            }
          }

          return collisions;
        }
      } catch (error) {
        console.warn('Worker collision detection failed, falling back to single-threaded:', error);
      }
    }

    // Fallback to single-threaded detection
    return this.detectCollisionsSingleThreaded(entities);
  }

  /**
   * Single-threaded collision detection (fallback)
   * @param entities - Array of particles and conglomerates to check
   * @returns Array of collision pairs
   */
  private detectCollisionsSingleThreaded(entities: Entity[]): CollisionPair[] {
    // Clear and rebuild spatial hash
    this.spatialHash.clear();
    for (const entity of entities) {
      this.spatialHash.insert(entity);
    }

    const collisions: CollisionPair[] = [];
    const checked = new Set<string>();

    // Check each entity against its neighbors
    for (const entity of entities) {
      const nearby = this.spatialHash.getNearby(entity);
      
      for (const other of nearby) {
        // Skip self-collision
        if (entity.id === other.id) {
          continue;
        }

        // Create unique pair key to avoid duplicate checks
        const pairKey = this.createPairKey(entity.id, other.id);
        if (checked.has(pairKey)) {
          continue;
        }
        checked.add(pairKey);

        // Check if entities are actually colliding
        if (this.checkCollision(entity, other)) {
          collisions.push({ entity1: entity, entity2: other });
        }
      }
    }

    return collisions;
  }

  /**
   * Check if two entities are colliding in 3D space
   * @param e1 - First entity
   * @param e2 - Second entity
   * @returns True if entities are colliding (touching or overlapping)
   */
  checkCollision(e1: Entity, e2: Entity): boolean {
    const pos1 = this.getPosition(e1);
    const pos2 = this.getPosition(e2);
    const radius1 = this.getRadius(e1);
    const radius2 = this.getRadius(e2);

    const distance = pos1.distanceTo(pos2);
    const minDistance = radius1 + radius2;

    // Collision occurs when distance <= sum of radii
    return distance <= minDistance;
  }

  /**
   * Get the position of an entity
   * @param entity - Particle or Conglomerate
   * @returns Position vector (3D)
   */
  private getPosition(entity: Entity): Vector3D {
    if (entity instanceof Particle) {
      return entity.position;
    } else {
      // Conglomerate is still using Vector2D (will be updated in task 6)
      // Temporarily convert to Vector3D with z=0
      const pos2d = entity.centerOfMass as any;
      return new Vector3D(pos2d.x, pos2d.y, 0);
    }
  }

  /**
   * Get the radius of an entity
   * @param entity - Particle or Conglomerate
   * @returns Radius value
   */
  private getRadius(entity: Entity): number {
    return entity.radius;
  }

  /**
   * Create a unique key for a pair of entities
   * Ensures consistent ordering to avoid duplicates
   * @param id1 - First entity ID
   * @param id2 - Second entity ID
   * @returns Unique pair key
   */
  private createPairKey(id1: string, id2: string): string {
    // Sort IDs to ensure consistent ordering
    return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  }

  /**
   * Terminate worker pool
   */
  terminate(): void {
    if (this.workerPool) {
      this.workerPool.terminate();
      this.workerPool = null;
      this.useWorkers = false;
    }
  }
}
