/**
 * 2D Vector class with mathematical operations
 * Designed to be extensible to 3D in the future
 */
export class Vector2D {
  constructor(public x: number, public y: number) {}

  /**
   * Add another vector to this vector
   */
  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtract another vector from this vector
   */
  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  /**
   * Multiply this vector by a scalar
   */
  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * Divide this vector by a scalar
   */
  divide(scalar: number): Vector2D {
    if (scalar === 0) {
      throw new Error('Division by zero');
    }
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  /**
   * Calculate the magnitude (length) of this vector
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Return a normalized (unit length) version of this vector
   */
  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) {
      return Vector2D.zero();
    }
    return this.divide(mag);
  }

  /**
   * Calculate the dot product with another vector
   */
  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Calculate the distance to another vector
   */
  distanceTo(other: Vector2D): number {
    return this.subtract(other).magnitude();
  }

  /**
   * Create a zero vector
   */
  static zero(): Vector2D {
    return new Vector2D(0, 0);
  }

  /**
   * Create a random vector with components in the range [min, max]
   */
  static random(min: number, max: number): Vector2D {
    const x = min + Math.random() * (max - min);
    const y = min + Math.random() * (max - min);
    return new Vector2D(x, y);
  }
}
