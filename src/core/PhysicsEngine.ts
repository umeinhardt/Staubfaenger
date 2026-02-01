import { Vector3D } from './Vector3D';
import { Particle } from './Particle';
import { Conglomerate } from './Conglomerate';
import { GravityFormula, NewtonianGravity } from './GravityFormula';

/**
 * Type representing either a Particle or Conglomerate
 */
export type Entity = Particle | Conglomerate;

/**
 * Represents a collision between two entities
 */
export interface CollisionPair {
  entity1: Entity;
  entity2: Entity;
}

/**
 * Represents energy dissipation from a collision (for visualization)
 */
export interface EnergyDissipation {
  position: Vector3D;
  energyLost: number;
}

/**
 * Physics engine implementing Newtonian mechanics
 * Handles gravitational forces and collision resolution
 */
export class PhysicsEngine {
  protected gravityFormula: GravityFormula;
  private elasticity: number = 0;
  private separateOnCollision: boolean = false;

  /**
   * Create a new physics engine
   * @param gravityFormula - Formula for calculating gravitational forces
   * @param elasticity - Collision elasticity coefficient (0 = fully inelastic, 1 = fully elastic)
   * @param separateOnCollision - If true, physically separate overlapping entities before applying impulse
   */
  constructor(gravityFormula: GravityFormula, elasticity: number = 0, separateOnCollision: boolean = false) {
    this.gravityFormula = gravityFormula;
    this.setElasticity(elasticity);
    this.separateOnCollision = separateOnCollision;
  }

  /**
   * Set the elasticity coefficient
   * @param elasticity - Value between 0 and 1
   */
  setElasticity(elasticity: number): void {
    if (elasticity < 0 || elasticity > 1) {
      throw new Error('Elasticity must be between 0 and 1');
    }
    this.elasticity = elasticity;
  }

  /**
   * Get the current elasticity coefficient
   */
  getElasticity(): number {
    return this.elasticity;
  }

  /**
   * Set whether to use GPU acceleration (overridden by GPUPhysicsEngine)
   * @param use - Whether to use GPU
   */
  setUseGPU(use: boolean): void {
    // Base implementation does nothing (CPU only)
    // GPUPhysicsEngine overrides this
  }

  /**
   * Set whether to physically separate overlapping entities on collision
   * @param separate - If true, entities are moved apart before impulse is applied
   */
  setSeparateOnCollision(separate: boolean): void {
    this.separateOnCollision = separate;
  }

  /**
   * Get whether entities are separated on collision
   */
  getSeparateOnCollision(): boolean {
    return this.separateOnCollision;
  }

  /**
   * Calculate gravitational force between two entities (OPTIMIZED)
   * Returns force vector acting on entity1 due to entity2
   * @param e1 - First entity
   * @param e2 - Second entity
   * @returns Force vector acting on e1
   */
  calculateGravitationalForce(e1: Entity, e2: Entity): Vector3D {
    const m1 = this.getMass(e1);
    const m2 = this.getMass(e2);
    const pos1 = this.getPosition(e1);
    const pos2 = this.getPosition(e2);

    // OPTIMIZATION: Calculate delta directly without creating intermediate vector
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    
    // OPTIMIZATION: Calculate distance squared first (avoid sqrt if possible)
    const distSq = dx * dx + dy * dy + dz * dz;
    
    // Early exit for zero distance
    if (distSq < 1e-10) {
      return Vector3D.zero();
    }
    
    const distance = Math.sqrt(distSq);

    // Calculate force magnitude using gravity formula
    const forceMagnitude = this.gravityFormula.calculate(m1, m2, distance);

    // OPTIMIZATION: Normalize and scale in one step (avoid creating intermediate vectors)
    const invDist = 1.0 / distance;
    return new Vector3D(
      dx * invDist * forceMagnitude,
      dy * invDist * forceMagnitude,
      dz * invDist * forceMagnitude
    );
  }

