# Manual Testing Guide - WebGPU Performance Optimization

This guide helps you manually verify all WebGPU performance optimization features implemented in the spec.

## Prerequisites

1. **Browser Requirements:**
   - Chrome/Edge 113+ or Firefox 121+ (for WebGPU support)
   - Enable WebGPU if needed: `chrome://flags/#enable-unsafe-webgpu`

2. **Start the Application:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 (or the port shown in terminal)

---

## Test Suite 1: Physics Engine Selection & Initialization

### Test 1.1: WebGPU Detection
**Goal:** Verify WebGPU is detected and initialized

**Steps:**
1. Open browser DevTools (F12) → Console tab
2. Refresh the page
3. Look for initialization messages

**Expected Results:**
- ✅ Console shows: `"WebGPU Physics: Enabled"` (if WebGPU available)
- ✅ OR: `"Physics: Using Web Workers"` (if WebGPU unavailable)
- ✅ No errors during initialization

**Pass/Fail:** ___________

---

### Test 1.2: GPU Threshold Behavior
**Goal:** Verify physics engine switches based on particle count

**Steps:**
1. Open the simulation
2. Set spawn rate to 5 particles/sec
3. Watch the console as particles spawn
4. Note when particle count crosses 200

**Expected Results:**
- ✅ With < 200 particles: CPU physics is used
- ✅ With ≥ 200 particles: GPU physics activates (if available)
- ✅ Console logs the switch: `"Switched to gpu physics"`

**Pass/Fail:** ___________

---

### Test 1.3: Fallback to CPU
**Goal:** Verify graceful fallback when GPU unavailable

**Steps:**
1. Open in a browser without WebGPU support (or disable it)
2. Refresh the page
3. Check console messages

**Expected Results:**
- ✅ Console shows: `"WebGPU initialization failed"` or similar warning
- ✅ Followed by: `"Physics: Using Web Workers"` or `"Physics: Using CPU only"`
- ✅ Simulation still runs smoothly

**Pass/Fail:** ___________

---

## Test Suite 2: Physics Engine Switching

### Test 2.1: Runtime Engine Switching
**Goal:** Verify you can switch physics engines while simulation runs

**Steps:**
1. Start simulation with particles spawning
2. Open browser console
3. Run: `window.simulationEngine.switchPhysicsEngine('cpu')`
4. Wait 2 seconds
5. Run: `window.simulationEngine.switchPhysicsEngine('gpu')`

**Expected Results:**
- ✅ Console shows: `"Switched to cpu physics"`
- ✅ Then: `"Switched to gpu physics"`
- ✅ Simulation continues without interruption
- ✅ Particles maintain their positions and velocities

**Pass/Fail:** ___________

---

### Test 2.2: State Preservation During Switch
**Goal:** Verify simulation state is preserved when switching engines

**Steps:**
1. Spawn 50 particles
2. Pause simulation
3. Note positions of a few particles (visually)
4. Switch physics engine (see Test 2.1)
5. Resume simulation

**Expected Results:**
- ✅ Particles remain in same positions after switch
- ✅ Velocities are preserved (particles continue moving in same direction)
- ✅ No particles disappear or duplicate

**Pass/Fail:** ___________

---

## Test Suite 3: Instanced Rendering

### Test 3.1: Instanced Rendering Toggle
**Goal:** Verify instanced rendering can be toggled

**Steps:**
1. Spawn 100+ particles
2. Open browser console
3. Check FPS: Note current frame rate
4. Run: `window.simulationEngine.setInstancedRendering(true)`
5. Wait 5 seconds, note FPS
6. Run: `window.simulationEngine.setInstancedRendering(false)`
7. Wait 5 seconds, note FPS

**Expected Results:**
- ✅ With instanced rendering ON: Higher FPS (or same if already optimal)
- ✅ With instanced rendering OFF: Lower FPS with many particles
- ✅ Visual appearance remains identical
- ✅ No rendering glitches

**Pass/Fail:** ___________

---

### Test 3.2: Draw Call Reduction
**Goal:** Verify instanced rendering reduces draw calls

**Steps:**
1. Open DevTools → Performance tab
2. Start recording
3. Enable instanced rendering
4. Spawn 200 particles
5. Stop recording after 5 seconds
6. Analyze the flame chart

