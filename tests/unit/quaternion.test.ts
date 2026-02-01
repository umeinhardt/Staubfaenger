import { describe, it, expect } from 'vitest';
import { Quaternion } from '../../src/core/Quaternion';
import { Vector3D } from '../../src/core/Vector3D';

describe('Quaternion', () => {
  describe('Identity', () => {
    it('should create identity quaternion', () => {
      const q = Quaternion.identity();
      expect(q.w).toBe(1);
      expect(q.x).toBe(0);
      expect(q.y).toBe(0);
      expect(q.z).toBe(0);
    });

    it('should produce no rotation when applied to vector', () => {
      const q = Quaternion.identity();
      const v = new Vector3D(1, 2, 3);
      const rotated = q.rotateVector(v);
      
      expect(rotated.x).toBeCloseTo(v.x, 10);
      expect(rotated.y).toBeCloseTo(v.y, 10);
      expect(rotated.z).toBeCloseTo(v.z, 10);
    });
  });

  describe('From Axis-Angle', () => {
    it('should create quaternion from axis-angle', () => {
      const axis = new Vector3D(0, 0, 1); // Z-axis
      const angle = Math.PI / 2; // 90 degrees
      const q = Quaternion.fromAxisAngle(axis, angle);
      
      // For 90 degree rotation around Z: w=cos(45°), z=sin(45°)
      expect(q.w).toBeCloseTo(Math.cos(Math.PI / 4), 10);
      expect(q.x).toBeCloseTo(0, 10);
      expect(q.y).toBeCloseTo(0, 10);
      expect(q.z).toBeCloseTo(Math.sin(Math.PI / 4), 10);
    });

    it('should rotate vector 90 degrees around X axis', () => {
      const axis = new Vector3D(1, 0, 0); // X-axis
      const angle = Math.PI / 2; // 90 degrees
      const q = Quaternion.fromAxisAngle(axis, angle);
      
      const v = new Vector3D(0, 1, 0); // Y-axis vector
      const rotated = q.rotateVector(v);
      
      // After 90° rotation around X, Y should become Z
      expect(rotated.x).toBeCloseTo(0, 8);
      expect(rotated.y).toBeCloseTo(0, 8);
      expect(rotated.z).toBeCloseTo(1, 8);
    });

    it('should rotate vector 90 degrees around Y axis', () => {
      const axis = new Vector3D(0, 1, 0); // Y-axis
      const angle = Math.PI / 2; // 90 degrees
      const q = Quaternion.fromAxisAngle(axis, angle);
      
      const v = new Vector3D(1, 0, 0); // X-axis vector
      const rotated = q.rotateVector(v);
      
      // After 90° rotation around Y, X should become -Z
      expect(rotated.x).toBeCloseTo(0, 8);
      expect(rotated.y).toBeCloseTo(0, 8);
      expect(rotated.z).toBeCloseTo(-1, 8);
    });

    it('should rotate vector 90 degrees around Z axis', () => {
      const axis = new Vector3D(0, 0, 1); // Z-axis
      const angle = Math.PI / 2; // 90 degrees
      const q = Quaternion.fromAxisAngle(axis, angle);
      
      const v = new Vector3D(1, 0, 0); // X-axis vector
      const rotated = q.rotateVector(v);
      
      // After 90° rotation around Z, X should become Y
      expect(rotated.x).toBeCloseTo(0, 8);
      expect(rotated.y).toBeCloseTo(1, 8);
      expect(rotated.z).toBeCloseTo(0, 8);
    });
  });

  describe('Multiplication', () => {
    it('should compose rotations correctly', () => {
      // Rotate 90° around Z, then 90° around X
      const q1 = Quaternion.fromAxisAngle(new Vector3D(0, 0, 1), Math.PI / 2);
      const q2 = Quaternion.fromAxisAngle(new Vector3D(1, 0, 0), Math.PI / 2);
      
      // Composition: q2 * q1 (apply q1 first, then q2)
      const combined = q2.multiply(q1);
      
      // Apply to X-axis vector
      const v = new Vector3D(1, 0, 0);
      const rotated = combined.rotateVector(v);
      
      // First rotation (q1): X -> Y
      // Second rotation (q2): Y -> Z
      expect(rotated.x).toBeCloseTo(0, 8);
      expect(rotated.y).toBeCloseTo(0, 8);
      expect(rotated.z).toBeCloseTo(1, 8);
    });

    it('should satisfy identity property', () => {
      const q = Quaternion.fromAxisAngle(new Vector3D(1, 1, 1).normalize(), Math.PI / 3);
      const identity = Quaternion.identity();
      
      const result1 = q.multiply(identity);
      const result2 = identity.multiply(q);
      
      expect(result1.w).toBeCloseTo(q.w, 10);
      expect(result1.x).toBeCloseTo(q.x, 10);
      expect(result1.y).toBeCloseTo(q.y, 10);
      expect(result1.z).toBeCloseTo(q.z, 10);
      
      expect(result2.w).toBeCloseTo(q.w, 10);
      expect(result2.x).toBeCloseTo(q.x, 10);
      expect(result2.y).toBeCloseTo(q.y, 10);
      expect(result2.z).toBeCloseTo(q.z, 10);
    });
  });

  describe('Conjugate', () => {
    it('should calculate conjugate correctly', () => {
      const q = new Quaternion(1, 2, 3, 4);
      const conj = q.conjugate();
      
      expect(conj.w).toBe(1);
      expect(conj.x).toBe(-2);
      expect(conj.y).toBe(-3);
      expect(conj.z).toBe(-4);
    });

    it('should invert rotation for unit quaternions', () => {
      const axis = new Vector3D(1, 1, 1).normalize();
      const angle = Math.PI / 3;
      const q = Quaternion.fromAxisAngle(axis, angle);
      const qInv = q.conjugate();
      
      // q * q^(-1) should be identity
      const result = q.multiply(qInv);
      
      expect(result.w).toBeCloseTo(1, 8);
      expect(result.x).toBeCloseTo(0, 8);
      expect(result.y).toBeCloseTo(0, 8);
      expect(result.z).toBeCloseTo(0, 8);
    });
  });

  describe('Normalization', () => {
    it('should normalize quaternion to unit length', () => {
      const q = new Quaternion(1, 2, 3, 4);
      const normalized = q.normalize();
      const magnitude = normalized.magnitude();
      
      expect(magnitude).toBeCloseTo(1, 10);
    });

    it('should maintain unit length for rotation quaternions', () => {
      const q = Quaternion.fromAxisAngle(new Vector3D(1, 0, 0), Math.PI / 4);
      const magnitude = q.magnitude();
      
      expect(magnitude).toBeCloseTo(1, 10);
    });

    it('should handle zero quaternion', () => {
      const q = new Quaternion(0, 0, 0, 0);
      const normalized = q.normalize();
      
      // Should return identity for zero quaternion
      expect(normalized.w).toBe(1);
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
      expect(normalized.z).toBe(0);
    });
  });

  describe('Rotate Vector', () => {
    it('should preserve vector magnitude', () => {
      const q = Quaternion.fromAxisAngle(new Vector3D(1, 1, 1).normalize(), Math.PI / 3);
      const v = new Vector3D(3, 4, 5);
      const originalMagnitude = v.magnitude();
      
      const rotated = q.rotateVector(v);
      const rotatedMagnitude = rotated.magnitude();
      
      expect(rotatedMagnitude).toBeCloseTo(originalMagnitude, 8);
    });

    it('should rotate 180 degrees correctly', () => {
      const q = Quaternion.fromAxisAngle(new Vector3D(0, 0, 1), Math.PI);
      const v = new Vector3D(1, 0, 0);
      const rotated = q.rotateVector(v);
      
      // 180° rotation around Z should flip X to -X
      expect(rotated.x).toBeCloseTo(-1, 8);
      expect(rotated.y).toBeCloseTo(0, 8);
      expect(rotated.z).toBeCloseTo(0, 8);
    });
  });

  describe('From Euler', () => {
    it('should create quaternion from Euler angles', () => {
      const q = Quaternion.fromEuler(0, 0, Math.PI / 2);
      
      // Should be equivalent to 90° rotation around Z
      const v = new Vector3D(1, 0, 0);
      const rotated = q.rotateVector(v);
      
      expect(rotated.x).toBeCloseTo(0, 8);
      expect(rotated.y).toBeCloseTo(1, 8);
      expect(rotated.z).toBeCloseTo(0, 8);
    });

    it('should handle zero Euler angles', () => {
      const q = Quaternion.fromEuler(0, 0, 0);
      
      // Should be identity
      expect(q.w).toBeCloseTo(1, 10);
      expect(q.x).toBeCloseTo(0, 10);
      expect(q.y).toBeCloseTo(0, 10);
      expect(q.z).toBeCloseTo(0, 10);
    });
  });

  describe('To Rotation Matrix', () => {
    it('should convert identity to identity matrix', () => {
      const q = Quaternion.identity();
      const matrix = q.toRotationMatrix();
      
      // Should be 3x3 identity matrix
      expect(matrix[0][0]).toBeCloseTo(1, 10);
      expect(matrix[0][1]).toBeCloseTo(0, 10);
      expect(matrix[0][2]).toBeCloseTo(0, 10);
      expect(matrix[1][0]).toBeCloseTo(0, 10);
      expect(matrix[1][1]).toBeCloseTo(1, 10);
      expect(matrix[1][2]).toBeCloseTo(0, 10);
      expect(matrix[2][0]).toBeCloseTo(0, 10);
      expect(matrix[2][1]).toBeCloseTo(0, 10);
      expect(matrix[2][2]).toBeCloseTo(1, 10);
    });

    it('should produce valid rotation matrix', () => {
      const q = Quaternion.fromAxisAngle(new Vector3D(0, 0, 1), Math.PI / 2);
      const matrix = q.toRotationMatrix();
      
      // Apply matrix to vector [1, 0, 0]
      const x = matrix[0][0] * 1 + matrix[0][1] * 0 + matrix[0][2] * 0;
      const y = matrix[1][0] * 1 + matrix[1][1] * 0 + matrix[1][2] * 0;
      const z = matrix[2][0] * 1 + matrix[2][1] * 0 + matrix[2][2] * 0;
      
      // Should rotate X to Y
      expect(x).toBeCloseTo(0, 8);
      expect(y).toBeCloseTo(1, 8);
      expect(z).toBeCloseTo(0, 8);
    });
  });

  describe('To Euler', () => {
    it('should convert back to Euler angles', () => {
      const originalX = Math.PI / 6;
      const originalY = Math.PI / 4;
      const originalZ = Math.PI / 3;
      
      const q = Quaternion.fromEuler(originalX, originalY, originalZ);
      const euler = q.toEuler();
      
      // Should recover original angles (within tolerance)
      expect(euler.x).toBeCloseTo(originalX, 6);
      expect(euler.y).toBeCloseTo(originalY, 6);
      expect(euler.z).toBeCloseTo(originalZ, 6);
    });
  });
});
