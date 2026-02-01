import { Vector3D } from './Vector3D';
import { Particle } from './Particle';
import { Conglomerate } from './Conglomerate';
import { Boundary } from './Boundary';

/**
 * Configuration for particle spawning
 */
export interface ParticleSpawnConfig {
  spawnRate: number;           // Particles per second
  massRange: [number, number]; // Min/Max mass
  energyRange: [number, number]; // Min/Max kinetic energy
  maxParticles: number;        // Maximum number of particles to inject (0 = unlimited)
}

/**
 * Manages all particles and conglomerates in the simulation
 * Handles spawning, wrap-around, and entity lifecycle
 */
export class ParticleManager {
  public particles: Particle[];
  public conglomerates: Conglomerate[];
  public config: ParticleSpawnConfig;
  public bounds: Boundary;
  
  private timeSinceLastSpawn: number;
  private totalParticlesSpawned: number; // Track total particles spawned
  private injectionEnabled: boolean; // Control whether new particles are spawned
  private boundaryMode: 'bounce' | 'wrap'; // Boundary behavior mode

  /**
   * Create a new particle manager
   * @param bounds - 3D boundary for the simulation
   * @param config - Particle spawning configuration
   */
  constructor(bounds: Boundary, config: ParticleSpawnConfig) {
    this.particles = [];
    this.conglomerates = [];
    this.bounds = bounds;
    this.config = config;
    this.timeSinceLastSpawn = 0;
    this.totalParticlesSpawned = 0;
    this.injectionEnabled = true; // Start with injection enabled
    this.boundaryMode = 'bounce'; // Default to bounce mode
  }

  /**
   * Spawn a new particle at a random boundary face position with random parameters
   * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
   * @returns The newly spawned particle, or null if max particles reached
   */
  spawnParticle(): Particle | null {
    // Check if we've reached the maximum particle limit
    if (this.config.maxParticles > 0 && this.totalParticlesSpawned >= this.config.maxParticles) {
      return null;
    }

    // Get random spawn position on one of the 6 boundary faces
    const position = this.bounds.getRandomSpawnPosition();
    
    // Generate random mass within configured range
    const [minMass, maxMass] = this.config.massRange;
    const mass = minMass + Math.random() * (maxMass - minMass);
    
    // Generate random kinetic energy within configured range
    const [minEnergy, maxEnergy] = this.config.energyRange;
    const kineticEnergy = minEnergy + Math.random() * (maxEnergy - minEnergy);
    
    // Calculate velocity magnitude from kinetic energy: KE = 0.5 * m * v²
    // Therefore: v = sqrt(2 * KE / m)
    const velocityMagnitude = Math.sqrt(2 * kineticEnergy / mass);
    
    // Get inward-pointing velocity from boundary
    const velocity = this.bounds.getSpawnVelocity(position, velocityMagnitude);
    
    const particle = new Particle(position, velocity, mass);
    this.particles.push(particle);
    this.totalParticlesSpawned++;
    
    return particle;
  }

  /**
   * Remove a particle from the manager
   * @param particle - Particle to remove
   */
  removeParticle(particle: Particle): void {
    const index = this.particles.findIndex(p => p.id === particle.id);
    if (index !== -1) {
      this.particles.splice(index, 1);
    }
  }

  /**
   * Wrap a particle around to the opposite side when it leaves the bounds
   * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
   * @param particle - Particle to wrap
   */
  wrapParticle(particle: Particle): void {
    const wrappedPosition = this.bounds.wrapPosition(particle.position);
    
    // Only update if position changed (particle was outside bounds)
    if (!wrappedPosition.equals(particle.position)) {
      particle.position = wrappedPosition;
    }
  }

