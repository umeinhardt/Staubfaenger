import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector3D } from '../../src/core/Vector3D';
import { NewtonianGravity } from '../../src/core/GravityFormula';

// Feature: 3d-particle-simulation, Property 21: Conglomerate formation conserves angular momentum (3D)
// Validates: Requirements 4.4

/**
 * Calculate angular momentum of a particle about a reference point in 3D
 * L = r × p = r × mv
 */
function calculateAngularMomentum(
  position: Vector3D,
  velocity: Vector3D,
  mass: number,
  referencePoint: Vector3D
): Vector3D {
  const r = position.subtract(referencePoint);
  const p = velocity.multiply(mass);
  return r.cross(p);
}

/**
 * Calculate total angular momentum of a system about a reference point in 3D
 */
function calculateSystemAngularMomentum(
  entities: (Particle | Conglomerate)[],
  referencePoint: Vector3D
): Vector3D {
  let totalAngularMomentum = Vector3D.zero();

  for (const entity of entities) {
    if (entity instanceof Particle) {
      totalAngularMomentum = totalAngularMomentum.add(
        calculateAngularMomentum(
          entity.position,
          entity.velocity,
          entity.mass,
          referencePoint
        )
      );
    } else {
      // For conglomerate, use center of mass
      totalAngularMomentum = totalAngularMomentum.add(
        calculateAngularMomentum(
          entity.centerOfMass,
          entity.velocity,
          entity.totalMass,
          referencePoint
        )
      );
      // Add rotational angular momentum
      totalAngularMomentum = totalAngularMomentum.add(entity.calculateAngularMomentum());
    }
  }

  return totalAngularMomentum;
}

