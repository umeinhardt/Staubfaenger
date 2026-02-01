import { SimulationEngine } from './SimulationEngine';
import { ParticleManager } from './ParticleManager';
import { PhysicsEngine } from './PhysicsEngine';
import { Renderer } from './Renderer';

/**
 * GUI Controller for managing user interface interactions in 3D simulation
 * Handles all UI controls and parameter updates
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */
export class GUIController {
  private simulationEngine: SimulationEngine;
  private particleManager: ParticleManager;
  private physicsEngine: PhysicsEngine;
  private renderer: Renderer;

  // UI Elements - Buttons
  private playButton: HTMLButtonElement;
  private pauseButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private toggleInjectionButton: HTMLButtonElement;

  // UI Elements - Sliders
  private spawnRateSlider: HTMLInputElement;
  private maxParticlesInput: HTMLInputElement;
  private massMinSlider: HTMLInputElement;
  private massMaxSlider: HTMLInputElement;
  private energyMinSlider: HTMLInputElement;
  private energyMaxSlider: HTMLInputElement;
  private elasticitySlider: HTMLInputElement;
  private accuracySlider: HTMLInputElement;
  private timeScaleSlider: HTMLInputElement;

  // UI Elements - Value Displays
  private spawnRateValue: HTMLElement;
  private particlesSpawnedValue: HTMLElement;
  private massMinValue: HTMLElement;
  private massMaxValue: HTMLElement;
  private energyMinValue: HTMLElement;
  private energyMaxValue: HTMLElement;
  private elasticityValue: HTMLElement;
  private accuracyValue: HTMLElement;
  private timeScaleValue: HTMLElement;
  private brightnessValue: HTMLElement;
  private totalEnergyValue: HTMLElement;

  // UI Elements - Statistics Display
  private statsParticleCount: HTMLElement | null = null;
  private statsConglomerateCount: HTMLElement | null = null;
  private statsFPS: HTMLElement | null = null;

  // UI Elements - Select
  private colorModeSelect: HTMLSelectElement;
  private boundaryModeSelect: HTMLSelectElement;
  
  // UI Elements - Checkbox
  private showVelocityCheckbox: HTMLInputElement;
  private disableStickingCheckbox: HTMLInputElement;
  private separateCollisionCheckbox: HTMLInputElement;
  private adaptiveTimeStepsCheckbox: HTMLInputElement;
  private useLODCheckbox: HTMLInputElement;
  private parallelCollisionCheckbox: HTMLInputElement;
  private barnesHutCheckbox: HTMLInputElement;
  
  // UI Elements - Brightness
  private brightnessSlider: HTMLInputElement;

  // Canvas for Three.js rendering (camera controls handled by OrbitControls)
  private canvas: HTMLCanvasElement;

  // FPS tracking
  private frameCount: number = 0;
  private lastFPSUpdate: number = 0;
  private currentFPS: number = 0;

