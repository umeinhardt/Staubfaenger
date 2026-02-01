import { describe, it, expect } from 'vitest';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector3D } from '../../src/core/Vector3D';

describe('3D CollisionDetector Edge Cases', () => {
  describe('Sphere-sphere collision detection in 3D', () => {
    it('should detect collision between two overlapping spheres', () => {
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        10
      );
      const particle2 = new Particle(
        new Vector3D(5, 0, 0), // Close enough to collide
        Vector3D.zero(),
        10
      );

      const detector = new CollisionDetector(particle1.radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(1);
      expect(collisions[0].entity1.id).toBe(particle1.id);
      expect(collisions[0].entity2.id).toBe(particle2.id);
    });

    it('should detect collision in 3D space (z-axis)', () => {
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        10
      );
      const particle2 = new Particle(
        new Vector3D(0, 0, 5), // Collision along z-axis
        Vector3D.zero(),
        10
      );

      const detector = new CollisionDetector(particle1.radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(1);
    });

    it('should detect collision in diagonal 3D direction', () => {
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        10
      );
      const particle2 = new Particle(
        new Vector3D(3, 3, 3), // Diagonal collision
        Vector3D.zero(),
        10
      );

      const detector = new CollisionDetector(particle1.radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(1);
    });
  });

  describe('Non-colliding spheres', () => {
    it('should not detect collision when spheres are far apart', () => {
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        10
      );
      const particle2 = new Particle(
        new Vector3D(100, 100, 100), // Far away
        Vector3D.zero(),
        10
      );

      const detector = new CollisionDetector(particle1.radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(0);
    });

    it('should not detect collision when spheres are just barely not touching', () => {
      const mass = 10;
      const radius = Math.sqrt(mass);
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        mass
      );
      const particle2 = new Particle(
        new Vector3D(radius * 2 + 0.01, 0, 0), // Just beyond touching distance
        Vector3D.zero(),
        mass
      );

      const detector = new CollisionDetector(radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(0);
    });
  });

  describe('Edge cases - touching spheres', () => {
    it('should detect collision when spheres are exactly touching', () => {
      const mass = 10;
      const radius = Math.sqrt(mass);
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        mass
      );
      const particle2 = new Particle(
        new Vector3D(radius * 2, 0, 0), // Exactly touching
        Vector3D.zero(),
        mass
      );

      const detector = new CollisionDetector(radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(1);
    });

    it('should detect collision when sphere centers overlap', () => {
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        10
      );
      const particle2 = new Particle(
        new Vector3D(0, 0, 0), // Same position
        Vector3D.zero(),
        10
      );

      const detector = new CollisionDetector(particle1.radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(1);
    });

    it('should detect collision when small sphere is inside large sphere', () => {
      const largeParticle = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        1000 // Large mass = large radius
      );
      const smallParticle = new Particle(
        new Vector3D(5, 5, 5), // Inside the large particle
        Vector3D.zero(),
        1 // Small mass = small radius
      );

      const detector = new CollisionDetector(largeParticle.radius * 2);
      const collisions = detector.detectCollisions([largeParticle, smallParticle]);

      expect(collisions.length).toBe(1);
    });
  });

  describe('Spatial hash with 3D positions', () => {
    it('should handle particles at 3D cell boundaries', () => {
      const cellSize = 10;
      const detector = new CollisionDetector(cellSize);

      // Place particles exactly at 3D cell boundaries
      const particle1 = new Particle(
        new Vector3D(cellSize, cellSize, cellSize),
        Vector3D.zero(),
        5
      );
      const particle2 = new Particle(
        new Vector3D(cellSize + particle1.radius * 2, cellSize, cellSize),
        Vector3D.zero(),
        5
      );

      const collisions = detector.detectCollisions([particle1, particle2]);
      expect(collisions.length).toBe(1);
    });

    it('should detect collisions across different z-levels', () => {
      const particles = [
        new Particle(new Vector3D(0, 0, 0), Vector3D.zero(), 10),
        new Particle(new Vector3D(0, 0, 5), Vector3D.zero(), 10),
        new Particle(new Vector3D(0, 0, 10), Vector3D.zero(), 10)
      ];

      const detector = new CollisionDetector(Math.sqrt(10) * 2);
      const collisions = detector.detectCollisions(particles);

      // Should detect 2 collisions: (0,1) and (1,2)
      expect(collisions.length).toBe(2);
    });

    it('should not produce duplicate collision pairs in 3D', () => {
      const particles = [
        new Particle(new Vector3D(0, 0, 0), Vector3D.zero(), 10),
        new Particle(new Vector3D(5, 0, 0), Vector3D.zero(), 10)
      ];

      const detector = new CollisionDetector(Math.sqrt(10) * 2);
      const collisions = detector.detectCollisions(particles);

      // Should only detect one collision, not duplicates
      expect(collisions.length).toBe(1);
    });

    it('should handle empty entity list', () => {
      const detector = new CollisionDetector(10);
      const collisions = detector.detectCollisions([]);

      expect(collisions.length).toBe(0);
    });

    it('should handle single entity', () => {
      const detector = new CollisionDetector(10);
      const particle = new Particle(new Vector3D(0, 0, 0), Vector3D.zero(), 10);
      const collisions = detector.detectCollisions([particle]);

      expect(collisions.length).toBe(0);
    });
  });

  describe('Multiple simultaneous collisions in 3D', () => {
    it('should detect all collisions in a 3D cluster', () => {
      // Create particles in a 3D cube formation
      const mass = 10;
      const radius = Math.sqrt(mass);
      const spacing = radius * 2; // Exactly touching

      const particles = [
        new Particle(new Vector3D(0, 0, 0), Vector3D.zero(), mass),
        new Particle(new Vector3D(spacing, 0, 0), Vector3D.zero(), mass),
        new Particle(new Vector3D(0, spacing, 0), Vector3D.zero(), mass),
        new Particle(new Vector3D(0, 0, spacing), Vector3D.zero(), mass)
      ];

      const detector = new CollisionDetector(radius * 2);
      const collisions = detector.detectCollisions(particles);

      // Should detect 3 collisions: (0,1), (0,2), (0,3)
      expect(collisions.length).toBe(3);
    });

    it('should detect collisions in a dense 3D cluster', () => {
      // Create many particles in a small 3D volume
      const particles: Particle[] = [];
      const mass = 10;
      const radius = Math.sqrt(mass);
      const clusterRadius = radius * 1.5;

      // Create particles in a spherical cluster
      for (let i = 0; i < 8; i++) {
        const theta = (2 * Math.PI * i) / 8;
        const phi = Math.PI / 4;
        particles.push(new Particle(
          new Vector3D(
            clusterRadius * Math.sin(phi) * Math.cos(theta),
            clusterRadius * Math.sin(phi) * Math.sin(theta),
            clusterRadius * Math.cos(phi)
          ),
          Vector3D.zero(),
          mass
        ));
      }

      const detector = new CollisionDetector(radius * 2);
      const collisions = detector.detectCollisions(particles);

      // Should detect multiple collisions in the cluster
      expect(collisions.length).toBeGreaterThan(0);
    });
  });

  describe('High velocity collisions in 3D', () => {
    it('should detect collision between fast-moving particles in 3D', () => {
      const particle1 = new Particle(
        new Vector3D(0, 0, 0),
        new Vector3D(1000, 500, 250), // Very high velocity in 3D
        10
      );
      const particle2 = new Particle(
        new Vector3D(5, 0, 0), // Close enough to collide
        new Vector3D(-1000, -500, -250), // Moving towards particle1
        10
      );

      const detector = new CollisionDetector(particle1.radius * 2);
      const collisions = detector.detectCollisions([particle1, particle2]);

      expect(collisions.length).toBe(1);
      expect(collisions[0].entity1.id).toBe(particle1.id);
      expect(collisions[0].entity2.id).toBe(particle2.id);
    });
  });

  describe('Extreme mass differences in 3D', () => {
    it('should detect collision between very large and very small particles', () => {
      const largeParticle = new Particle(
        new Vector3D(0, 0, 0),
        Vector3D.zero(),
        10000 // Very large
      );
      const smallParticle = new Particle(
        new Vector3D(largeParticle.radius, 0, 0), // At the edge
        Vector3D.zero(),
        0.1 // Very small
      );

      const detector = new CollisionDetector(largeParticle.radius * 2);
      const collisions = detector.detectCollisions([largeParticle, smallParticle]);

      expect(collisions.length).toBe(1);
    });
  });
});
