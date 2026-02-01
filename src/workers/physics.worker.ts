/**
 * Physics Worker for parallel gravity computation
 * Runs in separate thread to avoid blocking main thread
 * Supports SharedArrayBuffer for zero-copy data transfer
 */

// Message types
interface PhysicsWorkerMessage {
  type: 'computeGravity' | 'computeGravityShared' | 'initSharedBuffers';
  entities?: SerializedEntity[];
  G?: number;
  epsilon?: number;
  deltaTime?: number;
  // SharedArrayBuffer mode
  start?: number;
  end?: number;
  numEntities?: number;
  positions?: SharedArrayBuffer;
  masses?: SharedArrayBuffer;
  forces?: SharedArrayBuffer;
  maxEntities?: number;
}

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

// Shared buffers (if available)
let sharedPositions: Float64Array | null = null;
let sharedMasses: Float64Array | null = null;
let sharedForces: Float64Array | null = null;

/**
 * Compute gravitational forces between all entities
 * This runs in parallel on a separate CPU thread
 */
function computeGravityForces(
  entities: SerializedEntity[],
  G: number,
  epsilon: number
): GravityResult[] {
  const results: GravityResult[] = [];
  const n = entities.length;

  // For each entity, calculate total force from all others
  for (let i = 0; i < n; i++) {
    const e1 = entities[i];
    let fx = 0, fy = 0, fz = 0;

    // Calculate force from all other entities
    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const e2 = entities[j];

      // Calculate delta position
      const dx = e2.position.x - e1.position.x;
      const dy = e2.position.y - e1.position.y;
      const dz = e2.position.z - e1.position.z;

      // Calculate distance squared
      const distSq = dx * dx + dy * dy + dz * dz + epsilon * epsilon;

      // Skip if too close
      if (distSq < 1e-10) continue;

      const dist = Math.sqrt(distSq);

      // Calculate force magnitude: F = G * m1 * m2 / r^2
      const forceMag = G * e1.mass * e2.mass / distSq;

      // Add force components (normalized direction * magnitude)
      const invDist = 1.0 / dist;
      fx += dx * invDist * forceMag;
      fy += dy * invDist * forceMag;
      fz += dz * invDist * forceMag;
    }

    results.push({
      id: e1.id,
      force: { x: fx, y: fy, z: fz }
    });
  }

  return results;
}

/**
 * Compute gravity using SharedArrayBuffer (zero-copy)
 * Only computes for entities in range [start, end)
 */
function computeGravityShared(
  start: number,
  end: number,
  numEntities: number,
  G: number,
  epsilon: number
): void {
  if (!sharedPositions || !sharedMasses || !sharedForces) {
    return;
  }

  // For each entity in our range
  for (let i = start; i < end; i++) {
    const x1 = sharedPositions[i * 3 + 0];
    const y1 = sharedPositions[i * 3 + 1];
    const z1 = sharedPositions[i * 3 + 2];
    const m1 = sharedMasses[i];

    let fx = 0, fy = 0, fz = 0;

    // Calculate force from all other entities
    for (let j = 0; j < numEntities; j++) {
      if (i === j) continue;

      const x2 = sharedPositions[j * 3 + 0];
      const y2 = sharedPositions[j * 3 + 1];
      const z2 = sharedPositions[j * 3 + 2];
      const m2 = sharedMasses[j];

      // Calculate delta position
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;

      // Calculate distance squared
      const distSq = dx * dx + dy * dy + dz * dz + epsilon * epsilon;

      // Skip if too close
      if (distSq < 1e-10) continue;

      const dist = Math.sqrt(distSq);

      // Calculate force magnitude: F = G * m1 * m2 / r^2
      const forceMag = G * m1 * m2 / distSq;

      // Add force components (normalized direction * magnitude)
      const invDist = 1.0 / dist;
      fx += dx * invDist * forceMag;
      fy += dy * invDist * forceMag;
      fz += dz * invDist * forceMag;
    }

    // Write forces to shared buffer
    sharedForces[i * 3 + 0] += fx;
    sharedForces[i * 3 + 1] += fy;
    sharedForces[i * 3 + 2] += fz;
  }
}

/**
 * Message handler for worker
 */
self.onmessage = (e: MessageEvent<PhysicsWorkerMessage>) => {
  const { type } = e.data;

  if (type === 'initSharedBuffers') {
    // Initialize shared buffers
    const { positions, masses, forces } = e.data;
    if (positions && masses && forces) {
      sharedPositions = new Float64Array(positions);
      sharedMasses = new Float64Array(masses);
      sharedForces = new Float64Array(forces);
    }
  } else if (type === 'computeGravityShared') {
    // Compute using SharedArrayBuffer
    const { start, end, numEntities, G, epsilon } = e.data;
    if (start !== undefined && end !== undefined && numEntities !== undefined && G !== undefined && epsilon !== undefined) {
      computeGravityShared(start, end, numEntities, G, epsilon);
      
      // Notify completion
      self.postMessage({ type: 'gravityComplete' });
    }
  } else if (type === 'computeGravity') {
    // Compute using postMessage (fallback)
    const { entities, G, epsilon, deltaTime } = e.data;
    if (entities && G !== undefined && epsilon !== undefined) {
      const results = computeGravityForces(entities, G, epsilon);
      
      // Send results back to main thread
      self.postMessage({
        type: 'gravityResults',
        results,
        deltaTime
      });
    }
  }
};

// Export empty object to make TypeScript happy
export {};
