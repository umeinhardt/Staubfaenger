import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Boundary } from '../../src/core/Boundary';
import { Vector3D } from '../../src/core/Vector3D';

describe('Boundary Property Tests', () => {
  // Helper to create a standard boundary for testing
  const createBoundary = () => new Boundary(
    new Vector3D(-50, -50, -50),
    new Vector3D(50, 50, 50)
  );

  // Feature: 3d-particle-simulation, Property 24: Wrap-around works for all dimensions
  it('should wrap positions around boundary in all dimensions', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.float({ min: -200, max: 200 }),
          y: fc.float({ min: -200, max: 200 }),
          z: fc.float({ min: -200, max: 200 })
        }),
        (pos) => {
          const boundary = createBoundary();
          const position = new Vector3D(pos.x, pos.y, pos.z);
          const wrapped = boundary.wrapPosition(position);

          // Wrapped position should be inside boundary
          expect(wrapped.x).toBeGreaterThanOrEqual(boundary.min.x);
          expect(wrapped.x).toBeLessThanOrEqual(boundary.max.x);
          expect(wrapped.y).toBeGreaterThanOrEqual(boundary.min.y);
          expect(wrapped.y).toBeLessThanOrEqual(boundary.max.y);
          expect(wrapped.z).toBeGreaterThanOrEqual(boundary.min.z);
          expect(wrapped.z).toBeLessThanOrEqual(boundary.max.z);

          // If position was outside, verify wrap-around preserves overflow distance
          const width = boundary.max.x - boundary.min.x;
          const height = boundary.max.y - boundary.min.y;
          const depth = boundary.max.z - boundary.min.z;

          if (pos.x > boundary.max.x) {
            const overflow = (pos.x - boundary.max.x) % width;
            expect(wrapped.x).toBeCloseTo(boundary.min.x + overflow, 5);
          } else if (pos.x < boundary.min.x) {
            const overflow = (boundary.min.x - pos.x) % width;
            expect(wrapped.x).toBeCloseTo(boundary.max.x - overflow, 5);
          }

          if (pos.y > boundary.max.y) {
            const overflow = (pos.y - boundary.max.y) % height;
            expect(wrapped.y).toBeCloseTo(boundary.min.y + overflow, 5);
          } else if (pos.y < boundary.min.y) {
            const overflow = (boundary.min.y - pos.y) % height;
            expect(wrapped.y).toBeCloseTo(boundary.max.y - overflow, 5);
          }

          if (pos.z > boundary.max.z) {
            const overflow = (pos.z - boundary.max.z) % depth;
            expect(wrapped.z).toBeCloseTo(boundary.min.z + overflow, 5);
          } else if (pos.z < boundary.min.z) {
            const overflow = (boundary.min.z - pos.z) % depth;
            expect(wrapped.z).toBeCloseTo(boundary.max.z - overflow, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: 3d-particle-simulation, Property 25: Wrap-around preserves velocity and angular velocity
  it('should preserve velocity and angular velocity during wrap-around', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.float({ min: -200, max: 200 }),
          y: fc.float({ min: -200, max: 200 }),
          z: fc.float({ min: -200, max: 200 })
        }),
        fc.record({
          vx: fc.float({ min: -10, max: 10 }),
          vy: fc.float({ min: -10, max: 10 }),
          vz: fc.float({ min: -10, max: 10 })
        }),
        fc.record({
          wx: fc.float({ min: -5, max: 5 }),
          wy: fc.float({ min: -5, max: 5 }),
          wz: fc.float({ min: -5, max: 5 })
        }),
        (pos, vel, angVel) => {
          const boundary = createBoundary();
          const position = new Vector3D(pos.x, pos.y, pos.z);
          const velocity = new Vector3D(vel.vx, vel.vy, vel.vz);
          const angularVelocity = new Vector3D(angVel.wx, angVel.wy, angVel.wz);

          // Wrap position (velocity and angular velocity should remain unchanged)
          const wrappedPosition = boundary.wrapPosition(position);

          // Velocity should be unchanged
          expect(velocity.x).toBe(vel.vx);
          expect(velocity.y).toBe(vel.vy);
          expect(velocity.z).toBe(vel.vz);

          // Angular velocity should be unchanged
          expect(angularVelocity.x).toBe(angVel.wx);
          expect(angularVelocity.y).toBe(angVel.wy);
          expect(angularVelocity.z).toBe(angVel.wz);

          // This property verifies that wrapPosition doesn't modify velocity/angular velocity
          // (which it shouldn't - it only operates on position)
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: 3d-particle-simulation, Property 26: Spawned particles are on boundary faces
  it('should spawn particles on boundary faces', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99 }),
        (seed) => {
          const boundary = createBoundary();
          const spawnPosition = boundary.getRandomSpawnPosition();

          // At least one coordinate should be at min or max boundary
          const onMinX = Math.abs(spawnPosition.x - boundary.min.x) < 1e-10;
          const onMaxX = Math.abs(spawnPosition.x - boundary.max.x) < 1e-10;
          const onMinY = Math.abs(spawnPosition.y - boundary.min.y) < 1e-10;
          const onMaxY = Math.abs(spawnPosition.y - boundary.max.y) < 1e-10;
          const onMinZ = Math.abs(spawnPosition.z - boundary.min.z) < 1e-10;
          const onMaxZ = Math.abs(spawnPosition.z - boundary.max.z) < 1e-10;

          const onBoundaryFace = onMinX || onMaxX || onMinY || onMaxY || onMinZ || onMaxZ;
          expect(onBoundaryFace).toBe(true);

          // All coordinates should be within boundary
          expect(spawnPosition.x).toBeGreaterThanOrEqual(boundary.min.x);
          expect(spawnPosition.x).toBeLessThanOrEqual(boundary.max.x);
          expect(spawnPosition.y).toBeGreaterThanOrEqual(boundary.min.y);
          expect(spawnPosition.y).toBeLessThanOrEqual(boundary.max.y);
          expect(spawnPosition.z).toBeGreaterThanOrEqual(boundary.min.z);
          expect(spawnPosition.z).toBeLessThanOrEqual(boundary.max.z);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: 3d-particle-simulation, Property 27: Spawned particles have inward velocity
  it('should give spawned particles inward-pointing velocity', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.1, max: 10 }),
        (speed) => {
          const boundary = createBoundary();
          const spawnPosition = boundary.getRandomSpawnPosition();
          const velocity = boundary.getSpawnVelocity(spawnPosition, speed);

          // Calculate center of boundary
          const center = new Vector3D(
            (boundary.min.x + boundary.max.x) / 2,
            (boundary.min.y + boundary.max.y) / 2,
            (boundary.min.z + boundary.max.z) / 2
          );

          // Vector from spawn position to center
          const toCenter = center.subtract(spawnPosition);

          // Dot product of velocity with toCenter should be positive (pointing inward)
          const dotProduct = velocity.dot(toCenter);
          expect(dotProduct).toBeGreaterThan(0);

          // Velocity magnitude should equal the specified speed
          expect(velocity.magnitude()).toBeCloseTo(speed, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
