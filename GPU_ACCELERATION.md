# GPU-Beschleunigung für Staubkorn-Simulation

## Übersicht

Die Simulation kann durch GPU-Beschleunigung massiv beschleunigt werden. Hier sind die Optionen:

## Option 1: GPU.js (Empfohlen für Einstieg)

### Installation
```bash
npm install gpu.js
```

### Beispiel: Gravitations-Berechnung auf GPU

```typescript
import { GPU } from 'gpu.js';

export class GPUPhysicsEngine {
  private gpu: GPU;
  private calculateGravityKernel: any;

  constructor() {
    this.gpu = new GPU();
    
    // Kernel für Gravitationsberechnung
    this.calculateGravityKernel = this.gpu.createKernel(function(
      positions: number[][],  // [x, y, z]
      masses: number[],
      G: number,
      epsilon: number
    ) {
      // Für jedes Partikel i
      const i = this.thread.x;
      let fx = 0, fy = 0, fz = 0;
      
      // Berechne Kraft von allen anderen Partikeln
      for (let j = 0; j < this.constants.numParticles; j++) {
        if (i === j) continue;
        
        const dx = positions[j][0] - positions[i][0];
        const dy = positions[j][1] - positions[i][1];
        const dz = positions[j][2] - positions[i][2];
        
        const distSq = dx*dx + dy*dy + dz*dz + epsilon*epsilon;
        const dist = Math.sqrt(distSq);
        
        const forceMag = G * masses[i] * masses[j] / distSq;
        
        fx += forceMag * dx / dist;
        fy += forceMag * dy / dist;
        fz += forceMag * dz / dist;
      }
      
      return [fx, fy, fz];
    }).setOutput([numParticles]);
  }
  
  calculateForces(particles: Particle[]): Vector3D[] {
    const positions = particles.map(p => [p.position.x, p.position.y, p.position.z]);
    const masses = particles.map(p => p.mass);
    
    const forces = this.calculateGravityKernel(positions, masses, 1.0, 0.01);
    
    return forces.map((f: number[]) => new Vector3D(f[0], f[1], f[2]));
  }
}
```

### Vorteile:
- ✅ 10-50x schneller als CPU
- ✅ Einfache JavaScript-Syntax
- ✅ Automatischer Fallback auf CPU

### Nachteile:
- ❌ Overhead beim Datentransfer CPU ↔ GPU
- ❌ Nicht für kleine Partikelzahlen (<100) geeignet

---

## Option 2: WebGPU (Beste Performance)

### Browser-Unterstützung prüfen
```typescript
if (!navigator.gpu) {
  console.log('WebGPU nicht unterstützt');
  // Fallback auf CPU
}
```

### Beispiel: Compute Shader (WGSL)

```wgsl
// gravity.wgsl
struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  mass: f32,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> forces: array<vec3<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let i = global_id.x;
  if (i >= arrayLength(&particles)) {
    return;
  }
  
  var force = vec3<f32>(0.0, 0.0, 0.0);
  let pi = particles[i];
  
  for (var j = 0u; j < arrayLength(&particles); j++) {
    if (i == j) {
      continue;
    }
    
    let pj = particles[j];
    let delta = pj.position - pi.position;
    let distSq = dot(delta, delta) + 0.01;
    let dist = sqrt(distSq);
    
    let forceMag = 1.0 * pi.mass * pj.mass / distSq;
    force += forceMag * delta / dist;
  }
  
  forces[i] = force;
}
```

### TypeScript Integration:
```typescript
export class WebGPUPhysicsEngine {
  private device: GPUDevice;
  private pipeline: GPUComputePipeline;
  
  async initialize() {
    const adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();
    
    const shaderModule = this.device.createShaderModule({
      code: await fetch('gravity.wgsl').then(r => r.text())
    });
    
    this.pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main'
      }
    });
  }
  
  async computeForces(particles: Particle[]): Promise<Vector3D[]> {
    // Buffer erstellen und Daten hochladen
    const particleBuffer = this.device.createBuffer({
      size: particles.length * 32, // 8 floats per particle
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    
    // ... Compute Pass ausführen ...
    
    return forces;
  }
}
```

