import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../src/core/Vector2D';

describe('Vector2D', () => {
  describe('Constructor', () => {
    it('should create a vector with x and y components', () => {
      const v = new Vector2D(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });
  });

  describe('Addition', () => {
    it('should add two vectors correctly', () => {
      const v1 = new Vector2D(1, 2);
      const v2 = new Vector2D(3, 4);
      const result = v1.add(v2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should handle negative values', () => {
      const v1 = new Vector2D(5, -3);
      const v2 = new Vector2D(-2, 7);
      const result = v1.add(v2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should not modify original vectors', () => {
      const v1 = new Vector2D(1, 2);
      const v2 = new Vector2D(3, 4);
      v1.add(v2);
      expect(v1.x).toBe(1);
      expect(v1.y).toBe(2);
    });
  });

  describe('Subtraction', () => {
    it('should subtract two vectors correctly', () => {
      const v1 = new Vector2D(5, 7);
      const v2 = new Vector2D(2, 3);
      const result = v1.subtract(v2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should handle negative results', () => {
      const v1 = new Vector2D(1, 2);
      const v2 = new Vector2D(3, 5);
      const result = v1.subtract(v2);
      expect(result.x).toBe(-2);
      expect(result.y).toBe(-3);
    });
  });

  describe('Multiplication', () => {
    it('should multiply vector by scalar correctly', () => {
      const v = new Vector2D(2, 3);
      const result = v.multiply(3);
      expect(result.x).toBe(6);
      expect(result.y).toBe(9);
    });

    it('should handle negative scalars', () => {
      const v = new Vector2D(4, -2);
      const result = v.multiply(-2);
      expect(result.x).toBe(-8);
      expect(result.y).toBe(4);
    });

    it('should handle zero scalar', () => {
      const v = new Vector2D(5, 7);
      const result = v.multiply(0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('Division', () => {
    it('should divide vector by scalar correctly', () => {
      const v = new Vector2D(6, 9);
      const result = v.divide(3);
      expect(result.x).toBe(2);
      expect(result.y).toBe(3);
    });

    it('should handle negative scalars', () => {
      const v = new Vector2D(8, -4);
      const result = v.divide(-2);
      expect(result.x).toBe(-4);
      expect(result.y).toBe(2);
    });

    it('should throw error when dividing by zero', () => {
      const v = new Vector2D(5, 7);
      expect(() => v.divide(0)).toThrow('Division by zero');
    });
  });

  describe('Magnitude', () => {
    it('should calculate magnitude correctly', () => {
      const v = new Vector2D(3, 4);
      expect(v.magnitude()).toBe(5);
    });

    it('should handle zero vector', () => {
      const v = new Vector2D(0, 0);
      expect(v.magnitude()).toBe(0);
    });

    it('should handle negative components', () => {
      const v = new Vector2D(-3, -4);
      expect(v.magnitude()).toBe(5);
    });

    it('should calculate magnitude for unit vector', () => {
      const v = new Vector2D(1, 0);
      expect(v.magnitude()).toBe(1);
    });
  });

  describe('Normalization', () => {
    it('should normalize vector to unit length', () => {
      const v = new Vector2D(3, 4);
      const normalized = v.normalize();
      expect(normalized.magnitude()).toBeCloseTo(1, 10);
      expect(normalized.x).toBeCloseTo(0.6, 10);
      expect(normalized.y).toBeCloseTo(0.8, 10);
    });

    it('should handle zero vector', () => {
      const v = new Vector2D(0, 0);
      const normalized = v.normalize();
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('should preserve direction', () => {
      const v = new Vector2D(5, 0);
      const normalized = v.normalize();
      expect(normalized.x).toBeCloseTo(1, 10);
      expect(normalized.y).toBeCloseTo(0, 10);
    });
  });

  describe('Dot Product', () => {
    it('should calculate dot product correctly', () => {
      const v1 = new Vector2D(2, 3);
      const v2 = new Vector2D(4, 5);
      expect(v1.dot(v2)).toBe(23); // 2*4 + 3*5 = 8 + 15 = 23
    });

    it('should return zero for perpendicular vectors', () => {
      const v1 = new Vector2D(1, 0);
      const v2 = new Vector2D(0, 1);
      expect(v1.dot(v2)).toBe(0);
    });

    it('should handle negative values', () => {
      const v1 = new Vector2D(-2, 3);
      const v2 = new Vector2D(4, -5);
      expect(v1.dot(v2)).toBe(-23); // -2*4 + 3*(-5) = -8 - 15 = -23
    });
  });

  describe('Distance', () => {
    it('should calculate distance between two vectors', () => {
      const v1 = new Vector2D(0, 0);
      const v2 = new Vector2D(3, 4);
      expect(v1.distanceTo(v2)).toBe(5);
    });

    it('should be symmetric', () => {
      const v1 = new Vector2D(1, 2);
      const v2 = new Vector2D(4, 6);
      expect(v1.distanceTo(v2)).toBe(v2.distanceTo(v1));
    });

    it('should return zero for same position', () => {
      const v1 = new Vector2D(5, 7);
      const v2 = new Vector2D(5, 7);
      expect(v1.distanceTo(v2)).toBe(0);
    });
  });

  describe('Static Methods', () => {
    describe('zero', () => {
      it('should create a zero vector', () => {
        const v = Vector2D.zero();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
      });
    });

    describe('random', () => {
      it('should create vector within specified range', () => {
        const min = -10;
        const max = 10;
        const v = Vector2D.random(min, max);
        expect(v.x).toBeGreaterThanOrEqual(min);
        expect(v.x).toBeLessThanOrEqual(max);
        expect(v.y).toBeGreaterThanOrEqual(min);
        expect(v.y).toBeLessThanOrEqual(max);
      });

      it('should create different vectors on multiple calls', () => {
        const v1 = Vector2D.random(0, 100);
        const v2 = Vector2D.random(0, 100);
        // Very unlikely to be exactly the same
        const areDifferent = v1.x !== v2.x || v1.y !== v2.y;
        expect(areDifferent).toBe(true);
      });
    });
  });
});
