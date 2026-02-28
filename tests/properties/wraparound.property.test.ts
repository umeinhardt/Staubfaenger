import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ParticleManager, ParticleSpawnConfig } from '../../src/core/ParticleManager';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector3D } from '../../src/core/Vector3D';
import { Boundary } from '../../src/core/Boundary';

// Feature: dust-particle-aggregation, Property 2: Wrap-around Konsistenz
// **Validates: Requirement 3.6**

describe('Property 2: Wrap-around Konsistenz', () => {
  it('should preserve mass when particle wraps around', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.constantFrom('left', 'right', 'top', 'bottom', 'front', 'back'),
        (mass, velX, velY, velZ, edge) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside the specified edge
          let position: Vector3D;
          switch (edge) {
            case 'left':
              position = new Vector3D(-1, 300, 200);
              break;
            case 'right':
              position = new Vector3D(801, 300, 200);
              break;
            case 'top':
              position = new Vector3D(400, 601, 200);
              break;
            case 'bottom':
              position = new Vector3D(400, -1, 200);
              break;
            case 'front':
              position = new Vector3D(400, 300, -1);
              break;
            case 'back':
              position = new Vector3D(400, 300, 401);
              break;
          }
          
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          const massBefore = particle.mass;
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          const massAfter = particle.mass;
          
          // Mass should be preserved
          expect(massAfter).toBe(massBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve velocity when particle wraps around', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.constantFrom('left', 'right', 'top', 'bottom', 'front', 'back'),
        (mass, velX, velY, velZ, edge) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside the specified edge
          let position: Vector3D;
          switch (edge) {
            case 'left':
              position = new Vector3D(-1, 300, 200);
              break;
            case 'right':
              position = new Vector3D(801, 300, 200);
              break;
            case 'top':
              position = new Vector3D(400, 601, 200);
              break;
            case 'bottom':
              position = new Vector3D(400, -1, 200);
              break;
            case 'front':
              position = new Vector3D(400, 300, -1);
              break;
            case 'back':
              position = new Vector3D(400, 300, 401);
              break;
          }
          
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          const velocityBefore = new Vector3D(particle.velocity.x, particle.velocity.y, particle.velocity.z);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          const velocityAfter = particle.velocity;
          
          // Velocity should be preserved
          expect(velocityAfter.x).toBe(velocityBefore.x);
          expect(velocityAfter.y).toBe(velocityBefore.y);
          expect(velocityAfter.z).toBe(velocityBefore.z);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve kinetic energy when particle wraps around', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.constantFrom('left', 'right', 'top', 'bottom', 'front', 'back'),
        (mass, velX, velY, velZ, edge) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside the specified edge
          let position: Vector3D;
          switch (edge) {
            case 'left':
              position = new Vector3D(-1, 300, 200);
              break;
            case 'right':
              position = new Vector3D(801, 300, 200);
              break;
            case 'top':
              position = new Vector3D(400, 601, 200);
              break;
            case 'bottom':
              position = new Vector3D(400, -1, 200);
              break;
            case 'front':
              position = new Vector3D(400, 300, -1);
              break;
            case 'back':
              position = new Vector3D(400, 300, 401);
              break;
          }
          
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          const energyBefore = particle.kineticEnergy();
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          const energyAfter = particle.kineticEnergy();
          
          // Kinetic energy should be preserved
          expect(energyAfter).toBeCloseTo(energyBefore, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should wrap particle from left edge to right edge', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 600, noNaN: true }),
        fc.double({ min: 0, max: 400, noNaN: true }),
        (mass, velX, velY, velZ, yPos, zPos) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside left edge
          const position = new Vector3D(-1, yPos, zPos);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at right edge
          expect(particle.position.x).toBeCloseTo(800, 5);
          expect(particle.position.y).toBeCloseTo(yPos, 5);
          expect(particle.position.z).toBeCloseTo(zPos, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should wrap particle from right edge to left edge', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 600, noNaN: true }),
        fc.double({ min: 0, max: 400, noNaN: true }),
        (mass, velX, velY, velZ, yPos, zPos) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside right edge
          const position = new Vector3D(801, yPos, zPos);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at left edge
          expect(particle.position.x).toBeCloseTo(0, 5);
          expect(particle.position.y).toBeCloseTo(yPos, 5);
          expect(particle.position.z).toBeCloseTo(zPos, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should wrap particle from top edge to bottom edge', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 800, noNaN: true }),
        fc.double({ min: 0, max: 400, noNaN: true }),
        (mass, velX, velY, velZ, xPos, zPos) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside top edge
          const position = new Vector3D(xPos, 601, zPos);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at bottom edge
          expect(particle.position.x).toBeCloseTo(xPos, 5);
          expect(particle.position.y).toBeCloseTo(0, 5);
          expect(particle.position.z).toBeCloseTo(zPos, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should wrap particle from bottom edge to top edge', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 800, noNaN: true }),
        fc.double({ min: 0, max: 400, noNaN: true }),
        (mass, velX, velY, velZ, xPos, zPos) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside bottom edge
          const position = new Vector3D(xPos, -1, zPos);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at top edge
          expect(particle.position.x).toBeCloseTo(xPos, 5);
          expect(particle.position.y).toBeCloseTo(600, 5);
          expect(particle.position.z).toBeCloseTo(zPos, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all parameters when conglomerate wraps around', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.constantFrom('left', 'right', 'top', 'bottom', 'front', 'back'),
        (mass1, mass2, velX, velY, velZ, edge) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create two particles to form a conglomerate
          let centerPos: Vector3D;
          switch (edge) {
            case 'left':
              centerPos = new Vector3D(-10, 300, 200);
              break;
            case 'right':
              centerPos = new Vector3D(810, 300, 200);
              break;
            case 'top':
              centerPos = new Vector3D(400, 610, 200);
              break;
            case 'bottom':
              centerPos = new Vector3D(400, -10, 200);
              break;
            case 'front':
              centerPos = new Vector3D(400, 300, -10);
              break;
            case 'back':
              centerPos = new Vector3D(400, 300, 410);
              break;
          }
          
          const velocity = new Vector3D(velX, velY, velZ);
          const p1 = new Particle(centerPos, velocity, mass1);
          const p2 = new Particle(centerPos.add(new Vector3D(1, 1, 1)), velocity, mass2);
          
          const conglomerate = new Conglomerate([p1, p2]);
          
          const massBefore = conglomerate.totalMass;
          const velocityBefore = new Vector3D(conglomerate.velocity.x, conglomerate.velocity.y, conglomerate.velocity.z);
          const energyBefore = conglomerate.kineticEnergy();
          const angularVelocityBefore = conglomerate.angularVelocity;
          
          // Apply wrap-around
          manager.wrapConglomerate(conglomerate);
          
          // All parameters should be preserved
          expect(conglomerate.totalMass).toBe(massBefore);
          expect(conglomerate.velocity.x).toBe(velocityBefore.x);
          expect(conglomerate.velocity.y).toBe(velocityBefore.y);
          expect(conglomerate.velocity.z).toBe(velocityBefore.z);
          expect(conglomerate.kineticEnergy()).toBeCloseTo(energyBefore, 10);
          expect(conglomerate.angularVelocity).toBe(angularVelocityBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not modify particle inside bounds', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 799, noNaN: true }),
        fc.double({ min: 1, max: 599, noNaN: true }),
        fc.double({ min: 1, max: 399, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        (mass, xPos, yPos, zPos, velX, velY, velZ) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle inside bounds
          const position = new Vector3D(xPos, yPos, zPos);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          const positionBefore = new Vector3D(particle.position.x, particle.position.y, particle.position.z);
          
          // Apply wrap-around (should do nothing)
          manager.wrapParticle(particle);
          
          // Position should remain unchanged
          expect(particle.position.x).toBe(positionBefore.x);
          expect(particle.position.y).toBe(positionBefore.y);
          expect(particle.position.z).toBe(positionBefore.z);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle corner wrapping correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        (mass, velX, velY, velZ) => {
          const bounds = new Boundary(
            new Vector3D(0, 0, 0),
            new Vector3D(800, 600, 400)
          );
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000],
            maxParticles: 0
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle outside all three dimensions (corner)
          const position = new Vector3D(-1, -1, -1);
          const velocity = new Vector3D(velX, velY, velZ);
          const particle = new Particle(position, velocity, mass);
          
          const energyBefore = particle.kineticEnergy();
          const velocityBefore = new Vector3D(particle.velocity.x, particle.velocity.y, particle.velocity.z);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should wrap all three dimensions - wrapped position should be inside bounds
          expect(particle.position.x).toBeGreaterThanOrEqual(0);
          expect(particle.position.x).toBeLessThanOrEqual(800);
          expect(particle.position.y).toBeGreaterThanOrEqual(0);
          expect(particle.position.y).toBeLessThanOrEqual(600);
          expect(particle.position.z).toBeGreaterThanOrEqual(0);
          expect(particle.position.z).toBeLessThanOrEqual(400);
          
          // Parameters should be preserved
          expect(particle.velocity.x).toBe(velocityBefore.x);
          expect(particle.velocity.y).toBe(velocityBefore.y);
          expect(particle.velocity.z).toBe(velocityBefore.z);
          expect(particle.kineticEnergy()).toBeCloseTo(energyBefore, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
