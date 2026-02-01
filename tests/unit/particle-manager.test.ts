import { describe, it, expect, beforeEach } from 'vitest';
import { ParticleManager, ParticleSpawnConfig, Rectangle } from '../../src/core/ParticleManager';
import { Particle } from '../../src/core/Particle';
import { Conglomerate } from '../../src/core/Conglomerate';
import { Vector2D } from '../../src/core/Vector2D';

describe('ParticleManager', () => {
  let bounds: Rectangle;
  let config: ParticleSpawnConfig;
  let manager: ParticleManager;

  beforeEach(() => {
    bounds = { x: 0, y: 0, width: 800, height: 600 };
    config = {
      spawnRate: 10, // 10 particles per second
      massRange: [1, 10],
      energyRange: [100, 1000]
    };
    manager = new ParticleManager(bounds, config);
  });

  describe('spawnParticle', () => {
    it('should spawn a particle at the edge of bounds', () => {
      const particle = manager.spawnParticle();
      
      expect(particle).toBeDefined();
      expect(manager.particles).toContain(particle);
      
      // Check if particle is at one of the edges
      const atTopEdge = particle.position.y === bounds.y;
      const atBottomEdge = particle.position.y === bounds.y + bounds.height;
      const atLeftEdge = particle.position.x === bounds.x;
      const atRightEdge = particle.position.x === bounds.x + bounds.width;
      
      expect(atTopEdge || atBottomEdge || atLeftEdge || atRightEdge).toBe(true);
    });

    it('should spawn particle with mass in configured range', () => {
      const particle = manager.spawnParticle();
      
      expect(particle.mass).toBeGreaterThanOrEqual(config.massRange[0]);
      expect(particle.mass).toBeLessThanOrEqual(config.massRange[1]);
    });

    it('should spawn particle with kinetic energy in configured range', () => {
      const particle = manager.spawnParticle();
      const kineticEnergy = particle.kineticEnergy();
      
      // Allow small tolerance for floating point calculations
      expect(kineticEnergy).toBeGreaterThanOrEqual(config.energyRange[0] - 0.01);
      expect(kineticEnergy).toBeLessThanOrEqual(config.energyRange[1] + 0.01);
    });

    it('should spawn multiple particles with different parameters', () => {
      const particles = [];
      for (let i = 0; i < 10; i++) {
        particles.push(manager.spawnParticle());
      }
      
      // Check that not all particles have the same mass (randomness)
      const masses = particles.map(p => p.mass);
      const uniqueMasses = new Set(masses);
      expect(uniqueMasses.size).toBeGreaterThan(1);
    });
  });

  describe('removeParticle', () => {
    it('should remove a particle from the manager', () => {
      const particle = manager.spawnParticle();
      expect(manager.particles).toContain(particle);
      
      manager.removeParticle(particle);
      expect(manager.particles).not.toContain(particle);
    });

    it('should handle removing non-existent particle gracefully', () => {
      const particle = new Particle(Vector2D.zero(), Vector2D.zero(), 1);
      expect(() => manager.removeParticle(particle)).not.toThrow();
    });
  });

  describe('wrapParticle', () => {
    it('should wrap particle from left to right edge', () => {
      const particle = new Particle(
        new Vector2D(-10, 300),
        new Vector2D(1, 0),
        5
      );
      manager.particles.push(particle);
      
      manager.wrapParticle(particle);
      
      expect(particle.position.x).toBe(bounds.x + bounds.width);
      expect(particle.position.y).toBe(300);
    });

    it('should wrap particle from right to left edge', () => {
      const particle = new Particle(
        new Vector2D(810, 300),
        new Vector2D(1, 0),
        5
      );
      manager.particles.push(particle);
      
      manager.wrapParticle(particle);
      
      expect(particle.position.x).toBe(bounds.x);
      expect(particle.position.y).toBe(300);
    });

    it('should wrap particle from top to bottom edge', () => {
      const particle = new Particle(
        new Vector2D(400, -10),
        new Vector2D(0, 1),
        5
      );
      manager.particles.push(particle);
      
      manager.wrapParticle(particle);
      
      expect(particle.position.x).toBe(400);
      expect(particle.position.y).toBe(bounds.y + bounds.height);
    });

    it('should wrap particle from bottom to top edge', () => {
      const particle = new Particle(
        new Vector2D(400, 610),
        new Vector2D(0, 1),
        5
      );
      manager.particles.push(particle);
      
      manager.wrapParticle(particle);
      
      expect(particle.position.x).toBe(400);
      expect(particle.position.y).toBe(bounds.y);
    });

    it('should preserve velocity after wrapping', () => {
      const velocity = new Vector2D(10, 5);
      const particle = new Particle(
        new Vector2D(-10, 300),
        velocity,
        5
      );
      manager.particles.push(particle);
      
      manager.wrapParticle(particle);
      
      expect(particle.velocity.x).toBe(velocity.x);
      expect(particle.velocity.y).toBe(velocity.y);
    });
  });

  describe('createConglomerate', () => {
    it('should create conglomerate from two particles', () => {
      const p1 = manager.spawnParticle();
      const p2 = manager.spawnParticle();
      
      const initialParticleCount = manager.particles.length;
      const conglomerate = manager.createConglomerate(p1, p2);
      
      expect(conglomerate).toBeDefined();
      expect(conglomerate.particles).toContain(p1);
      expect(conglomerate.particles).toContain(p2);
      expect(manager.conglomerates).toContain(conglomerate);
      expect(manager.particles.length).toBe(initialParticleCount - 2);
    });

    it('should preserve total mass when creating conglomerate', () => {
      const p1 = manager.spawnParticle();
      const p2 = manager.spawnParticle();
      const totalMass = p1.mass + p2.mass;
      
      const conglomerate = manager.createConglomerate(p1, p2);
      
      expect(conglomerate.totalMass).toBeCloseTo(totalMass, 10);
    });
  });

  describe('mergeConglomerates', () => {
    it('should merge two conglomerates', () => {
      const p1 = manager.spawnParticle();
      const p2 = manager.spawnParticle();
      const p3 = manager.spawnParticle();
      const p4 = manager.spawnParticle();
      
      const c1 = manager.createConglomerate(p1, p2);
      const c2 = manager.createConglomerate(p3, p4);
      
      const merged = manager.mergeConglomerates(c1, c2);
      
      expect(merged.particles.length).toBe(4);
      expect(manager.conglomerates).toContain(merged);
      expect(manager.conglomerates).not.toContain(c1);
      expect(manager.conglomerates).not.toContain(c2);
    });

    it('should preserve total mass when merging conglomerates', () => {
      const p1 = manager.spawnParticle();
      const p2 = manager.spawnParticle();
      const p3 = manager.spawnParticle();
      const p4 = manager.spawnParticle();
      
      const c1 = manager.createConglomerate(p1, p2);
      const c2 = manager.createConglomerate(p3, p4);
      const totalMass = c1.totalMass + c2.totalMass;
      
      const merged = manager.mergeConglomerates(c1, c2);
      
      expect(merged.totalMass).toBeCloseTo(totalMass, 10);
    });
  });

  describe('mergeParticleWithConglomerate', () => {
    it('should merge particle with conglomerate', () => {
      const p1 = manager.spawnParticle();
      const p2 = manager.spawnParticle();
      const p3 = manager.spawnParticle();
      
      const conglomerate = manager.createConglomerate(p1, p2);
      const merged = manager.mergeParticleWithConglomerate(p3, conglomerate);
      
      expect(merged.particles.length).toBe(3);
      expect(manager.conglomerates).toContain(merged);
      expect(manager.conglomerates).not.toContain(conglomerate);
      expect(manager.particles).not.toContain(p3);
    });
  });

  describe('update', () => {
    it('should spawn particles based on spawn rate', () => {
      const deltaTime = 0.1; // 0.1 seconds
      const expectedSpawns = Math.floor(config.spawnRate * deltaTime);
      
      manager.update(deltaTime);
      
      expect(manager.particles.length).toBeGreaterThanOrEqual(expectedSpawns);
    });

    it('should update particle positions', () => {
      const particle = new Particle(
        new Vector2D(100, 100),
        new Vector2D(10, 5),
        5
      );
      manager.particles.push(particle);
      
      const initialPos = new Vector2D(particle.position.x, particle.position.y);
      manager.update(0.1);
      
      expect(particle.position.x).not.toBe(initialPos.x);
      expect(particle.position.y).not.toBe(initialPos.y);
    });
  });

  describe('getAllEntities', () => {
    it('should return all particles and conglomerates', () => {
      const p1 = manager.spawnParticle();
      const p2 = manager.spawnParticle();
      const p3 = manager.spawnParticle();
      const p4 = manager.spawnParticle();
      
      const c1 = manager.createConglomerate(p1, p2);
      
      const entities = manager.getAllEntities();
      
      expect(entities.length).toBe(3); // 2 particles + 1 conglomerate
      expect(entities).toContain(p3);
      expect(entities).toContain(p4);
      expect(entities).toContain(c1);
    });
  });

  describe('getEntityCount', () => {
    it('should return correct count of entities', () => {
      expect(manager.getEntityCount()).toBe(0);
      
      manager.spawnParticle();
      expect(manager.getEntityCount()).toBe(1);
      
      manager.spawnParticle();
      expect(manager.getEntityCount()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all particles and conglomerates', () => {
      manager.spawnParticle();
      manager.spawnParticle();
      
      manager.clear();
      
      expect(manager.particles.length).toBe(0);
      expect(manager.conglomerates.length).toBe(0);
      expect(manager.getEntityCount()).toBe(0);
    });
  });
});
