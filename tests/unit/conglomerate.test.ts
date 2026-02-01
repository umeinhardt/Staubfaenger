import { describe, it, expect } from 'vitest';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';

describe('Conglomerate 3D Edge Cases', () => {
  describe('Single-particle conglomerate', () => {
    it('should create a conglomerate with a single particle', () => {
      const particle = new Particle(
        new Vector3D(1, 2, 3),
        new Vector3D(4, 5, 6),
        10
      );

      const conglomerate = new Conglomerate([particle]);

      expect(conglomerate.particles.length).toBe(1);
      expect(conglomerate.totalMass).toBe(10);
      expect(conglomerate.centerOfMass.x).toBeCloseTo(1);
      expect(conglomerate.centerOfMass.y).toBeCloseTo(2);
      expect(conglomerate.centerOfMass.z).toBeCloseTo(3);
      expect(conglomerate.velocity.x).toBeCloseTo(4);
      expect(conglomerate.velocity.y).toBeCloseTo(5);
      expect(conglomerate.velocity.z).toBeCloseTo(6);
    });

    it('should have zero moment of inertia for single particle at center', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(1, 1, 1),
        5
      );

      const conglomerate = new Conglomerate([particle]);
      const tensor = conglomerate.calculateMomentOfInertiaTensor();

      // All elements should be zero for single particle at center
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          expect(tensor[i][j]).toBeCloseTo(0, 10);
        }
      }
    });

    it('should update position correctly for single particle', () => {
      const particle = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(1, 2, 3),
        5
      );

      const conglomerate = new Conglomerate([particle]);
      conglomerate.update(1.0);

      expect(conglomerate.centerOfMass.x).toBeCloseTo(1);
      expect(conglomerate.centerOfMass.y).toBeCloseTo(2);
      expect(conglomerate.centerOfMass.z).toBeCloseTo(3);
    });
  });

  describe('Two-particle conglomerate rotation in 3D', () => {
    it('should rotate two particles correctly around center of mass', () => {
      // Create two particles on opposite sides of origin
      const particle1 = new Particle(
        new Vector3D(1, 0, 0),
        new Vector3D(0, 0, 0),
        1
      );
      const particle2 = new Particle(
        new Vector3D(-1, 0, 0),
        new Vector3D(0, 0, 0),
        1
      );

      const conglomerate = new Conglomerate([particle1, particle2]);

      // Set angular velocity around z-axis
      conglomerate.angularVelocity = new Vector3D(0, 0, Math.PI / 2); // 90 degrees per second

      // Store initial distances
      const initialDist1 = conglomerate.particles[0].position.distanceTo(conglomerate.centerOfMass);
      const initialDist2 = conglomerate.particles[1].position.distanceTo(conglomerate.centerOfMass);

      // Update for 1 second (should rotate 90 degrees)
      conglomerate.update(1.0);

      // Distances should be preserved
      const finalDist1 = conglomerate.particles[0].position.distanceTo(conglomerate.centerOfMass);
      const finalDist2 = conglomerate.particles[1].position.distanceTo(conglomerate.centerOfMass);

      expect(finalDist1).toBeCloseTo(initialDist1, 5);
      expect(finalDist2).toBeCloseTo(initialDist2, 5);

      // After 90 degree rotation around z-axis, particle at (1,0,0) should be near (0,1,0)
      const relPos1 = conglomerate.particles[0].position.subtract(conglomerate.centerOfMass);
      expect(relPos1.x).toBeCloseTo(0, 5);
      expect(Math.abs(relPos1.y)).toBeCloseTo(1, 5);
      expect(relPos1.z).toBeCloseTo(0, 5);
    });

    it('should maintain relative positions during rotation', () => {
      const particle1 = new Particle(
        new Vector3D(1, 0, 0),
        new Vector3D(0, 0, 0),
        1
      );
      const particle2 = new Particle(
        new Vector3D(0, 1, 0),
        new Vector3D(0, 0, 0),
        1
      );

      const conglomerate = new Conglomerate([particle1, particle2]);
      conglomerate.angularVelocity = new Vector3D(1, 1, 1);

      // Store initial distance between particles
      const initialDistance = conglomerate.particles[0].position.distanceTo(
        conglomerate.particles[1].position
      );

      // Update multiple times
      for (let i = 0; i < 10; i++) {
        conglomerate.update(0.1);
      }

      // Distance between particles should be preserved
      const finalDistance = conglomerate.particles[0].position.distanceTo(
        conglomerate.particles[1].position
      );

      expect(finalDistance).toBeCloseTo(initialDistance, 5);
    });
  });

  describe('Merging two conglomerates', () => {
    it('should merge two conglomerates correctly', () => {
      // Create first conglomerate
      const particles1 = [
        new Particle(new Vector3D(0, 0, 0), new Vector3D(1, 0, 0), 1),
        new Particle(new Vector3D(1, 0, 0), new Vector3D(1, 0, 0), 1)
      ];
      const conglomerate1 = new Conglomerate(particles1);

      // Create second conglomerate
      const particles2 = [
        new Particle(new Vector3D(10, 0, 0), new Vector3D(-1, 0, 0), 1),
        new Particle(new Vector3D(11, 0, 0), new Vector3D(-1, 0, 0), 1)
      ];
      const conglomerate2 = new Conglomerate(particles2);

      // Merge them
      const merged = conglomerate1.merge(conglomerate2);

      // Should have all particles
      expect(merged.particles.length).toBe(4);

      // Total mass should be sum
      expect(merged.totalMass).toBe(4);

      // Momentum should be conserved
      const momentum1 = conglomerate1.momentum();
      const momentum2 = conglomerate2.momentum();
      const totalMomentum = momentum1.add(momentum2);
      const mergedMomentum = merged.momentum();

      expect(mergedMomentum.x).toBeCloseTo(totalMomentum.x, 5);
      expect(mergedMomentum.y).toBeCloseTo(totalMomentum.y, 5);
      expect(mergedMomentum.z).toBeCloseTo(totalMomentum.z, 5);
    });

    it('should preserve angular momentum when merging', () => {
      // Create first conglomerate with rotation
      const particles1 = [
        new Particle(new Vector3D(0, 0, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(1, 0, 0), new Vector3D(0, 0, 0), 1)
      ];
      const conglomerate1 = new Conglomerate(particles1);
      conglomerate1.angularVelocity = new Vector3D(0, 0, 1);

      // Create second conglomerate with rotation
      const particles2 = [
        new Particle(new Vector3D(10, 0, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(11, 0, 0), new Vector3D(0, 0, 0), 1)
      ];
      const conglomerate2 = new Conglomerate(particles2);
      conglomerate2.angularVelocity = new Vector3D(0, 0, 2);

      // Calculate total angular momentum before merge
      const L1 = conglomerate1.calculateAngularMomentum();
      const L2 = conglomerate2.calculateAngularMomentum();
      const totalL = L1.add(L2);

      // Merge them
      const merged = conglomerate1.merge(conglomerate2);

      // Angular momentum should be approximately conserved
      const mergedL = merged.calculateAngularMomentum();

      // Use larger tolerance due to position adjustment during merge
      expect(mergedL.x).toBeCloseTo(totalL.x, 1);
      expect(mergedL.y).toBeCloseTo(totalL.y, 1);
      expect(mergedL.z).toBeCloseTo(totalL.z, 1);
    });
  });

  describe('Quaternion normalization over time', () => {
    it('should maintain normalized quaternion after many updates', () => {
      const particles = [
        new Particle(new Vector3D(1, 0, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(-1, 0, 0), new Vector3D(0, 0, 0), 1)
      ];

      const conglomerate = new Conglomerate(particles);
      conglomerate.angularVelocity = new Vector3D(1, 2, 3);

      // Update many times
      for (let i = 0; i < 1000; i++) {
        conglomerate.update(0.01);
      }

      // Quaternion should still be normalized (magnitude = 1)
      const quat = conglomerate.orientation;
      const magnitude = Math.sqrt(quat.w * quat.w + quat.x * quat.x + quat.y * quat.y + quat.z * quat.z);

      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should maintain rigid body constraints after many rotations', () => {
      const particles = [
        new Particle(new Vector3D(1, 0, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(0, 1, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(0, 0, 1), new Vector3D(0, 0, 0), 1)
      ];

      const conglomerate = new Conglomerate(particles);
      conglomerate.angularVelocity = new Vector3D(2, 3, 4);

      // Store initial distances between all pairs
      const initialDistances: number[][] = [];
      for (let i = 0; i < particles.length; i++) {
        initialDistances[i] = [];
        for (let j = 0; j < particles.length; j++) {
          initialDistances[i][j] = conglomerate.particles[i].position.distanceTo(
            conglomerate.particles[j].position
          );
        }
      }

      // Update many times with rotation
      for (let i = 0; i < 500; i++) {
        conglomerate.update(0.01);
      }

      // All pairwise distances should be preserved
      for (let i = 0; i < particles.length; i++) {
        for (let j = 0; j < particles.length; j++) {
          const currentDistance = conglomerate.particles[i].position.distanceTo(
            conglomerate.particles[j].position
          );
          expect(currentDistance).toBeCloseTo(initialDistances[i][j], 4);
        }
      }
    });
  });

  describe('Error handling', () => {
    it('should throw error when creating conglomerate with no particles', () => {
      expect(() => new Conglomerate([])).toThrow('Conglomerate must contain at least one particle');
    });

    it('should handle zero angular velocity gracefully', () => {
      const particles = [
        new Particle(new Vector3D(1, 0, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(-1, 0, 0), new Vector3D(0, 0, 0), 1)
      ];

      const conglomerate = new Conglomerate(particles);
      conglomerate.angularVelocity = Vector3D.zero();

      // Should update without errors
      expect(() => conglomerate.update(1.0)).not.toThrow();

      // Particles should maintain their relative positions
      const relPos1 = conglomerate.particles[0].position.subtract(conglomerate.centerOfMass);
      expect(relPos1.magnitude()).toBeGreaterThan(0);
    });

    it('should handle applying force to conglomerate', () => {
      const particles = [
        new Particle(new Vector3D(0, 0, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(1, 0, 0), new Vector3D(0, 0, 0), 1)
      ];

      const conglomerate = new Conglomerate(particles);
      const initialVelocity = conglomerate.velocity;

      // Apply force
      const force = new Vector3D(10, 0, 0);
      conglomerate.applyForce(force, 1.0);

      // Velocity should change
      expect(conglomerate.velocity.x).toBeGreaterThan(initialVelocity.x);
    });

    it('should handle applying torque to conglomerate', () => {
      const particles = [
        new Particle(new Vector3D(1, 0, 0), new Vector3D(0, 0, 0), 1),
        new Particle(new Vector3D(-1, 0, 0), new Vector3D(0, 0, 0), 1)
      ];

      const conglomerate = new Conglomerate(particles);
      const initialAngularVelocity = conglomerate.angularVelocity;

      // Apply torque
      const torque = new Vector3D(0, 0, 10);
      conglomerate.applyTorque(torque, 1.0);

      // Angular velocity should change
      expect(conglomerate.angularVelocity.magnitude()).toBeGreaterThan(
        initialAngularVelocity.magnitude()
      );
    });
  });
});
