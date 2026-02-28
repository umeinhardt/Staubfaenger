import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { Boundary } from '../../src/core/Boundary';
import { Vector3D } from '../../src/core/Vector3D';

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
          
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          const particle = manager.spawnParticle();
          
          if (!particle) return; // Skip if max particles reached
          
          // Check if particle is at one of the 6 faces
          const atLeftFace = Math.abs(particle.position.x - 0) < 0.001;
          const atRightFace = Math.abs(particle.position.x - 800) < 0.001;
          const atBottomFace = Math.abs(particle.position.y - 0) < 0.001;
          const atTopFace = Math.abs(particle.position.y - 600) < 0.001;
          const atFrontFace = Math.abs(particle.position.z - 0) < 0.001;
          const atBackFace = Math.abs(particle.position.z - 400) < 0.001;
          
          const atFace = atLeftFace || atRightFace || atBottomFace || atTopFace || atFrontFace || atBackFace;
          
          expect(atFace).toBe(true);
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
          
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
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
          
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
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
          
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 10,
            massRange,
            energyRange,
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Spawn multiple particles and collect their velocity directions
          const directions: string[] = [];
          for (let i = 0; i < 10; i++) {
            const particle = manager.spawnParticle();
            if (!particle) continue; // Skip if max particles reached
            // Create a simple hash of the velocity direction
            const dirHash = `${Math.round(particle.velocity.x * 10)},${Math.round(particle.velocity.y * 10)},${Math.round(particle.velocity.z * 10)}`;
            directions.push(dirHash);
          }
          
          // Check that we have some variation in directions
          // At least 2 different directions (with tolerance) in 10 spawns
          const uniqueDirections = new Set<string>(directions);
          
          // With random angles, we should have at least 2 different directions in 10 spawns
          // (probability of all same is extremely low)
          expect(uniqueDirections.size).toBeGreaterThanOrEqual(2);
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
          
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
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
          expect(particle.position.x).toBeGreaterThanOrEqual(0);
          expect(particle.position.x).toBeLessThanOrEqual(800);
          expect(particle.position.y).toBeGreaterThanOrEqual(0);
          expect(particle.position.y).toBeLessThanOrEqual(600);
          expect(particle.position.z).toBeGreaterThanOrEqual(0);
          expect(particle.position.z).toBeLessThanOrEqual(400);
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
          
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
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