  /**
   * Wrap a conglomerate around to the opposite side when it leaves the bounds
   * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
   * @param conglomerate - Conglomerate to wrap
   */
  wrapConglomerate(conglomerate: Conglomerate): void {
    const wrappedPosition = this.bounds.wrapPosition(conglomerate.centerOfMass);
    
    // Calculate the wrap delta
    const wrapDelta = wrappedPosition.subtract(conglomerate.centerOfMass);
    
    // Only update if position changed (conglomerate was outside bounds)
    if (wrapDelta.magnitude() > 1e-10) {
      // Apply wrap to center of mass and all particles
      conglomerate.centerOfMass = wrappedPosition;
      for (const particle of conglomerate.particles) {
        particle.position = particle.position.add(wrapDelta);
      }
    }
  }

  /**
   * Bounce a particle off the boundary walls
   * Uses the particle's radius to detect collision with outer hull
   * Prevents jittering by clamping velocity when deeply penetrating
   * @param particle - Particle to bounce
   * @param elasticity - Coefficient of restitution (0 = no bounce, 1 = perfect bounce)
   */
  bounceParticle(particle: Particle, elasticity: number): void {
    const pos = particle.position;
    const r = particle.radius;
    let { x, y, z } = pos;
    let { x: vx, y: vy, z: vz } = particle.velocity;
    let hitWall = false;

    // Check if outer hull touches or exceeds boundaries
    // Bounce off X boundaries
    if (x - r < this.bounds.min.x) {
      const penetration = this.bounds.min.x - (x - r);
      x = this.bounds.min.x + r; // Position at boundary + radius
      vx = Math.abs(vx) * elasticity; // Reverse and apply elasticity
      // Extra damping if deeply penetrating to prevent jittering
      if (penetration > r * 0.1) {
        vx *= 0.5;
      }
      hitWall = true;
    } else if (x + r > this.bounds.max.x) {
      const penetration = (x + r) - this.bounds.max.x;
      x = this.bounds.max.x - r; // Position at boundary - radius
      vx = -Math.abs(vx) * elasticity; // Reverse and apply elasticity
      if (penetration > r * 0.1) {
        vx *= 0.5;
      }
      hitWall = true;
    }

    // Bounce off Y boundaries
    if (y - r < this.bounds.min.y) {
      const penetration = this.bounds.min.y - (y - r);
      y = this.bounds.min.y + r;
      vy = Math.abs(vy) * elasticity;
      if (penetration > r * 0.1) {
        vy *= 0.5;
      }
      hitWall = true;
    } else if (y + r > this.bounds.max.y) {
      const penetration = (y + r) - this.bounds.max.y;
      y = this.bounds.max.y - r;
      vy = -Math.abs(vy) * elasticity;
      if (penetration > r * 0.1) {
        vy *= 0.5;
      }
      hitWall = true;
    }

    // Bounce off Z boundaries
    if (z - r < this.bounds.min.z) {
      const penetration = this.bounds.min.z - (z - r);
      z = this.bounds.min.z + r;
      vz = Math.abs(vz) * elasticity;
      if (penetration > r * 0.1) {
        vz *= 0.5;
      }
      hitWall = true;
    } else if (z + r > this.bounds.max.z) {
      const penetration = (z + r) - this.bounds.max.z;
      z = this.bounds.max.z - r;
      vz = -Math.abs(vz) * elasticity;
      if (penetration > r * 0.1) {
        vz *= 0.5;
      }
      hitWall = true;
    }

    // Apply friction if any wall was hit
    if (hitWall) {
      const friction = 0.95;
      vx *= friction;
      vy *= friction;
      vz *= friction;
      
      particle.position = new Vector3D(x, y, z);
      particle.velocity = new Vector3D(vx, vy, vz);
    }
  }

