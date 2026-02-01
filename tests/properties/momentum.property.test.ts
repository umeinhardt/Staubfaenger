import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';
import { NewtonianGravity } from '../../src/core/GravityFormula';

// Feature: 3d-particle-simulation, Property 6: Impulserhaltung bei Kollisionen
// Feature: 3d-particle-simulation, Property 12: Elastic collisions conserve momentum in 3D
// Validates: Anforderungen 6.3, 7.4, 2.5

describe('Property 6: Impulserhaltung bei Kollisionen', () => {
  it('should conserve total momentum during particle-particle collisions', () => {
    fc.assert(
      fc.property(
        fc.record({
          mass1: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          mass2: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          pos1X: fc.double({ min: -100, max: 100, noNaN: true }),
          pos1Y: fc.double({ min: -100, max: 100, noNaN: true }),
          pos1Z: fc.double({ min: -100, max: 100, noNaN: true }),
          pos2X: fc.double({ min: -100, max: 100, noNaN: true }),
          pos2Y: fc.double({ min: -100, max: 100, noNaN: true }),
          pos2Z: fc.double({ min: -100, max: 100, noNaN: true }),
          vel1X: fc.double({ min: -50, max: 50, noNaN: true }),
          vel1Y: fc.double({ min: -50, max: 50, noNaN: true }),
          vel1Z: fc.double({ min: -50, max: 50, noNaN: true }),
          vel2X: fc.double({ min: -50, max: 50, noNaN: true }),
          vel2Y: fc.double({ min: -50, max: 50, noNaN: true }),
          vel2Z: fc.double({ min: -50, max: 50, noNaN: true }),
          elasticity: fc.double({ min: 0, max: 1, noNaN: true })
        }),
        (data) => {
          // Create particles
          const particle1 = new Particle(
            new Vector3D(data.pos1X, data.pos1Y, data.pos1Z),
            new Vector3D(data.vel1X, data.vel1Y, data.vel1Z),
            data.mass1
          );
          const particle2 = new Particle(
            new Vector3D(data.pos2X, data.pos2Y, data.pos2Z),
            new Vector3D(data.vel2X, data.vel2Y, data.vel2Z),
            data.mass2
          );

          // Calculate total momentum before collision
          const momentumBefore = particle1.momentum().add(particle2.momentum());

          // Create physics engine and resolve collision
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, data.elasticity);
          physics.resolveCollision({ entity1: particle1, entity2: particle2 });

          // Calculate total momentum after collision
          const momentumAfter = particle1.momentum().add(particle2.momentum());

          // Momentum should be conserved in all three dimensions
          expect(momentumAfter.x).toBeCloseTo(momentumBefore.x, 8);
          expect(momentumAfter.y).toBeCloseTo(momentumBefore.y, 8);
          expect(momentumAfter.z).toBeCloseTo(momentumBefore.z, 8);
        }
      ),
      { numRuns: 100 }
    );
  });

  // NOTE: Conglomerate tests are commented out until task 6 updates Conglomerate to 3D
  /*
  it('should conserve total momentum during conglomerate-particle collisions', () => {
    // Will be re-enabled in task 6
  });

  it('should conserve total momentum during conglomerate-conglomerate collisions', () => {
    // Will be re-enabled in task 6
  });
  */

  it('should conserve momentum regardless of elasticity value', () => {
    fc.assert(
      fc.property(
        fc.record({
          mass1: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          mass2: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          pos1X: fc.double({ min: -100, max: 100, noNaN: true }),
          pos1Y: fc.double({ min: -100, max: 100, noNaN: true }),
          pos1Z: fc.double({ min: -100, max: 100, noNaN: true }),
          pos2X: fc.double({ min: -100, max: 100, noNaN: true }),
          pos2Y: fc.double({ min: -100, max: 100, noNaN: true }),
          pos2Z: fc.double({ min: -100, max: 100, noNaN: true }),
          vel1X: fc.double({ min: -50, max: 50, noNaN: true }),
          vel1Y: fc.double({ min: -50, max: 50, noNaN: true }),
          vel1Z: fc.double({ min: -50, max: 50, noNaN: true }),
          vel2X: fc.double({ min: -50, max: 50, noNaN: true }),
          vel2Y: fc.double({ min: -50, max: 50, noNaN: true }),
          vel2Z: fc.double({ min: -50, max: 50, noNaN: true }),
          elasticity: fc.double({ min: 0, max: 1, noNaN: true })
        }),
        (data) => {
          // Create particles
          const particle1 = new Particle(
            new Vector3D(data.pos1X, data.pos1Y, data.pos1Z),
            new Vector3D(data.vel1X, data.vel1Y, data.vel1Z),
            data.mass1
          );
          const particle2 = new Particle(
            new Vector3D(data.pos2X, data.pos2Y, data.pos2Z),
            new Vector3D(data.vel2X, data.vel2Y, data.vel2Z),
            data.mass2
          );

          // Calculate total momentum before collision
          const momentumBefore = particle1.momentum().add(particle2.momentum());

          // Test with different elasticity values
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, data.elasticity);
          physics.resolveCollision({ entity1: particle1, entity2: particle2 });

          // Calculate total momentum after collision
          const momentumAfter = particle1.momentum().add(particle2.momentum());

          // Momentum should be conserved regardless of elasticity in all three dimensions
          expect(momentumAfter.x).toBeCloseTo(momentumBefore.x, 8);
          expect(momentumAfter.y).toBeCloseTo(momentumBefore.y, 8);
          expect(momentumAfter.z).toBeCloseTo(momentumBefore.z, 8);
        }
      ),
      { numRuns: 100 }
    );
  });
});
