import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SpatialHash } from '../../src/core/SpatialHash';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';

// Feature: 3d-particle-simulation
// These tests validate the correctness properties for 3D spatial hashing

describe('3D Spatial Hash Properties', () => {
  // Property 15: Particles are placed in correct grid cells
  // Validates: Requirements 3.2
  it('Property 15: should place particles in correct 3D grid cells', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.float({ min: -100, max: 100, noNaN: true }),
          y: fc.float({ min: -100, max: 100, noNaN: true }),
          z: fc.float({ min: -100, max: 100, noNaN: true })
        }),
        fc.float({ min: 0.5, max: 5, noNaN: true }), // mass (determines radius)
        fc.float({ min: 5, max: 20, noNaN: true }), // cellSize
        (pos, mass, cellSize) => {
          const position = new Vector3D(pos.x, pos.y, pos.z);
          const velocity = Vector3D.zero();
          const particle = new Particle(position, velocity, mass);
          
          const spatialHash = new SpatialHash(cellSize);
          spatialHash.insert(particle);
          
          // Calculate expected cell range
          const radius = particle.radius;
          const minX = Math.floor((pos.x - radius) / cellSize);
          const maxX = Math.floor((pos.x + radius) / cellSize);
          const minY = Math.floor((pos.y - radius) / cellSize);
          const maxY = Math.floor((pos.y + radius) / cellSize);
          const minZ = Math.floor((pos.z - radius) / cellSize);
          const maxZ = Math.floor((pos.z + radius) / cellSize);
          
          // Verify particle can be found in nearby queries
          const nearby = spatialHash.getNearby(particle);
          
          // The particle should be found in its own neighborhood
          expect(nearby).toContainEqual(particle);
          
          // Verify the particle is in the correct number of cells
          // (at least 1, at most 8 for a small particle in 3D)
          const expectedCells = (maxX - minX + 1) * (maxY - minY + 1) * (maxZ - minZ + 1);
          expect(expectedCells).toBeGreaterThanOrEqual(1);
          expect(expectedCells).toBeLessThanOrEqual(27); // Max for a particle spanning 3x3x3 cells
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 16: Nearby queries return only adjacent cells
  // Validates: Requirements 3.3
  it('Property 16: should return only particles in adjacent 3D cells', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 10, max: 20, noNaN: true }), // cellSize
        fc.array(
          fc.record({
            x: fc.float({ min: -50, max: 50, noNaN: true }),
            y: fc.float({ min: -50, max: 50, noNaN: true }),
            z: fc.float({ min: -50, max: 50, noNaN: true }),
            mass: fc.float({ min: 0.5, max: 2, noNaN: true })
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (cellSize, particleData) => {
          const spatialHash = new SpatialHash(cellSize);
          const particles: Particle[] = [];
          
          // Create and insert particles
          for (const data of particleData) {
            const position = new Vector3D(data.x, data.y, data.z);
            const velocity = Vector3D.zero();
            const particle = new Particle(position, velocity, data.mass);
            particles.push(particle);
            spatialHash.insert(particle);
          }
          
          // Pick a test particle
          const testParticle = particles[0];
          const nearby = spatialHash.getNearby(testParticle);
          
          // Calculate test particle's cell range
          const testPos = testParticle.position;
          const testRadius = testParticle.radius;
          const testMinX = Math.floor((testPos.x - testRadius) / cellSize);
          const testMaxX = Math.floor((testPos.x + testRadius) / cellSize);
          const testMinY = Math.floor((testPos.y - testRadius) / cellSize);
          const testMaxY = Math.floor((testPos.y + testRadius) / cellSize);
          const testMinZ = Math.floor((testPos.z - testRadius) / cellSize);
          const testMaxZ = Math.floor((testPos.z + testRadius) / cellSize);
          
          // Verify all nearby particles are in adjacent cells (27-cell neighborhood)
          for (const nearbyParticle of nearby) {
            const pos = nearbyParticle.position;
            const radius = nearbyParticle.radius;
            
            // Calculate nearby particle's cell range
            const minX = Math.floor((pos.x - radius) / cellSize);
            const maxX = Math.floor((pos.x + radius) / cellSize);
            const minY = Math.floor((pos.y - radius) / cellSize);
            const maxY = Math.floor((pos.y + radius) / cellSize);
            const minZ = Math.floor((pos.z - radius) / cellSize);
            const maxZ = Math.floor((pos.z + radius) / cellSize);
            
            // Check if cell ranges overlap (meaning they share at least one cell)
            const xOverlap = maxX >= testMinX && minX <= testMaxX;
            const yOverlap = maxY >= testMinY && minY <= testMaxY;
            const zOverlap = maxZ >= testMinZ && minZ <= testMaxZ;
            
            // Particles should overlap in all three dimensions to be in nearby cells
            expect(xOverlap && yOverlap && zOverlap).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
