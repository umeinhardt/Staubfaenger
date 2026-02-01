import { describe, it, expect, beforeEach } from 'vitest';
import { GravityRegistry } from '../../src/core/GravityRegistry';
import { GravityFormula, NewtonianGravity } from '../../src/core/GravityFormula';

describe('GravityRegistry', () => {
  let registry: GravityRegistry;

  beforeEach(() => {
    registry = new GravityRegistry();
  });

  describe('register', () => {
    it('should register a new gravity formula', () => {
      const formula = new NewtonianGravity();
      
      registry.register(formula);
      
      expect(registry.has('Newtonian')).toBe(true);
      expect(registry.count()).toBe(1);
    });

    it('should throw error when registering duplicate formula name', () => {
      const formula1 = new NewtonianGravity();
      const formula2 = new NewtonianGravity();
      
      registry.register(formula1);
      
      expect(() => registry.register(formula2)).toThrow(
        'Gravity formula with name "Newtonian" is already registered'
      );
    });

    it('should register multiple different formulas', () => {
      const newtonian = new NewtonianGravity();
      const custom: GravityFormula = {
        name: 'Custom',
        calculate: (m1, m2, r) => m1 * m2 / r
      };
      
      registry.register(newtonian);
      registry.register(custom);
      
      expect(registry.count()).toBe(2);
      expect(registry.list()).toEqual(['Newtonian', 'Custom']);
    });
  });

  describe('get', () => {
    it('should retrieve a registered formula', () => {
      const formula = new NewtonianGravity();
      registry.register(formula);
      
      const retrieved = registry.get('Newtonian');
      
      expect(retrieved).toBe(formula);
      expect(retrieved.name).toBe('Newtonian');
    });

    it('should throw error when getting non-existent formula', () => {
      expect(() => registry.get('NonExistent')).toThrow(
        'Gravity formula with name "NonExistent" not found'
      );
    });
  });

  describe('list', () => {
    it('should return empty array when no formulas registered', () => {
      expect(registry.list()).toEqual([]);
    });

    it('should return all registered formula names', () => {
      const newtonian = new NewtonianGravity();
      const custom1: GravityFormula = {
        name: 'Custom1',
        calculate: (m1, m2, r) => m1 * m2 / r
      };
      const custom2: GravityFormula = {
        name: 'Custom2',
        calculate: (m1, m2, r) => m1 * m2 / (r * r * r)
      };
      
      registry.register(newtonian);
      registry.register(custom1);
      registry.register(custom2);
      
      const names = registry.list();
      expect(names).toHaveLength(3);
      expect(names).toContain('Newtonian');
      expect(names).toContain('Custom1');
      expect(names).toContain('Custom2');
    });
  });

  describe('has', () => {
    it('should return true for registered formula', () => {
      const formula = new NewtonianGravity();
      registry.register(formula);
      
      expect(registry.has('Newtonian')).toBe(true);
    });

    it('should return false for non-registered formula', () => {
      expect(registry.has('NonExistent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove a registered formula', () => {
      const formula = new NewtonianGravity();
      registry.register(formula);
      
      const removed = registry.unregister('Newtonian');
      
      expect(removed).toBe(true);
      expect(registry.has('Newtonian')).toBe(false);
      expect(registry.count()).toBe(0);
    });

    it('should return false when removing non-existent formula', () => {
      const removed = registry.unregister('NonExistent');
      
      expect(removed).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all registered formulas', () => {
      const newtonian = new NewtonianGravity();
      const custom: GravityFormula = {
        name: 'Custom',
        calculate: (m1, m2, r) => m1 * m2 / r
      };
      
      registry.register(newtonian);
      registry.register(custom);
      
      registry.clear();
      
      expect(registry.count()).toBe(0);
      expect(registry.list()).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.count()).toBe(0);
    });

    it('should return correct count of registered formulas', () => {
      const newtonian = new NewtonianGravity();
      const custom: GravityFormula = {
        name: 'Custom',
        calculate: (m1, m2, r) => m1 * m2 / r
      };
      
      registry.register(newtonian);
      expect(registry.count()).toBe(1);
      
      registry.register(custom);
      expect(registry.count()).toBe(2);
      
      registry.unregister('Custom');
      expect(registry.count()).toBe(1);
    });
  });

  describe('integration', () => {
    it('should allow using registered formulas for calculations', () => {
      const newtonian = new NewtonianGravity(1.0, 0.01);
      registry.register(newtonian);
      
      const formula = registry.get('Newtonian');
      const force = formula.calculate(10, 20, 5);
      
      const expectedForce = 1.0 * 10 * 20 / (5 * 5);
      expect(force).toBeCloseTo(expectedForce, 10);
    });

    it('should support custom gravity formulas', () => {
      const customFormula: GravityFormula = {
        name: 'LinearGravity',
        calculate: (m1, m2, distance) => {
          // Simple linear gravity for testing
          return (m1 + m2) / distance;
        }
      };
      
      registry.register(customFormula);
      
      const formula = registry.get('LinearGravity');
      const force = formula.calculate(10, 20, 5);
      
      expect(force).toBe((10 + 20) / 5);
    });
  });
});
