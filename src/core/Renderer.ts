import * as THREE from 'three';
import { Vector3D } from './Vector3D';
import { Particle } from './Particle';
import { Conglomerate } from './Conglomerate';
import { Boundary } from './Boundary';
import { EnergyDissipation } from './PhysicsEngine';

/**
 * Color mode for rendering particles and conglomerates
 */
export type ColorMode = 'mass' | 'velocity' | 'energy' | 'age';

/**
 * Configuration for the renderer
 */
export interface RenderConfig {
  colorMode: ColorMode;
  showVelocityVectors: boolean;
}

/**
 * Renderer class for 3D visualization using Three.js
 * Provides hardware-accelerated WebGL rendering of particles and conglomerates
 */
export class Renderer {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private particleMeshes: Map<string, THREE.Mesh>;
  private velocityArrows: Map<string, THREE.ArrowHelper>;
  private boundaryWireframe: THREE.LineSegments | null = null;
  private config: RenderConfig;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private brightness: number = 1.5; // Default brightness multiplier

  // Color ranges for different modes (now used for rank-based distribution)
  private massColorRange = { min: 0, max: 1 };
  private velocityColorRange = { min: 0, max: 1 };
  private energyColorRange = { min: 0, max: 1 };
  private ageColorRange = { min: 0, max: 1 };
  
  // Rank maps for each color mode (maps entity/particle ID to rank)
  private massRanks: Map<string, number> = new Map();
  private velocityRanks: Map<string, number> = new Map();
  private energyRanks: Map<string, number> = new Map();
  private ageRanks: Map<string, number> = new Map();
  
  // Energy dissipation sparks
  private sparks: Array<{ mesh: THREE.Mesh; lifetime: number; maxLifetime: number }> = [];

  /**
   * Create a new 3D renderer
   * @param canvas - HTML canvas element to render to
   * @param config - Rendering configuration
   * @param camera - Optional external camera (if not provided, creates its own)
   */
  constructor(canvas: HTMLCanvasElement, config: RenderConfig, camera?: THREE.PerspectiveCamera) {
    this.config = config;
    this.particleMeshes = new Map();
    this.velocityArrows = new Map();

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Use provided camera or create a new one
    if (camera) {
      this.camera = camera;
    } else {
      // Create perspective camera
      this.camera = new THREE.PerspectiveCamera(
        75,  // FOV
        canvas.width / canvas.height,  // Aspect ratio
        0.1,  // Near plane
        1000  // Far plane
      );

      // Position camera to view the simulation
      this.camera.position.set(50, 50, 50);
      this.camera.lookAt(0, 0, 0);
    }

    // Set up lighting
    this.setupLighting();
  }

  /**
   * Set up lighting for depth perception
   */
  private setupLighting(): void {
    // Ambient light for base visibility
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5 * this.brightness);
    this.scene.add(this.ambientLight);

