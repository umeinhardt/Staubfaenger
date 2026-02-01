import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';

// Feature: 3d-particle-simulation, Property 5: Newton'sches Bewegungsgesetz
// Feature: 3d-particle-simulation, Property 10: Position updates follow kinematic equation (3D)
// Feature: 3d-particle-simulation, Property 11: Velocity updates follow kinematic equation (3D)
// Validates: Anforderung 6.2, 2.2, 2.3

describe('Property 5: Newton\'sches Bewegungsgesetz', () => {
  it('should apply Newton\'s second law: F = ma (acceleration = F/m)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true }),
        (mass, posX, posY, posZ, velX, velY, velZ, forceX, forceY, forceZ, deltaTime) => {
          const position = new Vector3D(posX, posY, posZ);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);

          const initialVelocity = new Vector3D(particle.velocity.x, particle.velocity.y, particle.velocity.z);
          const force = new Vector3D(forceX, forceY, forceZ);

          // Apply force
          particle.applyForce(force, deltaTime);

          // Calculate expected acceleration: a = F / m
          const expectedAcceleration = force.divide(mass);

          // Calculate expected velocity change: Δv = a * dt
          const expectedVelocityChange = expectedAcceleration.multiply(deltaTime);

          // Calculate expected final velocity: v_final = v_initial + Δv
          const expectedVelocity = initialVelocity.add(expectedVelocityChange);

          // Verify Newton's second law
          expect(particle.velocity.x).toBeCloseTo(expectedVelocity.x, 10);
          expect(particle.velocity.y).toBeCloseTo(expectedVelocity.y, 10);
          expect(particle.velocity.z).toBeCloseTo(expectedVelocity.z, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update position correctly based on velocity: p = p + v*dt', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true }),
        (mass, posX, posY, posZ, velX, velY, velZ, deltaTime) => {
          const position = new Vector3D(posX, posY, posZ);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);

          const initialPosition = new Vector3D(particle.position.x, particle.position.y, particle.position.z);
          const currentVelocity = new Vector3D(particle.velocity.x, particle.velocity.y, particle.velocity.z);

          // Update position
          particle.update(deltaTime);

          // Calculate expected position: p = p + v * dt
          const expectedPosition = initialPosition.add(currentVelocity.multiply(deltaTime));

          // Verify position update
          expect(particle.position.x).toBeCloseTo(expectedPosition.x, 10);
          expect(particle.position.y).toBeCloseTo(expectedPosition.y, 10);
          expect(particle.position.z).toBeCloseTo(expectedPosition.z, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly combine force application and position update', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true }),
        (mass, posX, posY, posZ, velX, velY, velZ, forceX, forceY, forceZ, deltaTime) => {
          const position = new Vector3D(posX, posY, posZ);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);

          const initialPosition = new Vector3D(particle.position.x, particle.position.y, particle.position.z);
          const initialVelocity = new Vector3D(particle.velocity.x, particle.velocity.y, particle.velocity.z);
          const force = new Vector3D(forceX, forceY, forceZ);

          // Apply force and update
          particle.applyForce(force, deltaTime);
          particle.update(deltaTime);

          // Calculate expected final state
          const acceleration = force.divide(mass);
          const finalVelocity = initialVelocity.add(acceleration.multiply(deltaTime));
          const expectedPosition = initialPosition.add(finalVelocity.multiply(deltaTime));

          // Verify final position
          expect(particle.position.x).toBeCloseTo(expectedPosition.x, 10);
          expect(particle.position.y).toBeCloseTo(expectedPosition.y, 10);
          expect(particle.position.z).toBeCloseTo(expectedPosition.z, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have zero acceleration when no force is applied', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true }),
        (mass, posX, posY, posZ, velX, velY, velZ, deltaTime) => {
          const position = new Vector3D(posX, posY, posZ);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);

          const initialVelocity = new Vector3D(particle.velocity.x, particle.velocity.y, particle.velocity.z);

          // Apply zero force
          const zeroForce = new Vector3D(0, 0, 0);
          particle.applyForce(zeroForce, deltaTime);

          // Velocity should remain unchanged (no acceleration)
          expect(particle.velocity.x).toBeCloseTo(initialVelocity.x, 10);
          expect(particle.velocity.y).toBeCloseTo(initialVelocity.y, 10);
          expect(particle.velocity.z).toBeCloseTo(initialVelocity.z, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
