import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ParticleManager, ParticleSpawnConfig, Rectangle } from '../../src/core/ParticleManager';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector2D } from '../../src/core/Vector2D';

// Feature: dust-particle-aggregation, Property 2: Wrap-around Konsistenz
// **Validates: Requirement 3.6**

describe('Property 2: Wrap-around Konsistenz', () => {
  it('should preserve mass when particle wraps around', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.constantFrom('left', 'right', 'top', 'bottom'),
        (mass, velX, velY, edge) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside the specified edge
          let position: Vector2D;
          switch (edge) {
            case 'left':
              position = new Vector2D(bounds.x - 1, bounds.y + bounds.height / 2);
              break;
            case 'right':
              position = new Vector2D(bounds.x + bounds.width + 1, bounds.y + bounds.height / 2);
              break;
            case 'top':
              position = new Vector2D(bounds.x + bounds.width / 2, bounds.y - 1);
              break;
            case 'bottom':
              position = new Vector2D(bounds.x + bounds.width / 2, bounds.y + bounds.height + 1);
              break;
          }
          
          const velocity = new Vector2D(velX, velY);
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
        fc.constantFrom('left', 'right', 'top', 'bottom'),
        (mass, velX, velY, edge) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside the specified edge
          let position: Vector2D;
          switch (edge) {
            case 'left':
              position = new Vector2D(bounds.x - 1, bounds.y + bounds.height / 2);
              break;
            case 'right':
              position = new Vector2D(bounds.x + bounds.width + 1, bounds.y + bounds.height / 2);
              break;
            case 'top':
              position = new Vector2D(bounds.x + bounds.width / 2, bounds.y - 1);
              break;
            case 'bottom':
              position = new Vector2D(bounds.x + bounds.width / 2, bounds.y + bounds.height + 1);
              break;
          }
          
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);
          
          const velocityBefore = new Vector2D(particle.velocity.x, particle.velocity.y);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          const velocityAfter = particle.velocity;
          
          // Velocity should be preserved
          expect(velocityAfter.x).toBe(velocityBefore.x);
          expect(velocityAfter.y).toBe(velocityBefore.y);
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
        fc.constantFrom('left', 'right', 'top', 'bottom'),
        (mass, velX, velY, edge) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside the specified edge
          let position: Vector2D;
          switch (edge) {
            case 'left':
              position = new Vector2D(bounds.x - 1, bounds.y + bounds.height / 2);
              break;
            case 'right':
              position = new Vector2D(bounds.x + bounds.width + 1, bounds.y + bounds.height / 2);
              break;
            case 'top':
              position = new Vector2D(bounds.x + bounds.width / 2, bounds.y - 1);
              break;
            case 'bottom':
              position = new Vector2D(bounds.x + bounds.width / 2, bounds.y + bounds.height + 1);
              break;
          }
          
          const velocity = new Vector2D(velX, velY);
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
        fc.double({ min: 0, max: 600, noNaN: true }),
        (mass, velX, velY, yPos) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside left edge
          const position = new Vector2D(bounds.x - 1, yPos);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at right edge
          expect(particle.position.x).toBeCloseTo(bounds.x + bounds.width, 5);
          expect(particle.position.y).toBeCloseTo(yPos, 5);
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
        fc.double({ min: 0, max: 600, noNaN: true }),
        (mass, velX, velY, yPos) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside right edge
          const position = new Vector2D(bounds.x + bounds.width + 1, yPos);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at left edge
          expect(particle.position.x).toBeCloseTo(bounds.x, 5);
          expect(particle.position.y).toBeCloseTo(yPos, 5);
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
        fc.double({ min: 0, max: 800, noNaN: true }),
        (mass, velX, velY, xPos) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside top edge
          const position = new Vector2D(xPos, bounds.y - 1);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at bottom edge
          expect(particle.position.x).toBeCloseTo(xPos, 5);
          expect(particle.position.y).toBeCloseTo(bounds.y + bounds.height, 5);
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
        fc.double({ min: 0, max: 800, noNaN: true }),
        (mass, velX, velY, xPos) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle just outside bottom edge
          const position = new Vector2D(xPos, bounds.y + bounds.height + 1);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should appear at top edge
          expect(particle.position.x).toBeCloseTo(xPos, 5);
          expect(particle.position.y).toBeCloseTo(bounds.y, 5);
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
        fc.constantFrom('left', 'right', 'top', 'bottom'),
        (mass1, mass2, velX, velY, edge) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create two particles to form a conglomerate
          let centerPos: Vector2D;
          switch (edge) {
            case 'left':
              centerPos = new Vector2D(bounds.x - 10, bounds.y + bounds.height / 2);
              break;
            case 'right':
              centerPos = new Vector2D(bounds.x + bounds.width + 10, bounds.y + bounds.height / 2);
              break;
            case 'top':
              centerPos = new Vector2D(bounds.x + bounds.width / 2, bounds.y - 10);
              break;
            case 'bottom':
              centerPos = new Vector2D(bounds.x + bounds.width / 2, bounds.y + bounds.height + 10);
              break;
          }
          
          const velocity = new Vector2D(velX, velY);
          const p1 = new Particle(centerPos, velocity, mass1);
          const p2 = new Particle(centerPos.add(new Vector2D(1, 1)), velocity, mass2);
          
          const conglomerate = new Conglomerate([p1, p2]);
          
          const massBefore = conglomerate.totalMass;
          const velocityBefore = new Vector2D(conglomerate.velocity.x, conglomerate.velocity.y);
          const energyBefore = conglomerate.kineticEnergy();
          const angularVelocityBefore = conglomerate.angularVelocity;
          
          // Apply wrap-around
          manager.wrapConglomerate(conglomerate);
          
          // All parameters should be preserved
          expect(conglomerate.totalMass).toBe(massBefore);
          expect(conglomerate.velocity.x).toBe(velocityBefore.x);
          expect(conglomerate.velocity.y).toBe(velocityBefore.y);
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
        fc.double({ min: -50, max: 50, noNaN: true }),
        fc.double({ min: -50, max: 50, noNaN: true }),
        (mass, xPos, yPos, velX, velY) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle inside bounds
          const position = new Vector2D(xPos, yPos);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);
          
          const positionBefore = new Vector2D(particle.position.x, particle.position.y);
          
          // Apply wrap-around (should do nothing)
          manager.wrapParticle(particle);
          
          // Position should remain unchanged
          expect(particle.position.x).toBe(positionBefore.x);
          expect(particle.position.y).toBe(positionBefore.y);
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
        (mass, velX, velY) => {
          const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
          const config: ParticleSpawnConfig = {
            spawnRate: 1,
            massRange: [0.1, 100],
            energyRange: [1, 10000]
          };
          
          const manager = new ParticleManager(bounds, config);
          
          // Create particle outside both left and top edges (corner)
          const position = new Vector2D(bounds.x - 1, bounds.y - 1);
          const velocity = new Vector2D(velX, velY);
          const particle = new Particle(position, velocity, mass);
          
          const energyBefore = particle.kineticEnergy();
          const velocityBefore = new Vector2D(particle.velocity.x, particle.velocity.y);
          
          // Apply wrap-around
          manager.wrapParticle(particle);
          
          // Should wrap both dimensions
          expect(particle.position.x).toBeCloseTo(bounds.x + bounds.width, 5);
          expect(particle.position.y).toBeCloseTo(bounds.y + bounds.height, 5);
          
          // Parameters should be preserved
          expect(particle.velocity.x).toBe(velocityBefore.x);
          expect(particle.velocity.y).toBe(velocityBefore.y);
          expect(particle.kineticEnergy()).toBeCloseTo(energyBefore, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
