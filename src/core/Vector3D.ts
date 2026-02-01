/**
 * 3D Vector class with mathematical operations
 * Provides all operations needed for 3D physics calculations
 */
export class Vector3D {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}

  /**
   * Add another vector to this vector
   * @param other - Vector to add
   * @returns New vector with component-wise addition
   */
  add(other: Vector3D): Vector3D {
    return new Vector3D(
      this.x + other.x,
      this.y + other.y,
      this.z + other.z
    );
  }

  /**
   * Subtract another vector from this vector
   * @param other - Vector to subtract
   * @returns New vector with component-wise subtraction
   */
  subtract(other: Vector3D): Vector3D {
    return new Vector3D(
      this.x - other.x,
      this.y - other.y,
      this.z - other.z
    );
  }

  /**
   * Multiply this vector by a scalar
   * @param scalar - Scalar value to multiply by
   * @returns New vector with all components scaled
   */
  multiply(scalar: number): Vector3D {
    return new Vector3D(
      this.x * scalar,
      this.y * scalar,
      this.z * scalar
    );
  }

  /**
   * Divide this vector by a scalar
   * @param scalar - Scalar value to divide by
   * @returns New vector with all components divided
   * @throws Error if scalar is zero
   */
  divide(scalar: number): Vector3D {
    if (scalar === 0) {
      throw new Error('Division by zero');
    }
    return new Vector3D(
      this.x / scalar,
      this.y / scalar,
      this.z / scalar
    );
  }

  /**
   * Calculate the magnitude (length) of this vector
   * Uses the Euclidean formula: sqrt(x² + y² + z²)
   * @returns Magnitude of the vector
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Calculate the squared magnitude of this vector
   * More efficient than magnitude() when only comparing lengths
   * @returns Squared magnitude of the vector
   */
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * Return a normalized (unit length) version of this vector
   * @returns Unit vector in the same direction, or zero vector if magnitude is zero
   */
  normalize(): Vector3D {
    const mag = this.magnitude();
    if (mag === 0) {
      return Vector3D.zero();
    }
    return this.divide(mag);
  }

  /**
   * Calculate the dot product with another vector
   * Formula: x1*x2 + y1*y2 + z1*z2
   * @param other - Vector to compute dot product with
   * @returns Scalar dot product
   */
  dot(other: Vector3D): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   * Calculate the cross product with another vector
   * Returns a vector perpendicular to both input vectors
   * Formula: (y1*z2 - z1*y2, z1*x2 - x1*z2, x1*y2 - y1*x2)
   * @param other - Vector to compute cross product with
   * @returns New vector perpendicular to both inputs
   */
  cross(other: Vector3D): Vector3D {
    return new Vector3D(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  /**
   * Calculate the distance to another vector
   * Uses Euclidean distance formula in 3D space
   * @param other - Vector to calculate distance to
   * @returns Distance between the two vectors
   */
  distanceTo(other: Vector3D): number {
    return this.subtract(other).magnitude();
  }

  /**
   * Check if this vector equals another vector within an epsilon tolerance
   * @param other - Vector to compare with
   * @param epsilon - Tolerance for floating-point comparison (default: 1e-10)
   * @returns True if vectors are equal within epsilon
   */
  equals(other: Vector3D, epsilon: number = 1e-10): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon &&
      Math.abs(this.z - other.z) < epsilon
    );
  }

  /**
   * Create a zero vector (0, 0, 0)
   * @returns Zero vector
   */
  static zero(): Vector3D {
    return new Vector3D(0, 0, 0);
  }

  /**
   * Create a random vector with components in the range [min, max]
   * @param min - Minimum value for each component
   * @param max - Maximum value for each component
   * @returns Random vector
   */
  static random(min: number, max: number): Vector3D {
    const x = min + Math.random() * (max - min);
    const y = min + Math.random() * (max - min);
    const z = min + Math.random() * (max - min);
    return new Vector3D(x, y, z);
  }
}
