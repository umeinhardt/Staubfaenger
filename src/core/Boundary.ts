import { Vector3D } from './Vector3D';

/**
 * Boundary class for 3D cubic space with wrap-around behavior
 * Defines a cubic volume where particles wrap around when they exit any face
 */
export class Boundary {
  /**
   * Create a new boundary
   * @param min - Minimum corner of the cubic boundary
   * @param max - Maximum corner of the cubic boundary
   * @throws Error if min >= max in any dimension
   */
  constructor(
    public readonly min: Vector3D,
    public readonly max: Vector3D
  ) {
    if (min.x >= max.x || min.y >= max.y || min.z >= max.z) {
      throw new Error('Invalid boundary: min must be less than max in all dimensions');
    }
  }

  /**
   * Wrap a position around the boundary if it's outside
   * Implements periodic boundary conditions for all 6 faces
   * @param position - Position to wrap
   * @returns Wrapped position inside the boundary
   */
  wrapPosition(position: Vector3D): Vector3D {
    let { x, y, z } = position;

    const width = this.max.x - this.min.x;
    const height = this.max.y - this.min.y;
    const depth = this.max.z - this.min.z;

    // Wrap x dimension
    if (x < this.min.x) {
      x = this.max.x - (this.min.x - x) % width;
    } else if (x > this.max.x) {
      x = this.min.x + (x - this.max.x) % width;
    }

    // Wrap y dimension
    if (y < this.min.y) {
      y = this.max.y - (this.min.y - y) % height;
    } else if (y > this.max.y) {
      y = this.min.y + (y - this.max.y) % height;
    }

    // Wrap z dimension
    if (z < this.min.z) {
      z = this.max.z - (this.min.z - z) % depth;
    } else if (z > this.max.z) {
      z = this.min.z + (z - this.max.z) % depth;
    }

    return new Vector3D(x, y, z);
  }

  /**
   * Check if a position is outside the boundary
   * @param position - Position to check
   * @returns True if position is outside the boundary
   */
  isOutside(position: Vector3D): boolean {
    return (
      position.x < this.min.x ||
      position.x > this.max.x ||
      position.y < this.min.y ||
      position.y > this.max.y ||
      position.z < this.min.z ||
      position.z > this.max.z
    );
  }

  /**
   * Get a random spawn position on one of the 6 boundary faces
   * @returns Position on a randomly selected boundary face
   */
  getRandomSpawnPosition(): Vector3D {
    const face = Math.floor(Math.random() * 6);
    const width = this.max.x - this.min.x;
    const height = this.max.y - this.min.y;
    const depth = this.max.z - this.min.z;

    switch (face) {
      case 0: // -X face (min x)
        return new Vector3D(
          this.min.x,
          this.min.y + Math.random() * height,
          this.min.z + Math.random() * depth
        );
      case 1: // +X face (max x)
        return new Vector3D(
          this.max.x,
          this.min.y + Math.random() * height,
          this.min.z + Math.random() * depth
        );
      case 2: // -Y face (min y)
        return new Vector3D(
          this.min.x + Math.random() * width,
          this.min.y,
          this.min.z + Math.random() * depth
        );
      case 3: // +Y face (max y)
        return new Vector3D(
          this.min.x + Math.random() * width,
          this.max.y,
          this.min.z + Math.random() * depth
        );
      case 4: // -Z face (min z)
        return new Vector3D(
          this.min.x + Math.random() * width,
          this.min.y + Math.random() * height,
          this.min.z
        );
      case 5: // +Z face (max z)
        return new Vector3D(
          this.min.x + Math.random() * width,
          this.min.y + Math.random() * height,
          this.max.z
        );
      default:
        // Should never reach here
        return new Vector3D(this.min.x, this.min.y, this.min.z);
    }
  }