describe('Property 21: Angular momentum conservation in 3D', () => {
  it('should conserve angular momentum during particle-particle collisions', () => {
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

          // Calculate center of mass as reference point
          const totalMass = particle1.mass + particle2.mass;
          const centerOfMass = particle1.position
            .multiply(particle1.mass)
            .add(particle2.position.multiply(particle2.mass))
            .divide(totalMass);

          // Calculate total angular momentum before collision
          const angularMomentumBefore = calculateSystemAngularMomentum(
            [particle1, particle2],
            centerOfMass
          );

          // Create physics engine and resolve collision
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, data.elasticity);
          physics.resolveCollision({ entity1: particle1, entity2: particle2 });

          // Calculate total angular momentum after collision
          const angularMomentumAfter = calculateSystemAngularMomentum(
            [particle1, particle2],
            centerOfMass
          );

          // Angular momentum should be conserved in all three dimensions
          expect(angularMomentumAfter.x).toBeCloseTo(angularMomentumBefore.x, 5);
          expect(angularMomentumAfter.y).toBeCloseTo(angularMomentumBefore.y, 5);
          expect(angularMomentumAfter.z).toBeCloseTo(angularMomentumBefore.z, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should conserve angular momentum during conglomerate-particle collisions', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Conglomerate particles
          conglomerateParticles: fc.array(
            fc.record({
              mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
              posX: fc.double({ min: -10, max: 10, noNaN: true }),
              posY: fc.double({ min: -10, max: 10, noNaN: true }),
              posZ: fc.double({ min: -10, max: 10, noNaN: true }),
              velX: fc.double({ min: -5, max: 5, noNaN: true }),
              velY: fc.double({ min: -5, max: 5, noNaN: true }),
              velZ: fc.double({ min: -5, max: 5, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          // Single particle
          particleMass: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          particlePosX: fc.double({ min: -100, max: 100, noNaN: true }),
          particlePosY: fc.double({ min: -100, max: 100, noNaN: true }),
          particlePosZ: fc.double({ min: -100, max: 100, noNaN: true }),
          particleVelX: fc.double({ min: -50, max: 50, noNaN: true }),
          particleVelY: fc.double({ min: -50, max: 50, noNaN: true }),
          particleVelZ: fc.double({ min: -50, max: 50, noNaN: true }),
          elasticity: fc.double({ min: 0, max: 1, noNaN: true })
        }),
        (data) => {
          // Create conglomerate
          const conglomerateParticles = data.conglomerateParticles.map(p =>
            new Particle(
              new Vector3D(p.posX, p.posY, p.posZ),
              new Vector3D(p.velX, p.velY, p.velZ),
              p.mass
            )
          );
          const conglomerate = new Conglomerate(conglomerateParticles);

          // Create single particle
          const particle = new Particle(
            new Vector3D(data.particlePosX, data.particlePosY, data.particlePosZ),
            new Vector3D(data.particleVelX, data.particleVelY, data.particleVelZ),
            data.particleMass
          );

          // Calculate center of mass as reference point
          const totalMass = conglomerate.totalMass + particle.mass;
          const centerOfMass = conglomerate.centerOfMass
            .multiply(conglomerate.totalMass)
            .add(particle.position.multiply(particle.mass))
            .divide(totalMass);

          // Calculate total angular momentum before collision
          const angularMomentumBefore = calculateSystemAngularMomentum(
            [conglomerate, particle],
            centerOfMass
          );

          // Create physics engine and resolve collision
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, data.elasticity);
          physics.resolveCollision({ entity1: conglomerate, entity2: particle });

          // Calculate total angular momentum after collision
          const angularMomentumAfter = calculateSystemAngularMomentum(
            [conglomerate, particle],
            centerOfMass
          );

          // Angular momentum should be conserved in all three dimensions
          expect(angularMomentumAfter.x).toBeCloseTo(angularMomentumBefore.x, 5);
          expect(angularMomentumAfter.y).toBeCloseTo(angularMomentumBefore.y, 5);
          expect(angularMomentumAfter.z).toBeCloseTo(angularMomentumBefore.z, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should conserve angular momentum during conglomerate-conglomerate collisions', () => {
    fc.assert(
      fc.property(
        fc.record({
          // First conglomerate
          conglomerate1Particles: fc.array(
            fc.record({
              mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
              posX: fc.double({ min: -10, max: 10, noNaN: true }),
              posY: fc.double({ min: -10, max: 10, noNaN: true }),
              posZ: fc.double({ min: -10, max: 10, noNaN: true }),
              velX: fc.double({ min: -5, max: 5, noNaN: true }),
              velY: fc.double({ min: -5, max: 5, noNaN: true }),
              velZ: fc.double({ min: -5, max: 5, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          // Second conglomerate
          conglomerate2Particles: fc.array(
            fc.record({
              mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
              posX: fc.double({ min: -10, max: 10, noNaN: true }),
              posY: fc.double({ min: -10, max: 10, noNaN: true }),
              posZ: fc.double({ min: -10, max: 10, noNaN: true }),
              velX: fc.double({ min: -5, max: 5, noNaN: true }),
              velY: fc.double({ min: -5, max: 5, noNaN: true }),
              velZ: fc.double({ min: -5, max: 5, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          elasticity: fc.double({ min: 0, max: 1, noNaN: true })
        }),
        (data) => {
          // Create first conglomerate
          const particles1 = data.conglomerate1Particles.map(p =>
            new Particle(
              new Vector3D(p.posX, p.posY, p.posZ),
              new Vector3D(p.velX, p.velY, p.velZ),
              p.mass
            )
          );
          const conglomerate1 = new Conglomerate(particles1);

          // Create second conglomerate
          const particles2 = data.conglomerate2Particles.map(p =>
            new Particle(
              new Vector3D(p.posX, p.posY, p.posZ),
              new Vector3D(p.velX, p.velY, p.velZ),
              p.mass
            )
          );
          const conglomerate2 = new Conglomerate(particles2);

          // Calculate center of mass as reference point
          const totalMass = conglomerate1.totalMass + conglomerate2.totalMass;
          const centerOfMass = conglomerate1.centerOfMass
            .multiply(conglomerate1.totalMass)
            .add(conglomerate2.centerOfMass.multiply(conglomerate2.totalMass))
            .divide(totalMass);

          // Calculate total angular momentum before collision
          const angularMomentumBefore = calculateSystemAngularMomentum(
            [conglomerate1, conglomerate2],
            centerOfMass
          );

          // Create physics engine and resolve collision
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, data.elasticity);
          physics.resolveCollision({ entity1: conglomerate1, entity2: conglomerate2 });

          // Calculate total angular momentum after collision
          const angularMomentumAfter = calculateSystemAngularMomentum(
            [conglomerate1, conglomerate2],
            centerOfMass
          );

          // Angular momentum should be conserved in all three dimensions
          expect(angularMomentumAfter.x).toBeCloseTo(angularMomentumBefore.x, 5);
          expect(angularMomentumAfter.y).toBeCloseTo(angularMomentumBefore.y, 5);
          expect(angularMomentumAfter.z).toBeCloseTo(angularMomentumBefore.z, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve angular momentum when conglomerate has initial rotation', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Conglomerate particles
          conglomerateParticles: fc.array(
            fc.record({
              mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
              posX: fc.double({ min: -10, max: 10, noNaN: true }),
              posY: fc.double({ min: -10, max: 10, noNaN: true }),
              posZ: fc.double({ min: -10, max: 10, noNaN: true }),
              velX: fc.double({ min: -5, max: 5, noNaN: true }),
              velY: fc.double({ min: -5, max: 5, noNaN: true }),
              velZ: fc.double({ min: -5, max: 5, noNaN: true })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          angularVelX: fc.double({ min: -10, max: 10, noNaN: true }),
          angularVelY: fc.double({ min: -10, max: 10, noNaN: true }),
          angularVelZ: fc.double({ min: -10, max: 10, noNaN: true }),
          // Single particle
          particleMass: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          particlePosX: fc.double({ min: -100, max: 100, noNaN: true }),
          particlePosY: fc.double({ min: -100, max: 100, noNaN: true }),
          particlePosZ: fc.double({ min: -100, max: 100, noNaN: true }),
          particleVelX: fc.double({ min: -50, max: 50, noNaN: true }),
          particleVelY: fc.double({ min: -50, max: 50, noNaN: true }),
          particleVelZ: fc.double({ min: -50, max: 50, noNaN: true }),
          elasticity: fc.double({ min: 0, max: 1, noNaN: true })
        }),
        (data) => {
          // Create conglomerate with rotation
          const conglomerateParticles = data.conglomerateParticles.map(p =>
            new Particle(
              new Vector3D(p.posX, p.posY, p.posZ),
              new Vector3D(p.velX, p.velY, p.velZ),
              p.mass
            )
          );
          const conglomerate = new Conglomerate(conglomerateParticles);
          conglomerate.angularVelocity = new Vector3D(
            data.angularVelX,
            data.angularVelY,
            data.angularVelZ
          );

          // Create single particle
          const particle = new Particle(
            new Vector3D(data.particlePosX, data.particlePosY, data.particlePosZ),
            new Vector3D(data.particleVelX, data.particleVelY, data.particleVelZ),
            data.particleMass
          );

          // Use origin as reference point
          const referencePoint = Vector3D.zero();

          // Calculate total angular momentum before collision
          const angularMomentumBefore = calculateSystemAngularMomentum(
            [conglomerate, particle],
            referencePoint
          );

          // Create physics engine and resolve collision
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, data.elasticity);
          physics.resolveCollision({ entity1: conglomerate, entity2: particle });

          // Calculate total angular momentum after collision
          const angularMomentumAfter = calculateSystemAngularMomentum(
            [conglomerate, particle],
            referencePoint
          );

          // Angular momentum should be conserved even with initial rotation
          // Use tolerance of 4 decimal places due to floating-point precision
          expect(angularMomentumAfter.x).toBeCloseTo(angularMomentumBefore.x, 4);
          expect(angularMomentumAfter.y).toBeCloseTo(angularMomentumBefore.y, 4);
          expect(angularMomentumAfter.z).toBeCloseTo(angularMomentumBefore.z, 4);
        }
      ),
      { numRuns: 100 }
    );
  });
});
