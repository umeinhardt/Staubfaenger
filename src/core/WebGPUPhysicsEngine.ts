/**
 * WebGPU Physics Engine - Modern GPU Compute
 * Uses WebGPU Compute Shaders for maximum performance
 * Falls back to Web Workers if WebGPU is not available
 */

import { ParallelPhysicsEngine } from './ParallelPhysicsEngine';
import { GravityFormula } from './GravityFormula';
import { Entity } from './PhysicsEngine';
import { Particle } from './Particle';
import { Vector3D } from './Vector3D';

/**
 * Physics engine using WebGPU Compute Shaders
 * Provides massive speedup for large particle counts (>200)
 */
export class WebGPUPhysicsEngine extends ParallelPhysicsEngine {
  private device: GPUDevice | null = null;
  private computePipeline: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private useGPU: boolean = false;
  private gpuThreshold: number = 200; // Use GPU only if more than 200 particles

  /**
   * Create WebGPU physics engine
   */
  constructor(
    gravityFormula: GravityFormula,
    elasticity: number = 0,
    separateOnCollision: boolean = false,
    numWorkers?: number
  ) {
    super(gravityFormula, elasticity, separateOnCollision, numWorkers);
  }

  /**
   * Initialize WebGPU and Web Workers
   */
  override async initialize(): Promise<void> {
    // Initialize Web Workers first (fallback)
    await super.initialize();

    // Try to initialize WebGPU
    await this.initializeWebGPU();
  }

  /**
   * Initialize WebGPU compute pipeline
   */
  private async initializeWebGPU(): Promise<void> {
    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        console.log('WebGPU not supported, using Web Workers');
        return;
      }