  /**
   * Create a new GUI controller for 3D simulation
   * @param simulationEngine - The simulation engine to control
   * @param particleManager - The particle manager to configure
   * @param physicsEngine - The physics engine to configure
   * @param renderer - The renderer to configure
   */
  constructor(
    simulationEngine: SimulationEngine,
    particleManager: ParticleManager,
    physicsEngine: PhysicsEngine,
    renderer: Renderer
  ) {
    this.simulationEngine = simulationEngine;
    this.particleManager = particleManager;
    this.physicsEngine = physicsEngine;
    this.renderer = renderer;

    // Get UI elements
    this.playButton = this.getElement<HTMLButtonElement>('playButton');
    this.pauseButton = this.getElement<HTMLButtonElement>('pauseButton');
    this.resetButton = this.getElement<HTMLButtonElement>('resetButton');
    this.toggleInjectionButton = this.getElement<HTMLButtonElement>('toggleInjectionButton');

    this.spawnRateSlider = this.getElement<HTMLInputElement>('spawnRate');
    this.maxParticlesInput = this.getElement<HTMLInputElement>('maxParticles');
    this.massMinSlider = this.getElement<HTMLInputElement>('massMin');
    this.massMaxSlider = this.getElement<HTMLInputElement>('massMax');
    this.energyMinSlider = this.getElement<HTMLInputElement>('energyMin');
    this.energyMaxSlider = this.getElement<HTMLInputElement>('energyMax');
    this.elasticitySlider = this.getElement<HTMLInputElement>('elasticity');
    this.accuracySlider = this.getElement<HTMLInputElement>('accuracy');
    this.timeScaleSlider = this.getElement<HTMLInputElement>('timeScale');

    this.spawnRateValue = this.getElement<HTMLElement>('spawnRateValue');
    this.particlesSpawnedValue = this.getElement<HTMLElement>('particlesSpawnedValue');
    this.massMinValue = this.getElement<HTMLElement>('massMinValue');
    this.massMaxValue = this.getElement<HTMLElement>('massMaxValue');
    this.energyMinValue = this.getElement<HTMLElement>('energyMinValue');
    this.energyMaxValue = this.getElement<HTMLElement>('energyMaxValue');
    this.elasticityValue = this.getElement<HTMLElement>('elasticityValue');
    this.accuracyValue = this.getElement<HTMLElement>('accuracyValue');
    this.timeScaleValue = this.getElement<HTMLElement>('timeScaleValue');
    this.brightnessValue = this.getElement<HTMLElement>('brightnessValue');
    this.totalEnergyValue = this.getElement<HTMLElement>('totalEnergyValue');

    // Optional statistics elements
    this.statsParticleCount = document.getElementById('statsParticleCount');
    this.statsConglomerateCount = document.getElementById('statsConglomerateCount');
    this.statsFPS = document.getElementById('statsFPS');

    this.colorModeSelect = this.getElement<HTMLSelectElement>('colorMode');
    this.boundaryModeSelect = this.getElement<HTMLSelectElement>('boundaryMode');
    this.showVelocityCheckbox = this.getElement<HTMLInputElement>('showVelocity');
    this.disableStickingCheckbox = this.getElement<HTMLInputElement>('disableSticking');
    this.separateCollisionCheckbox = this.getElement<HTMLInputElement>('separateCollision');
    this.adaptiveTimeStepsCheckbox = this.getElement<HTMLInputElement>('adaptiveTimeSteps');
    this.useLODCheckbox = this.getElement<HTMLInputElement>('useLOD');
    this.parallelCollisionCheckbox = this.getElement<HTMLInputElement>('parallelCollision');
    this.barnesHutCheckbox = this.getElement<HTMLInputElement>('barnesHut');
    this.brightnessSlider = this.getElement<HTMLInputElement>('brightness');

    this.canvas = this.getElement<HTMLCanvasElement>('canvas');
  }

  /**
   * Initialize the GUI controller and bind all event listeners
   * Validates: Requirements 9.7, 9.8
   */
  initialize(): void {
    this.bindEventListeners();
    this.updateButtonStates();
    this.updateStatistics();
    
    // Start periodic update of statistics
    setInterval(() => this.updateStatistics(), 100);
  }

