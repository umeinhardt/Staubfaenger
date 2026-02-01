import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Vector3D } from './Vector3D';
import { Boundary } from './Boundary';

/**
 * CameraController class for 3D camera management with orbit controls
 * Provides orbit, zoom, and pan controls for viewing the 3D simulation
 */
export class Camera {
  private camera: THREE.PerspectiveCamera;
  private controls!: OrbitControls;  // Definite assignment assertion - initialized in initializeControls()
  private canvas: HTMLCanvasElement;
  private initialPosition: Vector3D;
  private initialTarget: Vector3D;

  /**
   * Create a new camera controller
   * @param canvas - The canvas element for rendering
   * @param boundary - The simulation boundary to determine initial view
   */
  constructor(canvas: HTMLCanvasElement, boundary: Boundary) {
    this.canvas = canvas;

    // Create perspective camera with extended far clipping plane
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      canvas.width / canvas.height, // Aspect ratio
      0.1, // Near clipping plane
      10000 // Far clipping plane - increased from 1000 to 10000
    );

    // Calculate initial camera position to view entire boundary
    const center = new Vector3D(
      (boundary.min.x + boundary.max.x) / 2,
      (boundary.min.y + boundary.max.y) / 2,
      (boundary.min.z + boundary.max.z) / 2
    );

    // Calculate distance to view entire boundary
    const width = boundary.max.x - boundary.min.x;
    const height = boundary.max.y - boundary.min.y;
    const depth = boundary.max.z - boundary.min.z;
    const maxDimension = Math.max(width, height, depth);
    
    // Position camera at a distance that shows the entire boundary
    // Using a factor of 1.2 for a closer initial view
    const distance = maxDimension * 1.2;
    
    // Position camera at an angle to see all three dimensions
    this.initialPosition = new Vector3D(
      center.x + distance * 0.7,
      center.y + distance * 0.7,
      center.z + distance * 0.7
    );
    
    this.initialTarget = center;

    // Set initial camera position
    this.camera.position.set(
      this.initialPosition.x,
      this.initialPosition.y,
      this.initialPosition.z
    );

    // Initialize orbit controls
    this.initializeControls();

    // Look at the center of the boundary
    this.controls.target.set(center.x, center.y, center.z);
    this.controls.update();
  }

  /**
   * Initialize orbit controls with appropriate settings
   */
  private initializeControls(): void {
    this.controls = new OrbitControls(this.camera, this.canvas);

    // Enable smooth damping for better user experience
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Disable screen space panning (use world space instead)
    this.controls.screenSpacePanning = false;

    // Set distance limits - allow zooming out much further
    this.controls.minDistance = 10;
    this.controls.maxDistance = 2000; // Increased from 200 to 2000

    // Allow full rotation (no polar angle limits)
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minPolarAngle = 0;

    // Enable all control types
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
  }

  /**
   * Update the camera controls
   * Must be called in the animation loop for damping to work
   */
  update(): void {
    this.controls.update();
  }

  /**
   * Set the camera position
   * @param position - New camera position in world coordinates
   */
  setPosition(position: Vector3D): void {
    this.camera.position.set(position.x, position.y, position.z);
    this.controls.update();
  }

  /**
   * Set the camera to look at a specific target
   * @param target - Target position in world coordinates
   */
  lookAt(target: Vector3D): void {
    this.controls.target.set(target.x, target.y, target.z);
    this.controls.update();
  }

  /**
   * Reset the camera to its initial view
   */
  resetView(): void {
    this.camera.position.set(
      this.initialPosition.x,
      this.initialPosition.y,
      this.initialPosition.z
    );
    this.controls.target.set(
      this.initialTarget.x,
      this.initialTarget.y,
      this.initialTarget.z
    );
    this.controls.update();
  }

  /**
   * Get the Three.js camera instance
   * @returns The Three.js PerspectiveCamera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the orbit controls instance
   * @returns The OrbitControls instance
   */
  getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Update camera aspect ratio (call when canvas is resized)
   * @param width - New canvas width
   * @param height - New canvas height
   */
  updateAspectRatio(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
