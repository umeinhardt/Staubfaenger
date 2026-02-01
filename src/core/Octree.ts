/**
 * Octree data structure for Barnes-Hut algorithm
 * Divides 3D space into 8 octants recursively
 */

import { Vector3D } from './Vector3D';
import { Entity } from './PhysicsEngine';
import { Particle } from './Particle';

/**
 * Axis-aligned bounding box in 3D space
 */
export interface AABB {
  min: Vector3D;
  max: Vector3D;
}

/**
 * Node in the octree
 * Can be either a leaf (containing one entity) or internal (containing 8 children)
 */
export class OctreeNode {
  // Bounding box of this node
  public bounds: AABB;
  
  // Center of mass and total mass (for Barnes-Hut approximation)
  public centerOfMass: Vector3D;
  public totalMass: number;
  
  // Entity stored in this node (only for leaf nodes)
  public entity: Entity | null;
  
  // Children nodes (8 octants)
  public children: (OctreeNode | null)[];
  
  // Whether this is a leaf node
  public isLeaf: boolean;

  constructor(bounds: AABB) {
    this.bounds = bounds;
    this.centerOfMass = Vector3D.zero();
    this.totalMass = 0;
    this.entity = null;
    this.children = new Array(8).fill(null);
    this.isLeaf = true;
  }

  /**
   * Get the center of the bounding box
   */
  getCenter(): Vector3D {
    return new Vector3D(
      (this.bounds.min.x + this.bounds.max.x) / 2,
      (this.bounds.min.y + this.bounds.max.y) / 2,
      (this.bounds.min.z + this.bounds.max.z) / 2
    );
  }

  /**
   * Get the size (width) of the bounding box
   */
  getSize(): number {
    return this.bounds.max.x - this.bounds.min.x;
  }

  /**
   * Check if a point is inside this node's bounds
   */
  contains(point: Vector3D): boolean {
    return (
      point.x >= this.bounds.min.x && point.x <= this.bounds.max.x &&
      point.y >= this.bounds.min.y && point.y <= this.bounds.max.y &&
      point.z >= this.bounds.min.z && point.z <= this.bounds.max.z
    );
  }

  /**
   * Get the octant index for a point (0-7)
   * Octants are numbered:
   * 0: (-x, -y, -z)  1: (+x, -y, -z)
   * 2: (-x, +y, -z)  3: (+x, +y, -z)
   * 4: (-x, -y, +z)  5: (+x, -y, +z)
   * 6: (-x, +y, +z)  7: (+x, +y, +z)
   */
  getOctant(point: Vector3D): number {
    const center = this.getCenter();
    let octant = 0;
    
    if (point.x >= center.x) octant |= 1;
    if (point.y >= center.y) octant |= 2;
    if (point.z >= center.z) octant |= 4;
    
    return octant;
  }

  /**
   * Get the bounding box for a specific octant
   */
  getOctantBounds(octant: number): AABB {
    const center = this.getCenter();
    const min = this.bounds.min;
    const max = this.bounds.max;
    
    return {
      min: new Vector3D(
        (octant & 1) ? center.x : min.x,
        (octant & 2) ? center.y : min.y,
        (octant & 4) ? center.z : min.z
      ),
      max: new Vector3D(
        (octant & 1) ? max.x : center.x,
        (octant & 2) ? max.y : center.y,
        (octant & 4) ? max.z : center.z
      )
    };
  }
}

/**
 * Octree for spatial partitioning in 3D
 * Used by Barnes-Hut algorithm for O(n log n) gravity computation
 */
export class Octree {
  private root: OctreeNode;
  private maxDepth: number;
  private theta: number; // Barnes-Hut opening angle parameter

  /**
   * Create a new octree
   * @param bounds - Bounding box of the entire space
   * @param maxDepth - Maximum tree depth (default: 20)
   * @param theta - Opening angle parameter for Barnes-Hut (default: 0.5)
   */
  constructor(bounds: AABB, maxDepth: number = 20, theta: number = 0.5) {
    this.root = new OctreeNode(bounds);
    this.maxDepth = maxDepth;
    this.theta = theta;
  }

  /**
   * Insert an entity into the octree
   */
  insert(entity: Entity): void {
    const position = this.getEntityPosition(entity);
    const mass = this.getEntityMass(entity);
    
    this.insertRecursive(this.root, entity, position, mass, 0);
  }

