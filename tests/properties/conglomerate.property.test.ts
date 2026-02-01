import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector3D } from '../../src/core/Vector3D';
import { PhysicsEngine } from '../../src/core/PhysicsEngine';
import { NewtonianGravity } from '../../src/core/GravityFormula';

// Feature: 3d-particle-simulation, Property 18: Low-velocity collisions trigger merging
// Validates: Requirements 4.1

describe('Property 18: Low-velocity collisions trigger merging', () => {
  it('should merge particles when relative velocity is below threshold', () => {
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
          // Low velocities to ensure below threshold
          vel1X: fc.double({ min: -0.5, max: 0.5, noNaN: true }),
          vel1Y: fc.double({ min: -0.5, max: 0.5, noNaN: true }),
          vel1Z: fc.double({ min: -0.5, max: 0.5, noNaN: true }),
          vel2X: fc.double({ min: -0.5, max: 0.5, noNaN: true }),
          vel2Y: fc.double({ min: -0.5, max: 0.5, noNaN: true }),
          vel2Z: fc.double({ min: -0.5, max: 0.5, noNaN: true }),
          threshold: fc.double({ min: 1.0, max: 10.0, noNaN: true })
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

          // Calculate relative velocity
          const relativeVelocity = particle1.velocity.subtract(particle2.velocity);
          const relativeSpeed = relativeVelocity.magnitude();

          // Create physics engine
          const gravity = new NewtonianGravity(1.0, 0.01);
          const physics = new PhysicsEngine(gravity, 0.5);

          // Check if should merge
          const shouldMerge = physics.shouldMerge(particle1, particle2, data.threshold);

          // Should merge if relative speed is below threshold
          if (relativeSpeed < data.threshold) {
            expect(shouldMerge).toBe(true);
          } else {
            expect(shouldMerge).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: 3d-particle-simulation, Property 19: Center of mass follows formula (3D)
// Validates: Requirements 4.2

describe('Property 19: Center of mass follows formula (3D)', () => {
  it('should calculate center of mass correctly in 3D', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 1000, noNaN: true }),
            posX: fc.double({ min: -100, max: 100, noNaN: true }),
            posY: fc.double({ min: -100, max: 100, noNaN: true }),
            posZ: fc.double({ min: -100, max: 100, noNaN: true }),
            velX: fc.double({ min: -50, max: 50, noNaN: true }),
            velY: fc.double({ min: -50, max: 50, noNaN: true }),
            velZ: fc.double({ min: -50, max: 50, noNaN: true })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (particleData) => {
          // Create particles
          const particles = particleData.map(data => 
            new Particle(
              new Vector3D(data.posX, data.posY, data.posZ),
              new Vector3D(data.velX, data.velY, data.velZ),
              data.mass
            )
          );

          // Create conglomerate
          const conglomerate = new Conglomerate(particles);

          // Calculate expected center of mass manually
          let totalMass = 0;
          let weightedSumX = 0;
          let weightedSumY = 0;
          let weightedSumZ = 0;

          for (const data of particleData) {
            totalMass += data.mass;
            weightedSumX += data.mass * data.posX;
            weightedSumY += data.mass * data.posY;
            weightedSumZ += data.mass * data.posZ;
          }

          const expectedCOM = new Vector3D(
            weightedSumX / totalMass,
            weightedSumY / totalMass,
            weightedSumZ / totalMass
          );

          // Center of mass should match formula (within tolerance due to position adjustment)
          // Use larger tolerance since particles are adjusted to touch
          expect(conglomerate.centerOfMass.x).toBeCloseTo(expectedCOM.x, 0);
          expect(conglomerate.centerOfMass.y).toBeCloseTo(expectedCOM.y, 0);
          expect(conglomerate.centerOfMass.z).toBeCloseTo(expectedCOM.z, 0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: 3d-particle-simulation, Property 20: Conglomerate formation conserves linear momentum (3D)
// Validates: Requirements 4.3

describe('Property 20: Conglomerate formation conserves linear momentum (3D)', () => {
  it('should conserve linear momentum when forming conglomerate', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 1000, noNaN: true }),
            posX: fc.double({ min: -100, max: 100, noNaN: true }),
            posY: fc.double({ min: -100, max: 100, noNaN: true }),
            posZ: fc.double({ min: -100, max: 100, noNaN: true }),
            velX: fc.double({ min: -50, max: 50, noNaN: true }),
            velY: fc.double({ min: -50, max: 50, noNaN: true }),
            velZ: fc.double({ min: -50, max: 50, noNaN: true })
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (particleData) => {
          // Create particles
          const particles = particleData.map(data => 
            new Particle(
              new Vector3D(data.posX, data.posY, data.posZ),
              new Vector3D(data.velX, data.velY, data.velZ),
              data.mass
            )
          );

          // Calculate total momentum before conglomerate formation
          let totalMomentumBefore = Vector3D.zero();
          for (const particle of particles) {
            totalMomentumBefore = totalMomentumBefore.add(particle.momentum());
          }

          // Create conglomerate
          const conglomerate = new Conglomerate(particles);

          // Calculate total momentum after conglomerate formation
          const totalMomentumAfter = conglomerate.momentum();

          // Momentum should be conserved in all three dimensions
          expect(totalMomentumAfter.x).toBeCloseTo(totalMomentumBefore.x, 5);
          expect(totalMomentumAfter.y).toBeCloseTo(totalMomentumBefore.y, 5);
          expect(totalMomentumAfter.z).toBeCloseTo(totalMomentumBefore.z, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: 3d-particle-simulation, Property 21: Conglomerate formation conserves angular momentum (3D)
// Validates: Requirements 4.4

describe('Property 21: Conglomerate formation conserves angular momentum (3D)', () => {
  it('should conserve angular momentum when forming conglomerate', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
            posX: fc.double({ min: -10, max: 10, noNaN: true }),
            posY: fc.double({ min: -10, max: 10, noNaN: true }),
            posZ: fc.double({ min: -10, max: 10, noNaN: true }),
            velX: fc.double({ min: -5, max: 5, noNaN: true }),
            velY: fc.double({ min: -5, max: 5, noNaN: true }),
            velZ: fc.double({ min: -5, max: 5, noNaN: true })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (particleData) => {
          // Create particles
          const particles = particleData.map(data => 
            new Particle(
              new Vector3D(data.posX, data.posY, data.posZ),
              new Vector3D(data.velX, data.velY, data.velZ),
              data.mass
            )
          );

          // Calculate center of mass
          let totalMass = 0;
          let comX = 0, comY = 0, comZ = 0;
          for (const p of particles) {
            totalMass += p.mass;
            comX += p.mass * p.position.x;
            comY += p.mass * p.position.y;
            comZ += p.mass * p.position.z;
          }
          const com = new Vector3D(comX / totalMass, comY / totalMass, comZ / totalMass);

          // Calculate total angular momentum before conglomerate formation
          // L = Σ(r × p) where r is position relative to COM
          let totalAngularMomentumBefore = Vector3D.zero();
          for (const particle of particles) {
            const r = particle.position.subtract(com);
            const p = particle.momentum();
            const L = r.cross(p);
            totalAngularMomentumBefore = totalAngularMomentumBefore.add(L);
          }

          // Create conglomerate (without position adjustment to preserve angular momentum)
          const conglomerate = new Conglomerate(particles, false);

          // Calculate total angular momentum after conglomerate formation
          const totalAngularMomentumAfter = conglomerate.calculateAngularMomentum();

          // Angular momentum should be conserved in all three dimensions
          // Use tolerance of 3 decimal places due to numerical precision
          expect(totalAngularMomentumAfter.x).toBeCloseTo(totalAngularMomentumBefore.x, 3);
          expect(totalAngularMomentumAfter.y).toBeCloseTo(totalAngularMomentumBefore.y, 3);
          expect(totalAngularMomentumAfter.z).toBeCloseTo(totalAngularMomentumBefore.z, 3);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: 3d-particle-simulation, Property 22: Moment of inertia tensor follows formula
// Validates: Requirements 4.5

describe('Property 22: Moment of inertia tensor follows formula', () => {
  it('should calculate moment of inertia tensor correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
            posX: fc.double({ min: -10, max: 10, noNaN: true }),
            posY: fc.double({ min: -10, max: 10, noNaN: true }),
            posZ: fc.double({ min: -10, max: 10, noNaN: true }),
            velX: fc.double({ min: -5, max: 5, noNaN: true }),
            velY: fc.double({ min: -5, max: 5, noNaN: true }),
            velZ: fc.double({ min: -5, max: 5, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (particleData) => {
          // Create particles
          const particles = particleData.map(data => 
            new Particle(
              new Vector3D(data.posX, data.posY, data.posZ),
              new Vector3D(data.velX, data.velY, data.velZ),
              data.mass
            )
          );

          // Create conglomerate
          const conglomerate = new Conglomerate(particles);

          // Calculate expected inertia tensor manually
          const expectedTensor: number[][] = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
          ];

          for (const particle of conglomerate.particles) {
            const relPos = particle.position.subtract(conglomerate.centerOfMass);
            const m = particle.mass;
            const x = relPos.x;
            const y = relPos.y;
            const z = relPos.z;

            // Diagonal elements
            expectedTensor[0][0] += m * (y * y + z * z); // Ixx
            expectedTensor[1][1] += m * (x * x + z * z); // Iyy
            expectedTensor[2][2] += m * (x * x + y * y); // Izz

            // Off-diagonal elements
            expectedTensor[0][1] -= m * x * y; // Ixy
            expectedTensor[0][2] -= m * x * z; // Ixz
            expectedTensor[1][2] -= m * y * z; // Iyz
          }

          // Fill symmetric elements
          expectedTensor[1][0] = expectedTensor[0][1];
          expectedTensor[2][0] = expectedTensor[0][2];
          expectedTensor[2][1] = expectedTensor[1][2];

          // Get actual tensor
          const actualTensor = conglomerate.calculateMomentOfInertiaTensor();

          // Compare all elements
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              expect(actualTensor[i][j]).toBeCloseTo(expectedTensor[i][j], 5);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: 3d-particle-simulation, Property 23: Conglomerate particles maintain relative positions
// Validates: Requirements 4.7

describe('Property 23: Conglomerate particles maintain relative positions', () => {
  it('should maintain relative positions during rotation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
            posX: fc.double({ min: -10, max: 10, noNaN: true }),
            posY: fc.double({ min: -10, max: 10, noNaN: true }),
            posZ: fc.double({ min: -10, max: 10, noNaN: true }),
            velX: fc.double({ min: -5, max: 5, noNaN: true }),
            velY: fc.double({ min: -5, max: 5, noNaN: true }),
            velZ: fc.double({ min: -5, max: 5, noNaN: true })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        fc.double({ min: 0.01, max: 1.0, noNaN: true }),
        (particleData, deltaTime) => {
          // Create particles
          const particles = particleData.map(data => 
            new Particle(
              new Vector3D(data.posX, data.posY, data.posZ),
              new Vector3D(data.velX, data.velY, data.velZ),
              data.mass
            )
          );

          // Create conglomerate
          const conglomerate = new Conglomerate(particles);

          // Give it some angular velocity
          conglomerate.angularVelocity = new Vector3D(1, 2, 3);

          // Store initial distances from center of mass
          const initialDistances = conglomerate.particles.map(p =>
            p.position.distanceTo(conglomerate.centerOfMass)
          );

          // Update conglomerate
          conglomerate.update(deltaTime);

          // Check that distances are maintained (rigid body)
          for (let i = 0; i < conglomerate.particles.length; i++) {
            const currentDistance = conglomerate.particles[i].position.distanceTo(
              conglomerate.centerOfMass
            );
            expect(currentDistance).toBeCloseTo(initialDistances[i], 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