  /**
   * Get an inward-pointing velocity for a particle spawned at the given position
   * The velocity points in a random direction into the boundary (hemisphere)
   * @param position - Spawn position on a boundary face
   * @param speed - Magnitude of the velocity
   * @returns Velocity vector pointing inward from the spawn position
   */
  getSpawnVelocity(position: Vector3D, speed: number): Vector3D {
    // Determine which face the particle is spawned on
    const epsilon = 0.01;
    let inwardNormal: Vector3D;
    
    if (Math.abs(position.x - this.min.x) < epsilon) {
      // -X face: inward normal points in +X direction
      inwardNormal = new Vector3D(1, 0, 0);
    } else if (Math.abs(position.x - this.max.x) < epsilon) {
      // +X face: inward normal points in -X direction
      inwardNormal = new Vector3D(-1, 0, 0);
    } else if (Math.abs(position.y - this.min.y) < epsilon) {
      // -Y face: inward normal points in +Y direction
      inwardNormal = new Vector3D(0, 1, 0);
    } else if (Math.abs(position.y - this.max.y) < epsilon) {
      // +Y face: inward normal points in -Y direction
      inwardNormal = new Vector3D(0, -1, 0);
    } else if (Math.abs(position.z - this.min.z) < epsilon) {
      // -Z face: inward normal points in +Z direction
      inwardNormal = new Vector3D(0, 0, 1);
    } else {
      // +Z face: inward normal points in -Z direction
      inwardNormal = new Vector3D(0, 0, -1);
    }
    
    // Generate random direction within hemisphere pointing inward
    // Use spherical coordinates: theta (azimuthal) and phi (polar)
    const theta = Math.random() * 2 * Math.PI; // 0 to 2π (full circle)
    const phi = Math.random() * Math.PI / 2; // 0 to π/2 (hemisphere)
    
    // Convert spherical to Cartesian (in local coordinate system)
    const localX = Math.sin(phi) * Math.cos(theta);
    const localY = Math.sin(phi) * Math.sin(theta);
    const localZ = Math.cos(phi);
    
    // Create two perpendicular vectors to the inward normal
    let tangent1: Vector3D;
    let tangent2: Vector3D;
    
    if (Math.abs(inwardNormal.x) > 0.5) {
      // Normal is mostly along X axis
      tangent1 = new Vector3D(0, 1, 0).cross(inwardNormal).normalize();
    } else {
      // Normal is mostly along Y or Z axis
      tangent1 = new Vector3D(1, 0, 0).cross(inwardNormal).normalize();
    }
    tangent2 = inwardNormal.cross(tangent1).normalize();
    
    // Transform from local coordinates to world coordinates
    // direction = localZ * normal + localX * tangent1 + localY * tangent2
    const direction = inwardNormal.multiply(localZ)
      .add(tangent1.multiply(localX))
      .add(tangent2.multiply(localY))
      .normalize();
    
    // Scale to desired speed
    return direction.multiply(speed);
  }

  /**
   * Bounce a position and velocity off the boundary walls
   * Applies elasticity to reduce energy at each bounce
   * @param position - Current position (may be outside boundary)
   * @param velocity - Current velocity
   * @param elasticity - Coefficient of restitution (0 = no bounce, 1 = perfect bounce)
   * @returns Object with bounced position and velocity
   */
  bounceOffBoundary(position: Vector3D, velocity: Vector3D, elasticity: number): { position: Vector3D; velocity: Vector3D } {
    let { x, y, z } = position;
    let { x: vx, y: vy, z: vz } = velocity;

    // Track which walls were hit to avoid double-applying friction
    let hitWall = false;

    // Bounce off X boundaries
    if (x < this.min.x) {
      x = this.min.x;
      vx = Math.abs(vx) * elasticity; // Reverse and apply elasticity
      hitWall = true;
    } else if (x > this.max.x) {
      x = this.max.x;
      vx = -Math.abs(vx) * elasticity; // Reverse and apply elasticity
      hitWall = true;
    }

    // Bounce off Y boundaries
    if (y < this.min.y) {
      y = this.min.y;
      vy = Math.abs(vy) * elasticity; // Reverse and apply elasticity
      hitWall = true;
    } else if (y > this.max.y) {
      y = this.max.y;
      vy = -Math.abs(vy) * elasticity; // Reverse and apply elasticity
      hitWall = true;
    }

    // Bounce off Z boundaries
    if (z < this.min.z) {
      z = this.min.z;
      vz = Math.abs(vz) * elasticity; // Reverse and apply elasticity
      hitWall = true;
    } else if (z > this.max.z) {
      z = this.max.z;
      vz = -Math.abs(vz) * elasticity; // Reverse and apply elasticity
      hitWall = true;
    }

    // Apply friction to all components once if any wall was hit
    // This simulates energy loss without double-applying
    if (hitWall) {
      const friction = 0.95; // Slight friction at walls
      vx *= friction;
      vy *= friction;
      vz *= friction;
    }

    return {
      position: new Vector3D(x, y, z),
      velocity: new Vector3D(vx, vy, vz)
    };
  }
}
