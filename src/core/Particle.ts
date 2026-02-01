import { Vector3D } from './Vector3D';

/**
 * Represents a single dust particle in the 3D simulation
 * with position, velocity, angular velocity, and mass properties
 */
export class Particle {
  public readonly id: string;
  public position: Vector3D;
  public velocity: Vector3D;
  public angularVelocity: Vector3D;
  public readonly mass: number;
  public readonly radius: number;
  public age: number; // Age in seconds since particle creation
  public frozenColor: number | null; // Frozen color as hex number (null = use dynamic color)

  /**
   * Create a new particle
   * @param position - Initial position vector (3D)
   * @param velocity - Initial velocity vector (3D)
   * @param mass - Mass of the particle (radius is calculated proportionally)
   * @param angularVelocity - Initial angular velocity vector (3D), defaults to zero
   */
  constructor(position: Vector3D, velocity: Vector3D, mass: number, angularVelocity?: Vector3D) {
    this.id = this.generateId();
    this.position = position;
    this.velocity = velocity;
    this.angularVelocity = angularVelocity || Vector3D.zero();
    this.mass = mass;
    // Radius proportional to mass: r = k * sqrt(m)
    // Using sqrt to maintain volume proportional to mass (V = 4/3*π*r³ ∝ m)
    this.radius = Math.sqrt(mass);
    this.age = 0; // Start with age 0
    this.frozenColor = null; // No frozen color initially
  }

  /**
   * Apply a force to the particle for a given time step
   * Uses Newton's second law: F = ma, therefore a = F/m
   * @param force - Force vector to apply (3D)
   * @param deltaTime - Time step duration
   */
  applyForce(force: Vector3D, deltaTime: number): void {
    // Calculate acceleration: a = F / m
    const acceleration = force.divide(this.mass);
    
    // Update velocity: v = v + a * dt
    this.velocity = this.velocity.add(acceleration.multiply(deltaTime));
  }

  /**
   * Apply a torque to the particle for a given time step
   * Updates angular velocity based on torque and moment of inertia
   * For a sphere: I = (2/5) * m * r²
   * Angular acceleration: α = τ / I
   * @param torque - Torque vector to apply (3D)
   * @param deltaTime - Time step duration
   */
  applyTorque(torque: Vector3D, deltaTime: number): void {
    // Calculate moment of inertia for a sphere: I = (2/5) * m * r²
    const momentOfInertia = (2 / 5) * this.mass * this.radius * this.radius;
    
    // Calculate angular acceleration: α = τ / I
    const angularAcceleration = torque.divide(momentOfInertia);
    
    // Update angular velocity: ω = ω + α * dt
    this.angularVelocity = this.angularVelocity.add(angularAcceleration.multiply(deltaTime));
  }

  /**
   * Update particle position based on current velocity
   * @param deltaTime - Time step duration
   */
  update(deltaTime: number): void {
    // Update position: p = p + v * dt
    this.position = this.position.add(this.velocity.multiply(deltaTime));
    
    // Update age
    this.age += deltaTime;
  }

  /**
   * Calculate the kinetic energy of the particle
   * KE = 0.5 * m * v²
   * @returns Kinetic energy
   */
  kineticEnergy(): number {
    const velocitySquared = this.velocity.dot(this.velocity);
    return 0.5 * this.mass * velocitySquared;
  }

  /**
   * Calculate the linear momentum of the particle
   * p = m * v
   * @returns Momentum vector (3D)
   */
  momentum(): Vector3D {
    return this.velocity.multiply(this.mass);
  }

  /**
   * Calculate the angular momentum of the particle
   * L = I * ω where I is moment of inertia and ω is angular velocity
   * For a sphere: I = (2/5) * m * r²
   * @returns Angular momentum vector (3D)
   */
  angularMomentum(): Vector3D {
    // Calculate moment of inertia for a sphere: I = (2/5) * m * r²
    const momentOfInertia = (2 / 5) * this.mass * this.radius * this.radius;
    
    // L = I * ω
    return this.angularVelocity.multiply(momentOfInertia);
  }

  /**
   * Generate a unique ID for the particle
   * @returns Unique identifier string
   */
  private generateId(): string {
    return `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
