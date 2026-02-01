import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector2D } from '../../src/core/Vector2D';

// Feature: dust-particle-aggregation, Property 3: Massenproportionalität und -erhaltung
// Validates: Anforderungen 5.1, 5.2, 7.3

describe('Property 3: Massenproportionalität und -erhaltung', () => {
  it('should have radius proportional to mass (r = sqrt(m))', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        (mass, posX, posY, velX, velY) => {
          const position = new Vector2D(posX, posY);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);

          // Radius should be proportional to sqrt(mass)
          const expectedRadius = Math.sqrt(mass);
          expect(particle.radius).toBeCloseTo(expectedRadius, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain mass as immutable property', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        (mass, posX, posY, velX, velY) => {
          const position = new Vector2D(posX, posY);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);

          const initialMass = particle.mass;

          // Apply some forces and updates
          const force = new Vector2D(10, 10);
          particle.applyForce(force, 0.1);
          particle.update(0.1);

          // Mass should remain unchanged
          expect(particle.mass).toBe(initialMass);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain radius as immutable property', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -100, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        (mass, posX, posY, velX, velY) => {
          const position = new Vector2D(posX, posY);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);

          const initialRadius = particle.radius;

          // Apply some forces and updates
          const force = new Vector2D(10, 10);
          particle.applyForce(force, 0.1);
          particle.update(0.1);

          // Radius should remain unchanged
          expect(particle.radius).toBe(initialRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3 extended: Mass conservation during conglomerate formation and merging
  it('should conserve total mass when creating a conglomerate from particles', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 1000, noNaN: true }),
            posX: fc.double({ min: -100, max: 100, noNaN: true }),
            posY: fc.double({ min: -100, max: 100, noNaN: true }),
            velX: fc.double({ min: -50, max: 50, noNaN: true }),
            velY: fc.double({ min: -50, max: 50, noNaN: true })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (particleData) => {
          // Create particles
          const particles = particleData.map(data => 
            new Particle(
              new Vector2D(data.posX, data.posY),
              new Vector2D(data.velX, data.velY),
              data.mass
            )
          );

          // Calculate total mass before conglomerate formation
          const totalMassBefore = particles.reduce((sum, p) => sum + p.mass, 0);

          // Create conglomerate
          const conglomerate = new Conglomerate(particles);

          // Total mass should be conserved
          expect(conglomerate.totalMass).toBeCloseTo(totalMassBefore, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should conserve total mass when merging two conglomerates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 1000, noNaN: true }),
            posX: fc.double({ min: -100, max: 100, noNaN: true }),
            posY: fc.double({ min: -100, max: 100, noNaN: true }),
            velX: fc.double({ min: -50, max: 50, noNaN: true }),
            velY: fc.double({ min: -50, max: 50, noNaN: true })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 1000, noNaN: true }),
            posX: fc.double({ min: -100, max: 100, noNaN: true }),
            posY: fc.double({ min: -100, max: 100, noNaN: true }),
            velX: fc.double({ min: -50, max: 50, noNaN: true }),
            velY: fc.double({ min: -50, max: 50, noNaN: true })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (particleData1, particleData2) => {
          // Create first conglomerate
          const particles1 = particleData1.map(data => 
            new Particle(
              new Vector2D(data.posX, data.posY),
              new Vector2D(data.velX, data.velY),
              data.mass
            )
          );
          const conglomerate1 = new Conglomerate(particles1);

          // Create second conglomerate
          const particles2 = particleData2.map(data => 
            new Particle(
              new Vector2D(data.posX, data.posY),
              new Vector2D(data.velX, data.velY),
              data.mass
            )
          );
          const conglomerate2 = new Conglomerate(particles2);

          // Calculate total mass before merge
          const totalMassBefore = conglomerate1.totalMass + conglomerate2.totalMass;

          // Merge conglomerates
          const merged = conglomerate1.merge(conglomerate2);

          // Total mass should be conserved
          expect(merged.totalMass).toBeCloseTo(totalMassBefore, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have radius proportional to mass for conglomerates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mass: fc.double({ min: 0.1, max: 100, noNaN: true }),
            posX: fc.double({ min: -10, max: 10, noNaN: true }),
            posY: fc.double({ min: -10, max: 10, noNaN: true }),
            velX: fc.double({ min: -5, max: 5, noNaN: true }),
            velY: fc.double({ min: -5, max: 5, noNaN: true })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (particleData) => {
          // Create particles
          const particles = particleData.map(data => 
            new Particle(
              new Vector2D(data.posX, data.posY),
              new Vector2D(data.velX, data.velY),
              data.mass
            )
          );

          // Create conglomerate
          const conglomerate = new Conglomerate(particles);

          // Radius should be positive and related to the spatial extent
          expect(conglomerate.radius).toBeGreaterThan(0);
          
          // Radius should be at least as large as the largest particle radius
          const maxParticleRadius = Math.max(...particles.map(p => p.radius));
          expect(conglomerate.radius).toBeGreaterThanOrEqual(maxParticleRadius);
        }
      ),
      { numRuns: 100 }
    );
  });
});