  /**
   * Bounce a conglomerate off the boundary walls
   * Uses the conglomerate's radius to detect collision with outer hull
   * Prevents jittering by clamping velocity when deeply penetrating
   * @param conglomerate - Conglomerate to bounce
   * @param elasticity - Coefficient of restitution (0 = no bounce, 1 = perfect bounce)
   */
  bounceConglomerate(conglomerate: Conglomerate, elasticity: number): void {
    const pos = conglomerate.centerOfMass;
    const r = conglomerate.radius;
    let { x, y, z } = pos;
    let { x: vx, y: vy, z: vz } = conglomerate.velocity;
    let hitWall = false;

    // Check if outer hull touches or exceeds boundaries
    // Bounce off X boundaries
    if (x - r < this.bounds.min.x) {
      const penetration = this.bounds.min.x - (x - r);
      x = this.bounds.min.x + r; // Position at boundary + radius
      vx = Math.abs(vx) * elasticity; // Reverse and apply elasticity
      // Extra damping if deeply penetrating to prevent jittering
      if (penetration > r * 0.1) {
        vx *= 0.5;
      }
      hitWall = true;
    } else if (x + r > this.bounds.max.x) {
      const penetration = (x + r) - this.bounds.max.x;
      x = this.bounds.max.x - r; // Position at boundary - radius
      vx = -Math.abs(vx) * elasticity; // Reverse and apply elasticity
      if (penetration > r * 0.1) {
        vx *= 0.5;
      }
      hitWall = true;
    }

    // Bounce off Y boundaries
    if (y - r < this.bounds.min.y) {
      const penetration = this.bounds.min.y - (y - r);
      y = this.bounds.min.y + r;
      vy = Math.abs(vy) * elasticity;
      if (penetration > r * 0.1) {
        vy *= 0.5;
      }
      hitWall = true;
    } else if (y + r > this.bounds.max.y) {
      const penetration = (y + r) - this.bounds.max.y;
      y = this.bounds.max.y - r;
      vy = -Math.abs(vy) * elasticity;
      if (penetration > r * 0.1) {
        vy *= 0.5;
      }
      hitWall = true;
    }

    // Bounce off Z boundaries
    if (z - r < this.bounds.min.z) {
      const penetration = this.bounds.min.z - (z - r);
      z = this.bounds.min.z + r;
      vz = Math.abs(vz) * elasticity;
      if (penetration > r * 0.1) {
        vz *= 0.5;
      }
      hitWall = true;
    } else if (z + r > this.bounds.max.z) {
      const penetration = (z + r) - this.bounds.max.z;
      z = this.bounds.max.z - r;
      vz = -Math.abs(vz) * elasticity;
      if (penetration > r * 0.1) {
        vz *= 0.5;
      }
      hitWall = true;
    }

    // Apply friction and update position if any wall was hit
    if (hitWall) {
      const friction = 0.95;
      vx *= friction;
      vy *= friction;
      vz *= friction;
      
      // Calculate position delta
      const newPos = new Vector3D(x, y, z);
      const positionDelta = newPos.subtract(conglomerate.centerOfMass);
      
      // Update center of mass and velocity
      conglomerate.centerOfMass = newPos;
      conglomerate.velocity = new Vector3D(vx, vy, vz);
      
      // Apply position delta to all particles
      for (const particle of conglomerate.particles) {
        particle.position = particle.position.add(positionDelta);
      }
    }
  }

  /**
   * Create a conglomerate from two particles
   * Calculates initial angular momentum from collision
   * Particles penetrate deeper based on collision energy
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4
   * @param p1 - First particle
   * @param p2 - Second particle
   * @returns New conglomerate containing both particles
   */
  createConglomerate(p1: Particle, p2: Particle): Conglomerate {
    // Remove particles from the particles array
    this.removeParticle(p1);
    this.removeParticle(p2);
    
    // Calculate relative velocity for energy-based penetration
    const relativeVelocity = p1.velocity.subtract(p2.velocity);
    const collisionSpeed = relativeVelocity.magnitude();
    
    // Create new conglomerate with collision speed for penetration calculation
    const conglomerate = new Conglomerate([p1, p2], true, collisionSpeed);
    
    // Calculate initial angular momentum from the collision
    // L = r × p, where r is position relative to center of mass and p is momentum
    const r1 = p1.position.subtract(conglomerate.centerOfMass);
    const r2 = p2.position.subtract(conglomerate.centerOfMass);
    const L1 = r1.cross(p1.momentum());
    const L2 = r2.cross(p2.momentum());
    const totalAngularMomentum = L1.add(L2);
    
    // Set angular velocity based on moment of inertia
    const I = conglomerate.calculateMomentOfInertiaTensor();
    const scalarI = (I[0][0] + I[1][1] + I[2][2]) / 3;
    
    if (scalarI > 1e-10) {
      conglomerate.angularVelocity = totalAngularMomentum.divide(scalarI);
    }
    
    this.conglomerates.push(conglomerate);
    
    return conglomerate;
  }