  /**
   * Bind all event listeners to UI elements
   */
  private bindEventListeners(): void {
    // Button events
    this.playButton.addEventListener('click', () => this.onPlayClick());
    this.pauseButton.addEventListener('click', () => this.onPauseClick());
    this.resetButton.addEventListener('click', () => this.onResetClick());
    this.toggleInjectionButton.addEventListener('click', () => this.onToggleInjectionClick());

    // Slider events
    this.spawnRateSlider.addEventListener('input', () => 
      this.onSpawnRateChange(parseFloat(this.spawnRateSlider.value))
    );
    this.maxParticlesInput.addEventListener('input', () => 
      this.onMaxParticlesChange(parseInt(this.maxParticlesInput.value))
    );
    this.massMinSlider.addEventListener('input', () => 
      this.onMassRangeChange()
    );
    this.massMaxSlider.addEventListener('input', () => 
      this.onMassRangeChange()
    );
    this.energyMinSlider.addEventListener('input', () => 
      this.onEnergyRangeChange()
    );
    this.energyMaxSlider.addEventListener('input', () => 
      this.onEnergyRangeChange()
    );
    this.elasticitySlider.addEventListener('input', () => 
      this.onElasticityChange(parseFloat(this.elasticitySlider.value))
    );
    this.accuracySlider.addEventListener('input', () => 
      this.onAccuracyChange(parseInt(this.accuracySlider.value))
    );
    this.timeScaleSlider.addEventListener('input', () => 
      this.onTimeScaleChange(parseFloat(this.timeScaleSlider.value))
    );
    this.brightnessSlider.addEventListener('input', () => 
      this.onBrightnessChange(parseFloat(this.brightnessSlider.value))
    );

    // Select events
    this.colorModeSelect.addEventListener('change', () => 
      this.onColorModeChange(this.colorModeSelect.value)
    );
    this.boundaryModeSelect.addEventListener('change', () => 
      this.onBoundaryModeChange(this.boundaryModeSelect.value as 'bounce' | 'wrap')
    );
    
    // Checkbox events
    this.showVelocityCheckbox.addEventListener('change', () => 
      this.onShowVelocityChange(this.showVelocityCheckbox.checked)
    );
    this.disableStickingCheckbox.addEventListener('change', () => 
      this.onDisableStickingChange(this.disableStickingCheckbox.checked)
    );
    this.separateCollisionCheckbox.addEventListener('change', () => 
      this.onSeparateCollisionChange(this.separateCollisionCheckbox.checked)
    );
    this.adaptiveTimeStepsCheckbox.addEventListener('change', () => 
      this.onAdaptiveTimeStepsChange(this.adaptiveTimeStepsCheckbox.checked)
    );
    this.useLODCheckbox.addEventListener('change', () => 
      this.onUseLODChange(this.useLODCheckbox.checked)
    );
    this.parallelCollisionCheckbox.addEventListener('change', () => 
      this.onParallelCollisionChange(this.parallelCollisionCheckbox.checked)
    );
    this.barnesHutCheckbox.addEventListener('change', () => 
      this.onBarnesHutChange(this.barnesHutCheckbox.checked)
    );

    // Note: Camera controls are handled by OrbitControls in the Camera class
    // No need for manual mouse event handling here
  }

  /**
   * Handle play button click
   * Validates: Requirements 9.5, 9.7
   */
  private onPlayClick(): void {
    this.simulationEngine.start();
    this.updateButtonStates();
  }

  /**
   * Handle pause button click
   * Validates: Requirements 9.5, 9.7
   */
  private onPauseClick(): void {
    this.simulationEngine.pause();
    this.updateButtonStates();
  }

  /**
   * Handle reset button click
   * Validates: Requirements 9.6, 9.7
   */
  private onResetClick(): void {
    this.simulationEngine.reset();
    this.updateButtonStates();
    this.updateStatistics();
  }

  /**
   * Handle toggle injection button click
   */
  private onToggleInjectionClick(): void {
    if (this.particleManager.isInjectionEnabled()) {
      this.particleManager.disableInjection();
      this.toggleInjectionButton.textContent = 'Injektion starten';
    } else {
      this.particleManager.enableInjection();
      this.toggleInjectionButton.textContent = 'Injektion stoppen';
    }
  }

  /**
   * Handle spawn rate change
   * Validates: Requirements 9.2, 9.7
   * @param value - New spawn rate value
   */
  private onSpawnRateChange(value: number): void {
    this.particleManager.config.spawnRate = value;
    this.spawnRateValue.textContent = value.toFixed(1);
  }

  /**
   * Handle max particles change
   * Validates: Requirement 9.7
   * @param value - New max particles value
   */
  private onMaxParticlesChange(value: number): void {
    // Enforce minimum of 2 particles if not unlimited (0)
    if (value > 0 && value < 2) {
      value = 2;
      this.maxParticlesInput.value = '2';
    }
    this.particleManager.config.maxParticles = value;
    this.updateStatistics();
  }

