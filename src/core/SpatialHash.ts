import { Vector3D } from './Vector3D';
import { Particle } from './Particle';
import { Conglomerate } from './Conglomerate';

/**
 * Type representing entities that can be stored in the spatial hash
 */
export type Entity = Particle | Conglomerate;

/**
 * 3D Spatial hash grid for efficient collision detection
 * Divides 3D space into cubic cells and stores entities in their corresponding cells
 */
export class SpatialHash {
  public readonly cellSize: number;
  private grid: Map<string, Entity[]>;

  /**
   * Create a new 3D spatial hash grid
   * @param cellSize - Size of each cubic grid cell (should be ~2x max particle radius)
   */
  constructor(cellSize: number) {
    if (cellSize <= 0) {
      throw new Error('Cell size must be positive');
    }
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Clear all entities from the grid
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Insert an entity into the 3D spatial hash
   * @param entity - Particle or Conglomerate to insert
   */
  insert(entity: Entity): void {
    const position = this.getPosition(entity);
    const radius = this.getRadius(entity);

    // Calculate which 3D cells this entity overlaps
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize);
    const maxZ = Math.floor((position.z + radius) / this.cellSize);

    // Insert entity into all overlapping 3D cells
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = this.hash(x, y, z);
          
          if (!this.grid.has(key)) {
            this.grid.set(key, []);
          }
          
          this.grid.get(key)!.push(entity);
        }
      }
    }
  }

  /**
   * Get all entities near the given entity
   * Returns entities in the same and adjacent cells (27-cell neighborhood in 3D)
   * @param entity - Entity to find neighbors for
   * @returns Array of nearby entities (no duplicates)
   */
  getNearby(entity: Entity): Entity[] {
    const position = this.getPosition(entity);
    const radius = this.getRadius(entity);

    // Calculate which 3D cells to check
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize);
    const maxZ = Math.floor((position.z + radius) / this.cellSize);

    const nearby: Entity[] = [];
    const seen = new Set<string>();

    // Collect entities from all relevant 3D cells (27-cell neighborhood)
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = this.hash(x, y, z);
          const cellEntities = this.grid.get(key);
          
          if (cellEntities) {
            for (const e of cellEntities) {
              const entityId = this.getEntityId(e);
              if (!seen.has(entityId)) {
                seen.add(entityId);
                nearby.push(e);
              }
            }
          }
        }
      }
    }

    return nearby;
  }

  /**
   * Hash a 3D grid coordinate to a string key
   * @param x - Grid x coordinate
   * @param y - Grid y coordinate
   * @param z - Grid z coordinate
   * @returns String key for the 3D grid cell
   */
  private hash(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
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
   * Get the unique ID of an entity
   * @param entity - Particle or Conglomerate
   * @returns Entity ID
   */
  private getEntityId(entity: Entity): string {
    return entity.id;
  }
}