  /**
   * Recursive insertion into octree
   */
  private insertRecursive(
    node: OctreeNode,
    entity: Entity,
    position: Vector3D,
    mass: number,
    depth: number
  ): void {
    // Update center of mass and total mass
    if (node.totalMass === 0) {
      node.centerOfMass = position;
      node.totalMass = mass;
    } else {
      // Weighted average: COM = (m1*p1 + m2*p2) / (m1 + m2)
      const totalMass = node.totalMass + mass;
      node.centerOfMass = new Vector3D(
        (node.centerOfMass.x * node.totalMass + position.x * mass) / totalMass,
        (node.centerOfMass.y * node.totalMass + position.y * mass) / totalMass,
        (node.centerOfMass.z * node.totalMass + position.z * mass) / totalMass
      );
      node.totalMass = totalMass;
    }

    // If this is a leaf node
    if (node.isLeaf) {
      // If empty, store entity here
      if (node.entity === null) {
        node.entity = entity;
        return;
      }

      // If we've reached max depth, don't subdivide further
      if (depth >= this.maxDepth) {
        return;
      }

      // Node already has an entity - need to subdivide
      const existingEntity = node.entity;
      const existingPosition = this.getEntityPosition(existingEntity);
      const existingMass = this.getEntityMass(existingEntity);
      
      node.entity = null;
      node.isLeaf = false;

      // Re-insert existing entity
      const existingOctant = node.getOctant(existingPosition);
      if (node.children[existingOctant] === null) {
        node.children[existingOctant] = new OctreeNode(node.getOctantBounds(existingOctant));
      }
      this.insertRecursive(node.children[existingOctant]!, existingEntity, existingPosition, existingMass, depth + 1);

      // Insert new entity
      const newOctant = node.getOctant(position);
      if (node.children[newOctant] === null) {
        node.children[newOctant] = new OctreeNode(node.getOctantBounds(newOctant));
      }
      this.insertRecursive(node.children[newOctant]!, entity, position, mass, depth + 1);
    } else {
      // Internal node - insert into appropriate child
      const octant = node.getOctant(position);
      if (node.children[octant] === null) {
        node.children[octant] = new OctreeNode(node.getOctantBounds(octant));
      }
      this.insertRecursive(node.children[octant]!, entity, position, mass, depth + 1);
    }
  }

  /**
   * Calculate gravitational force on an entity using Barnes-Hut approximation
   * @param entity - Entity to calculate force for
   * @param G - Gravitational constant
   * @param epsilon - Softening parameter
   * @returns Force vector
   */
  calculateForce(entity: Entity, G: number, epsilon: number): Vector3D {
    const position = this.getEntityPosition(entity);
    const mass = this.getEntityMass(entity);
    
    return this.calculateForceRecursive(this.root, position, mass, G, epsilon, entity.id);
  }

  /**
   * Recursive force calculation using Barnes-Hut criterion
   */
  private calculateForceRecursive(
    node: OctreeNode,
    position: Vector3D,
    mass: number,
    G: number,
    epsilon: number,
    entityId: string
  ): Vector3D {
    // Empty node
    if (node.totalMass === 0) {
      return Vector3D.zero();
    }

    // Calculate distance to node's center of mass
    const dx = node.centerOfMass.x - position.x;
    const dy = node.centerOfMass.y - position.y;
    const dz = node.centerOfMass.z - position.z;
    const distSq = dx * dx + dy * dy + dz * dz + epsilon * epsilon;
    
    // Skip if too close (avoid self-interaction)
    if (distSq < 1e-10) {
      return Vector3D.zero();
    }

    const distance = Math.sqrt(distSq);

    // Barnes-Hut criterion: s/d < theta
    // s = size of node, d = distance to node
    // If true, treat node as single body
    const size = node.getSize();
    const ratio = size / distance;

    if (node.isLeaf || ratio < this.theta) {
      // Treat as single body
      // Skip if this is the same entity
      if (node.entity && node.entity.id === entityId) {
        return Vector3D.zero();
      }

      // Calculate force: F = G * m1 * m2 / r^2
      const forceMagnitude = G * mass * node.totalMass / distSq;
      
      // Direction: normalized (dx, dy, dz)
      const invDist = 1.0 / distance;
      return new Vector3D(
        dx * invDist * forceMagnitude,
        dy * invDist * forceMagnitude,
        dz * invDist * forceMagnitude
      );
    } else {
      // Node is too close - recurse into children
      let totalForce = Vector3D.zero();
      
      for (const child of node.children) {
        if (child !== null) {
          const childForce = this.calculateForceRecursive(child, position, mass, G, epsilon, entityId);
          totalForce = totalForce.add(childForce);
        }
      }
      
      return totalForce;
    }
  }

  /**
   * Get entity position
   */
  private getEntityPosition(entity: Entity): Vector3D {
    if (entity instanceof Particle) {
      return entity.position;
    } else {
      return (entity as any).centerOfMass;
    }
  }

  /**
   * Get entity mass
   */
  private getEntityMass(entity: Entity): number {
    if (entity instanceof Particle) {
      return entity.mass;
    } else {
      return (entity as any).totalMass;
    }
  }

  /**
   * Get the root node (for debugging)
   */
  getRoot(): OctreeNode {
    return this.root;
  }

  /**
   * Set the theta parameter (opening angle)
   */
  setTheta(theta: number): void {
    this.theta = theta;
  }

  /**
   * Get the theta parameter
   */
  getTheta(): number {
    return this.theta;
  }
}
