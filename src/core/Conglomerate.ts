import { Vector3D } from './Vector3D';
import { Quaternion } from './Quaternion';
import { Particle } from './Particle';

/**
 * Represents a conglomerate of multiple particles that have merged together
 * Maintains individual particles while calculating collective properties
 * Uses quaternions for 3D rotation representation
 */
export class Conglomerate {
  public readonly id: string;
  public particles: Particle[];
  public centerOfMass: Vector3D;
  public velocity: Vector3D;
  public totalMass: number;
  public angularVelocity: Vector3D; // Angular velocity vector (axis * magnitude)
  public orientation: Quaternion; // 3D rotation state
  public radius: number; // Effective radius for collision detection
  public age: number; // Age in seconds since conglomerate creation
  private relativePositions: Vector3D[]; // Fixed relative positions from center of mass

  /**
   * Create a new conglomerate from multiple particles
   * Adjusts particle positions so they touch each other
   * @param particles - Array of particles to form the conglomerate
   * @param adjustPositions - Whether to adjust particle positions (default: true, set false when merging)
   * @param collisionSpeed - Relative speed at collision (optional, for energy-based penetration)
   */
  constructor(particles: Particle[], adjustPositions: boolean = true, collisionSpeed?: number) {
    if (particles.length === 0) {
      throw new Error('Conglomerate must contain at least one particle');
    }

    this.id = this.generateId();
    this.particles = [...particles]; // Copy array to avoid external mutations
    this.angularVelocity = Vector3D.zero();
    this.orientation = Quaternion.identity();
    this.age = 0; // Start with age 0

    // Calculate initial properties
    this.totalMass = this.calculateTotalMass();
    
    // Adjust particle positions so they touch (only for new conglomerates)
    // Do this BEFORE calculating velocity and center of mass
    if (adjustPositions) {
      this.adjustParticlePositions(collisionSpeed);
    }
    
    // Calculate collective properties AFTER position adjustment
    this.centerOfMass = this.calculateCenterOfMass();
    this.velocity = this.calculateVelocity();
    this.radius = this.calculateRadius();
    
    // Store fixed relative positions (shape is now locked)
    this.relativePositions = this.particles.map(p => 
      p.position.subtract(this.centerOfMass)
    );
  }

  /**
   * Adjust particle positions so they touch each other in 3D space
   * Arranges particles so they're in contact, creating a visually cohesive structure
   * If collision speed is provided, particles penetrate deeper based on collision energy
   * @param collisionSpeed - Relative speed at collision (optional, for energy-based penetration)
   */
  private adjustParticlePositions(collisionSpeed?: number): void {
    if (this.particles.length < 2) {
      return; // Single particle, no adjustment needed
    }

    // Calculate penetration factor based on collision speed
    // Higher speed = deeper penetration (up to 40% overlap)
    // Use a non-linear curve for more visible variation
    let penetrationFactor = 0;
    if (collisionSpeed !== undefined && collisionSpeed > 0) {
      // Normalize speed to a reasonable range (0-5 units/s)
      // Use square root for more gradual increase
      const maxSpeed = 5;
      const normalizedSpeed = Math.min(collisionSpeed / maxSpeed, 1.0);
      // Square root gives more variation at lower speeds
      penetrationFactor = Math.sqrt(normalizedSpeed) * 0.4;
    }

    // Keep first particle as anchor
    const anchor = this.particles[0];
    
    // Adjust each subsequent particle to touch the anchor or form a chain
    for (let i = 1; i < this.particles.length; i++) {
      const current = this.particles[i];
      
      // Find the closest particle that's already positioned
      let closestParticle = anchor;
      let minDistance = anchor.position.distanceTo(current.position);
      
      for (let j = 1; j < i; j++) {
        const dist = this.particles[j].position.distanceTo(current.position);
        if (dist < minDistance) {
          minDistance = dist;
          closestParticle = this.particles[j];
        }
      }
      
      // Calculate direction from closest to current
      const direction = current.position.subtract(closestParticle.position);
      const distance = direction.magnitude();
      
      // Calculate desired distance with energy-based penetration
      // Base distance is sum of radii (touching)
      // Penetration reduces this distance
      const touchingDistance = closestParticle.radius + current.radius;
      const desiredDistance = touchingDistance * (1 - penetrationFactor);
      
      // If particles are not touching properly, adjust position
      if (Math.abs(distance - desiredDistance) > 0.01) {
        if (distance > 0.001) {
          // Move along the direction vector
          const normalizedDirection = direction.normalize();
          current.position = closestParticle.position.add(
            normalizedDirection.multiply(desiredDistance)
          );
        } else {
          // Particles are at same position, place them touching at an angle
          // Use spherical coordinates to create a 3D arrangement
          const theta = (i * Math.PI * 2) / this.particles.length; // Azimuthal angle
          const phi = Math.acos(1 - 2 * (i / this.particles.length)); // Polar angle
          current.position = closestParticle.position.add(
            new Vector3D(
              Math.sin(phi) * Math.cos(theta) * desiredDistance,
              Math.sin(phi) * Math.sin(theta) * desiredDistance,
              Math.cos(phi) * desiredDistance
            )
          );
        }
      }
    }
  }

