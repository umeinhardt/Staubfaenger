/**
 * Interface for gravity calculation formulas
 * Allows for extensible gravity implementations
 */
export interface GravityFormula {
  /**
   * Name of the gravity formula
   */
  name: string;

  /**
   * Calculate gravitational force between two masses
   * @param m1 - Mass of first object
   * @param m2 - Mass of second object
   * @param distance - Distance between the objects
   * @returns Magnitude of gravitational force
   */
  calculate(m1: number, m2: number, distance: number): number;
}

/**
 * Newtonian gravity implementation
 * F = G × m1 × m2 / r²
 */
export class NewtonianGravity implements GravityFormula {
  public readonly name = 'Newtonian';
  private readonly G: number;
  private readonly epsilon: number;

  /**
   * Create a Newtonian gravity calculator
   * @param G - Gravitational constant (default: 6.674e-11 for SI units, but can be scaled for simulation)
   * @param epsilon - Minimum distance to prevent division by zero (default: 0.01)
   */
  constructor(G: number = 1.0, epsilon: number = 0.01) {
    this.G = G;
    this.epsilon = epsilon;
  }

  /**
   * Calculate Newtonian gravitational force
   * F = G × m1 × m2 / r²
   * Uses epsilon to ensure numerical stability when objects are very close
   * @param m1 - Mass of first object
   * @param m2 - Mass of second object
   * @param distance - Distance between the objects
   * @returns Magnitude of gravitational force
   */
  calculate(m1: number, m2: number, distance: number): number {
    // Use epsilon to prevent division by zero and ensure numerical stability
    const effectiveDistance = Math.max(distance, this.epsilon);
    
    // F = G × m1 × m2 / r²
    return this.G * m1 * m2 / (effectiveDistance * effectiveDistance);
  }
}