### Vorteile:
- ✅ 100x+ schneller als CPU
- ✅ Tausende von Partikeln möglich
- ✅ Volle GPU-Kontrolle

### Nachteile:
- ❌ Komplexe Implementierung
- ❌ Noch nicht in allen Browsern
- ❌ Shader-Programmierung erforderlich

---

## Option 3: Three.js GPUComputationRenderer

### Beispiel:
```typescript
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';

export class ThreeGPUPhysics {
  private gpuCompute: GPUComputationRenderer;
  private positionVariable: any;
  private velocityVariable: any;
  
  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.gpuCompute = new GPUComputationRenderer(width, height, renderer);
    
    // Position Texture
    const dtPosition = this.gpuCompute.createTexture();
    this.fillPositionTexture(dtPosition);
    
    // Velocity Texture
    const dtVelocity = this.gpuCompute.createTexture();
    this.fillVelocityTexture(dtVelocity);
    
    // Shader für Position-Update
    this.positionVariable = this.gpuCompute.addVariable(
      'texturePosition',
      positionShader,
      dtPosition
    );
    
    // Shader für Velocity-Update
    this.velocityVariable = this.gpuCompute.addVariable(
      'textureVelocity',
      velocityShader,
      dtVelocity
    );
    
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
      this.velocityVariable
    ]);
    
    this.gpuCompute.init();
  }
  
  update() {
    this.gpuCompute.compute();
    
    // Ergebnisse zurück zur CPU holen (optional)
    const positions = this.gpuCompute.getCurrentRenderTarget(
      this.positionVariable
    ).texture;
  }
}
```

### Vorteile:
- ✅ Integration mit Three.js
- ✅ Gut für Partikel-Systeme
- ✅ Beispiele verfügbar

### Nachteile:
- ❌ WebGL 2.0 erforderlich
- ❌ Texture-basiert (limitiert auf 4096x4096 Partikel)

---

## Performance-Vergleich

| Methode | Partikel | FPS (geschätzt) | Komplexität |
|---------|----------|-----------------|-------------|
| CPU (aktuell) | 100 | 60 | ⭐ |
| CPU (aktuell) | 1000 | 10 | ⭐ |
| GPU.js | 1000 | 60 | ⭐⭐ |
| GPU.js | 10000 | 30 | ⭐⭐ |
| WebGPU | 10000 | 60 | ⭐⭐⭐⭐ |
| WebGPU | 100000 | 30 | ⭐⭐⭐⭐ |

---

## Implementierungs-Roadmap

### Phase 1: GPU.js Integration (1-2 Tage)
1. GPU.js installieren
2. Gravitations-Kernel implementieren
3. Kollisions-Kernel implementieren
4. Performance-Tests

### Phase 2: Optimierung (1 Tag)
1. Batch-Processing
2. Datentransfer minimieren
3. Spatial Hashing auf GPU

### Phase 3: WebGPU Migration (Optional, 3-5 Tage)
1. WebGPU-Support prüfen
2. Compute Shaders schreiben
3. Pipeline aufbauen
4. Fallback auf GPU.js/CPU

---

## Wann lohnt sich GPU?

**GPU lohnt sich ab:**
- ✅ >200 Partikel (GPU.js)
- ✅ >1000 Partikel (WebGPU)
- ✅ Komplexe Berechnungen (N² Gravitation)

**GPU lohnt sich NICHT bei:**
- ❌ <100 Partikel (Overhead zu groß)
- ❌ Einfache Berechnungen
- ❌ Viele Konglomerate (komplexe Datenstrukturen)

---

## Nächste Schritte

### Sofort umsetzbar:
```bash
npm install gpu.js
```

Dann in `PhysicsEngine.ts`:
```typescript
import { GPU } from 'gpu.js';

// GPU-Kernel für Gravitation
// Speedup: 10-50x
```

### Möchtest du, dass ich das implementiere?

Ich kann:
1. GPU.js Integration für Gravitation
2. Performance-Vergleich CPU vs GPU
3. Automatischer Fallback bei GPU-Fehler
4. UI-Toggle für GPU on/off