  /**
   * Calculate the total mass of the conglomerate
   * @returns Sum of all particle masses
   */
  private calculateTotalMass(): number {
    return this.particles.reduce((sum, particle) => sum + particle.mass, 0);
  }

  /**
   * Calculate the center of mass of the conglomerate in 3D
   * COM = Σ(m_i * r_i) / Σ(m_i)
   * @returns Center of mass position vector
   */
  calculateCenterOfMass(): Vector3D {
    let weightedSum = Vector3D.zero();
    
    for (const particle of this.particles) {
      const weightedPosition = particle.position.multiply(particle.mass);
      weightedSum = weightedSum.add(weightedPosition);
    }

    return weightedSum.divide(this.totalMass);
  }

  /**
   * Calculate the velocity of the conglomerate based on momentum conservation
   * v = Σ(m_i * v_i) / Σ(m_i)
   * @returns Velocity vector
   */
  private calculateVelocity(): Vector3D {
    let totalMomentum = Vector3D.zero();
    
    for (const particle of this.particles) {
      totalMomentum = totalMomentum.add(particle.momentum());
    }

    return totalMomentum.divide(this.totalMass);
  }

  /**
   * Calculate the effective radius of the conglomerate
   * Uses the maximum distance from center of mass to any particle edge
   * @returns Effective radius
   */
  private calculateRadius(): number {
    let maxRadius = 0;
    
    for (const particle of this.particles) {
      const distanceToCenter = particle.position.distanceTo(this.centerOfMass);
      const effectiveRadius = distanceToCenter + particle.radius;
      maxRadius = Math.max(maxRadius, effectiveRadius);
    }

    return maxRadius;
  }

  /**
   * Calculate the moment of inertia tensor of the conglomerate in 3D
   * Returns a 3x3 matrix representing the inertia tensor
   * For point masses: Ixx = Σ m_i(y_i² + z_i²), etc.
   * @returns Moment of inertia tensor as 3x3 matrix
   */
  calculateMomentOfInertiaTensor(): number[][] {
    // Initialize 3x3 matrix
    const tensor: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    
    for (const particle of this.particles) {
      const relPos = particle.position.subtract(this.centerOfMass);
      const m = particle.mass;
      const x = relPos.x;
      const y = relPos.y;
      const z = relPos.z;
      
      // Diagonal elements
      tensor[0][0] += m * (y * y + z * z); // Ixx
      tensor[1][1] += m * (x * x + z * z); // Iyy
      tensor[2][2] += m * (x * x + y * y); // Izz
      
      // Off-diagonal elements (symmetric)
      tensor[0][1] -= m * x * y; // Ixy
      tensor[0][2] -= m * x * z; // Ixz
      tensor[1][2] -= m * y * z; // Iyz
    }
    
    // Fill symmetric elements
    tensor[1][0] = tensor[0][1]; // Iyx = Ixy
    tensor[2][0] = tensor[0][2]; // Izx = Ixz
    tensor[2][1] = tensor[1][2]; // Izy = Iyz
    
    return tensor;
  }