  /**
   * Merge two conglomerates into one
   * Particles penetrate deeper based on collision energy
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
   * @param c1 - First conglomerate
   * @param c2 - Second conglomerate
   * @returns New merged conglomerate
   */
  mergeConglomerates(c1: Conglomerate, c2: Conglomerate): Conglomerate {
    // Remove both conglomerates from the array
    const index1 = this.conglomerates.findIndex(c => c.id === c1.id);
    if (index1 !== -1) {
      this.conglomerates.splice(index1, 1);
    }
    
    const index2 = this.conglomerates.findIndex(c => c.id === c2.id);
    if (index2 !== -1) {
      this.conglomerates.splice(index2, 1);
    }
    
    // Calculate relative velocity for energy-based penetration
    const relativeVelocity = c1.velocity.subtract(c2.velocity);
    const collisionSpeed = relativeVelocity.magnitude();
    
    // Combine all particles from both conglomerates
    const allParticles = [...c1.particles, ...c2.particles];
    
    // Create new conglomerate WITH position adjustment for visual appeal
    // This ensures particles always touch, even if it adds some energy
    // Pass collision speed for energy-based penetration
    const merged = new Conglomerate(allParticles, true, collisionSpeed);
    
    // Calculate combined angular momentum to preserve it
    const L1 = c1.calculateAngularMomentum();
    const L2 = c2.calculateAngularMomentum();
    const totalAngularMomentum = L1.add(L2);
    
    // Set angular velocity based on new moment of inertia tensor
    // Simplified approach: use scalar approximation
    const I = merged.calculateMomentOfInertiaTensor();
    const scalarI = (I[0][0] + I[1][1] + I[2][2]) / 3;
    
    if (scalarI > 0) {
      // Approximate: ω ≈ L / I_avg
      merged.angularVelocity = totalAngularMomentum.divide(scalarI);
    }
    
    this.conglomerates.push(merged);
    
    return merged;
  }

  /**
   * Create a conglomerate from a particle and an existing conglomerate
   * Calculates combined angular momentum from both entities
   * Particles penetrate deeper based on collision energy
   * @param particle - Particle to add
   * @param conglomerate - Existing conglomerate
   * @returns New merged conglomerate
   */
  mergeParticleWithConglomerate(particle: Particle, conglomerate: Conglomerate): Conglomerate {
    // Remove particle and conglomerate
    this.removeParticle(particle);
    const index = this.conglomerates.findIndex(c => c.id === conglomerate.id);
    if (index !== -1) {
      this.conglomerates.splice(index, 1);
    }
    
    // Calculate relative velocity for energy-based penetration
    const relativeVelocity = particle.velocity.subtract(conglomerate.velocity);
    const collisionSpeed = relativeVelocity.magnitude();
    
    // Create new conglomerate with all particles
    // Adjust positions to ensure particles touch visually (prioritize visual appeal)
    // Pass collision speed for energy-based penetration
    const allParticles = [...conglomerate.particles, particle];
    const merged = new Conglomerate(allParticles, true, collisionSpeed);
    
    // Calculate total angular momentum:
    // 1. Angular momentum from the conglomerate
    const conglomerateAngularMomentum = conglomerate.calculateAngularMomentum();
    
    // 2. Angular momentum from the particle relative to new center of mass
    const r = particle.position.subtract(merged.centerOfMass);
    const particleAngularMomentum = r.cross(particle.momentum());
    
    // 3. Total angular momentum
    const totalAngularMomentum = conglomerateAngularMomentum.add(particleAngularMomentum);
    
    // Set angular velocity based on new moment of inertia
    const newInertiaTensor = merged.calculateMomentOfInertiaTensor();
    const scalarI = (newInertiaTensor[0][0] + newInertiaTensor[1][1] + newInertiaTensor[2][2]) / 3;
    
    if (scalarI > 1e-10) {
      merged.angularVelocity = totalAngularMomentum.divide(scalarI);
    }
    
    this.conglomerates.push(merged);
    return merged;
  }

