import { describe, it, expect } from 'vitest';
import { Boundary } from '../../src/core/Boundary';
import { Vector3D } from '../../src/core/Vector3D';

describe('Boundary Unit Tests', () => {
  const boundary = new Boundary(
    new Vector3D(-50, -50, -50),
    new Vector3D(50, 50, 50)
  );

  describe('Constructor', () => {
    it('should create a valid boundary', () => {
      expect(boundary.min.x).toBe(-50);
      expect(boundary.min.y).toBe(-50);
      expect(boundary.min.z).toBe(-50);
      expect(boundary.max.x).toBe(50);
      expect(boundary.max.y).toBe(50);
      expect(boundary.max.z).toBe(50);
    });

    it('should throw error if min >= max in any dimension', () => {
      expect(() => new Boundary(
        new Vector3D(0, 0, 0),
        new Vector3D(-1, 10, 10)
      )).toThrow('Invalid boundary');

      expect(() => new Boundary(
        new Vector3D(0, 0, 0),
        new Vector3D(10, -1, 10)
      )).toThrow('Invalid boundary');

      expect(() => new Boundary(
        new Vector3D(0, 0, 0),
        new Vector3D(10, 10, -1)
      )).toThrow('Invalid boundary');
    });
  });

  describe('wrapPosition', () => {
    it('should wrap position exceeding positive x boundary', () => {
      const position = new Vector3D(55, 0, 0);
      const wrapped = boundary.wrapPosition(position);
      expect(wrapped.x).toBeCloseTo(-45, 5);
      expect(wrapped.y).toBe(0);
      expect(wrapped.z).toBe(0);
    });

    it('should wrap position exceeding negative x boundary', () => {
      const position = new Vector3D(-55, 0, 0);
      const wrapped = boundary.wrapPosition(position);
      expect(wrapped.x).toBeCloseTo(45, 5);
      expect(wrapped.y).toBe(0);
      expect(wrapped.z).toBe(0);
    });

    it('should wrap position exceeding positive y boundary', () => {
      const position = new Vector3D(0, 55, 0);
      const wrapped = boundary.wrapPosition(position);
      expect(wrapped.x).toBe(0);
      expect(wrapped.y).toBeCloseTo(-45, 5);
      expect(wrapped.z).toBe(0);
    });

    it('should wrap position exceeding negative y boundary', () => {
      const position = new Vector3D(0, -55, 0);
      const wrapped = boundary.wrapPosition(position);
      expect(wrapped.x).toBe(0);
      expect(wrapped.y).toBeCloseTo(45, 5);
      expect(wrapped.z).toBe(0);
    });

    it('should wrap position exceeding positive z boundary', () => {
      const position = new Vector3D(0, 0, 55);
      const wrapped = boundary.wrapPosition(position);
      expect(wrapped.x).toBe(0);
      expect(wrapped.y).toBe(0);
      expect(wrapped.z).toBeCloseTo(-45, 5);
    });

    it('should wrap position exceeding negative z boundary', () => {
      const position = new Vector3D(0, 0, -55);
      const wrapped = boundary.wrapPosition(position);
      expect(wrapped.x).toBe(0);
      expect(wrapped.y).toBe(0);
      expect(wrapped.z).toBeCloseTo(45, 5);
    });

    it('should wrap corner positions (multiple dimensions simultaneously)', () => {
      // Exceeds positive x, y, z
      const corner1 = new Vector3D(55, 55, 55);
      const wrapped1 = boundary.wrapPosition(corner1);
      expect(wrapped1.x).toBeCloseTo(-45, 5);
      expect(wrapped1.y).toBeCloseTo(-45, 5);
      expect(wrapped1.z).toBeCloseTo(-45, 5);

      // Exceeds negative x, y, z
      const corner2 = new Vector3D(-55, -55, -55);
      const wrapped2 = boundary.wrapPosition(corner2);
      expect(wrapped2.x).toBeCloseTo(45, 5);
      expect(wrapped2.y).toBeCloseTo(45, 5);
      expect(wrapped2.z).toBeCloseTo(45, 5);

      // Mixed: positive x, negative y, positive z
      const corner3 = new Vector3D(55, -55, 55);
      const wrapped3 = boundary.wrapPosition(corner3);
      expect(wrapped3.x).toBeCloseTo(-45, 5);
      expect(wrapped3.y).toBeCloseTo(45, 5);
      expect(wrapped3.z).toBeCloseTo(-45, 5);
    });

    it('should handle particle exactly at boundary', () => {
      // At max boundary
      const atMax = new Vector3D(50, 50, 50);
      const wrappedMax = boundary.wrapPosition(atMax);
      expect(wrappedMax.x).toBe(50);
      expect(wrappedMax.y).toBe(50);
      expect(wrappedMax.z).toBe(50);

      // At min boundary
      const atMin = new Vector3D(-50, -50, -50);
      const wrappedMin = boundary.wrapPosition(atMin);
      expect(wrappedMin.x).toBe(-50);
      expect(wrappedMin.y).toBe(-50);
      expect(wrappedMin.z).toBe(-50);
    });

    it('should not modify position inside boundary', () => {
      const inside = new Vector3D(10, 20, 30);
      const wrapped = boundary.wrapPosition(inside);
      expect(wrapped.x).toBe(10);
      expect(wrapped.y).toBe(20);
      expect(wrapped.z).toBe(30);
    });
  });

  describe('isOutside', () => {
    it('should return false for position inside boundary', () => {
      const inside = new Vector3D(0, 0, 0);
      expect(boundary.isOutside(inside)).toBe(false);
    });

    it('should return true for position outside positive x boundary', () => {
      const outside = new Vector3D(51, 0, 0);
      expect(boundary.isOutside(outside)).toBe(true);
    });

    it('should return true for position outside negative x boundary', () => {
      const outside = new Vector3D(-51, 0, 0);
      expect(boundary.isOutside(outside)).toBe(true);
    });

    it('should return true for position outside positive y boundary', () => {
      const outside = new Vector3D(0, 51, 0);
      expect(boundary.isOutside(outside)).toBe(true);
    });

    it('should return true for position outside negative y boundary', () => {
      const outside = new Vector3D(0, -51, 0);
      expect(boundary.isOutside(outside)).toBe(true);
    });

    it('should return true for position outside positive z boundary', () => {
      const outside = new Vector3D(0, 0, 51);
      expect(boundary.isOutside(outside)).toBe(true);
    });

    it('should return true for position outside negative z boundary', () => {
      const outside = new Vector3D(0, 0, -51);
      expect(boundary.isOutside(outside)).toBe(true);
    });

    it('should return false for position exactly at boundary', () => {
      const atBoundary = new Vector3D(50, 50, 50);
      expect(boundary.isOutside(atBoundary)).toBe(false);
    });
  });

  describe('getRandomSpawnPosition', () => {
    it('should spawn on -X face (min x)', () => {
      // Test multiple times to increase chance of hitting this face
      let foundMinX = false;
      for (let i = 0; i < 50; i++) {
        const pos = boundary.getRandomSpawnPosition();
        if (Math.abs(pos.x - boundary.min.x) < 1e-10) {
          foundMinX = true;
          expect(pos.y).toBeGreaterThanOrEqual(boundary.min.y);
          expect(pos.y).toBeLessThanOrEqual(boundary.max.y);
          expect(pos.z).toBeGreaterThanOrEqual(boundary.min.z);
          expect(pos.z).toBeLessThanOrEqual(boundary.max.z);
          break;
        }
      }
      expect(foundMinX).toBe(true);
    });

    it('should spawn on +X face (max x)', () => {
      let foundMaxX = false;
      for (let i = 0; i < 50; i++) {
        const pos = boundary.getRandomSpawnPosition();
        if (Math.abs(pos.x - boundary.max.x) < 1e-10) {
          foundMaxX = true;
          expect(pos.y).toBeGreaterThanOrEqual(boundary.min.y);
          expect(pos.y).toBeLessThanOrEqual(boundary.max.y);
          expect(pos.z).toBeGreaterThanOrEqual(boundary.min.z);
          expect(pos.z).toBeLessThanOrEqual(boundary.max.z);
          break;
        }
      }
      expect(foundMaxX).toBe(true);
    });

    it('should spawn on -Y face (min y)', () => {
      let foundMinY = false;
      for (let i = 0; i < 50; i++) {
        const pos = boundary.getRandomSpawnPosition();
        if (Math.abs(pos.y - boundary.min.y) < 1e-10) {
          foundMinY = true;
          expect(pos.x).toBeGreaterThanOrEqual(boundary.min.x);
          expect(pos.x).toBeLessThanOrEqual(boundary.max.x);
          expect(pos.z).toBeGreaterThanOrEqual(boundary.min.z);
          expect(pos.z).toBeLessThanOrEqual(boundary.max.z);
          break;
        }
      }
      expect(foundMinY).toBe(true);
    });

    it('should spawn on +Y face (max y)', () => {
      let foundMaxY = false;
      for (let i = 0; i < 50; i++) {
        const pos = boundary.getRandomSpawnPosition();
        if (Math.abs(pos.y - boundary.max.y) < 1e-10) {
          foundMaxY = true;
          expect(pos.x).toBeGreaterThanOrEqual(boundary.min.x);
          expect(pos.x).toBeLessThanOrEqual(boundary.max.x);
          expect(pos.z).toBeGreaterThanOrEqual(boundary.min.z);
          expect(pos.z).toBeLessThanOrEqual(boundary.max.z);
          break;
        }
      }
      expect(foundMaxY).toBe(true);
    });

    it('should spawn on -Z face (min z)', () => {
      let foundMinZ = false;
      for (let i = 0; i < 50; i++) {
        const pos = boundary.getRandomSpawnPosition();
        if (Math.abs(pos.z - boundary.min.z) < 1e-10) {
          foundMinZ = true;
          expect(pos.x).toBeGreaterThanOrEqual(boundary.min.x);
          expect(pos.x).toBeLessThanOrEqual(boundary.max.x);
          expect(pos.y).toBeGreaterThanOrEqual(boundary.min.y);
          expect(pos.y).toBeLessThanOrEqual(boundary.max.y);
          break;
        }
      }
      expect(foundMinZ).toBe(true);
    });

    it('should spawn on +Z face (max z)', () => {
      let foundMaxZ = false;
      for (let i = 0; i < 50; i++) {
        const pos = boundary.getRandomSpawnPosition();
        if (Math.abs(pos.z - boundary.max.z) < 1e-10) {
          foundMaxZ = true;
          expect(pos.x).toBeGreaterThanOrEqual(boundary.min.x);
          expect(pos.x).toBeLessThanOrEqual(boundary.max.x);
          expect(pos.y).toBeGreaterThanOrEqual(boundary.min.y);
          expect(pos.y).toBeLessThanOrEqual(boundary.max.y);
          break;
        }
      }
      expect(foundMaxZ).toBe(true);
    });
  });

  describe('getSpawnVelocity', () => {
    it('should point inward from -X face', () => {
      const pos = new Vector3D(boundary.min.x, 0, 0);
      const velocity = boundary.getSpawnVelocity(pos, 5);
      
      // Should point in positive x direction (inward)
      expect(velocity.x).toBeGreaterThan(0);
      expect(velocity.magnitude()).toBeCloseTo(5, 5);
    });

    it('should point inward from +X face', () => {
      const pos = new Vector3D(boundary.max.x, 0, 0);
      const velocity = boundary.getSpawnVelocity(pos, 5);
      
      // Should point in negative x direction (inward)
      expect(velocity.x).toBeLessThan(0);
      expect(velocity.magnitude()).toBeCloseTo(5, 5);
    });

    it('should point inward from -Y face', () => {
      const pos = new Vector3D(0, boundary.min.y, 0);
      const velocity = boundary.getSpawnVelocity(pos, 5);
      
      // Should point in positive y direction (inward)
      expect(velocity.y).toBeGreaterThan(0);
      expect(velocity.magnitude()).toBeCloseTo(5, 5);
    });

    it('should point inward from +Y face', () => {
      const pos = new Vector3D(0, boundary.max.y, 0);
      const velocity = boundary.getSpawnVelocity(pos, 5);
      
      // Should point in negative y direction (inward)
      expect(velocity.y).toBeLessThan(0);
      expect(velocity.magnitude()).toBeCloseTo(5, 5);
    });

    it('should point inward from -Z face', () => {
      const pos = new Vector3D(0, 0, boundary.min.z);
      const velocity = boundary.getSpawnVelocity(pos, 5);
      
      // Should point in positive z direction (inward)
      expect(velocity.z).toBeGreaterThan(0);
      expect(velocity.magnitude()).toBeCloseTo(5, 5);
    });

    it('should point inward from +Z face', () => {
      const pos = new Vector3D(0, 0, boundary.max.z);
      const velocity = boundary.getSpawnVelocity(pos, 5);
      
      // Should point in negative z direction (inward)
      expect(velocity.z).toBeLessThan(0);
      expect(velocity.magnitude()).toBeCloseTo(5, 5);
    });

    it('should scale velocity to specified speed', () => {
      const pos = boundary.getRandomSpawnPosition();
      const speed = 10;
      const velocity = boundary.getSpawnVelocity(pos, speed);
      
      expect(velocity.magnitude()).toBeCloseTo(speed, 5);
    });
  });
});