**Expected Results:**
- ✅ Fewer WebGL draw calls visible in performance timeline
- ✅ Rendering time per frame is reduced
- ✅ GPU utilization is more efficient

**Pass/Fail:** ___________

---

## Test Suite 4: GPU-CPU Equivalence

### Test 4.1: Physics Consistency
**Goal:** Verify GPU and CPU physics produce same results

**Steps:**
1. Reset simulation
2. Set spawn rate to 0 (no new particles)
3. Manually spawn 10 particles in specific positions
4. Run with CPU physics for 10 seconds
5. Note final positions of particles
6. Reset and repeat with same initial conditions
7. Run with GPU physics for 10 seconds
8. Compare final positions

**Expected Results:**
- ✅ Final positions are very similar (within 1% tolerance)
- ✅ Collision behavior is identical
- ✅ No particles "escape" or behave differently

**Pass/Fail:** ___________

---

## Test Suite 5: Performance Benchmarks

### Test 5.1: Run Benchmark Suite
**Goal:** Verify benchmark system works

**Steps:**
1. Open browser console
2. Run: `window.benchmark.runBenchmarkSuite()`
3. Wait for completion (may take 1-2 minutes)
4. Check console output

**Expected Results:**
- ✅ Benchmark completes without errors
- ✅ Results show FPS for different particle counts
- ✅ Results show comparison between CPU and GPU (if available)
- ✅ Performance report is generated

**Pass/Fail:** ___________

---

### Test 5.2: Export Benchmark Results
**Goal:** Verify benchmark results can be exported

**Steps:**
1. Run benchmark suite (see Test 5.1)
2. After completion, run: `window.benchmark.exportToJSON()`
3. Check Downloads folder
4. Open the JSON file

**Expected Results:**
- ✅ JSON file is downloaded
- ✅ File contains benchmark results with timestamps
- ✅ Data includes FPS, particle counts, and engine types
- ✅ File is valid JSON (can be opened in text editor)

**Pass/Fail:** ___________

---

### Test 5.3: CSV Export
**Goal:** Verify CSV export works

**Steps:**
1. Run benchmark suite
2. Run: `window.benchmark.exportToCSV()`
3. Check Downloads folder
4. Open CSV in Excel/Sheets

**Expected Results:**
- ✅ CSV file is downloaded
- ✅ File has proper headers (Particle Count, FPS, Engine Type, etc.)
- ✅ Data is properly formatted
- ✅ Can be imported into spreadsheet software

**Pass/Fail:** ___________

---

## Test Suite 6: Error Handling

### Test 6.1: GPU Initialization Failure
**Goal:** Verify graceful handling of GPU errors

**Steps:**
1. Disable WebGPU in browser flags
2. Restart browser
3. Open simulation
4. Check console

**Expected Results:**
- ✅ Warning message appears: `"WebGPU initialization failed"`
- ✅ Simulation falls back to CPU/Workers
- ✅ No crashes or blank screens
- ✅ User can still interact with simulation

**Pass/Fail:** ___________

---

### Test 6.2: Invalid Configuration
**Goal:** Verify error handling for invalid settings

**Steps:**
1. Open console
2. Try: `window.simulationEngine.setGPUThreshold(-100)`
3. Try: `window.simulationEngine.setTimeScale(-5)`
4. Try: `window.simulationEngine.setAccuracySteps(0)`

**Expected Results:**
- ✅ Each command throws appropriate error
- ✅ Error messages are clear and descriptive
- ✅ Simulation continues running normally
- ✅ Invalid values are rejected

**Pass/Fail:** ___________

---

## Test Suite 7: Preference Persistence

### Test 7.1: Save Preferences
**Goal:** Verify preferences are saved to localStorage

**Steps:**
1. Enable GPU physics
2. Enable instanced rendering
3. Set GPU threshold to 150
4. Close browser tab
5. Reopen simulation in new tab

**Expected Results:**
- ✅ GPU physics is still enabled
- ✅ Instanced rendering is still enabled
- ✅ GPU threshold is 150
- ✅ Settings persist across sessions

**Pass/Fail:** ___________

---

### Test 7.2: Clear Preferences
**Goal:** Verify preferences can be reset

