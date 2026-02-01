/**
 * Barnes-Hut Physics Engine
 * Uses octree spatial partitioning for O(n log n) gravity computation
 * Extends LODPhysicsEngine with Barnes-Hut algorithm
 */

import { LODPhysicsEngine } from './LODPhysicsEngine';
import { Entity } from './PhysicsEngine';
import { Particle } from './Particle';
import { GravityFormula } from './GravityFormula';
import { Vector3D } from './Vector3D';
import { Octree, AABB } from './Octree';

/**
 * Physics engine with Barnes-Hut algorithm for fast gravity computation
 * Reduces complexity from O(n²) to O(n log n)
 */
export class BarnesHutPhysicsEngine extends LODPhysicsEngine {
  private useBarnesHut: boolean = true;
  private barnesHutThreshold: number = 100; // Use Barnes-Hut only if more than 100 entities
  private theta: number = 0.5; // Opening angle parameter (smaller = more accurate, slower)
  private boundaryPadding: number = 100; // Padding around entities for octree bounds

  /**
   * Create a Barnes-Hut physics engine
   */
  constructor(
    gravityFormula: GravityFormula,
    elasticity: number = 0,
    separateOnCollision: boolean = false,
    numWorkers?: number
  ) {
    super(gravityFormula, elasticity, separateOnCollision, numWorkers);
  }

  /**
   * Enable or disable Barnes-Hut algorithm
   */
  setUseBarnesHut(use: boolean): void {
    this.useBarnesHut = use;
    console.log('Barnes-Hut:', use ? 'enabled' : 'disabled');
  }

  /**
   * Check if Barnes-Hut is enabled
   */
  isUsingBarnesHut(): boolean {
    return this.useBarnesHut;
  }

  /**
   * Set the threshold for using Barnes-Hut
   */
  setBarnesHutThreshold(threshold: number): void {
    this.barnesHutThreshold = threshold;
  }

  /**
   * Get the Barnes-Hut threshold
   */
  getBarnesHutThreshold(): number {
    return this.barnesHutThreshold;
  }

  /**
   * Set the theta parameter (opening angle)
   * Smaller values = more accurate but slower
   * Typical values: 0.3 (accurate) to 1.0 (fast)
   */
  setTheta(theta: number): void {
    if (theta <= 0) {
      throw new Error('Theta must be positive');
    }
    this.theta = theta;
    console.log('Barnes-Hut theta:', theta);
  }

  /**
   * Get the theta parameter
   */
  getTheta(): number {
    return this.theta;
  }

  /**
   * Apply gravity with Barnes-Hut optimization
   */
  override applyGravity(entities: Entity[], deltaTime: number): void {
    // Use Barnes-Hut if enabled and above threshold
    if (this.useBarnesHut && entities.length >= this.barnesHutThreshold) {
      this.applyGravityBarnesHut(entities, deltaTime);
    } else {
      // Fall back to LOD or standard computation
      super.applyGravity(entities, deltaTime);
    }
  }

  /**
   * Apply gravity using Barnes-Hut algorithm
   */
  private applyGravityBarnesHut(entities: Entity[], deltaTime: number): void {
    // Calculate bounding box for all entities
    const bounds = this.calculateBounds(entities);
    
    // Create octree
    const octree = new Octree(bounds, 20, this.theta);
    
    // Insert all entities into octree
    for (const entity of entities) {
      octree.insert(entity);
    }
    
    // Get gravitational constant from formula
    const G = (this.gravityFormula as any).G || 1.0;
    const epsilon = (this.gravityFormula as any).epsilon || 0.01;
    
    // Calculate forces for each entity using Barnes-Hut
    for (const entity of entities) {
      const force = octree.calculateForce(entity, G, epsilon);
      this.applyForce(entity, force, deltaTime);
    }
  }

  /**
   * Calculate axis-aligned bounding box for all entities
   */
  private calculateBounds(entities: Entity[]): AABB {
    if (entities.length === 0) {
      // Default bounds if no entities
      return {
        min: new Vector3D(-1000, -1000, -1000),
        max: new Vector3D(1000, 1000, 1000)
      };
    }

    // Initialize with first entity position
    const firstPos = this.getEntityPos(entities[0]);
    let minX = firstPos.x;
    let maxX = firstPos.x;
    let minY = firstPos.y;
    let maxY = firstPos.y;
    let minZ = firstPos.z;
    let maxZ = firstPos.z;

    // Find min/max for all entities
    for (const entity of entities) {
      const pos = this.getEntityPos(entity);
      const radius = entity.radius;

      minX = Math.min(minX, pos.x - radius);
      maxX = Math.max(maxX, pos.x + radius);
      minY = Math.min(minY, pos.y - radius);
      maxY = Math.max(maxY, pos.y + radius);
      minZ = Math.min(minZ, pos.z - radius);
      maxZ = Math.max(maxZ, pos.z + radius);
    }

    // Add padding to avoid entities exactly on boundary
    const padding = this.boundaryPadding;
    
    return {
      min: new Vector3D(minX - padding, minY - padding, minZ - padding),
      max: new Vector3D(maxX + padding, maxY + padding, maxZ + padding)
    };
  }

  /**
   * Get entity position (works for both Particle and Conglomerate)
   */
  private getEntityPos(entity: Entity): Vector3D {
    if (entity instanceof Particle) {
      return entity.position;
    } else {
      return (entity as any).centerOfMass;
    }
  }

  /**
   * Get Barnes-Hut statistics for debugging
   */
  getBarnesHutStats(entities: Entity[]): {
    enabled: boolean;
    entityCount: number;
    threshold: number;
    theta: number;
    usingBarnesHut: boolean;
  } {
    return {
      enabled: this.useBarnesHut,
      entityCount: entities.length,
      threshold: this.barnesHutThreshold,
      theta: this.theta,
      usingBarnesHut: this.useBarnesHut && entities.length >= this.barnesHutThreshold
    };
  }
}
