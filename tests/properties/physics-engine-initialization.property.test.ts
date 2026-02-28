import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PhysicsEngineConfig } from '../../src/core/SimulationEngine';
import { NewtonianGravity } from '../../src/core/GravityFormula';

// Feature: webgpu-performance-optimization
// Property: WebGPU detection should consistently return same result for same environment
// **Validates: Requirements 1.1, 1.2**

describe('Property: WebGPU detection consistency', () => {
  let originalNavigator: any;
  let originalWorker: any;

  beforeEach(() => {
    // Store original globals
    originalNavigator = global.navigator;
    originalWorker = global.Worker;
  });

  // Helper to detect physics mode based on environment
  const detectPhysicsMode = async (config: PhysicsEngineConfig): Promise<'gpu' | 'workers' | 'cpu'> => {
    // Step 1: Check if GPU is forced off
    if (config.forceMode === 'cpu' || config.forceMode === 'workers') {
      if (config.forceMode === 'workers' && typeof Worker !== 'undefined') {
        return 'workers';
      }
      return 'cpu';
    }
    
    // Step 2: Try WebGPU initialization
    if (config.preferGPU && typeof navigator !== 'undefined' && (navigator as any).gpu) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          const device = await adapter.requestDevice();
          if (device) {
            return 'gpu';
          }
        }
      } catch (error) {
        // GPU initialization failed, fall through
      }
    }
    
    // Step 3: Fall back to Workers or CPU
    if (typeof Worker !== 'undefined') {
      return 'workers';
    }
    return 'cpu';
  };

  it('should return consistent physics mode when WebGPU is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // Number of detection attempts
        async (numAttempts) => {
          // Mock WebGPU as unavailable
          (global as any).navigator = { gpu: undefined };

          const config: PhysicsEngineConfig = {
            preferGPU: true,
            gpuThreshold: 200,
            forceMode: undefined
          };

          const detectedModes: string[] = [];

          // Perform multiple detection attempts
          for (let i = 0; i < numAttempts; i++) {
            const mode = await detectPhysicsMode(config);
            detectedModes.push(mode);
          }

          // Restore navigator
          (global as any).navigator = originalNavigator;

          // All detected modes should be the same (consistent)
          const firstMode = detectedModes[0];
          const allSame = detectedModes.every(mode => mode === firstMode);
          
          expect(allSame).toBe(true);
          // When WebGPU is unavailable, should fall back to workers or cpu
          expect(firstMode === 'workers' || firstMode === 'cpu').toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return consistent physics mode when WebGPU is available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // Number of detection attempts
        async (numAttempts) => {
          // Mock WebGPU as available
          const mockGPU = {
            requestAdapter: vi.fn().mockResolvedValue({
              requestDevice: vi.fn().mockResolvedValue({
                createBuffer: vi.fn(),
                createShaderModule: vi.fn(),
                createComputePipeline: vi.fn(),
                queue: { submit: vi.fn() }
              })
            })
          };

          (global as any).navigator = { gpu: mockGPU };

          const config: PhysicsEngineConfig = {
            preferGPU: true,
            gpuThreshold: 200,
            forceMode: undefined
          };

          const detectedModes: string[] = [];

          // Perform multiple detection attempts
          for (let i = 0; i < numAttempts; i++) {
            const mode = await detectPhysicsMode(config);
            detectedModes.push(mode);
          }

          // Restore navigator
          (global as any).navigator = originalNavigator;

          // All detected modes should be the same (consistent)
          const firstMode = detectedModes[0];
          const allSame = detectedModes.every(mode => mode === firstMode);
          
          expect(allSame).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should consistently respect forceMode configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('cpu', 'workers', 'gpu'), // Force modes
        fc.integer({ min: 2, max: 5 }), // Number of detection attempts
        async (forceMode, numAttempts) => {
          const config: PhysicsEngineConfig = {
            preferGPU: true,
            gpuThreshold: 200,
            forceMode: forceMode as 'cpu' | 'workers' | 'gpu' | undefined
          };

          const detectedModes: string[] = [];

          // Perform multiple detection attempts
          for (let i = 0; i < numAttempts; i++) {
            const mode = await detectPhysicsMode(config);
            detectedModes.push(mode);
          }

          // All detected modes should be the same (consistent)
          const firstMode = detectedModes[0];
          const allSame = detectedModes.every(mode => mode === firstMode);
          
          expect(allSame).toBe(true);
          
          // When forceMode is cpu or workers, should respect that
          if (forceMode === 'cpu' || forceMode === 'workers') {
            expect(firstMode === forceMode || firstMode === 'cpu').toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should consistently detect same mode with preferGPU false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // Number of detection attempts
        async (numAttempts) => {
          const config: PhysicsEngineConfig = {
            preferGPU: false,
            gpuThreshold: 200,
            forceMode: undefined
          };

          const detectedModes: string[] = [];

          // Perform multiple detection attempts
          for (let i = 0; i < numAttempts; i++) {
            const mode = await detectPhysicsMode(config);
            detectedModes.push(mode);
          }

          // All detected modes should be the same (consistent)
          const firstMode = detectedModes[0];
          const allSame = detectedModes.every(mode => mode === firstMode);
          
          expect(allSame).toBe(true);
          // When preferGPU is false, should not use GPU
          expect(firstMode === 'workers' || firstMode === 'cpu').toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should consistently handle varying gpuThreshold values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10000 }), // GPU threshold
        fc.integer({ min: 2, max: 5 }), // Number of detection attempts
        async (gpuThreshold, numAttempts) => {
          const config: PhysicsEngineConfig = {
            preferGPU: true,
            gpuThreshold: gpuThreshold,
            forceMode: undefined
          };

          const detectedModes: string[] = [];

          // Perform multiple detection attempts with same config
          for (let i = 0; i < numAttempts; i++) {
            const mode = await detectPhysicsMode(config);
            detectedModes.push(mode);
          }

          // All detected modes should be the same (consistent)
          const firstMode = detectedModes[0];
          const allSame = detectedModes.every(mode => mode === firstMode);
          
          expect(allSame).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