  /**
   * Handle mass range change
   * Validates: Requirement 9.7
   */
  private onMassRangeChange(): void {
    const min = parseFloat(this.massMinSlider.value);
    const max = parseFloat(this.massMaxSlider.value);

    // Ensure min <= max
    if (min > max) {
      this.massMinSlider.value = max.toString();
      this.massMinValue.textContent = max.toFixed(1);
      this.particleManager.config.massRange = [max, max];
    } else {
      this.massMinValue.textContent = min.toFixed(1);
      this.massMaxValue.textContent = max.toFixed(1);
      this.particleManager.config.massRange = [min, max];
    }
  }

  /**
   * Handle energy range change
   * Validates: Requirement 9.7
   */
  private onEnergyRangeChange(): void {
    const min = parseFloat(this.energyMinSlider.value);
    const max = parseFloat(this.energyMaxSlider.value);

    // Ensure min <= max
    if (min > max) {
      this.energyMinSlider.value = max.toString();
      this.energyMinValue.textContent = max.toString();
      this.particleManager.config.energyRange = [max, max];
    } else {
      this.energyMinValue.textContent = min.toString();
      this.energyMaxValue.textContent = max.toString();
      this.particleManager.config.energyRange = [min, max];
    }
  }

  /**
   * Handle elasticity change
   * Validates: Requirements 9.3, 9.7
   * @param value - New elasticity value
   */
  private onElasticityChange(value: number): void {
    this.physicsEngine.setElasticity(value);
    this.elasticityValue.textContent = value.toFixed(2);
  }

  /**
   * Handle accuracy change
   * Validates: Requirement 9.7
   * @param value - New accuracy steps value
   */
  private onAccuracyChange(value: number): void {
    this.simulationEngine.setAccuracySteps(value);
    this.accuracyValue.textContent = value.toString();
  }

  /**
   * Handle time scale change
   * Validates: Requirement 9.7
   * @param value - New time scale value
   */
  private onTimeScaleChange(value: number): void {
    this.simulationEngine.setTimeScale(value);
    this.timeScaleValue.textContent = value.toFixed(1) + 'x';
  }

  /**
   * Handle brightness change
   * @param value - New brightness value
   */
  private onBrightnessChange(value: number): void {
    this.renderer.setBrightness(value);
    this.brightnessValue.textContent = value.toFixed(1) + 'x';
  }

  /**
   * Handle color mode change
   * Validates: Requirement 9.7
   * @param mode - New color mode
   */
  private onColorModeChange(mode: string): void {
    if (mode === 'mass' || mode === 'velocity' || mode === 'energy' || mode === 'age') {
      this.renderer.setColorMode(mode);
    }
  }

  /**
   * Handle boundary mode change
   * @param mode - New boundary mode ('bounce' or 'wrap')
   */
  private onBoundaryModeChange(mode: 'bounce' | 'wrap'): void {
    this.particleManager.setBoundaryMode(mode);
    console.log('Boundary mode:', mode === 'bounce' ? 'Abprallen' : 'Durchgang (Wrap-around)');
  }

  /**
   * Handle show velocity vectors change
   * Validates: Requirement 9.7
   * @param show - Whether to show velocity vectors
   */
  private onShowVelocityChange(show: boolean): void {
    this.renderer.setShowVelocityVectors(show);
  }

  /**
   * Handle disable sticking checkbox change
   * @param disable - Whether to disable particle sticking
   */
  private onDisableStickingChange(disable: boolean): void {
    this.simulationEngine.setDisableSticking(disable);
  }

  /**
   * Handle separate collision checkbox change
   * @param separate - Whether to physically separate overlapping entities on collision
   */
  private onSeparateCollisionChange(separate: boolean): void {
    this.physicsEngine.setSeparateOnCollision(separate);
  }

  /**
   * Handle adaptive time steps checkbox change
   * @param enable - Whether to enable adaptive time steps
   */
  private onAdaptiveTimeStepsChange(enable: boolean): void {
    this.simulationEngine.setAdaptiveTimeSteps(enable);
    console.log('Adaptive time steps:', enable ? 'enabled' : 'disabled');
  }