  /**
   * Update all entities (particles and conglomerates)
   * Handles spawning and boundary behavior (bounce or wrap)
   * @param deltaTime - Time step duration
   * @param useBounce - Legacy parameter (ignored, use setBoundaryMode instead)
   * @param elasticity - Coefficient of restitution for bouncing (default 0.8)
   */
  update(deltaTime: number, useBounce: boolean = false, elasticity: number = 0.8): void {
    // Handle particle spawning based on spawn rate (only if injection is enabled)
    if (this.injectionEnabled) {
      this.timeSinceLastSpawn += deltaTime;
      const spawnInterval = 1 / this.config.spawnRate; // Time between spawns
      
      while (this.timeSinceLastSpawn >= spawnInterval) {
        this.spawnParticle();
        this.timeSinceLastSpawn -= spawnInterval;
      }
    }
    
    // Update all particles with selected boundary mode
    for (const particle of this.particles) {
      particle.update(deltaTime);
      
      if (this.boundaryMode === 'bounce') {
        this.bounceParticle(particle, elasticity);
      } else {
        this.wrapParticle(particle);
      }
    }
    
    // Update all conglomerates with selected boundary mode
    for (const conglomerate of this.conglomerates) {
      conglomerate.update(deltaTime);
      
      if (this.boundaryMode === 'bounce') {
        this.bounceConglomerate(conglomerate, elasticity);
      } else {
        this.wrapConglomerate(conglomerate);
      }
    }
  }

  /**
   * Get all entities (particles and conglomerates) as a single array
   * @returns Array of all entities
   */
  getAllEntities(): (Particle | Conglomerate)[] {
    return [...this.particles, ...this.conglomerates];
  }

  /**
   * Get the total count of entities
   * @returns Total number of particles and conglomerates
   */
  getEntityCount(): number {
    return this.particles.length + this.conglomerates.length;
  }

  /**
   * Clear all particles and conglomerates
   */
  clear(): void {
    this.particles = [];
    this.conglomerates = [];
    this.timeSinceLastSpawn = 0;
    this.totalParticlesSpawned = 0;
  }

  /**
   * Get the total number of particles spawned since start/reset
   * @returns Total particles spawned
   */
  getTotalParticlesSpawned(): number {
    return this.totalParticlesSpawned;
  }

  /**
   * Get the count of individual particles (not in conglomerates)
   * @returns Number of individual particles
   */
  getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Get the count of conglomerates
   * @returns Number of conglomerates
   */
  getConglomerateCount(): number {
    return this.conglomerates.length;
  }

  /**
   * Enable particle injection
   */
  enableInjection(): void {
    this.injectionEnabled = true;
  }

  /**
   * Disable particle injection
   */
  disableInjection(): void {
    this.injectionEnabled = false;
  }

  /**
   * Check if particle injection is enabled
   * @returns True if injection is enabled
   */
  isInjectionEnabled(): boolean {
    return this.injectionEnabled;
  }

  /**
   * Set the boundary behavior mode
   * @param mode - 'bounce' to bounce off walls, 'wrap' for wrap-around
   */
  setBoundaryMode(mode: 'bounce' | 'wrap'): void {
    this.boundaryMode = mode;
    console.log('Boundary mode:', mode);
  }

  /**
   * Get the current boundary behavior mode
   * @returns Current boundary mode
   */
  getBoundaryMode(): 'bounce' | 'wrap' {
    return this.boundaryMode;
  }
}
