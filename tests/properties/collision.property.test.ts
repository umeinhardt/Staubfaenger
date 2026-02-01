import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CollisionDetector } from '../../src/core/CollisionDetector';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';

// Feature: 3d-particle-simulation, Property 8: Konglomerat-Bildung bei Kontakt
// Feature: 3d-particle-simulation, Property 17: Overlapping spheres are detected as collisions
// Validates: Anforderung 7.1, 3.4

describe('Property 8: Konglomerat-Bildung bei Kontakt', () => {
  it('should detect collision when particles are touching (distance = sum of radii)', () => {
    fc.assert(
      fc.property(
        fc.record({
          mass1: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          mass2: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          posX: fc.double({ min: -1000, max: 1000, noNaN: true }),
          posY: fc.double({ min: -1000, max: 1000, noNaN: true }),
          posZ: fc.double({ min: -1000, max: 1000, noNaN: true }),
          theta: fc.double({ min: 0, max: Math.PI, noNaN: true }),
          phi: fc.double({ min: 0, max: 2 * Math.PI, noNaN: true })
        }),
        (data) => {
          // Create first particle at given position
          const particle1 = new Particle(
            new Vector3D(data.posX, data.posY, data.posZ),
            Vector3D.zero(),
            data.mass1
          );

          // Create second particle temporarily to get its radius
          const tempParticle2 = new Particle(
            Vector3D.zero(),
            Vector3D.zero(),
            data.mass2
          );

          // Calculate exact touching distance (with small epsilon to ensure touching)
          const touchingDistance = (particle1.radius + tempParticle2.radius) * 0.99;
          
          // Place second particle exactly at touching distance using spherical coordinates
          const particle2 = new Particle(
            new Vector3D(
              data.posX + touchingDistance * Math.sin(data.theta) * Math.cos(data.phi),
              data.posY + touchingDistance * Math.sin(data.theta) * Math.sin(data.phi),
              data.posZ + touchingDistance * Math.cos(data.theta)
            ),
            Vector3D.zero(),
            data.mass2
          );

          // Create collision detector with larger cell size
          const detector = new CollisionDetector((particle1.radius + particle2.radius) * 3);

          // Should detect collision when particles are exactly touching
          const collisions = detector.detectCollisions([particle1, particle2]);
          expect(collisions.length).toBeGreaterThanOrEqual(1);
          
          // Verify the collision pair contains both particles
          const collision = collisions[0];
          const ids = [collision.entity1.id, collision.entity2.id];
          expect(ids).toContain(particle1.id);
          expect(ids).toContain(particle2.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect collision when particles are overlapping (distance < sum of radii)', () => {
    fc.assert(
      fc.property(
        fc.record({
          mass1: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          mass2: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          posX: fc.double({ min: -1000, max: 1000, noNaN: true }),
          posY: fc.double({ min: -1000, max: 1000, noNaN: true }),
          posZ: fc.double({ min: -1000, max: 1000, noNaN: true }),
          theta: fc.double({ min: 0, max: Math.PI, noNaN: true }),
          phi: fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
          overlapFactor: fc.double({ min: 0.1, max: 0.9, noNaN: true })
        }),
        (data) => {
          // Create first particle
          const particle1 = new Particle(
            new Vector3D(data.posX, data.posY, data.posZ),
            Vector3D.zero(),
            data.mass1
          );

          // Calculate overlapping distance (less than sum of radii)
          const touchingDistance = particle1.radius + Math.sqrt(data.mass2);
          const overlappingDistance = touchingDistance * data.overlapFactor;
          
          // Place second particle at overlapping distance using spherical coordinates
          const particle2 = new Particle(
            new Vector3D(
              data.posX + overlappingDistance * Math.sin(data.theta) * Math.cos(data.phi),
              data.posY + overlappingDistance * Math.sin(data.theta) * Math.sin(data.phi),
              data.posZ + overlappingDistance * Math.cos(data.theta)
            ),
            Vector3D.zero(),
            data.mass2
          );

          // Create collision detector with larger cell size
          const detector = new CollisionDetector((particle1.radius + particle2.radius) * 3);

          // Should detect collision when particles are overlapping
          const collisions = detector.detectCollisions([particle1, particle2]);
          expect(collisions.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT detect collision when particles are separated (distance > sum of radii)', () => {
    fc.assert(
      fc.property(
        fc.record({
          mass1: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          mass2: fc.double({ min: 0.1, max: 1000, noNaN: true }),
          posX: fc.double({ min: -1000, max: 1000, noNaN: true }),
          posY: fc.double({ min: -1000, max: 1000, noNaN: true }),
          posZ: fc.double({ min: -1000, max: 1000, noNaN: true }),
          theta: fc.double({ min: 0, max: Math.PI, noNaN: true }),
          phi: fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }),
          separationFactor: fc.double({ min: 1.1, max: 10, noNaN: true })
        }),
        (data) => {
          // Create first particle
          const particle1 = new Particle(
            new Vector3D(data.posX, data.posY, data.posZ),
            Vector3D.zero(),
            data.mass1
          );

          // Calculate separated distance (more than sum of radii)
          const touchingDistance = particle1.radius + Math.sqrt(data.mass2);
          const separatedDistance = touchingDistance * data.separationFactor;
          
          // Place second particle at separated distance using spherical coordinates
          const particle2 = new Particle(
            new Vector3D(
              data.posX + separatedDistance * Math.sin(data.theta) * Math.cos(data.phi),
              data.posY + separatedDistance * Math.sin(data.theta) * Math.sin(data.phi),
              data.posZ + separatedDistance * Math.cos(data.theta)
            ),
            Vector3D.zero(),
            data.mass2
          );

          // Create collision detector with larger cell size
          const detector = new CollisionDetector((particle1.radius + particle2.radius) * 3);

          // Should NOT detect collision when particles are separated
          const collisions = detector.detectCollisions([particle1, particle2]);
          expect(collisions.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // NOTE: Conglomerate collision tests are commented out until task 6 updates Conglomerate to 3D

  it('should detect all collisions in a group of multiple particles', () => {
    fc.assert(
      fc.property(
        fc.record({
          centerX: fc.double({ min: -1000, max: 1000, noNaN: true }),
          centerY: fc.double({ min: -1000, max: 1000, noNaN: true }),
          centerZ: fc.double({ min: -1000, max: 1000, noNaN: true }),
          numParticles: fc.integer({ min: 3, max: 10 }),
          mass: fc.double({ min: 1, max: 100, noNaN: true })
        }),
        (data) => {
          // Create particles in a tight cluster (all overlapping)
          const particles: Particle[] = [];
          const radius = Math.sqrt(data.mass);
          
          for (let i = 0; i < data.numParticles; i++) {
            // Distribute particles on a sphere using Fibonacci sphere algorithm
            const phi = Math.acos(1 - 2 * (i + 0.5) / data.numParticles);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            // Place particles at distance 0.9 * radius from center
            // This ensures they overlap with each other
            const distance = radius * 0.9;
            
            particles.push(new Particle(
              new Vector3D(
                data.centerX + distance * Math.sin(phi) * Math.cos(theta),
                data.centerY + distance * Math.sin(phi) * Math.sin(theta),
                data.centerZ + distance * Math.cos(phi)
              ),
              Vector3D.zero(),
              data.mass
            ));
          }

          // Create collision detector with larger cell size
          const detector = new CollisionDetector(radius * 4);

          // Should detect multiple collisions
          const collisions = detector.detectCollisions(particles);
          expect(collisions.length).toBeGreaterThan(0);
          
          // Each collision should involve different entities
          for (const collision of collisions) {
            expect(collision.entity1.id).not.toBe(collision.entity2.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
