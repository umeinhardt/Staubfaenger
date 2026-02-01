/**
 * Collision Worker for parallel collision detection
 * Runs spatial hashing and collision detection in separate thread
 * Supports SharedArrayBuffer for zero-copy data transfer
 */

// Message types
interface CollisionWorkerMessage {
  type: 'detectCollisions' | 'detectCollisionsShared' | 'initSharedBuffers';
  entities?: SerializedEntity[];
  cellSize?: number;
  // SharedArrayBuffer mode
  start?: number;
  end?: number;
  numEntities?: number;
  positions?: SharedArrayBuffer;
  radii?: SharedArrayBuffer;
  collisions?: SharedArrayBuffer;
  maxEntities?: number;
  maxCollisions?: number;
}

interface SerializedEntity {
  id: string;
  position: { x: number; y: number; z: number };
  radius: number;
}

interface CollisionPair {
  id1: string;
  id2: string;
}

// Shared buffers (if available)
let sharedPositions: Float64Array | null = null;
let sharedRadii: Float64Array | null = null;
let sharedCollisions: Int32Array | null = null;
let maxEntities: number = 0;
let maxCollisions: number = 0;

/**
 * 3D Spatial hash for collision detection
 */
class SpatialHashWorker {
  private cellSize: number;
  private grid: Map<string, number[]>; // Map cell key to entity indices

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear(): void {
    this.grid.clear();
  }

  /**
   * Hash a 3D grid coordinate to a string key
   */
  private hash(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  /**
   * Insert an entity into the spatial hash
   */
  insert(index: number, position: { x: number; y: number; z: number }, radius: number): void {
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize);
    const maxZ = Math.floor((position.z + radius) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = this.hash(x, y, z);
          
          if (!this.grid.has(key)) {
            this.grid.set(key, []);
          }
          
          this.grid.get(key)!.push(index);
        }
      }
    }
  }

  /**
   * Get nearby entity indices
   */
  getNearby(position: { x: number; y: number; z: number }, radius: number): Set<number> {
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize);
    const maxZ = Math.floor((position.z + radius) / this.cellSize);

    const nearby = new Set<number>();

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = this.hash(x, y, z);
          const cellEntities = this.grid.get(key);
          
          if (cellEntities) {
            for (const idx of cellEntities) {
              nearby.add(idx);
            }
          }
        }
      }
    }

    return nearby;
  }
}

/**
 * Check if two entities are colliding
 */
function checkCollision(
  pos1: { x: number; y: number; z: number },
  radius1: number,
  pos2: { x: number; y: number; z: number },
  radius2: number
): boolean {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  
  const distSq = dx * dx + dy * dy + dz * dz;
  const minDist = radius1 + radius2;
  
  return distSq <= minDist * minDist;
}

/**
 * Detect collisions using postMessage (fallback)
 */
function detectCollisions(entities: SerializedEntity[], cellSize: number): CollisionPair[] {
  const spatialHash = new SpatialHashWorker(cellSize);
  const collisions: CollisionPair[] = [];
  const checked = new Set<string>();

  // Build spatial hash
  for (let i = 0; i < entities.length; i++) {
    spatialHash.insert(i, entities[i].position, entities[i].radius);
  }

  // Check each entity against nearby entities
  for (let i = 0; i < entities.length; i++) {
    const e1 = entities[i];
    const nearby = spatialHash.getNearby(e1.position, e1.radius);

    for (const j of nearby) {
      if (i === j) continue;

      const e2 = entities[j];

      // Create unique pair key
      const pairKey = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      // Check collision
      if (checkCollision(e1.position, e1.radius, e2.position, e2.radius)) {
        collisions.push({ id1: e1.id, id2: e2.id });
      }
    }
  }

  return collisions;
}

/**
 * Detect collisions using SharedArrayBuffer (zero-copy)
 * Only checks entities in range [start, end)
 */
function detectCollisionsShared(
  start: number,
  end: number,
  numEntities: number,
  cellSize: number
): number {
  if (!sharedPositions || !sharedRadii || !sharedCollisions) {
    return 0;
  }

  const spatialHash = new SpatialHashWorker(cellSize);
  const checked = new Set<string>();
  let collisionCount = 0;

  // Build spatial hash for ALL entities (needed for nearby queries)
  for (let i = 0; i < numEntities; i++) {
    const x = sharedPositions[i * 3 + 0];
    const y = sharedPositions[i * 3 + 1];
    const z = sharedPositions[i * 3 + 2];
    const radius = sharedRadii[i];
    
    spatialHash.insert(i, { x, y, z }, radius);
  }

  // Check entities in our range
  for (let i = start; i < end; i++) {
    const x1 = sharedPositions[i * 3 + 0];
    const y1 = sharedPositions[i * 3 + 1];
    const z1 = sharedPositions[i * 3 + 2];
    const radius1 = sharedRadii[i];

    const nearby = spatialHash.getNearby({ x: x1, y: y1, z: z1 }, radius1);

    for (const j of nearby) {
      if (i === j) continue;

      // Create unique pair key
      const pairKey = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      const x2 = sharedPositions[j * 3 + 0];
      const y2 = sharedPositions[j * 3 + 1];
      const z2 = sharedPositions[j * 3 + 2];
      const radius2 = sharedRadii[j];

      // Check collision
      if (checkCollision(
        { x: x1, y: y1, z: z1 }, radius1,
        { x: x2, y: y2, z: z2 }, radius2
      )) {
        // Write collision to shared buffer
        // Format: [id1, id2, id1, id2, ...]
        if (collisionCount * 2 + 1 < maxCollisions) {
          sharedCollisions[collisionCount * 2 + 0] = i;
          sharedCollisions[collisionCount * 2 + 1] = j;
          collisionCount++;
        }
      }
    }
  }

  return collisionCount;
}

/**
 * Message handler for worker
 */
self.onmessage = (e: MessageEvent<CollisionWorkerMessage>) => {
  const { type } = e.data;

  if (type === 'initSharedBuffers') {
    // Initialize shared buffers
    const { positions, radii, collisions, maxEntities: maxEnt, maxCollisions: maxCol } = e.data;
    if (positions && radii && collisions && maxEnt && maxCol) {
      sharedPositions = new Float64Array(positions);
      sharedRadii = new Float64Array(radii);
      sharedCollisions = new Int32Array(collisions);
      maxEntities = maxEnt;
      maxCollisions = maxCol;
    }
  } else if (type === 'detectCollisionsShared') {
    // Detect collisions using SharedArrayBuffer
    const { start, end, numEntities, cellSize } = e.data;
    if (start !== undefined && end !== undefined && numEntities !== undefined && cellSize !== undefined) {
      const count = detectCollisionsShared(start, end, numEntities, cellSize);
      
      // Notify completion
      self.postMessage({ type: 'collisionsComplete', count });
    }
  } else if (type === 'detectCollisions') {
    // Detect collisions using postMessage (fallback)
    const { entities, cellSize } = e.data;
    if (entities && cellSize !== undefined) {
      const collisions = detectCollisions(entities, cellSize);
      
      // Send results back to main thread
      self.postMessage({
        type: 'collisionsResult',
        collisions
      });
    }
  }
};

// Export empty object to make TypeScript happy
export {};
