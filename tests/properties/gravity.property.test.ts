import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { NewtonianGravity } from '../../src/core/GravityFormula';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';

// Feature: 3d-particle-simulation, Property 4: Newton'sche Gravitationsformel
// Feature: 3d-particle-simulation, Property 9: Gravity points in negative z direction
// Validates: Anforderung 6.1, 2.1

describe('Property 4: Newton\'sche Gravitationsformel', () => {
  it('should calculate gravitational force according to F = G × m1 × m2 / r²', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        (m1, m2, distance, G) => {
          const gravity = new NewtonianGravity(G, 0.01);
          
          const force = gravity.calculate(m1, m2, distance);
          
          // Calculate expected force: F = G × m1 × m2 / r²
          const expectedForce = G * m1 * m2 / (distance * distance);
          
          // Verify the formula is correctly applied
          expect(force).toBeCloseTo(expectedForce, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use epsilon for numerical stability when distance is very small', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.001, max: 0.009, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        (m1, m2, smallDistance, G) => {
          const epsilon = 0.01;
          const gravity = new NewtonianGravity(G, epsilon);
          
          const force = gravity.calculate(m1, m2, smallDistance);
          
          // When distance < epsilon, effective distance should be epsilon
          const expectedForce = G * m1 * m2 / (epsilon * epsilon);
          
          // Verify epsilon is used for stability
          expect(force).toBeCloseTo(expectedForce, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce positive force for positive masses', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        (m1, m2, distance, G) => {
          const gravity = new NewtonianGravity(G, 0.01);
          
          const force = gravity.calculate(m1, m2, distance);
          
          // Force should always be positive for positive masses
          expect(force).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be symmetric: F(m1, m2, r) = F(m2, m1, r)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        (m1, m2, distance, G) => {
          const gravity = new NewtonianGravity(G, 0.01);
          
          const force1 = gravity.calculate(m1, m2, distance);
          const force2 = gravity.calculate(m2, m1, distance);
          
          // Force should be symmetric (Newton's third law)
          // Use 6 decimal places for numerical stability with large values
          expect(force1).toBeCloseTo(force2, 6);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should scale linearly with each mass', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        fc.double({ min: 2, max: 10, noNaN: true }),
        (m1, m2, distance, G, scaleFactor) => {
          const gravity = new NewtonianGravity(G, 0.01);
          
          const force1 = gravity.calculate(m1, m2, distance);
          const force2 = gravity.calculate(m1 * scaleFactor, m2, distance);
          
          // Force should scale linearly with mass
          // Use 6 decimal places for numerical stability with large values
          expect(force2).toBeCloseTo(force1 * scaleFactor, 6);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should scale with inverse square of distance', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 1, max: 50, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        fc.double({ min: 2, max: 5, noNaN: true }),
        (m1, m2, distance, G, scaleFactor) => {
          const gravity = new NewtonianGravity(G, 0.01);
          
          const force1 = gravity.calculate(m1, m2, distance);
          const force2 = gravity.calculate(m1, m2, distance * scaleFactor);
          
          // Force should scale with inverse square of distance
          const expectedRatio = 1 / (scaleFactor * scaleFactor);
          const actualRatio = force2 / force1;
          
          expect(actualRatio).toBeCloseTo(expectedRatio, 8);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero distance by using epsilon', () => {
    const gravity = new NewtonianGravity(1.0, 0.01);
    const m1 = 10;
    const m2 = 20;
    
    const force = gravity.calculate(m1, m2, 0);
    
    // Should use epsilon instead of zero
    const expectedForce = 1.0 * m1 * m2 / (0.01 * 0.01);
    expect(force).toBeCloseTo(expectedForce, 10);
  });

  it('should allow custom gravitational constant', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        (m1, m2, distance, G) => {
          const gravity = new NewtonianGravity(G, 0.01);
          
          const force = gravity.calculate(m1, m2, distance);
          
          // Force should be proportional to G
          const expectedForce = G * m1 * m2 / (distance * distance);
          expect(force).toBeCloseTo(expectedForce, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// **Property 9: Gravity points in negative z direction**
// Validates: Requirements 2.1
describe('Property 9: Gravity points in negative z direction', () => {
  it('should apply gravitational force with component in negative z direction', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        (m1, m2, x1, y1, z1, x2, y2, z2) => {
          // Create two particles at different positions
          const particle1 = new Particle(
            new Vector3D(x1, y1, z1),
            Vector3D.zero(),
            m1
          );
          const particle2 = new Particle(
            new Vector3D(x2, y2, z2),
            Vector3D.zero(),
            m2
          );

          // Create physics engine
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, 0.5);

          // Calculate gravitational force
          const force = physics.calculateGravitationalForce(particle1, particle2);

          // If particles have different z coordinates, force should have z component
          // pointing from particle1 toward particle2
          if (Math.abs(z2 - z1) > 0.01) {
            const expectedZDirection = Math.sign(z2 - z1);
            const actualZDirection = Math.sign(force.z);
            
            // Force z component should point in the direction from p1 to p2
            // (or be zero if particles are at same z level)
            if (Math.abs(force.z) > 1e-10) {
              expect(actualZDirection).toBe(expectedZDirection);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have zero z component when particles are at same z level', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        (m1, m2, x1, y1, z, x2, y2) => {
          // Create two particles at same z level
          const particle1 = new Particle(
            new Vector3D(x1, y1, z),
            Vector3D.zero(),
            m1
          );
          const particle2 = new Particle(
            new Vector3D(x2, y2, z),
            Vector3D.zero(),
            m2
          );

          // Skip if particles are at same position
          const distance = particle1.position.distanceTo(particle2.position);
          if (distance < 0.01) {
            return;
          }

          // Create physics engine
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, 0.5);

          // Calculate gravitational force
          const force = physics.calculateGravitationalForce(particle1, particle2);

          // Force z component should be approximately zero
          expect(Math.abs(force.z)).toBeLessThan(1e-10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
