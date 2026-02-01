/**
 * GPU-accelerated Physics Engine using WebGL Compute
 * Falls back to CPU if GPU is not available
 * 
 * Uses WebGL for parallel computation of gravitational forces
 */

import { Vector3D } from './Vector3D';
import { Particle } from './Particle';
import { Conglomerate } from './Conglomerate';
import { GravityFormula } from './GravityFormula';
import { PhysicsEngine, Entity } from './PhysicsEngine';
import * as THREE from 'three';

/**
 * GPU-accelerated physics engine
 * Computes gravitational forces on GPU for better performance with many particles
 */
export class GPUPhysicsEngine extends PhysicsEngine {
  private useGPU: boolean = false;
  private renderer: THREE.WebGLRenderer | null = null;
  private gravityComputeShader: THREE.ShaderMaterial | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private particleThreshold: number = 100; // Use GPU only if more than 100 particles

  /**
   * Initialize GPU compute capabilities
   * @param renderer - Three.js WebGL renderer
   */
  initializeGPU(renderer: THREE.WebGLRenderer): void {
    try {
      this.renderer = renderer;
      
      // Check WebGL2 support
      const gl = renderer.getContext();
      if (!gl || !(gl instanceof WebGL2RenderingContext)) {
        console.warn('WebGL2 not supported, falling back to CPU');
        this.useGPU = false;
        return;
      }

      // Create compute shader for gravity calculation
      this.createGravityComputeShader();
      
      this.useGPU = true;
      console.log('GPU acceleration enabled for physics');
    } catch (error) {
      console.warn('Failed to initialize GPU compute:', error);
      this.useGPU = false;
    }
  }

