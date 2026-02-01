import { Vector3D } from './Vector3D';

/**
 * Quaternion class for representing 3D rotations
 * Provides gimbal-lock-free rotation representation
 * Format: w + xi + yj + zk where w is scalar, (x,y,z) is vector part
 */
export class Quaternion {
  constructor(
    public w: number,  // Scalar part
    public x: number,  // Vector part x
    public y: number,  // Vector part y
    public z: number   // Vector part z
  ) {}

  /**
   * Create an identity quaternion (no rotation)
   * @returns Identity quaternion (1, 0, 0, 0)
   */
  static identity(): Quaternion {
    return new Quaternion(1, 0, 0, 0);
  }

  /**
   * Create a quaternion from axis-angle representation
   * @param axis - Rotation axis (should be normalized)
   * @param angle - Rotation angle in radians
   * @returns Quaternion representing the rotation
   */
  static fromAxisAngle(axis: Vector3D, angle: number): Quaternion {
    const halfAngle = angle / 2;
    const sinHalf = Math.sin(halfAngle);
    const cosHalf = Math.cos(halfAngle);
    
    // Normalize axis to be safe
    const normalizedAxis = axis.normalize();
    
    return new Quaternion(
      cosHalf,
      normalizedAxis.x * sinHalf,
      normalizedAxis.y * sinHalf,
      normalizedAxis.z * sinHalf
    );
  }

  /**
   * Create a quaternion from Euler angles (XYZ order)
   * @param x - Rotation around X axis in radians
   * @param y - Rotation around Y axis in radians
   * @param z - Rotation around Z axis in radians
   * @returns Quaternion representing the combined rotation
   */
  static fromEuler(x: number, y: number, z: number): Quaternion {
    // Calculate half angles
    const cx = Math.cos(x / 2);
    const cy = Math.cos(y / 2);
    const cz = Math.cos(z / 2);
    const sx = Math.sin(x / 2);
    const sy = Math.sin(y / 2);
    const sz = Math.sin(z / 2);

    // XYZ order
    return new Quaternion(
      cx * cy * cz + sx * sy * sz,
      sx * cy * cz - cx * sy * sz,
      cx * sy * cz + sx * cy * sz,
      cx * cy * sz - sx * sy * cz
    );
  }

  /**
   * Multiply this quaternion by another (quaternion composition)
   * Note: Quaternion multiplication is not commutative (q1 * q2 ≠ q2 * q1)
   * @param other - Quaternion to multiply with
   * @returns New quaternion representing combined rotation
   */
  multiply(other: Quaternion): Quaternion {
    return new Quaternion(
      this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z,
      this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
      this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
      this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w
    );
  }

  /**
   * Calculate the conjugate of this quaternion
   * For unit quaternions, conjugate equals inverse
   * @returns Conjugate quaternion
   */
  conjugate(): Quaternion {
    return new Quaternion(this.w, -this.x, -this.y, -this.z);
  }

  /**
   * Calculate the magnitude (norm) of this quaternion
   * @returns Magnitude
   */
  magnitude(): number {
    return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Normalize this quaternion to unit length
   * @returns Normalized quaternion
   */
  normalize(): Quaternion {
    const mag = this.magnitude();
    if (mag === 0) {
      return Quaternion.identity();
    }
    return new Quaternion(
      this.w / mag,
      this.x / mag,
      this.y / mag,
      this.z / mag
    );
  }

  /**
   * Rotate a 3D vector by this quaternion
   * Uses the formula: v' = q * v * q^(-1)
   * where v is treated as a quaternion with w=0
   * @param v - Vector to rotate
   * @returns Rotated vector
   */
  rotateVector(v: Vector3D): Vector3D {
    // Represent vector as quaternion with w=0
    const vecQuat = new Quaternion(0, v.x, v.y, v.z);
    
    // Calculate q * v * q^(-1)
    const conjugateQuat = this.conjugate();
    const result = this.multiply(vecQuat).multiply(conjugateQuat);
    
    // Extract vector part
    return new Vector3D(result.x, result.y, result.z);
  }

  /**
   * Convert quaternion to 3x3 rotation matrix
   * Returns matrix as nested array [row][col]
   * @returns 3x3 rotation matrix
   */
  toRotationMatrix(): number[][] {
    const w = this.w, x = this.x, y = this.y, z = this.z;
    
    return [
      [
        1 - 2*y*y - 2*z*z,
        2*x*y - 2*w*z,
        2*x*z + 2*w*y
      ],
      [
        2*x*y + 2*w*z,
        1 - 2*x*x - 2*z*z,
        2*y*z - 2*w*x
      ],
      [
        2*x*z - 2*w*y,
        2*y*z + 2*w*x,
        1 - 2*x*x - 2*y*y
      ]
    ];
  }

  /**
   * Convert quaternion to Euler angles (XYZ order)
   * @returns Object with x, y, z rotation angles in radians
   */
  toEuler(): { x: number; y: number; z: number } {
    const w = this.w, x = this.x, y = this.y, z = this.z;
    
    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);
    
    // Pitch (y-axis rotation)
    const sinp = 2 * (w * y - z * x);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * Math.PI / 2; // Use 90 degrees if out of range
    } else {
      pitch = Math.asin(sinp);
    }
    
    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
    
    return { x: roll, y: pitch, z: yaw };
  }
}
