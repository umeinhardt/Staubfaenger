import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ParticleManager, ParticleSpawnConfig, Rectangle } from '../../src/core/ParticleManager';

// Feature: dust-particle-aggregation, Property 1: Teilcheneintritt-Validierung
// **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

describe('Property 1: Teilcheneintritt-Validierung', () => {
  it('should spawn particles at the edge of simulation bounds', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (minMass, maxMass, minEnergy, maxEnergy) => {
          // Ensure min < max
          const massRange: [number, number] = minMass < maxMass ? [minMass, maxMass] : [maxMass, minMass];
          const energyRange: [number, number] = minEnergy < maxEnergy ? [minEnergy, maxEnergy] : [maxEnergy, minEnergy];
          
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          const particle = manager.spawnParticle();
          
          if (!particle) return; // Skip if max particles reached
          
          // Check if particle is at one of the edges
          const atLeftEdge = Math.abs(particle.position.x - bounds.x) < 0.001;
          const atRightEdge = Math.abs(particle.position.x - (bounds.x + bounds.width)) < 0.001;
          const atTopEdge = Math.abs(particle.position.y - bounds.y) < 0.001;
          const atBottomEdge = Math.abs(particle.position.y - (bounds.y + bounds.height)) < 0.001;
          
          const atEdge = atLeftEdge || atRightEdge || atTopEdge || atBottomEdge;
          
          expect(atEdge).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should spawn particles with mass within configured range', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (minMass, maxMass, minEnergy, maxEnergy) => {
          // Ensure min < max
          const massRange: [number, number] = minMass < maxMass ? [minMass, maxMass] : [maxMass, minMass];
          const energyRange: [number, number] = minEnergy < maxEnergy ? [minEnergy, maxEnergy] : [maxEnergy, minEnergy];
          
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          const particle = manager.spawnParticle();
          
          if (!particle) return; // Skip if max particles reached
          
          // Mass should be within configured range
          expect(particle.mass).toBeGreaterThanOrEqual(massRange[0]);
          expect(particle.mass).toBeLessThanOrEqual(massRange[1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should spawn particles with kinetic energy within configured range', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (minMass, maxMass, minEnergy, maxEnergy) => {
          // Ensure min < max
          const massRange: [number, number] = minMass < maxMass ? [minMass, maxMass] : [maxMass, minMass];
          const energyRange: [number, number] = minEnergy < maxEnergy ? [minEnergy, maxEnergy] : [maxEnergy, minEnergy];
          
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          const particle = manager.spawnParticle();
          
          if (!particle) return; // Skip if max particles reached
          
          const kineticEnergy = particle.kineticEnergy();
          
          // Kinetic energy should be within configured range (with small tolerance for floating point)
          expect(kineticEnergy).toBeGreaterThanOrEqual(energyRange[0] - 0.001);
          expect(kineticEnergy).toBeLessThanOrEqual(energyRange[1] + 0.001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should spawn particles with random entry angles', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (minMass, maxMass, minEnergy, maxEnergy) => {
          // Ensure min < max
          const massRange: [number, number] = minMass < maxMass ? [minMass, maxMass] : [maxMass, minMass];
          const energyRange: [number, number] = minEnergy < maxEnergy ? [minEnergy, maxEnergy] : [maxEnergy, minEnergy];
          
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Spawn multiple particles and collect their angles
          const angles: number[] = [];
          for (let i = 0; i < 10; i++) {
            const particle = manager.spawnParticle();
            if (!particle) continue; // Skip if max particles reached
            const angle = Math.atan2(particle.velocity.y, particle.velocity.x);
            angles.push(angle);
          }
          
          // Check that we have some variation in angles
          // At least 2 different angles (with tolerance) in 10 spawns
          const uniqueAngles = new Set<number>();
          for (const angle of angles) {
            // Round to 2 decimal places to account for floating point
            const rounded = Math.round(angle * 100) / 100;
            uniqueAngles.add(rounded);
          }
          
          // With random angles, we should have at least 2 different angles in 10 spawns
          // (probability of all same is extremely low)
          expect(uniqueAngles.size).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should spawn particles with position within or at bounds', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (minMass, maxMass, minEnergy, maxEnergy) => {
          // Ensure min < max
          const massRange: [number, number] = minMass < maxMass ? [minMass, maxMass] : [maxMass, minMass];
          const energyRange: [number, number] = minEnergy < maxEnergy ? [minEnergy, maxEnergy] : [maxEnergy, minEnergy];
          
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          const particle = manager.spawnParticle();
          
          if (!particle) return; // Skip if max particles reached
          
          // Position should be within or at the bounds
          expect(particle.position.x).toBeGreaterThanOrEqual(bounds.x);
          expect(particle.position.x).toBeLessThanOrEqual(bounds.x + bounds.width);
          expect(particle.position.y).toBeGreaterThanOrEqual(bounds.y);
          expect(particle.position.y).toBeLessThanOrEqual(bounds.y + bounds.height);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should spawn particles with velocity magnitude matching kinetic energy formula', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        fc.double({ min: 1, max: 10000, noNaN: true }),
        (minMass, maxMass, minEnergy, maxEnergy) => {
          // Ensure min < max
          const massRange: [number, number] = minMass < maxMass ? [minMass, maxMass] : [maxMass, minMass];
          const energyRange: [number, number] = minEnergy < maxEnergy ? [minEnergy, maxEnergy] : [maxEnergy, minEnergy];
          
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          const particle = manager.spawnParticle();
          
          if (!particle) return; // Skip if max particles reached
          
          // Calculate kinetic energy from velocity: KE = 0.5 * m * v²
          const velocityMagnitude = particle.velocity.magnitude();
          const calculatedEnergy = 0.5 * particle.mass * velocityMagnitude * velocityMagnitude;
          const actualEnergy = particle.kineticEnergy();
          
          // They should match (with small tolerance for floating point)
          expect(calculatedEnergy).toBeCloseTo(actualEnergy, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
