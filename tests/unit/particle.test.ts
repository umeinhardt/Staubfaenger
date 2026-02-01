import { describe, it, expect } from 'vitest';
import { Particle } from '../../src/core/Particle';
import { Vector3D } from '../../src/core/Vector3D';

describe('Particle', () => {
  describe('Constructor', () => {
    it('should create a particle with 3D position and velocity', () => {
      const position = new Vector3D(1, 2, 3);
      const velocity = new Vector3D(4, 5, 6);
      const mass = 10;
      
      const particle = new Particle(position, velocity, mass);
      
      expect(particle.position.x).toBe(1);
      expect(particle.position.y).toBe(2);
      expect(particle.position.z).toBe(3);
      expect(particle.velocity.x).toBe(4);
      expect(particle.velocity.y).toBe(5);
      expect(particle.velocity.z).toBe(6);
      expect(particle.mass).toBe(10);
    });

    it('should initialize angular velocity to zero by default', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(1, 1, 1);
      const mass = 5;
      
      const particle = new Particle(position, velocity, mass);
      
      expect(particle.angularVelocity.x).toBe(0);
      expect(particle.angularVelocity.y).toBe(0);
      expect(particle.angularVelocity.z).toBe(0);
    });

    it('should accept custom angular velocity', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(1, 1, 1);
      const mass = 5;
      const angularVelocity = new Vector3D(0.1, 0.2, 0.3);
      
      const particle = new Particle(position, velocity, mass, angularVelocity);
      
      expect(particle.angularVelocity.x).toBe(0.1);
      expect(particle.angularVelocity.y).toBe(0.2);
      expect(particle.angularVelocity.z).toBe(0.3);
    });

    it('should calculate radius proportional to mass', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 16;
      
      const particle = new Particle(position, velocity, mass);
      
      expect(particle.radius).toBe(4); // sqrt(16) = 4
    });

    it('should generate unique IDs for different particles', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 1;
      
      const particle1 = new Particle(position, velocity, mass);
      const particle2 = new Particle(position, velocity, mass);
      
      expect(particle1.id).not.toBe(particle2.id);
    });
  });

  describe('applyForce', () => {
    it('should update velocity correctly in 3D when force is applied', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(1, 2, 3);
      const mass = 2;
      const particle = new Particle(position, velocity, mass);
      
      const force = new Vector3D(4, 6, 8);
      const deltaTime = 0.1;
      
      particle.applyForce(force, deltaTime);
      
      // Expected: v_new = v_old + (F/m) * dt
      // v_new = (1, 2, 3) + (4/2, 6/2, 8/2) * 0.1
      // v_new = (1, 2, 3) + (2, 3, 4) * 0.1
      // v_new = (1, 2, 3) + (0.2, 0.3, 0.4)
      // v_new = (1.2, 2.3, 3.4)
      expect(particle.velocity.x).toBeCloseTo(1.2, 10);
      expect(particle.velocity.y).toBeCloseTo(2.3, 10);
      expect(particle.velocity.z).toBeCloseTo(3.4, 10);
    });

    it('should handle zero force', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(5, 6, 7);
      const mass = 3;
      const particle = new Particle(position, velocity, mass);
      
      const force = new Vector3D(0, 0, 0);
      const deltaTime = 0.1;
      
      particle.applyForce(force, deltaTime);
      
      expect(particle.velocity.x).toBe(5);
      expect(particle.velocity.y).toBe(6);
      expect(particle.velocity.z).toBe(7);
    });

    it('should handle negative forces', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(10, 10, 10);
      const mass = 5;
      const particle = new Particle(position, velocity, mass);
      
      const force = new Vector3D(-10, -20, -30);
      const deltaTime = 1;
      
      particle.applyForce(force, deltaTime);
      
      // v_new = (10, 10, 10) + (-10/5, -20/5, -30/5) * 1
      // v_new = (10, 10, 10) + (-2, -4, -6)
      // v_new = (8, 6, 4)
      expect(particle.velocity.x).toBeCloseTo(8, 10);
      expect(particle.velocity.y).toBeCloseTo(6, 10);
      expect(particle.velocity.z).toBeCloseTo(4, 10);
    });
  });

  describe('applyTorque', () => {
    it('should update angular velocity when torque is applied', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 10;
      const particle = new Particle(position, velocity, mass);
      
      // For mass=10, radius=sqrt(10)≈3.162
      // I = (2/5) * m * r² = (2/5) * 10 * 10 = 40
      const torque = new Vector3D(40, 80, 120);
      const deltaTime = 0.1;
      
      particle.applyTorque(torque, deltaTime);
      
      // ω_new = ω_old + (τ/I) * dt
      // ω_new = (0, 0, 0) + (40/40, 80/40, 120/40) * 0.1
      // ω_new = (0, 0, 0) + (1, 2, 3) * 0.1
      // ω_new = (0.1, 0.2, 0.3)
      expect(particle.angularVelocity.x).toBeCloseTo(0.1, 10);
      expect(particle.angularVelocity.y).toBeCloseTo(0.2, 10);
      expect(particle.angularVelocity.z).toBeCloseTo(0.3, 10);
    });

    it('should accumulate angular velocity over multiple torque applications', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 10;
      const particle = new Particle(position, velocity, mass);
      
      const torque = new Vector3D(40, 0, 0);
      const deltaTime = 0.1;
      
      particle.applyTorque(torque, deltaTime);
      particle.applyTorque(torque, deltaTime);
      
      // After first: ω = (0.1, 0, 0)
      // After second: ω = (0.2, 0, 0)
      expect(particle.angularVelocity.x).toBeCloseTo(0.2, 10);
      expect(particle.angularVelocity.y).toBeCloseTo(0, 10);
      expect(particle.angularVelocity.z).toBeCloseTo(0, 10);
    });

    it('should handle zero torque', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 5;
      const angularVelocity = new Vector3D(1, 2, 3);
      const particle = new Particle(position, velocity, mass, angularVelocity);
      
      const torque = new Vector3D(0, 0, 0);
      const deltaTime = 0.1;
      
      particle.applyTorque(torque, deltaTime);
      
      expect(particle.angularVelocity.x).toBe(1);
      expect(particle.angularVelocity.y).toBe(2);
      expect(particle.angularVelocity.z).toBe(3);
    });
  });

  describe('update', () => {
    it('should update position with 3D velocity', () => {
      const position = new Vector3D(10, 20, 30);
      const velocity = new Vector3D(1, 2, 3);
      const mass = 5;
      const particle = new Particle(position, velocity, mass);
      
      const deltaTime = 2;
      particle.update(deltaTime);
      
      // p_new = p_old + v * dt
      // p_new = (10, 20, 30) + (1, 2, 3) * 2
      // p_new = (10, 20, 30) + (2, 4, 6)
      // p_new = (12, 24, 36)
      expect(particle.position.x).toBe(12);
      expect(particle.position.y).toBe(24);
      expect(particle.position.z).toBe(36);
    });

    it('should handle zero velocity', () => {
      const position = new Vector3D(5, 10, 15);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 3;
      const particle = new Particle(position, velocity, mass);
      
      const deltaTime = 1;
      particle.update(deltaTime);
      
      expect(particle.position.x).toBe(5);
      expect(particle.position.y).toBe(10);
      expect(particle.position.z).toBe(15);
    });

    it('should handle negative velocity', () => {
      const position = new Vector3D(10, 10, 10);
      const velocity = new Vector3D(-2, -3, -4);
      const mass = 2;
      const particle = new Particle(position, velocity, mass);
      
      const deltaTime = 1;
      particle.update(deltaTime);
      
      expect(particle.position.x).toBe(8);
      expect(particle.position.y).toBe(7);
      expect(particle.position.z).toBe(6);
    });
  });

  describe('momentum', () => {
    it('should calculate momentum in 3D', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(2, 3, 4);
      const mass = 5;
      const particle = new Particle(position, velocity, mass);
      
      const momentum = particle.momentum();
      
      // p = m * v = 5 * (2, 3, 4) = (10, 15, 20)
      expect(momentum.x).toBe(10);
      expect(momentum.y).toBe(15);
      expect(momentum.z).toBe(20);
    });

    it('should return zero momentum for stationary particle', () => {
      const position = new Vector3D(5, 5, 5);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 10;
      const particle = new Particle(position, velocity, mass);
      
      const momentum = particle.momentum();
      
      expect(momentum.x).toBe(0);
      expect(momentum.y).toBe(0);
      expect(momentum.z).toBe(0);
    });

    it('should handle negative velocity components', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(-1, 2, -3);
      const mass = 4;
      const particle = new Particle(position, velocity, mass);
      
      const momentum = particle.momentum();
      
      expect(momentum.x).toBe(-4);
      expect(momentum.y).toBe(8);
      expect(momentum.z).toBe(-12);
    });
  });

  describe('angularMomentum', () => {
    it('should calculate angular momentum in 3D', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 10; // radius = sqrt(10)
      const angularVelocity = new Vector3D(1, 2, 3);
      const particle = new Particle(position, velocity, mass, angularVelocity);
      
      const angularMomentum = particle.angularMomentum();
      
      // I = (2/5) * m * r² = (2/5) * 10 * 10 = 40
      // L = I * ω = 40 * (1, 2, 3) = (40, 80, 120)
      expect(angularMomentum.x).toBeCloseTo(40, 10);
      expect(angularMomentum.y).toBeCloseTo(80, 10);
      expect(angularMomentum.z).toBeCloseTo(120, 10);
    });

    it('should return zero angular momentum for non-rotating particle', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(5, 5, 5);
      const mass = 8;
      const particle = new Particle(position, velocity, mass);
      
      const angularMomentum = particle.angularMomentum();
      
      expect(angularMomentum.x).toBe(0);
      expect(angularMomentum.y).toBe(0);
      expect(angularMomentum.z).toBe(0);
    });

    it('should scale with particle mass and radius', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(0, 0, 0);
      const mass1 = 4; // radius = 2, I = (2/5) * 4 * 4 = 6.4
      const mass2 = 16; // radius = 4, I = (2/5) * 16 * 16 = 102.4
      const angularVelocity = new Vector3D(1, 0, 0);
      
      const particle1 = new Particle(position, velocity, mass1, angularVelocity);
      const particle2 = new Particle(position, velocity, mass2, angularVelocity);
      
      const L1 = particle1.angularMomentum();
      const L2 = particle2.angularMomentum();
      
      // L2 should be larger than L1
      expect(L2.x).toBeGreaterThan(L1.x);
    });
  });

  describe('kineticEnergy', () => {
    it('should calculate kinetic energy in 3D', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(3, 4, 0);
      const mass = 2;
      const particle = new Particle(position, velocity, mass);
      
      const ke = particle.kineticEnergy();
      
      // KE = 0.5 * m * v²
      // v² = 3² + 4² + 0² = 9 + 16 = 25
      // KE = 0.5 * 2 * 25 = 25
      expect(ke).toBe(25);
    });

    it('should return zero for stationary particle', () => {
      const position = new Vector3D(10, 10, 10);
      const velocity = new Vector3D(0, 0, 0);
      const mass = 5;
      const particle = new Particle(position, velocity, mass);
      
      const ke = particle.kineticEnergy();
      
      expect(ke).toBe(0);
    });

    it('should handle all three velocity components', () => {
      const position = new Vector3D(0, 0, 0);
      const velocity = new Vector3D(1, 1, 1);
      const mass = 6;
      const particle = new Particle(position, velocity, mass);
      
      const ke = particle.kineticEnergy();
      
      // v² = 1² + 1² + 1² = 3
      // KE = 0.5 * 6 * 3 = 9
      expect(ke).toBe(9);
    });
  });
});