  /**
   * Create WebGL shader for gravity computation
   */
  private createGravityComputeShader(): void {
    // Vertex shader (pass-through)
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader (compute gravity forces)
    const fragmentShader = `
      precision highp float;
      
      uniform sampler2D positions;  // RGB = xyz position
      uniform sampler2D masses;     // R = mass
      uniform float G;              // Gravitational constant
      uniform float epsilon;        // Softening parameter
      uniform int numParticles;
      uniform vec2 texSize;
      
      varying vec2 vUv;
      
      vec3 getPosition(int index) {
        float x = mod(float(index), texSize.x);
        float y = floor(float(index) / texSize.x);
        vec2 uv = (vec2(x, y) + 0.5) / texSize;
        return texture2D(positions, uv).xyz;
      }
      
      float getMass(int index) {
        float x = mod(float(index), texSize.x);
        float y = floor(float(index) / texSize.x);
        vec2 uv = (vec2(x, y) + 0.5) / texSize;
        return texture2D(masses, uv).r;
      }
      
      void main() {
        // Get current particle index from UV
        int i = int(vUv.x * texSize.x + vUv.y * texSize.y * texSize.x);
        
        if (i >= numParticles) {
          gl_FragColor = vec4(0.0);
          return;
        }
        
        vec3 pos_i = getPosition(i);
        float mass_i = getMass(i);
        
        vec3 totalForce = vec3(0.0);
        
        // Calculate force from all other particles
        for (int j = 0; j < 10000; j++) {
          if (j >= numParticles) break;
          if (i == j) continue;
          
          vec3 pos_j = getPosition(j);
          float mass_j = getMass(j);
          
          vec3 delta = pos_j - pos_i;
          float distSq = dot(delta, delta) + epsilon * epsilon;
          float dist = sqrt(distSq);
          
          float forceMag = G * mass_i * mass_j / distSq;
          totalForce += forceMag * delta / dist;
        }
        
        // Output force as RGB (xyz)
        gl_FragColor = vec4(totalForce, 1.0);
      }
    `;

    this.gravityComputeShader = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        positions: { value: null },
        masses: { value: null },
        G: { value: 1.0 },
        epsilon: { value: 0.01 },
        numParticles: { value: 0 },
        texSize: { value: new THREE.Vector2(1, 1) }
      }
    });

    // Create scene and camera for compute pass
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create quad for rendering
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.gravityComputeShader
    );
    this.scene.add(quad);
  }

  /**
   * Apply gravitational forces using GPU or CPU
   * Automatically chooses GPU if available and particle count is high enough
   */
  override applyGravity(entities: Entity[], deltaTime: number): void {
    // Separate particles and conglomerates
    const particles = entities.filter(e => e instanceof Particle) as Particle[];
    const conglomerates = entities.filter(e => e instanceof Conglomerate) as Conglomerate[];
    
    // Use GPU for particles if threshold is met
    if (this.useGPU && particles.length >= this.particleThreshold) {
      this.applyGravityGPU(particles, deltaTime);
      
      // Still need to apply gravity for conglomerates on CPU
      if (conglomerates.length > 0) {
        super.applyGravity(conglomerates, deltaTime);
      }
      
      // Apply gravity between particles and conglomerates on CPU
      // (GPU only handles particle-particle interactions)
      if (particles.length > 0 && conglomerates.length > 0) {
        this.applyGravityBetweenGroups(particles, conglomerates, deltaTime);
      }
    } else {
      // Fall back to CPU for everything
      super.applyGravity(entities, deltaTime);
    }
  }

  /**
   * Apply gravity between two groups of entities (CPU)
   * Used for particle-conglomerate interactions when GPU is active
   */
  private applyGravityBetweenGroups(
    group1: Entity[],
    group2: Entity[],
    deltaTime: number
  ): void {
    for (const e1 of group1) {
      for (const e2 of group2) {
        const force = this.calculateGravitationalForce(e1, e2);
        this.applyForce(e1, force, deltaTime);
        this.applyForce(e2, force.multiply(-1), deltaTime);
      }
    }
  }

  /**
   * Apply gravity using GPU computation
   */
  private applyGravityGPU(particles: Particle[], deltaTime: number): void {
    if (!this.renderer || !this.gravityComputeShader || !this.scene || !this.camera) {
      // Fallback to CPU
      super.applyGravity(particles, deltaTime);
      return;
    }

    try {
      // Calculate texture size (square texture)
      const texSize = Math.ceil(Math.sqrt(particles.length));
      
      // Create textures for positions and masses
      const positionData = new Float32Array(texSize * texSize * 4);
      const massData = new Float32Array(texSize * texSize * 4);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        positionData[i * 4 + 0] = p.position.x;
        positionData[i * 4 + 1] = p.position.y;
        positionData[i * 4 + 2] = p.position.z;
        positionData[i * 4 + 3] = 1.0;
        
        massData[i * 4 + 0] = p.mass;
        massData[i * 4 + 1] = 0;
        massData[i * 4 + 2] = 0;
        massData[i * 4 + 3] = 1.0;
      }
      
      const positionTexture = new THREE.DataTexture(
        positionData,
        texSize,
        texSize,
        THREE.RGBAFormat,
        THREE.FloatType
      );
      positionTexture.needsUpdate = true;
      
      const massTexture = new THREE.DataTexture(
        massData,
        texSize,
        texSize,
        THREE.RGBAFormat,
        THREE.FloatType
      );
      massTexture.needsUpdate = true;
      
      // Update shader uniforms
      this.gravityComputeShader.uniforms.positions.value = positionTexture;
      this.gravityComputeShader.uniforms.masses.value = massTexture;
      this.gravityComputeShader.uniforms.numParticles.value = particles.length;
      this.gravityComputeShader.uniforms.texSize.value.set(texSize, texSize);
      
      // Create render target if needed
      if (!this.renderTarget || this.renderTarget.width !== texSize) {
        this.renderTarget?.dispose();
        this.renderTarget = new THREE.WebGLRenderTarget(texSize, texSize, {
          format: THREE.RGBAFormat,
          type: THREE.FloatType,
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter
        });
      }
      
      // Render to compute forces
      const oldTarget = this.renderer.getRenderTarget();
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(oldTarget);
      
      // Read back results
      const forceData = new Float32Array(texSize * texSize * 4);
      this.renderer.readRenderTargetPixels(
        this.renderTarget,
        0, 0,
        texSize, texSize,
        forceData
      );
      
      // Apply forces to particles
      for (let i = 0; i < particles.length; i++) {
        const fx = forceData[i * 4 + 0];
        const fy = forceData[i * 4 + 1];
        const fz = forceData[i * 4 + 2];
        
        const force = new Vector3D(fx, fy, fz);
        particles[i].applyForce(force, deltaTime);
      }
      
      // Cleanup
      positionTexture.dispose();
      massTexture.dispose();
      
    } catch (error) {
      console.warn('GPU computation failed, falling back to CPU:', error);
      super.applyGravity(particles, deltaTime);
    }
  }

  /**
   * Set the particle threshold for GPU usage
   * @param threshold - Minimum number of particles to use GPU
   */
  setParticleThreshold(threshold: number): void {
    this.particleThreshold = threshold;
  }

  /**
   * Get whether GPU is currently being used
   */
  isUsingGPU(): boolean {
    return this.useGPU;
  }

  /**
   * Enable or disable GPU acceleration
   */
  setUseGPU(use: boolean): void {
    this.useGPU = use;
  }

  /**
   * Cleanup GPU resources
   */
  dispose(): void {
    this.renderTarget?.dispose();
    this.gravityComputeShader?.dispose();
  }
}