  /**
   * Calculate the angular momentum of the conglomerate in 3D
   * L = I * ω where I is the inertia tensor and ω is angular velocity vector
   * @returns Angular momentum vector
   */
  calculateAngularMomentum(): Vector3D {
    const I = this.calculateMomentOfInertiaTensor();
    const omega = this.angularVelocity;
    
    // Matrix-vector multiplication: L = I * ω
    const Lx = I[0][0] * omega.x + I[0][1] * omega.y + I[0][2] * omega.z;
    const Ly = I[1][0] * omega.x + I[1][1] * omega.y + I[1][2] * omega.z;
    const Lz = I[2][0] * omega.x + I[2][1] * omega.y + I[2][2] * omega.z;
    
    return new Vector3D(Lx, Ly, Lz);
  }

  /**
   * Apply a force to the conglomerate in 3D
   * Uses Newton's second law: F = ma, therefore a = F/m
   * @param force - Force vector to apply
   * @param deltaTime - Time step duration
   */
  applyForce(force: Vector3D, deltaTime: number): void {
    // Calculate acceleration: a = F / m
    const acceleration = force.divide(this.totalMass);
    
    // Update velocity: v = v + a * dt
    this.velocity = this.velocity.add(acceleration.multiply(deltaTime));
  }

  /**
   * Apply a torque to the conglomerate in 3D
   * Uses rotational dynamics with inertia tensor
   * Note: This is a simplified approach; full 3D rigid body dynamics would require
   * solving Euler's equations with the inertia tensor in body coordinates
   * @param torque - Torque vector to apply
   * @param deltaTime - Time step duration
   */
  applyTorque(torque: Vector3D, deltaTime: number): void {
    // For simplicity, we use a scalar moment of inertia approximation
    // Full implementation would require solving I * α = τ with the tensor
    const I = this.calculateMomentOfInertiaTensor();
    
    // Calculate trace of inertia tensor as scalar approximation
    const scalarI = (I[0][0] + I[1][1] + I[2][2]) / 3;
    
    if (scalarI === 0) {
      return; // Avoid division by zero for point-like conglomerates
    }

    // Calculate angular acceleration: α = τ / I (simplified)
    const angularAcceleration = torque.divide(scalarI);
    
    // Update angular velocity: ω = ω + α * dt
    this.angularVelocity = this.angularVelocity.add(angularAcceleration.multiply(deltaTime));
  }

  /**
   * Update the conglomerate's position and rotation in 3D
   * Maintains fixed shape by using stored relative positions and quaternion rotation
   * Applies angular damping to prevent excessive rotation
   * @param deltaTime - Time step duration
   */
  update(deltaTime: number): void {
    // Update center of mass position
    this.centerOfMass = this.centerOfMass.add(this.velocity.multiply(deltaTime));
    
    // Update age
    this.age += deltaTime;

    // Apply angular damping to prevent excessive rotation
    // Damping factor: 0.99 means 1% loss per frame (very gentle)
    const angularDamping = 0.99;
    this.angularVelocity = this.angularVelocity.multiply(Math.pow(angularDamping, deltaTime * 60));
    
    // Cap maximum angular velocity to prevent extreme spinning
    const maxAngularSpeed = 5.0; // radians per second
    const angularSpeed = this.angularVelocity.magnitude();
    if (angularSpeed > maxAngularSpeed) {
      this.angularVelocity = this.angularVelocity.normalize().multiply(maxAngularSpeed);
    }

    // Apply rotation if there's angular velocity
    if (angularSpeed > 1e-10) {
      // Create quaternion for incremental rotation
      const deltaRotation = Quaternion.fromAxisAngle(
        this.angularVelocity.normalize(),
        Math.min(angularSpeed, maxAngularSpeed) * deltaTime
      );
      
      // Update orientation: new_orientation = delta_rotation * current_orientation
      this.orientation = deltaRotation.multiply(this.orientation).normalize();
      
      // Update particle positions using quaternion rotation
      for (let i = 0; i < this.particles.length; i++) {
        // Rotate the relative position by current orientation
        const rotatedRelPos = this.orientation.rotateVector(this.relativePositions[i]);
        
        // Update particle position: center of mass + rotated relative position
        this.particles[i].position = this.centerOfMass.add(rotatedRelPos);
      }
    } else {
      // No rotation, just translate all particles
      for (let i = 0; i < this.particles.length; i++) {
        const rotatedRelPos = this.orientation.rotateVector(this.relativePositions[i]);
        this.particles[i].position = this.centerOfMass.add(rotatedRelPos);
      }
    }
  }