  /**
   * Apply gravitational forces between all entities
   * @param entities - Array of entities to apply gravity to
   * @param deltaTime - Time step duration
   */
  applyGravity(entities: Entity[], deltaTime: number): void {
    // Apply gravitational force between each pair of entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const e1 = entities[i];
        const e2 = entities[j];

        // Calculate gravitational force on e1 due to e2
        const force = this.calculateGravitationalForce(e1, e2);

        // Apply force to e1 (attraction towards e2)
        this.applyForce(e1, force, deltaTime);

        // Apply equal and opposite force to e2 (Newton's third law)
        this.applyForce(e2, force.multiply(-1), deltaTime);
      }
    }
  }

  /**
   * Resolve a collision between two entities
   * Applies impulse-based collision resolution with elasticity
   * For rotating bodies (conglomerates), considers velocity at contact point
   * @param pair - Collision pair to resolve
   */
  resolveCollision(pair: CollisionPair): void {
    const { entity1, entity2 } = pair;

    const m1 = this.getMass(entity1);
    const m2 = this.getMass(entity2);
    const pos1 = this.getPosition(entity1);
    const pos2 = this.getPosition(entity2);

    // OPTIMIZATION: Calculate direction components directly
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    
    // If entities are too close, collision resolution is numerically unstable
    if (distSq < 1e-12) {
      return;
    }
    
    const distance = Math.sqrt(distSq);
    const invDist = 1.0 / distance;
    
    // OPTIMIZATION: Collision normal calculated inline
    const nx = dx * invDist;
    const ny = dy * invDist;
    const nz = dz * invDist;

    // Calculate radii
    const r1 = this.getRadius(entity1);
    const r2 = this.getRadius(entity2);

    // Optional: Physically separate overlapping entities before applying impulse
    if (this.separateOnCollision) {
      const overlap = (r1 + r2) - distance;
      
      if (overlap > 0) {
        // Calculate separation based on mass ratio (heavier objects move less)
        const totalMass = m1 + m2;
        const separation1 = overlap * (m2 / totalMass);
        const separation2 = overlap * (m1 / totalMass);
        
        // OPTIMIZATION: Move entities apart without creating intermediate vectors
        const newPos1 = new Vector3D(
          pos1.x - nx * separation1,
          pos1.y - ny * separation1,
          pos1.z - nz * separation1
        );
        const newPos2 = new Vector3D(
          pos2.x + nx * separation2,
          pos2.y + ny * separation2,
          pos2.z + nz * separation2
        );
        
        this.setPosition(entity1, newPos1);
        this.setPosition(entity2, newPos2);
      }
    }

    // Calculate collision point (midpoint between surfaces)
    const collisionPoint = new Vector3D(
      pos1.x + nx * r1,
      pos1.y + ny * r1,
      pos1.z + nz * r1
    );

    // Get velocity at collision point (includes rotational component for conglomerates)
    const v1 = this.getVelocityAtPoint(entity1, collisionPoint);
    const v2 = this.getVelocityAtPoint(entity2, collisionPoint);

    // OPTIMIZATION: Calculate relative velocity components directly
    const vRelX = v1.x - v2.x;
    const vRelY = v1.y - v2.y;
    const vRelZ = v1.z - v2.z;

    // Calculate relative velocity along collision normal
    const velocityAlongNormal = vRelX * nx + vRelY * ny + vRelZ * nz;

    // Don't resolve if entities are separating (moving apart)
    if (velocityAlongNormal > 0) {
      return;
    }

    // Calculate impulse scalar
    // j = -(1 + e) * v_rel · n / (1/m1 + 1/m2)
    const impulseScalar = -(1 + this.elasticity) * velocityAlongNormal / (1 / m1 + 1 / m2);

    // OPTIMIZATION: Calculate impulse vector inline
    const impulse = new Vector3D(
      nx * impulseScalar,
      ny * impulseScalar,
      nz * impulseScalar
    );

    // Apply impulse to entities
    // Entity 1 receives impulse in opposite direction of collision normal
    // Entity 2 receives impulse in direction of collision normal
    this.applyImpulse(entity1, impulse, collisionPoint);
    this.applyImpulse(entity2, impulse.multiply(-1), collisionPoint);
  }

  /**
   * Calculate collision impulse for a collision pair
   * @param e1 - First entity
   * @param e2 - Second entity
   * @returns Impulse vector to apply to e1
   */
  calculateCollisionImpulse(e1: Entity, e2: Entity): Vector3D {
    const m1 = this.getMass(e1);
    const m2 = this.getMass(e2);
    const v1 = this.getVelocity(e1);
    const v2 = this.getVelocity(e2);
    const pos1 = this.getPosition(e1);
    const pos2 = this.getPosition(e2);

    // Calculate collision normal (from e1 to e2)
    const collisionNormal = pos2.subtract(pos1).normalize();

    // Calculate relative velocity
    const relativeVelocity = v1.subtract(v2);

    // Calculate relative velocity along collision normal
    const velocityAlongNormal = relativeVelocity.dot(collisionNormal);

    // Calculate impulse scalar
    const impulseScalar = -(1 + this.elasticity) * velocityAlongNormal / (1 / m1 + 1 / m2);

    // Return impulse vector
    return collisionNormal.multiply(impulseScalar);
  }

  /**
   * Get the mass of an entity
   */
  private getMass(entity: Entity): number {
    if (entity instanceof Particle) {
      return entity.mass;
    } else {
      return entity.totalMass;
    }
  }

  /**
   * Get the position of an entity
   */
  private getPosition(entity: Entity): Vector3D {
    if (entity instanceof Particle) {
      return entity.position;
    } else {
      return entity.centerOfMass;
    }
  }

  /**
   * Set the position of an entity
   */
  private setPosition(entity: Entity, position: Vector3D): void {
    if (entity instanceof Particle) {
      entity.position = position;
    } else {
      // For conglomerates, move all particles by the delta
      const delta = position.subtract(entity.centerOfMass);
      entity.centerOfMass = position;
      for (const particle of entity.particles) {
        particle.position = particle.position.add(delta);
      }
      // Update relative positions to reflect the new particle positions
      // This ensures the shape is maintained when update() is called later
      entity.updateRelativePositions();
    }
  }

  /**
   * Get the radius of an entity
   */
  private getRadius(entity: Entity): number {
    return entity.radius;
  }

  /**
   * Get the velocity of an entity
   */
  private getVelocity(entity: Entity): Vector3D {
    return entity.velocity;
  }

  /**
   * Get velocity at a specific point on an entity
   * For particles, this is just the velocity
   * For conglomerates, this includes rotational velocity: v = v_cm + ω × r
   */
  private getVelocityAtPoint(entity: Entity, point: Vector3D): Vector3D {
    if (entity instanceof Particle) {
      return entity.velocity;
    } else {
      // For conglomerate: v_point = v_cm + ω × r
      const r = point.subtract(entity.centerOfMass);
      const rotationalVelocity = entity.angularVelocity.cross(r);
      return entity.velocity.add(rotationalVelocity);
    }
  }

  /**
   * Apply an impulse to an entity at a specific point
   * For particles, this just changes velocity
   * For conglomerates, this affects both velocity and angular velocity
   */
  private applyImpulse(entity: Entity, impulse: Vector3D, point: Vector3D): void {
    if (entity instanceof Particle) {
      // Simple impulse: Δv = J / m
      entity.velocity = entity.velocity.add(impulse.divide(entity.mass));
    } else {
      // For conglomerate: apply both linear and angular impulse
      const m = entity.totalMass;
      
      // Linear impulse: Δv = J / m
      entity.velocity = entity.velocity.add(impulse.divide(m));
      
      // Angular impulse: ΔL = r × J, where r is from center of mass to collision point
      const r = point.subtract(entity.centerOfMass);
      const angularImpulse = r.cross(impulse);
      
      // Calculate change in angular velocity: Δω = I^-1 * ΔL
      // Simplified: use scalar moment of inertia
      const I = entity.calculateMomentOfInertiaTensor();
      const scalarI = (I[0][0] + I[1][1] + I[2][2]) / 3;
      
      if (scalarI > 1e-10) {
        const deltaOmega = angularImpulse.divide(scalarI);
        entity.angularVelocity = entity.angularVelocity.add(deltaOmega);
      }
    }
  }

  /**
   * Set the velocity of an entity
   */
  private setVelocity(entity: Entity, velocity: Vector3D): void {
    entity.velocity = velocity;
  }

  /**
   * Apply a force to an entity
   */
  protected applyForce(entity: Entity, force: Vector3D, deltaTime: number): void {
    entity.applyForce(force, deltaTime);
  }

  /**
   * Calculate total gravitational potential energy of a system of entities
   * U = -G * m1 * m2 / r for each pair
   * @param entities - Array of entities
   * @returns Total gravitational potential energy (negative value)
   */
  calculatePotentialEnergy(entities: Entity[]): number {
    let totalPotentialEnergy = 0;

    // Calculate potential energy for each pair of entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const e1 = entities[i];
        const e2 = entities[j];

        const m1 = this.getMass(e1);
        const m2 = this.getMass(e2);
        const pos1 = this.getPosition(e1);
        const pos2 = this.getPosition(e2);

        const distance = pos1.distanceTo(pos2);

        // U = -G * m1 * m2 / r
        // Use the same formula as gravity calculation
        const G = this.gravityFormula instanceof NewtonianGravity 
          ? (this.gravityFormula as any).G 
          : 1.0;
        
        // Avoid division by zero with epsilon
        const epsilon = 0.01;
        const effectiveDistance = Math.max(distance, epsilon);
        
        totalPotentialEnergy -= G * m1 * m2 / effectiveDistance;
      }
    }

    return totalPotentialEnergy;
  }
}