      // Request adapter and device
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.log('WebGPU adapter not available');
        return;
      }

      this.device = await adapter.requestDevice();

      // Create compute shader
      const shaderModule = this.device.createShaderModule({
        label: 'Gravity Compute Shader',
        code: this.getComputeShaderCode()
      });

      // Create bind group layout
      this.bindGroupLayout = this.device.createBindGroupLayout({
        label: 'Gravity Bind Group Layout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' } // Positions
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' } // Masses
          },
          {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' } // Forces (output)
          },
          {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' } // Parameters (G, epsilon, numParticles)
          }
        ]
      });

      // Create compute pipeline
      this.computePipeline = this.device.createComputePipeline({
        label: 'Gravity Compute Pipeline',
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bindGroupLayout]
        }),
        compute: {
          module: shaderModule,
          entryPoint: 'main'
        }
      });

      this.useGPU = true;
      console.log('WebGPU Physics Engine: GPU Compute enabled');
    } catch (error) {
      console.warn('WebGPU initialization failed:', error);
      this.useGPU = false;
    }
  }

  /**
   * Get WebGPU compute shader code (WGSL)
   */
  private getComputeShaderCode(): string {
    return `
      struct Params {
        G: f32,
        epsilon: f32,
        numParticles: u32,
        padding: u32,
      }

      @group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
      @group(0) @binding(1) var<storage, read> masses: array<f32>;
      @group(0) @binding(2) var<storage, read_write> forces: array<vec4<f32>>;
      @group(0) @binding(3) var<uniform> params: Params;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let i = global_id.x;
        
        // Bounds check
        if (i >= params.numParticles) {
          return;
        }

        let pos_i = positions[i].xyz;
        let mass_i = masses[i];
        var force = vec3<f32>(0.0, 0.0, 0.0);

        // Calculate force from all other particles
        for (var j = 0u; j < params.numParticles; j++) {
          if (i == j) {
            continue;
          }

          let pos_j = positions[j].xyz;
          let mass_j = masses[j];

          // Calculate delta
          let delta = pos_j - pos_i;
          let distSq = dot(delta, delta) + params.epsilon * params.epsilon;

          // Skip if too close
          if (distSq < 1e-10) {
            continue;
          }

          let dist = sqrt(distSq);

          // F = G * m1 * m2 / r^2
          let forceMag = params.G * mass_i * mass_j / distSq;

          // Add force (normalized direction * magnitude)
          force += (delta / dist) * forceMag;
        }

        // Write result
        forces[i] = vec4<f32>(force, 0.0);
      }
    `;
  }

  /**
   * Apply gravity using best available method
   */
  override applyGravity(entities: Entity[], deltaTime: number): void {
    // Filter particles only (GPU doesn't handle conglomerates well)
    const particles = entities.filter(e => e instanceof Particle) as Particle[];
    const conglomerates = entities.filter(e => !(e instanceof Particle));

    // Use GPU for particles if available and above threshold
    if (this.useGPU && this.device && particles.length >= this.gpuThreshold) {
      // GPU compute is async, but we need to handle it synchronously
      // Queue the GPU work and apply forces immediately from last frame's results
      this.applyGravityGPUSync(particles, deltaTime);
      
      // Use CPU for conglomerates and particle-conglomerate interactions
      if (conglomerates.length > 0) {
        super.applyGravity(conglomerates, deltaTime);
        
        // Particle-conglomerate interactions on CPU
        for (const particle of particles) {
          for (const conglomerate of conglomerates) {
            const force = this.calculateGravitationalForce(particle, conglomerate);
            particle.applyForce(force, deltaTime);
            conglomerate.applyForce(force.multiply(-1), deltaTime);
          }
        }
      }
    } else {
      // Fall back to Web Workers or CPU
      super.applyGravity(entities, deltaTime);
    }
  }

  /**
   * Apply gravity using WebGPU compute (synchronous wrapper)
   */
  private applyGravityGPUSync(particles: Particle[], deltaTime: number): void {
    // Start GPU computation asynchronously (don't await)
    this.applyGravityGPU(particles, deltaTime).catch(error => {
      console.warn('WebGPU compute failed, falling back:', error);
      // Fallback to CPU for this frame
      super.applyGravity(particles, deltaTime);
    });
  }

  /**
   * Apply gravity using WebGPU compute
   */
  private async applyGravityGPU(particles: Particle[], deltaTime: number): Promise<void> {
    if (!this.device || !this.computePipeline || !this.bindGroupLayout) {
      return;
    }

    try {
      const numParticles = particles.length;

      // Prepare data
      const positions = new Float32Array(numParticles * 4); // vec4 (xyz + padding)
      const masses = new Float32Array(numParticles);
      
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        positions[i * 4 + 0] = p.position.x;
        positions[i * 4 + 1] = p.position.y;
        positions[i * 4 + 2] = p.position.z;
        positions[i * 4 + 3] = 0; // padding
        masses[i] = p.mass;
      }

      // Create buffers
      const positionBuffer = this.device.createBuffer({
        size: positions.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Float32Array(positionBuffer.getMappedRange()).set(positions);
      positionBuffer.unmap();

      const massBuffer = this.device.createBuffer({
        size: masses.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Float32Array(massBuffer.getMappedRange()).set(masses);
      massBuffer.unmap();

      const forceBuffer = this.device.createBuffer({
        size: numParticles * 4 * 4, // vec4<f32>
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      });

      // Parameters
      const G = (this.gravityFormula as any).G || 1.0;
      const epsilon = (this.gravityFormula as any).epsilon || 0.01;
      const params = new Float32Array([G, epsilon, numParticles, 0]);
      
      const paramBuffer = this.device.createBuffer({
        size: params.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Float32Array(paramBuffer.getMappedRange()).set(params);
      paramBuffer.unmap();

      // Create bind group
      const bindGroup = this.device.createBindGroup({
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: positionBuffer } },
          { binding: 1, resource: { buffer: massBuffer } },
          { binding: 2, resource: { buffer: forceBuffer } },
          { binding: 3, resource: { buffer: paramBuffer } }
        ]
      });

      // Create command encoder
      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(this.computePipeline);
      passEncoder.setBindGroup(0, bindGroup);
      
      // Dispatch workgroups (64 threads per workgroup)
      const workgroupCount = Math.ceil(numParticles / 64);
      passEncoder.dispatchWorkgroups(workgroupCount);
      passEncoder.end();

      // Read back results
      const readBuffer = this.device.createBuffer({
        size: forceBuffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });

      commandEncoder.copyBufferToBuffer(forceBuffer, 0, readBuffer, 0, forceBuffer.size);
      this.device.queue.submit([commandEncoder.finish()]);

      // Wait for GPU to finish
      await readBuffer.mapAsync(GPUMapMode.READ);
      const forces = new Float32Array(readBuffer.getMappedRange());

      // Apply forces to particles
      for (let i = 0; i < numParticles; i++) {
        const fx = forces[i * 4 + 0];
        const fy = forces[i * 4 + 1];
        const fz = forces[i * 4 + 2];
        
        const force = new Vector3D(fx, fy, fz);
        particles[i].applyForce(force, deltaTime);
      }

      // Cleanup
      readBuffer.unmap();
      positionBuffer.destroy();
      massBuffer.destroy();
      forceBuffer.destroy();
      paramBuffer.destroy();
      readBuffer.destroy();

    } catch (error) {
      console.warn('WebGPU compute failed, falling back:', error);
      super.applyGravity(particles, deltaTime);
    }
  }

  /**
   * Set GPU threshold
   */
  setGPUThreshold(threshold: number): void {
    this.gpuThreshold = threshold;
  }

  /**
   * Check if GPU is being used
   */
  isUsingGPU(): boolean {
    return this.useGPU && this.device !== null;
  }

  /**
   * Enable/disable GPU
   */
  setUseGPU(use: boolean): void {
    this.useGPU = use && this.device !== null;
  }

  /**
   * Cleanup
   */
  override dispose(): void {
    super.dispose();
    this.device?.destroy();
  }
}