**Steps:**
1. Set custom preferences (see Test 7.1)
2. Open console
3. Run: `localStorage.clear()`
4. Refresh page

**Expected Results:**
- ✅ Settings return to defaults
- ✅ GPU preference: true
- ✅ GPU threshold: 200
- ✅ Instanced rendering: false (default)

**Pass/Fail:** ___________

---

## Test Suite 8: Integration Tests

### Test 8.1: Complete Workflow
**Goal:** Verify entire system works end-to-end

**Steps:**
1. Start simulation
2. Spawn 300 particles (crosses GPU threshold)
3. Enable instanced rendering
4. Let simulation run for 30 seconds
5. Run benchmark
6. Export results
7. Switch to CPU physics
8. Continue simulation

**Expected Results:**
- ✅ All features work together smoothly
- ✅ No performance degradation
- ✅ No memory leaks (check DevTools Memory tab)
- ✅ FPS remains stable

**Pass/Fail:** ___________

---

### Test 8.2: Stress Test
**Goal:** Verify system handles high particle counts

**Steps:**
1. Set spawn rate to 20 particles/sec
2. Enable GPU physics
3. Enable instanced rendering
4. Let run until 500+ particles
5. Monitor FPS and memory

**Expected Results:**
- ✅ FPS remains above 30 (acceptable performance)
- ✅ No crashes or freezes
- ✅ Memory usage is reasonable (< 500MB)
- ✅ Simulation remains responsive

**Pass/Fail:** ___________

---

## Test Suite 9: Visual Verification

### Test 9.1: Rendering Quality
**Goal:** Verify visual quality is maintained

**Steps:**
1. Spawn 100 particles
2. Toggle instanced rendering on/off
3. Compare visual appearance

**Expected Results:**
- ✅ Particles look identical in both modes
- ✅ Colors are correct
- ✅ No flickering or artifacts
- ✅ Smooth animation in both modes

**Pass/Fail:** ___________

---

### Test 9.2: Collision Visualization
**Goal:** Verify collisions are visible and correct

**Steps:**
1. Spawn 50 particles
2. Watch for collisions
3. Verify particles merge into conglomerates

**Expected Results:**
- ✅ Collisions are detected
- ✅ Particles merge smoothly
- ✅ Conglomerates rotate correctly
- ✅ No particles overlap incorrectly

**Pass/Fail:** ___________

---

## Summary

**Total Tests:** 23
**Passed:** ___________
**Failed:** ___________
**Pass Rate:** ___________%

### Critical Issues Found:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

### Notes:
___________________________________________
___________________________________________
___________________________________________

---

## Quick Reference: Console Commands

```javascript
// Check current physics mode
window.simulationEngine.getPhysicsMode()

// Switch physics engine
window.simulationEngine.switchPhysicsEngine('gpu')  // or 'cpu', 'workers'

// Toggle instanced rendering
window.simulationEngine.setInstancedRendering(true)

// Set GPU threshold
window.simulationEngine.setGPUThreshold(150)

// Run benchmarks
window.benchmark.runBenchmarkSuite()

// Export results
window.benchmark.exportToJSON()
window.benchmark.exportToCSV()

// Check FPS
window.simulationEngine.getCurrentFPS()
window.simulationEngine.getAverageFPS()

// Get particle count
window.simulationEngine.getParticleManager().getEntityCount()
```

---

## Browser Compatibility Checklist

Test in multiple browsers:

- [ ] Chrome 113+ (WebGPU supported)
- [ ] Edge 113+ (WebGPU supported)
- [ ] Firefox 121+ (WebGPU supported)
- [ ] Safari (fallback to CPU - WebGPU not yet supported)

---

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| FPS with 100 particles (CPU) | > 60 | _____ |
| FPS with 100 particles (GPU) | > 60 | _____ |
| FPS with 500 particles (CPU) | > 30 | _____ |
| FPS with 500 particles (GPU) | > 60 | _____ |
| Memory usage (500 particles) | < 500MB | _____ |
| Benchmark suite completion | < 2 min | _____ |

---

**Tester Name:** ___________________________________________
**Date:** ___________________________________________
**Browser:** ___________________________________________
**OS:** ___________________________________________
**WebGPU Available:** Yes / No