  /**
   * Update relative positions based on current particle positions
   * Should be called after external position changes (e.g., collision resolution)
   */
  updateRelativePositions(): void {
    this.relativePositions = this.particles.map(p => 
      p.position.subtract(this.centerOfMass)
    );
  }

  /**
   * Merge this conglomerate with another conglomerate or particle
   * @param other - Another conglomerate to merge with
   * @param collisionSpeed - Relative speed at collision (optional, for energy-based penetration)
   * @returns New conglomerate containing all particles
   */
  merge(other: Conglomerate, collisionSpeed?: number): Conglomerate {
    // Combine all particles from both conglomerates
    const allParticles = [...this.particles, ...other.particles];
    
    // If no collision speed provided, calculate it
    if (collisionSpeed === undefined) {
      const relativeVelocity = this.velocity.subtract(other.velocity);
      collisionSpeed = relativeVelocity.magnitude();
    }
    
    // Create new conglomerate WITH position adjustment for visual appeal
    // This ensures particles always touch, even if it adds some energy
    const merged = new Conglomerate(allParticles, true, collisionSpeed);
    
    // Calculate combined angular momentum to preserve it
    const L1 = this.calculateAngularMomentum();
    const L2 = other.calculateAngularMomentum();
    const totalAngularMomentum = L1.add(L2);
    
    // Set angular velocity based on new moment of inertia tensor
    // Simplified approach: use scalar approximation
    const I = merged.calculateMomentOfInertiaTensor();
    const scalarI = (I[0][0] + I[1][1] + I[2][2]) / 3;
    
    if (scalarI > 0) {
      // Approximate: ω ≈ L / I_avg
      merged.angularVelocity = totalAngularMomentum.divide(scalarI);
    }

    return merged;
  }

  /**
   * Check if this conglomerate contains a specific particle
   * @param particle - Particle to check for
   * @returns True if the particle is part of this conglomerate
   */
  contains(particle: Particle): boolean {
    return this.particles.some(p => p.id === particle.id);
  }

  /**
   * Calculate the kinetic energy of the conglomerate in 3D
   * KE = 0.5 * m * v² + 0.5 * ω^T * I * ω
   * @returns Total kinetic energy (translational + rotational)
   */
  kineticEnergy(): number {
    const translationalEnergy = 0.5 * this.totalMass * this.velocity.dot(this.velocity);
    
    // Rotational energy: 0.5 * ω^T * I * ω
    const L = this.calculateAngularMomentum();
    const rotationalEnergy = 0.5 * this.angularVelocity.dot(L);
    
    return translationalEnergy + rotationalEnergy;
  }

  /**
   * Calculate the momentum of the conglomerate
   * p = m * v
   * @returns Momentum vector
   */
  momentum(): Vector3D {
    return this.velocity.multiply(this.totalMass);
  }

  /**
   * Generate a unique ID for the conglomerate
   * @returns Unique identifier string
   */
  private generateId(): string {
    return `conglomerate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
