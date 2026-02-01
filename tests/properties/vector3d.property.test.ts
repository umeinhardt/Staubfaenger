import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Vector3D } from '../../src/core/Vector3D';

// Feature: 3d-particle-simulation
// These tests validate the correctness properties for 3D vector mathematics

describe('Vector3D Properties', () => {
  // Property 1: Vector addition is component-wise
  // Validates: Requirements 1.2
  it('Property 1: should add vectors component-wise', () => {
    fc.assert(
      fc.property(
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        (v1, v2) => {
          const vec1 = new Vector3D(v1.x, v1.y, v1.z);
          const vec2 = new Vector3D(v2.x, v2.y, v2.z);
          const result = vec1.add(vec2);
          
          expect(result.x).toBeCloseTo(v1.x + v2.x, 10);
          expect(result.y).toBeCloseTo(v1.y + v2.y, 10);
          expect(result.z).toBeCloseTo(v1.z + v2.z, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2: Vector subtraction is component-wise
  // Validates: Requirements 1.3
  it('Property 2: should subtract vectors component-wise', () => {
    fc.assert(
      fc.property(
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        (v1, v2) => {
          const vec1 = new Vector3D(v1.x, v1.y, v1.z);
          const vec2 = new Vector3D(v2.x, v2.y, v2.z);
          const result = vec1.subtract(vec2);
          
          expect(result.x).toBeCloseTo(v1.x - v2.x, 10);
          expect(result.y).toBeCloseTo(v1.y - v2.y, 10);
          expect(result.z).toBeCloseTo(v1.z - v2.z, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Scalar multiplication scales all components
  // Validates: Requirements 1.4
  it('Property 3: should multiply vector by scalar', () => {
    fc.assert(
      fc.property(
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        fc.float({ min: -100, max: 100, noNaN: true }),
        (v, scalar) => {
          const vec = new Vector3D(v.x, v.y, v.z);
          const result = vec.multiply(scalar);
          
          expect(result.x).toBeCloseTo(v.x * scalar, 10);
          expect(result.y).toBeCloseTo(v.y * scalar, 10);
          expect(result.z).toBeCloseTo(v.z * scalar, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 4: Magnitude follows Euclidean formula
  // Validates: Requirements 1.5
  it('Property 4: should calculate magnitude using Euclidean formula', () => {
    fc.assert(
      fc.property(
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        (v) => {
          const vec = new Vector3D(v.x, v.y, v.z);
          const magnitude = vec.magnitude();
          const expected = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
          
          expect(magnitude).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Normalization produces unit vectors
  // Validates: Requirements 1.6
  it('Property 5: should normalize to unit vector', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        (v) => {
          const vec = new Vector3D(v.x, v.y, v.z);
          const magnitude = vec.magnitude();
          
          // Skip zero or near-zero vectors
          if (magnitude < 1e-10) {
            return true;
          }
          
          const normalized = vec.normalize();
          const normalizedMagnitude = normalized.magnitude();
          
          // Normalized vector should have magnitude 1
          expect(normalizedMagnitude).toBeCloseTo(1, 8);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 6: Dot product follows formula
  // Validates: Requirements 1.7
  it('Property 6: should calculate dot product correctly', () => {
    fc.assert(
      fc.property(
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        (v1, v2) => {
          const vec1 = new Vector3D(v1.x, v1.y, v1.z);
          const vec2 = new Vector3D(v2.x, v2.y, v2.z);
          const dotProduct = vec1.dot(vec2);
          const expected = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
          
          expect(dotProduct).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 7: Cross product is perpendicular to both inputs
  // Validates: Requirements 1.8
  it('Property 7: should produce cross product perpendicular to both inputs', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.float({ min: -100, max: 100, noNaN: true }),
          y: fc.float({ min: -100, max: 100, noNaN: true }),
          z: fc.float({ min: -100, max: 100, noNaN: true })
        }),
        fc.record({
          x: fc.float({ min: -100, max: 100, noNaN: true }),
          y: fc.float({ min: -100, max: 100, noNaN: true }),
          z: fc.float({ min: -100, max: 100, noNaN: true })
        }),
        (v1, v2) => {
          const vec1 = new Vector3D(v1.x, v1.y, v1.z);
          const vec2 = new Vector3D(v2.x, v2.y, v2.z);
          
          // Skip if vectors are parallel or near-zero
          const mag1 = vec1.magnitude();
          const mag2 = vec2.magnitude();
          if (mag1 < 1e-6 || mag2 < 1e-6) {
            return true;
          }
          
          const crossProduct = vec1.cross(vec2);
          
          // Skip if cross product is near-zero (parallel vectors)
          if (crossProduct.magnitude() < 1e-6) {
            return true;
          }
          
          // Cross product should be perpendicular to both inputs
          // (dot product should be zero)
          const dot1 = crossProduct.dot(vec1);
          const dot2 = crossProduct.dot(vec2);
          
          expect(Math.abs(dot1)).toBeLessThan(1e-4);
          expect(Math.abs(dot2)).toBeLessThan(1e-4);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 8: Distance follows Euclidean formula
  // Validates: Requirements 1.9
  it('Property 8: should calculate distance using Euclidean formula', () => {
    fc.assert(
      fc.property(
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        fc.record({ 
          x: fc.float({ min: -1000, max: 1000, noNaN: true }),
          y: fc.float({ min: -1000, max: 1000, noNaN: true }),
          z: fc.float({ min: -1000, max: 1000, noNaN: true })
        }),
        (v1, v2) => {
          const vec1 = new Vector3D(v1.x, v1.y, v1.z);
          const vec2 = new Vector3D(v2.x, v2.y, v2.z);
          const distance = vec1.distanceTo(vec2);
          
          const dx = v2.x - v1.x;
          const dy = v2.y - v1.y;
          const dz = v2.z - v1.z;
          const expected = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          expect(distance).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
