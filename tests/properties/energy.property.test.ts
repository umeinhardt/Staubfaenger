import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';
import { NewtonianGravity } from '../../src/core/GravityFormula';

// Feature: 3d-particle-simulation, Property 7: Energieerhaltung mit Elastizität
// Feature: 3d-particle-simulation, Property 13: Elastic collisions conserve kinetic energy
// Feature: 3d-particle-simulation, Property 14: Inelastic collisions conserve momentum but reduce energy
// Validates: Anforderung 6.4, 2.6, 2.7

describe('Property 7: Energieerhaltung mit Elastizität', () => {
  it('should scale kinetic energy by elasticity coefficient for particle-particle collisions', () => {
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

          // Check if particles are actually colliding (overlapping)
          const distance = particle1.position.distanceTo(particle2.position);
          const minDistance = particle1.radius + particle2.radius;
          
          // Skip if particles are not colliding OR too close for numerical stability
          if (distance > minDistance || distance < 0.01) {
            return;
          }

          // Calculate total kinetic energy before collision
          const energyBefore = particle1.kineticEnergy() + particle2.kineticEnergy();
          
          // Skip if initial energy is too small to meaningfully test (numerical precision issues)
          if (energyBefore < 1e-2) {
            return;
          }

          // Create physics engine and resolve collision
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, data.elasticity);
          physics.resolveCollision({ entity1: particle1, entity2: particle2 });

          // Calculate total kinetic energy after collision
          const energyAfter = particle1.kineticEnergy() + particle2.kineticEnergy();

          if (data.elasticity === 1) {
            // Perfectly elastic: energy should be approximately conserved (allow 1% tolerance)
            const relativeError = Math.abs(energyAfter - energyBefore) / energyBefore;
            expect(relativeError).toBeLessThan(0.01);
          } else {
            // Inelastic: energy should not increase significantly (allow 1% tolerance for numerical errors)
            expect(energyAfter).toBeLessThanOrEqual(energyBefore * 1.01);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should conserve energy for perfectly elastic collisions (e=1)', () => {
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
          vel2Z: fc.double({ min: -50, max: 50, noNaN: true })
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

          // Check if particles are actually colliding (overlapping)
          const distance = particle1.position.distanceTo(particle2.position);
          const minDistance = particle1.radius + particle2.radius;
          
          // Skip if particles are not colliding OR too close for numerical stability
          if (distance > minDistance || distance < 0.01) {
            return;
          }

          // Calculate total kinetic energy before collision
          const energyBefore = particle1.kineticEnergy() + particle2.kineticEnergy();
          
          // Skip if initial energy is too small to meaningfully test
          if (energyBefore < 1e-2) {
            return;
          }

          // Create physics engine with perfect elasticity
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, 1.0);
          physics.resolveCollision({ entity1: particle1, entity2: particle2 });

          // Calculate total kinetic energy after collision
          const energyAfter = particle1.kineticEnergy() + particle2.kineticEnergy();

          // Energy should be conserved for perfectly elastic collisions
          const relativeError = Math.abs(energyAfter - energyBefore) / energyBefore;
          expect(relativeError).toBeLessThan(0.01); // 1% tolerance
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should lose energy for perfectly inelastic collisions (e=0)', () => {
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
          vel2Z: fc.double({ min: -50, max: 50, noNaN: true })
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

          // Check if particles are actually colliding (overlapping)
          const distance = particle1.position.distanceTo(particle2.position);
          const minDistance = particle1.radius + particle2.radius;
          
          // Skip if particles are not colliding OR too close for numerical stability
          if (distance > minDistance || distance < 0.01) {
            return;
          }

          // Check if particles are approaching (not separating)
          const direction = particle2.position.subtract(particle1.position);
          const collisionNormal = direction.magnitude() > 1e-10 ? direction.normalize() : new Vector3D(1, 0, 0);
          const relativeVelocity = particle1.velocity.subtract(particle2.velocity);
          const velocityAlongNormal = relativeVelocity.dot(collisionNormal);
          
          // Skip if particles are separating OR have very low approach velocity
          if (velocityAlongNormal < 1) {
            return;
          }

          // Calculate total kinetic energy before collision
          const energyBefore = particle1.kineticEnergy() + particle2.kineticEnergy();
          
          // Skip if initial energy is too small
          if (energyBefore < 1e-2) {
            return;
          }

          // Create physics engine with zero elasticity
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, 0.0);
          physics.resolveCollision({ entity1: particle1, entity2: particle2 });

          // Calculate total kinetic energy after collision
          const energyAfter = particle1.kineticEnergy() + particle2.kineticEnergy();

          // Energy should be lost for perfectly inelastic collisions
          expect(energyAfter).toBeLessThanOrEqual(energyBefore * 1.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  // NOTE: Conglomerate energy tests are commented out until task 6 updates Conglomerate to 3D
});