  /**
   * Handle LOD checkbox change
   * @param enable - Whether to enable LOD
   */
  private onUseLODChange(enable: boolean): void {
    // Check if physics engine supports LOD
    if ('setUseLOD' in this.physicsEngine) {
      (this.physicsEngine as any).setUseLOD(enable);
      console.log('LOD:', enable ? 'enabled' : 'disabled');
    }
  }

  /**
   * Handle parallel collision detection checkbox change
   * @param enable - Whether to enable parallel collision detection
   */
  private onParallelCollisionChange(enable: boolean): void {
    const collisionDetector = this.simulationEngine.getCollisionDetector();
    collisionDetector.setUseWorkers(enable);
    console.log('Parallel collision detection:', enable ? 'enabled' : 'disabled');
  }

  /**
   * Handle Barnes-Hut checkbox change
   * @param enable - Whether to enable Barnes-Hut algorithm
   */
  private onBarnesHutChange(enable: boolean): void {
    // Check if physics engine supports Barnes-Hut
    if ('setUseBarnesHut' in this.physicsEngine) {
      (this.physicsEngine as any).setUseBarnesHut(enable);
      console.log('Barnes-Hut:', enable ? 'enabled' : 'disabled');
    }
  }

  /**
   * Update button states based on simulation state
   */
  private updateButtonStates(): void {
    const isRunning = this.simulationEngine.getIsRunning();
    this.playButton.disabled = isRunning;
    this.pauseButton.disabled = !isRunning;
  }

  /**
   * Update statistics display (particle count, conglomerate count, FPS)
   * Validates: Requirement 9.8
   */
  private updateStatistics(): void {
    // Update particle counter
    const spawned = this.particleManager.getTotalParticlesSpawned();
    const max = this.particleManager.config.maxParticles;
    
    if (max === 0) {
      this.particlesSpawnedValue.textContent = `${spawned} / ∞`;
    } else {
      this.particlesSpawnedValue.textContent = `${spawned} / ${max}`;
    }

    // Calculate and display total energy (kinetic + potential)
    const entities = this.particleManager.getAllEntities();
    
    // Calculate kinetic energy
    let kineticEnergy = 0;
    for (const entity of entities) {
      kineticEnergy += entity.kineticEnergy();
    }
    
    // Calculate potential energy
    const potentialEnergy = this.physicsEngine.calculatePotentialEnergy(entities);
    
    // Total energy = kinetic + potential
    const totalEnergy = kineticEnergy + potentialEnergy;
    
    // Format with scientific notation for large numbers
    if (Math.abs(totalEnergy) >= 1000) {
      this.totalEnergyValue.textContent = totalEnergy.toExponential(2);
    } else {
      this.totalEnergyValue.textContent = totalEnergy.toFixed(2);
    }

    // Update optional statistics if elements exist
    if (this.statsParticleCount) {
      const particleCount = this.particleManager.getParticleCount();
      this.statsParticleCount.textContent = particleCount.toString();
    }

    if (this.statsConglomerateCount) {
      const conglomerateCount = this.particleManager.getConglomerateCount();
      this.statsConglomerateCount.textContent = conglomerateCount.toString();
    }

    // Update FPS
    this.updateFPS();
  }

  /**
   * Update FPS counter
   * Validates: Requirement 9.8
   */
  private updateFPS(): void {
    if (!this.statsFPS) {
      return;
    }

    const now = performance.now();
    this.frameCount++;

    // Update FPS every second
    if (now - this.lastFPSUpdate >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
      this.statsFPS.textContent = this.currentFPS.toString();
      
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }
  }

  /**
   * Notify GUI that a frame has been rendered (for FPS tracking)
   * Should be called from the simulation loop
   */
  public notifyFrameRendered(): void {
    this.frameCount++;
  }

  /**
   * Get an HTML element by ID with type checking
   * @param id - Element ID
   * @returns The element
   */
  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id "${id}" not found`);
    }
    return element as T;
  }
}
