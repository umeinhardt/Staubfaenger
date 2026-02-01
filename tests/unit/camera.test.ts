import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Camera } from '../../src/core/Camera';
import { Vector3D } from '../../src/core/Vector3D';
import { Boundary } from '../../src/core/Boundary';

describe('Camera (3D)', () => {
  let camera: Camera;
  let canvas: HTMLCanvasElement;
  let boundary: Boundary;

  beforeEach(() => {
    // Create a mock canvas element
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Create a boundary for the simulation
    boundary = new Boundary(
      new Vector3D(-50, -50, -50),
      new Vector3D(50, 50, 50)
    );

    // Create camera with boundary
    camera = new Camera(canvas, boundary);
  });

  describe('initialization', () => {
    it('should initialize with a Three.js PerspectiveCamera', () => {
      const threeCamera = camera.getCamera();
      
      expect(threeCamera).toBeDefined();
      expect(threeCamera.type).toBe('PerspectiveCamera');
      expect(threeCamera.fov).toBe(75);
    });

    it('should initialize with correct aspect ratio', () => {
      const threeCamera = camera.getCamera();
      
      expect(threeCamera.aspect).toBeCloseTo(800 / 600, 5);
    });

    it('should initialize orbit controls', () => {
      const controls = camera.getControls();
      
      expect(controls).toBeDefined();
      expect(controls.enableDamping).toBe(true);
      expect(controls.dampingFactor).toBe(0.05);
    });

    it('should configure distance limits', () => {
      const controls = camera.getControls();
      
      expect(controls.minDistance).toBe(10);
      expect(controls.maxDistance).toBe(200);
    });

    it('should allow full rotation', () => {
      const controls = camera.getControls();
      
      expect(controls.maxPolarAngle).toBe(Math.PI);
      expect(controls.minPolarAngle).toBe(0);
    });

    it('should enable all control types', () => {
      const controls = camera.getControls();
      
      expect(controls.enableRotate).toBe(true);
      expect(controls.enableZoom).toBe(true);
      expect(controls.enablePan).toBe(true);
    });
  });

  describe('initial camera position', () => {
    it('should position camera to view entire boundary', () => {
      const threeCamera = camera.getCamera();
      const controls = camera.getControls();
      
      // Camera should be positioned away from the center
      const center = new Vector3D(0, 0, 0);
      const cameraPos = new Vector3D(
        threeCamera.position.x,
        threeCamera.position.y,
        threeCamera.position.z
      );
      
      const distance = cameraPos.distanceTo(center);
      
      // Distance should be sufficient to view the entire boundary
      // Boundary has dimensions 100x100x100, so max dimension is 100
      // Camera should be at least 100 * 1.5 = 150 units away
      expect(distance).toBeGreaterThan(100);
    });

    it('should look at the center of the boundary', () => {
      const controls = camera.getControls();
      
      // Controls target should be at the center of the boundary
      expect(controls.target.x).toBeCloseTo(0, 5);
      expect(controls.target.y).toBeCloseTo(0, 5);
      expect(controls.target.z).toBeCloseTo(0, 5);
    });

    it('should position camera at an angle to see all dimensions', () => {
      const threeCamera = camera.getCamera();
      
      // Camera should have positive x, y, and z to see all three dimensions
      expect(threeCamera.position.x).toBeGreaterThan(0);
      expect(threeCamera.position.y).toBeGreaterThan(0);
      expect(threeCamera.position.z).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should update orbit controls', () => {
      const controls = camera.getControls();
      const updateSpy = vi.spyOn(controls, 'update');
      
      camera.update();
      
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('setPosition', () => {
    it('should set camera position within distance constraints', () => {
      const newPosition = new Vector3D(100, 200, 300);
      
      camera.setPosition(newPosition);
      
      const threeCamera = camera.getCamera();
      const controls = camera.getControls();
      
      // Calculate distance from camera to target
      const dx = threeCamera.position.x - controls.target.x;
      const dy = threeCamera.position.y - controls.target.y;
      const dz = threeCamera.position.z - controls.target.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Distance should be within the configured limits
      expect(distance).toBeGreaterThanOrEqual(controls.minDistance);
      expect(distance).toBeLessThanOrEqual(controls.maxDistance);
    });

    it('should update controls after setting position', () => {
      const controls = camera.getControls();
      const updateSpy = vi.spyOn(controls, 'update');
      
      camera.setPosition(new Vector3D(50, 50, 50));
      
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('lookAt', () => {
    it('should set camera target', () => {
      const target = new Vector3D(25, 35, 45);
      
      camera.lookAt(target);
      
      const controls = camera.getControls();
      expect(controls.target.x).toBeCloseTo(25, 5);
      expect(controls.target.y).toBeCloseTo(35, 5);
      expect(controls.target.z).toBeCloseTo(45, 5);
    });

    it('should update controls after setting target', () => {
      const controls = camera.getControls();
      const updateSpy = vi.spyOn(controls, 'update');
      
      camera.lookAt(new Vector3D(10, 20, 30));
      
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('resetView', () => {
    it('should reset camera to initial position', () => {
      const threeCamera = camera.getCamera();
      
      // Store initial position
      const initialX = threeCamera.position.x;
      const initialY = threeCamera.position.y;
      const initialZ = threeCamera.position.z;
      
      // Move camera
      camera.setPosition(new Vector3D(1000, 2000, 3000));
      
      // Reset
      camera.resetView();
      
      // Should be back at initial position
      expect(threeCamera.position.x).toBeCloseTo(initialX, 5);
      expect(threeCamera.position.y).toBeCloseTo(initialY, 5);
      expect(threeCamera.position.z).toBeCloseTo(initialZ, 5);
    });

    it('should reset camera target to initial target', () => {
      const controls = camera.getControls();
      
      // Store initial target
      const initialTargetX = controls.target.x;
      const initialTargetY = controls.target.y;
      const initialTargetZ = controls.target.z;
      
      // Change target
      camera.lookAt(new Vector3D(500, 600, 700));
      
      // Reset
      camera.resetView();
      
      // Should be back at initial target
      expect(controls.target.x).toBeCloseTo(initialTargetX, 5);
      expect(controls.target.y).toBeCloseTo(initialTargetY, 5);
      expect(controls.target.z).toBeCloseTo(initialTargetZ, 5);
    });

    it('should update controls after reset', () => {
      const controls = camera.getControls();
      const updateSpy = vi.spyOn(controls, 'update');
      
      camera.resetView();
      
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('updateAspectRatio', () => {
    it('should update camera aspect ratio', () => {
      const threeCamera = camera.getCamera();
      
      camera.updateAspectRatio(1920, 1080);
      
      expect(threeCamera.aspect).toBeCloseTo(1920 / 1080, 5);
    });

    it('should update projection matrix', () => {
      const threeCamera = camera.getCamera();
      const updateSpy = vi.spyOn(threeCamera, 'updateProjectionMatrix');
      
      camera.updateAspectRatio(1024, 768);
      
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('getCamera', () => {
    it('should return the Three.js camera instance', () => {
      const threeCamera = camera.getCamera();
      
      expect(threeCamera).toBeDefined();
      expect(threeCamera.type).toBe('PerspectiveCamera');
    });
  });

  describe('getControls', () => {
    it('should return the OrbitControls instance', () => {
      const controls = camera.getControls();
      
      expect(controls).toBeDefined();
      expect(controls.constructor.name).toBe('OrbitControls');
    });
  });
});