    // Directional light for depth perception
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8 * this.brightness);
    this.directionalLight.position.set(10, 10, 10);
    this.scene.add(this.directionalLight);

    // Additional fill light
    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.3 * this.brightness);
    this.fillLight.position.set(-10, -10, -10);
    this.scene.add(this.fillLight);
  }

  /**
   * Get the Three.js camera instance
   * @returns Camera object
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the Three.js WebGL renderer instance
   * @returns WebGL renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Create boundary wireframe visualization
   * @param boundary - Boundary to visualize
   */
  createBoundaryWireframe(boundary: Boundary): void {
    // Remove existing wireframe if any
    if (this.boundaryWireframe) {
      this.scene.remove(this.boundaryWireframe);
    }

    const width = boundary.max.x - boundary.min.x;
    const height = boundary.max.y - boundary.min.y;
    const depth = boundary.max.z - boundary.min.z;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0x444444 });

    this.boundaryWireframe = new THREE.LineSegments(edges, material);

    // Position at center of boundary
    const centerX = (boundary.min.x + boundary.max.x) / 2;
    const centerY = (boundary.min.y + boundary.max.y) / 2;
    const centerZ = (boundary.min.z + boundary.max.z) / 2;
    this.boundaryWireframe.position.set(centerX, centerY, centerZ);

    this.scene.add(this.boundaryWireframe);
  }

  /**
   * Render all entities (particles and conglomerates)
   * @param entities - Array of particles and conglomerates to render
   */
  render(entities: (Particle | Conglomerate)[]): void {
    // Collect all particles (including those in conglomerates) for ranking
    const allParticles: Particle[] = [];
    for (const entity of entities) {
      if (entity instanceof Particle) {
        allParticles.push(entity);
      } else if (entity instanceof Conglomerate) {
        allParticles.push(...entity.particles);
      }
    }

    if (allParticles.length > 0) {
      // Calculate ranks for all color modes to ensure full spectrum usage
      const maxRank = Math.max(allParticles.length - 1, 1);

      // Mass ranks
      const sortedByMass = [...allParticles].sort((a, b) => a.mass - b.mass);
      this.massRanks = new Map();
      sortedByMass.forEach((particle, index) => {
        this.massRanks.set(particle.id, index);
      });
      this.massColorRange.min = 0;
      this.massColorRange.max = maxRank;

      // Velocity ranks
      const sortedByVelocity = [...allParticles].sort((a, b) => 
        a.velocity.magnitude() - b.velocity.magnitude()
      );
      this.velocityRanks = new Map();
      sortedByVelocity.forEach((particle, index) => {
        this.velocityRanks.set(particle.id, index);
      });
      this.velocityColorRange.min = 0;
      this.velocityColorRange.max = maxRank;

      // Energy ranks
      const sortedByEnergy = [...allParticles].sort((a, b) => 
        a.kineticEnergy() - b.kineticEnergy()
      );
      this.energyRanks = new Map();
      sortedByEnergy.forEach((particle, index) => {
        this.energyRanks.set(particle.id, index);
      });
      this.energyColorRange.min = 0;
      this.energyColorRange.max = maxRank;

      // Age ranks
      const sortedByAge = [...allParticles].sort((a, b) => a.age - b.age);
      this.ageRanks = new Map();
      sortedByAge.forEach((particle, index) => {
        this.ageRanks.set(particle.id, index);
      });
      this.ageColorRange.min = 0;
      this.ageColorRange.max = maxRank;
    }
    
    // Track which entities are still active
    const activeIds = new Set<string>();

    for (const entity of entities) {
      if (entity instanceof Particle) {
        this.updateParticle(entity);
        activeIds.add(entity.id);
        
        // Update velocity vector if enabled
        if (this.config.showVelocityVectors) {
          this.updateVelocityArrow(entity);
        }
      } else if (entity instanceof Conglomerate) {
        this.updateConglomerate(entity);
        activeIds.add(entity.id);
        // Also mark constituent particles as active
        for (const particle of entity.particles) {
          activeIds.add(particle.id);
        }
        
        // Update velocity vector for conglomerate if enabled
        if (this.config.showVelocityVectors) {
          this.updateVelocityArrow(entity);
        }
      }
    }

    // Remove meshes for entities that no longer exist
    for (const [id, mesh] of Array.from(this.particleMeshes.entries())) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.particleMeshes.delete(id);
      }
    }

    // Remove velocity arrows for entities that no longer exist or if disabled
    for (const [id, arrow] of Array.from(this.velocityArrows.entries())) {
      if (!activeIds.has(id) || !this.config.showVelocityVectors) {
        this.scene.remove(arrow);
        arrow.dispose();
        this.velocityArrows.delete(id);
      }
    }

    // Update sparks (energy dissipation visualization)
    this.updateSparks(0.016); // Assume ~60 FPS

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update or create mesh for a particle
   * @param particle - Particle to render
   */
  private updateParticle(particle: Particle): void {
    let mesh = this.particleMeshes.get(particle.id);

    if (!mesh) {
      // Create new mesh for particle with vibrant material
      const geometry = new THREE.SphereGeometry(particle.radius, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: this.getColor(particle),
        shininess: 100,
        specular: 0x444444,
        emissive: 0x000000,
        emissiveIntensity: 0.1
      });
      mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.particleMeshes.set(particle.id, mesh);
    }

    // Update position
    mesh.position.set(particle.position.x, particle.position.y, particle.position.z);

    // Update color
    const color = this.getColor(particle);
    const material = mesh.material as THREE.MeshPhongMaterial;
    material.color.set(color);
    // Add slight emissive glow based on color for more vibrancy
    material.emissive.set(color);
    material.emissiveIntensity = 0.15;
  }

  /**
   * Update or create velocity arrow for an entity
   * @param entity - Particle or Conglomerate to show velocity for
   */
  private updateVelocityArrow(entity: Particle | Conglomerate): void {
    const id = entity.id;
    const velocity = entity.velocity;
    const speed = velocity.magnitude();
    
    // Don't show arrow if velocity is very small
    if (speed < 0.1) {
      const existingArrow = this.velocityArrows.get(id);
      if (existingArrow) {
        this.scene.remove(existingArrow);
        existingArrow.dispose();
        this.velocityArrows.delete(id);
      }
      return;
    }

    // Get position
    const position = entity instanceof Particle 
      ? entity.position 
      : entity.centerOfMass;

    // Normalize velocity direction
    const direction = new THREE.Vector3(
      velocity.x / speed,
      velocity.y / speed,
      velocity.z / speed
    );

    // Arrow length proportional to speed (scaled for visibility)
    const arrowLength = Math.min(speed * 0.5, 20);
    
    // Get or create arrow
    let arrow = this.velocityArrows.get(id);
    
    if (!arrow) {
      // Create new arrow (yellow color for visibility)
      arrow = new THREE.ArrowHelper(
        direction,
        new THREE.Vector3(position.x, position.y, position.z),
        arrowLength,
        0xffff00, // Yellow
        arrowLength * 0.2, // Head length
        arrowLength * 0.1  // Head width
      );
      this.scene.add(arrow);
      this.velocityArrows.set(id, arrow);
    } else {
      // Update existing arrow
      arrow.position.set(position.x, position.y, position.z);
      arrow.setDirection(direction);
      arrow.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.1);
    }
  }

  /**
   * Update or create meshes for a conglomerate
   * Renders all constituent particles with their individual frozen colors
   * @param conglomerate - Conglomerate to render
   */
  private updateConglomerate(conglomerate: Conglomerate): void {
    // Render all constituent particles with their individual frozen colors
    for (const particle of conglomerate.particles) {
      let mesh = this.particleMeshes.get(particle.id);

      // Determine color: use frozen color if available, otherwise calculate
      let particleColor: THREE.Color;
      if (particle.frozenColor !== null) {
        particleColor = new THREE.Color(particle.frozenColor);
      } else {
        // Freeze the color when particle joins conglomerate
        particleColor = this.getColor(particle);
        particle.frozenColor = particleColor.getHex();
      }

      if (!mesh) {
        // Create new mesh for particle with vibrant material
        const geometry = new THREE.SphereGeometry(particle.radius, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: particleColor,
          shininess: 100,
          specular: 0x444444,
          emissive: particleColor,
          emissiveIntensity: 0.15
        });
        mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.particleMeshes.set(particle.id, mesh);
      }

      // Update position
      mesh.position.set(particle.position.x, particle.position.y, particle.position.z);

      // Update color with particle's frozen color
      const material = mesh.material as THREE.MeshPhongMaterial;
      material.color.set(particleColor);
      material.emissive.set(particleColor);
      material.emissiveIntensity = 0.15;
    }
  }

  /**
   * Get the color for an entity based on the current color mode
   * Uses rank-based distribution for all modes to ensure full spectrum usage
   * @param entity - Particle or Conglomerate
   * @returns THREE.Color object
   */
  private getColor(entity: Particle | Conglomerate): THREE.Color {
    let value: number;
    let min: number;
    let max: number;

    // For all modes, use rank instead of actual value for full spectrum distribution
    const entityId = entity instanceof Particle ? entity.id : entity.id;

    switch (this.config.colorMode) {
      case 'mass':
        const massRank = this.massRanks.get(entityId);
        value = massRank !== undefined ? massRank : 0;
        min = this.massColorRange.min;
        max = this.massColorRange.max;
        break;

      case 'velocity':
        const velocityRank = this.velocityRanks.get(entityId);
        value = velocityRank !== undefined ? velocityRank : 0;
        min = this.velocityColorRange.min;
        max = this.velocityColorRange.max;
        break;

      case 'energy':
        const energyRank = this.energyRanks.get(entityId);
        value = energyRank !== undefined ? energyRank : 0;
        min = this.energyColorRange.min;
        max = this.energyColorRange.max;
        break;

      case 'age':
        const ageRank = this.ageRanks.get(entityId);
        value = ageRank !== undefined ? ageRank : 0;
        min = this.ageColorRange.min;
        max = this.ageColorRange.max;
        break;

      default:
        value = 0;
        min = 0;
        max = 1;
    }

    // Normalize value to [0, 1]
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

    // Map to color gradient: blue (cold) -> green -> yellow -> red (hot)
    return this.valueToColor(normalized);
  }

  /**
   * Convert a normalized value [0, 1] to a color
   * Uses a vibrant rainbow gradient: purple -> blue -> cyan -> green -> yellow -> orange -> red
   * @param value - Normalized value between 0 and 1
   * @returns THREE.Color object
   */
  private valueToColor(value: number): THREE.Color {
    // Clamp value to [0, 1]
    value = Math.max(0, Math.min(1, value));

    let r: number, g: number, b: number;

    if (value < 0.16) {
      // Purple to Blue
      const t = value / 0.16;
      r = 0.5 - t * 0.5;
      g = 0;
      b = 1;
    } else if (value < 0.33) {
      // Blue to Cyan
      const t = (value - 0.16) / 0.17;
      r = 0;
      g = t;
      b = 1;
    } else if (value < 0.5) {
      // Cyan to Green
      const t = (value - 0.33) / 0.17;
      r = 0;
      g = 1;
      b = 1 - t;
    } else if (value < 0.66) {
      // Green to Yellow
      const t = (value - 0.5) / 0.16;
      r = t;
      g = 1;
      b = 0;
    } else if (value < 0.83) {
      // Yellow to Orange
      const t = (value - 0.66) / 0.17;
      r = 1;
      g = 1 - t * 0.5;
      b = 0;
    } else {
      // Orange to Red
      const t = (value - 0.83) / 0.17;
      r = 1;
      g = 0.5 - t * 0.5;
      b = 0;
    }

    return new THREE.Color(r, g, b);
  }

  /**
   * Set the color mode for rendering
   * @param mode - Color mode to use
   */
  setColorMode(mode: ColorMode): void {
    this.config.colorMode = mode;
  }

  /**
   * Set whether to show velocity vectors
   * @param show - True to show velocity vectors
   */
  setShowVelocityVectors(show: boolean): void {
    this.config.showVelocityVectors = show;
  }

  /**
   * Set the brightness multiplier for lighting
   * @param brightness - Brightness multiplier (0.5 to 3.0)
   */
  setBrightness(brightness: number): void {
    this.brightness = Math.max(0.5, Math.min(3.0, brightness));
    
    // Update all light intensities
    this.ambientLight.intensity = 0.5 * this.brightness;
    this.directionalLight.intensity = 0.8 * this.brightness;
    this.fillLight.intensity = 0.3 * this.brightness;
  }

  /**
   * Get the current render configuration
   * @returns Current render configuration
   */
  getConfig(): RenderConfig {
    return { ...this.config };
  }

  /**
   * Handle window resize
   * @param width - New canvas width
   * @param height - New canvas height
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Dispose all meshes
    for (const [, mesh] of Array.from(this.particleMeshes)) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.particleMeshes.clear();

    // Dispose all velocity arrows
    for (const [, arrow] of Array.from(this.velocityArrows)) {
      this.scene.remove(arrow);
      arrow.dispose();
    }
    this.velocityArrows.clear();

    // Dispose all sparks
    for (const spark of this.sparks) {
      this.scene.remove(spark.mesh);
      spark.mesh.geometry.dispose();
      (spark.mesh.material as THREE.Material).dispose();
    }
    this.sparks = [];

    // Dispose boundary wireframe
    if (this.boundaryWireframe) {
      this.scene.remove(this.boundaryWireframe);
      this.boundaryWireframe.geometry.dispose();
      (this.boundaryWireframe.material as THREE.Material).dispose();
    }

    // Dispose renderer
    this.renderer.dispose();
  }

  /**
   * Add an energy dissipation spark at a collision point
   * @param dissipation - Energy dissipation information
   */
  addEnergyDissipation(dissipation: EnergyDissipation): void {
    const { position, energyLost } = dissipation;
    
    // Create spark size based on energy lost (larger and more visible)
    const sparkSize = Math.min(Math.log(energyLost + 1) * 1.0 + 0.5, 3);
    
    // Create spark geometry (small sphere)
    const geometry = new THREE.SphereGeometry(sparkSize, 8, 8);
    
    // Create very bright emissive material (yellow-white spark)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1.0
    });
    
    const sparkMesh = new THREE.Mesh(geometry, material);
    sparkMesh.position.set(position.x, position.y, position.z);
    
    // Add strong glow effect with point light
    const light = new THREE.PointLight(0xffff00, Math.max(energyLost * 2, 5), sparkSize * 10);
    light.position.set(position.x, position.y, position.z);
    sparkMesh.add(light);
    
    this.scene.add(sparkMesh);
    
    // Spark lifetime: 0.2 to 0.5 seconds based on energy
    const lifetime = 0.2 + Math.min(energyLost * 0.02, 0.3);
    
    this.sparks.push({
      mesh: sparkMesh,
      lifetime: 0,
      maxLifetime: lifetime
    });
  }

  /**
   * Update sparks (fade out and remove expired ones)
   * Should be called each frame
   * @param deltaTime - Time elapsed since last frame
   */
  private updateSparks(deltaTime: number): void {
    // Update existing sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      spark.lifetime += deltaTime;
      
      // Calculate fade (1.0 at start, 0.0 at end)
      const fade = 1.0 - (spark.lifetime / spark.maxLifetime);
      
      if (fade <= 0) {
        // Remove expired spark
        this.scene.remove(spark.mesh);
        spark.mesh.geometry.dispose();
        (spark.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
      } else {
        // Update opacity for fade effect
        const material = spark.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = fade;
        
        // Update light intensity
        const light = spark.mesh.children[0] as THREE.PointLight;
        if (light) {
          light.intensity *= fade;
        }
        
        // Slight expansion
        const scale = 1.0 + (1.0 - fade) * 0.5;
        spark.mesh.scale.set(scale, scale, scale);
      }
    }
  }
}
