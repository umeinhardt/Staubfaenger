# WebGPU Physics Implementation

## Overview

The WebGPU physics engine provides GPU-accelerated gravitational force calculations using modern WebGPU Compute Shaders. This implementation builds on top of the existing Web Workers optimization to provide maximum performance.

## Architecture

### Hybrid Approach

The `WebGPUPhysicsEngine` extends `ParallelPhysicsEngine` and uses a hybrid approach:

1. **WebGPU Compute Shaders** - For particle-particle gravity (>200 particles)
2. **Web Workers** - Fallback when GPU is unavailable or disabled
3. **CPU** - For conglomerates and particle-conglomerate interactions

### Performance Thresholds

- **GPU Threshold**: 200 particles (configurable)
  - Below threshold: Uses Web Workers
  - Above threshold: Uses GPU for particles, CPU for conglomerates

- **Worker Threshold**: 50 entities (inherited from ParallelPhysicsEngine)
  - Below threshold: Single-threaded CPU
  - Above threshold: Multi-threaded Web Workers

## Implementation Details

### WebGPU Compute Shader (WGSL)

The compute shader calculates gravitational forces in parallel on the GPU:

```wgsl
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Each thread processes one particle
  let i = global_id.x;
  
  // Calculate force from all other particles
  for (var j = 0u; j < params.numParticles; j++) {
    // F = G * m1 * m2 / r^2
    // Accumulate forces
  }
}
```

### Key Features

1. **Automatic Fallback**
   - Detects WebGPU support at initialization
   - Falls back to Web Workers if GPU unavailable
   - Graceful degradation on errors

2. **Efficient Memory Management**
   - Creates GPU buffers for positions, masses, forces
   - Reads back results after computation
   - Cleans up buffers after each frame

3. **Hybrid Processing**
   - GPU handles particle-particle interactions
   - CPU handles conglomerate physics
   - CPU handles particle-conglomerate interactions

4. **User Control**
   - UI checkbox to enable/disable GPU
   - Console logging of GPU status
   - Real-time toggling without restart

## Usage

### Initialization

```typescript
const physicsEngine = new WebGPUPhysicsEngine(gravityFormula, elasticity);
await physicsEngine.initialize(); // Initialize WebGPU and workers

console.log('GPU:', physicsEngine.isUsingGPU());
console.log('Workers:', physicsEngine.isUsingWorkers());
```

### Runtime Control

```typescript
// Enable/disable GPU at runtime
physicsEngine.setUseGPU(true);  // Enable GPU
physicsEngine.setUseGPU(false); // Disable GPU (use workers)

// Adjust GPU threshold
physicsEngine.setGPUThreshold(300); // Use GPU only if >300 particles
```

### UI Integration

The GPU toggle checkbox is located in the controls panel:

```html
<input type="checkbox" id="useGPU" checked>
```

## Performance Characteristics

### Expected Speedup

- **Small simulations (<200 particles)**: Web Workers (2-4x speedup)
- **Medium simulations (200-1000 particles)**: GPU (5-10x speedup)
- **Large simulations (>1000 particles)**: GPU (10-50x speedup)

### Overhead Considerations

- GPU has initialization overhead (~100ms)
- GPU has per-frame buffer creation/destruction overhead
- GPU is most efficient with large particle counts
- Web Workers are more efficient for small counts

## Browser Compatibility

### WebGPU Support

- **Chrome/Edge**: Version 113+ (May 2023)
- **Firefox**: Experimental support (behind flag)
- **Safari**: Not yet supported

### Fallback Behavior

If WebGPU is not available:
1. Attempts to use Web Workers (multi-threaded CPU)
2. Falls back to single-threaded CPU if workers fail
3. User is notified via console logs

## Technical Notes

### Asynchronous GPU Computation

WebGPU compute operations are asynchronous, but the physics loop is synchronous. The implementation handles this by:

1. Starting GPU computation without waiting
2. Applying forces from previous frame's results
3. Catching errors and falling back to CPU

This introduces a 1-frame latency but maintains smooth performance.

### Memory Layout

GPU buffers use the following layout:

- **Positions**: `vec4<f32>` (xyz + padding)
- **Masses**: `f32`
- **Forces**: `vec4<f32>` (xyz + padding)
- **Parameters**: `struct { G, epsilon, numParticles, padding }`

### Workgroup Size

The compute shader uses a workgroup size of 64 threads:

```wgsl
@workgroup_size(64)
```

This is a good balance for most GPUs. The number of workgroups is calculated as:

```typescript
const workgroupCount = Math.ceil(numParticles / 64);
```

## Debugging

### Console Logs

The engine logs its status at initialization:

```
WebGPU Physics Engine: GPU Compute enabled
WebGPU Physics: Enabled
Web Workers: Enabled
```

Or if GPU is unavailable:

```
WebGPU not supported, using Web Workers
WebGPU Physics: Disabled (using Web Workers)
Web Workers: Enabled
```

### Common Issues

1. **GPU not detected**: Check browser version and WebGPU support
2. **Performance worse than before**: Try disabling GPU (use workers only)
3. **Errors in console**: GPU may have failed, check fallback behavior

## Future Improvements

Potential optimizations:

1. **Persistent GPU buffers**: Reuse buffers across frames
2. **Compute pipeline caching**: Cache compiled shaders
3. **Spatial partitioning on GPU**: Implement spatial hash on GPU
4. **Collision detection on GPU**: Move collision detection to GPU
5. **Double buffering**: Use ping-pong buffers for better pipelining

## Comparison with Previous GPU Implementation

### Old Implementation (WebGL)

- Used WebGL Compute Shaders (less efficient)
- Made CPU performance worse when GPU was disabled
- No proper fallback mechanism
- **Result**: Rolled back due to performance regression

### New Implementation (WebGPU)

- Uses modern WebGPU API (more efficient)
- Extends existing Web Workers implementation
- Proper fallback chain: GPU → Workers → CPU
- No performance regression when GPU is disabled
- **Result**: Integrated successfully

## References

- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [WGSL Specification](https://www.w3.org/TR/WGSL/)
- [WebGPU Samples](https://webgpu.github.io/webgpu-samples/)
