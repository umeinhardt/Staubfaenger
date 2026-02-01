/**
 * LOD (Level of Detail) Physics Engine
 * Reduces computation for distant objects
 * Extends ParallelPhysicsEngine with distance-based optimization
 */

import { ParallelPhysicsEngine } from './ParallelPhysicsEngine';
import { Entity } from './PhysicsEngine';
import { Particle } from './Particle';
import { GravityFormula } from './GravityFormula';
import { Vector3D } from './Vector3D';
import { Camera } from './Camera';

/**
 * LOD levels for physics computation
 */
enum LODLevel {
  HIGH = 0,    // Full computation (close to camera)
  MEDIUM = 1,  // Reduced computation (medium distance)
  LOW = 2,     // Minimal computation (far from camera)
  SKIP = 3     // Skip computation (very far)
}

/**
 * LOD configuration
 */
interface LODConfig {
  highDistance: number;    // Distance for HIGH LOD
  mediumDistance: number;  // Distance for MEDIUM LOD
  lowDistance: number;     // Distance for LOW LOD
  skipDistance: number;    // Distance to skip computation
}

/**
 * Physics engine with Level of Detail optimization
 */
export class LODPhysicsEngine extends ParallelPhysicsEngine {
  private camera: Camera | null = null;
  private useLOD: boolean = true;
  
  // LOD configuration (distances from camera)
  private lodConfig: LODConfig = {
    highDistance: 500,    // Full computation within 500 units
    mediumDistance: 1000, // Reduced computation 500-1000 units
    lowDistance: 1500,    // Minimal computation 1000-1500 units
    skipDistance: 2000    // Skip computation beyond 2000 units
  };

  /**
   * Create an LOD physics engine
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
   * Set the camera for LOD calculations
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  /**
   * Enable or disable LOD
   */
  setUseLOD(use: boolean): void {
    this.useLOD = use;
    console.log('LOD:', use ? 'enabled' : 'disabled');
  }

  /**
   * Check if LOD is enabled
   */
  isUsingLOD(): boolean {
    return this.useLOD && this.camera !== null;
  }

  /**
   * Set LOD distances
   */
  setLODDistances(high: number, medium: number, low: number, skip: number): void {
    this.lodConfig = {
      highDistance: high,
      mediumDistance: medium,
      lowDistance: low,
      skipDistance: skip
    };
  }

  /**
   * Get LOD configuration
   */
  getLODConfig(): LODConfig {
    return { ...this.lodConfig };
  }

  /**
   * Get entity position (works for both Particle and Conglomerate)
   */
  private getEntityPosition(entity: Entity): Vector3D {
    if (entity instanceof Particle) {
      return entity.position;
    } else {
      return (entity as any).centerOfMass;
    }
  }

  /**
   * Apply gravity with LOD optimization
   */
  override applyGravity(entities: Entity[], deltaTime: number): void {
    // If LOD is disabled or no camera, use standard computation
    if (!this.useLOD || !this.camera) {
      super.applyGravity(entities, deltaTime);
      return;
    }

    // Get camera position
    const cameraPos = this.camera.getCamera().position;
    const camPos = new Vector3D(cameraPos.x, cameraPos.y, cameraPos.z);

    // Categorize entities by LOD level
    const highLOD: Entity[] = [];
    const mediumLOD: Entity[] = [];
    const lowLOD: Entity[] = [];
    // SKIP entities are not added to any list

    for (const entity of entities) {
      const entityPos = this.getEntityPosition(entity);
      const distance = camPos.distanceTo(entityPos);

      if (distance < this.lodConfig.highDistance) {
        highLOD.push(entity);
      } else if (distance < this.lodConfig.mediumDistance) {
        mediumLOD.push(entity);
      } else if (distance < this.lodConfig.lowDistance) {
        lowLOD.push(entity);
      }
      // Entities beyond skipDistance are not processed
    }

    // Apply full computation to HIGH LOD entities
    if (highLOD.length > 0) {
      super.applyGravity(highLOD, deltaTime);
    }

    // Apply reduced computation to MEDIUM LOD entities
    // Only compute interactions with HIGH LOD entities and other MEDIUM entities
    if (mediumLOD.length > 0) {
      this.applyGravityReduced(mediumLOD, highLOD, deltaTime);
    }

    // Apply minimal computation to LOW LOD entities
    // Only compute interactions with HIGH LOD entities (major attractors)
    if (lowLOD.length > 0) {
      this.applyGravityMinimal(lowLOD, highLOD, deltaTime);
    }
  }

  /**
   * Apply reduced gravity computation (MEDIUM LOD)
   * Only compute interactions with HIGH LOD and other MEDIUM entities
   */
  private applyGravityReduced(mediumEntities: Entity[], highEntities: Entity[], deltaTime: number): void {
    // Interactions between MEDIUM entities
    for (let i = 0; i < mediumEntities.length; i++) {
      for (let j = i + 1; j < mediumEntities.length; j++) {
        const e1 = mediumEntities[i];
        const e2 = mediumEntities[j];

        const force = this.calculateGravitationalForce(e1, e2);
        this.applyForce(e1, force, deltaTime);
        this.applyForce(e2, force.multiply(-1), deltaTime);
      }
    }

    // Interactions with HIGH LOD entities
    for (const mediumEntity of mediumEntities) {
      for (const highEntity of highEntities) {
        const force = this.calculateGravitationalForce(mediumEntity, highEntity);
        this.applyForce(mediumEntity, force, deltaTime);
        this.applyForce(highEntity, force.multiply(-1), deltaTime);
      }
    }
  }

  /**
   * Apply minimal gravity computation (LOW LOD)
   * Only compute interactions with HIGH LOD entities (major attractors)
   */
  private applyGravityMinimal(lowEntities: Entity[], highEntities: Entity[], deltaTime: number): void {
    // Only compute interactions with HIGH LOD entities
    for (const lowEntity of lowEntities) {
      for (const highEntity of highEntities) {
        const force = this.calculateGravitationalForce(lowEntity, highEntity);
        this.applyForce(lowEntity, force, deltaTime);
        this.applyForce(highEntity, force.multiply(-1), deltaTime);
      }
    }
  }

  /**
   * Get LOD statistics for debugging
   */
  getLODStats(entities: Entity[]): { high: number; medium: number; low: number; skip: number } {
    if (!this.camera) {
      return { high: entities.length, medium: 0, low: 0, skip: 0 };
    }

    const cameraPos = this.camera.getCamera().position;
    const camPos = new Vector3D(cameraPos.x, cameraPos.y, cameraPos.z);

    let high = 0, medium = 0, low = 0, skip = 0;

    for (const entity of entities) {
      const entityPos = this.getEntityPosition(entity);
      const distance = camPos.distanceTo(entityPos);

      if (distance < this.lodConfig.highDistance) {
        high++;
      } else if (distance < this.lodConfig.mediumDistance) {
        medium++;
      } else if (distance < this.lodConfig.lowDistance) {
        low++;
      } else {
        skip++;
      }
    }

    return { high, medium, low, skip };
  }
}
