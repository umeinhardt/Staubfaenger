# Implementation Plan: 3D Particle Aggregation Simulation

## Overview

This plan converts the existing 2D particle aggregation simulation to full 3D. The implementation follows an incremental approach, building from foundational 3D mathematics through physics, rendering, and finally integration. Each step validates correctness through property-based tests before proceeding.

**Current Status**: The codebase has a complete 2D simulation. No 3D code has been implemented yet. All tasks below represent new work to be done.

## Tasks

- [ ] 1. Implement 3D vector mathematics and quaternion rotation
  - [x] 1.1 Create Vector3D class with all 3D operations
    - Create new file `src/core/Vector3D.ts`
    - Implement constructor with x, y, z components
    - Implement add, subtract, multiply, divide operations
    - Implement magnitude, magnitudeSquared, normalize methods
    - Implement dot product and cross product operations
    - Implement distanceTo method for 3D Euclidean distance
    - Implement static methods: zero(), random()
    - Implement equals() method with epsilon comparison
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  
  - [x] 1.2 Write property tests for Vector3D operations
    - Create new file `tests/properties/vector3d.property.test.ts`
    - **Property 1: Vector addition is component-wise**
    - **Property 2: Vector subtraction is component-wise**
    - **Property 3: Scalar multiplication scales all components**
    - **Property 4: Magnitude follows Euclidean formula**
    - **Property 5: Normalization produces unit vectors**
    - **Property 6: Dot product follows formula**
    - **Property 7: Cross product is perpendicular to both inputs**
    - **Property 8: Distance follows Euclidean formula**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**
  
  - [x] 1.3 Create Quaternion class for 3D rotation
    - Create new file `src/core/Quaternion.ts`
    - Implement constructor with w, x, y, z components
    - Implement static identity() method
    - Implement static fromAxisAngle(axis: Vector3D, angle: number)
    - Implement static fromEuler(x, y, z) method
    - Implement multiply(other: Quaternion) for composition
    - Implement conjugate() method
    - Implement normalize() method
    - Implement rotateVector(v: Vector3D) to apply rotation
    - Implement toRotationMatrix() and toEuler() conversions
    - _Requirements: 4.6_
  
  - [x] 1.4 Write unit tests for Quaternion operations
    - Create new file `tests/unit/quaternion.test.ts`
    - Test identity quaternion produces no rotation
    - Test 90-degree rotations around each axis (x, y, z)
    - Test quaternion multiplication composition
    - Test normalization maintains unit length
    - Test rotateVector applies correct rotation
    - _Requirements: 4.6_

- [x] 2. Extend Particle class to 3D
  - [x] 2.1 Update Particle class for 3D space
    - Modify `src/core/Particle.ts`
    - Change position from Vector2D to Vector3D
    - Change velocity from Vector2D to Vector3D
    - Add angularVelocity as Vector3D (currently not in 2D version)
    - Update applyForce to use Vector3D
    - Add applyTorque method to use Vector3D torque
    - Update momentum() to return Vector3D
    - Add angularMomentum() method to return Vector3D
    - Update all method signatures and implementations
    - _Requirements: 2.2, 2.3, 2.9_
  
  - [x] 2.2 Write unit tests for 3D Particle
    - Update `tests/unit/particle.test.ts` (if exists) or create new file
    - Test particle creation with 3D position and velocity
    - Test force application updates velocity correctly in 3D
    - Test position updates with 3D velocity
    - Test momentum calculation in 3D
    - Test torque application and angular momentum
    - _Requirements: 2.2, 2.3, 2.9_

- [x] 3. Implement 3D spatial hashing for collision detection
  - [x] 3.1 Create 3D SpatialHash class
    - Modify `src/core/SpatialHash.ts` to support 3D
    - Update hash function to use (x, y, z) coordinates instead of (x, y)
    - Update insert to handle 3D cell ranges (minX/maxX, minY/maxY, minZ/maxZ)
    - Update getNearby to check 27-cell neighborhood (3×3×3) instead of 9 cells
    - Update cell coordinate calculation for 3D positions
    - Ensure getPosition and getRadius work with 3D entities
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 3.2 Write property tests for 3D spatial hashing
    - Create or update `tests/properties/spatial-hash.property.test.ts`
    - **Property 15: Particles are placed in correct grid cells**
    - **Property 16: Nearby queries return only adjacent cells**
    - **Validates: Requirements 3.2, 3.3**
  
  - [x] 3.3 Write unit tests for 3D collision detection
    - Update `tests/unit/collision-detector.test.ts` for 3D
    - Test sphere-sphere collision detection in 3D
    - Test non-colliding spheres are not detected
    - Test edge cases (touching spheres, overlapping centers)
    - Test spatial hash with 3D positions
    - _Requirements: 3.4_

- [x] 4. Update PhysicsEngine for 3D physics
  - [x] 4.1 Extend PhysicsEngine to 3D
    - Modify `src/core/PhysicsEngine.ts`
    - Update calculateGravitationalForce to return Vector3D
    - Update gravity to apply force in negative z direction (not just 2D)
    - Update collision detection to use 3D distance calculations
    - Update collision normal calculation to use 3D vectors
    - Update impulse calculation for 3D collision response
    - Update all helper methods (getPosition, setPosition, etc.) for 3D
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7, 3.4_
  
  - [x] 4.2 Write property tests for 3D physics
    - Update `tests/properties/gravity.property.test.ts` for 3D
    - Update `tests/properties/motion.property.test.ts` for 3D
    - Update `tests/properties/momentum.property.test.ts` for 3D
    - Update `tests/properties/energy.property.test.ts` for 3D
    - Update `tests/properties/collision.property.test.ts` for 3D
    - **Property 9: Gravity points in negative z direction**
    - **Property 10: Position updates follow kinematic equation (3D)**
    - **Property 11: Velocity updates follow kinematic equation (3D)**
    - **Property 12: Elastic collisions conserve momentum in 3D**
    - **Property 13: Elastic collisions conserve kinetic energy**
    - **Property 14: Inelastic collisions conserve momentum but reduce energy**
    - **Property 17: Overlapping spheres are detected as collisions**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 3.4**

- [x] 5. Checkpoint - Verify 3D physics correctness
  - Run all Vector3D property tests and unit tests
  - Run all Quaternion unit tests
  - Run all 3D physics property tests
  - Run all spatial hash tests
  - Ensure all tests pass before proceeding
  - Ask the user if questions arise

- [x] 6. Extend Conglomerate class to 3D with quaternion rotation
  - [x] 6.1 Update Conglomerate for 3D rigid body dynamics
    - Modify `src/core/Conglomerate.ts`
    - Change centerOfMass from Vector2D to Vector3D
    - Change velocity from Vector2D to Vector3D
    - Change angularVelocity from scalar to Vector3D
    - Add orientation field as Quaternion
    - Update calculateCenterOfMass for 3D
    - Implement calculateMomentOfInertiaTensor (returns 3×3 matrix or object)
    - Update calculateAngularMomentum to return Vector3D
    - Update applyForce to use Vector3D
    - Update applyTorque to use Vector3D torque
    - Update update() method to use quaternion rotation
    - Update particle position calculation using quaternion.rotateVector()
    - Update relativePositions to use Vector3D
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 6.2 Write property tests for 3D conglomerate physics
    - Update `tests/properties/conglomerate.property.test.ts` for 3D
    - Update `tests/properties/angular-momentum.property.test.ts` for 3D
    - **Property 18: Low-velocity collisions trigger merging**
    - **Property 19: Center of mass follows formula (3D)**
    - **Property 20: Conglomerate formation conserves linear momentum (3D)**
    - **Property 21: Conglomerate formation conserves angular momentum (3D)**
    - **Property 22: Moment of inertia tensor follows formula**
    - **Property 23: Conglomerate particles maintain relative positions**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7**
  
  - [x] 6.3 Write unit tests for conglomerate edge cases
    - Update or create `tests/unit/conglomerate.test.ts`
    - Test single-particle conglomerate
    - Test two-particle conglomerate rotation in 3D
    - Test merging two conglomerates
    - Test quaternion normalization over time
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Implement 3D boundary with wrap-around
  - [x] 7.1 Create Boundary class for 3D cubic space
    - Create new file `src/core/Boundary.ts`
    - Implement constructor with min and max Vector3D
    - Implement wrapPosition for all 6 faces (±x, ±y, ±z)
    - Implement isOutside check for 3D position
    - Implement getRandomSpawnPosition for 6 faces
    - Implement getSpawnVelocity to point inward from spawn face
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [x] 7.2 Write property tests for boundary behavior
    - Create new file `tests/properties/boundary.property.test.ts`
    - **Property 24: Wrap-around works for all dimensions**
    - **Property 25: Wrap-around preserves velocity and angular velocity**
    - **Property 26: Spawned particles are on boundary faces**
    - **Property 27: Spawned particles have inward velocity**
    - **Validates: Requirements 5.2-5.8, 6.2-6.8**
  
  - [x] 7.3 Write unit tests for boundary edge cases
    - Create new file `tests/unit/boundary.test.ts`
    - Test corner wrap-around (multiple dimensions simultaneously)
    - Test particle exactly at boundary
    - Test spawn position on each of 6 faces
    - Test inward velocity calculation for each face
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 8. Checkpoint - Verify boundary and conglomerate correctness
  - Run all boundary property tests and unit tests
  - Run all conglomerate 3D tests
  - Ensure all tests pass before proceeding
  - Ask the user if questions arise

- [x] 9. Install Three.js and implement 3D renderer
  - [x] 9.1 Install Three.js dependencies
    - Run: `npm install three @types/three`
    - Verify installation in package.json
    - _Requirements: 7.1_
  
  - [x] 9.2 Create Renderer class with Three.js
    - Completely rewrite `src/core/Renderer.ts` for 3D
    - Import Three.js and necessary modules
    - Initialize Three.js scene, WebGL renderer, and perspective camera
    - Set up ambient and directional lighting for depth perception
    - Create particle mesh cache (Map<string, THREE.Mesh>)
    - Implement updateParticle to create/update sphere meshes
    - Implement updateConglomerate to render constituent particles
    - Implement color mode support (mass, velocity, energy)
    - Create boundary wireframe using BoxGeometry and EdgesGeometry
    - Implement render() method to update all entities
    - Remove all Canvas 2D code
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [x] 9.3 Write unit tests for renderer
    - Update `tests/unit/renderer.test.ts` for Three.js
    - Test scene initialization
    - Test particle mesh creation
    - Test mesh position updates
    - Test color calculation for different modes
    - Test boundary wireframe creation
    - Note: May need to mock Three.js or use jsdom
    - _Requirements: 7.2, 7.3, 7.6_

- [x] 10. Implement camera controls
  - [x] 10.1 Create CameraController with OrbitControls
    - Completely rewrite `src/core/Camera.ts` for 3D
    - Import OrbitControls from three/examples/jsm/controls/OrbitControls
    - Initialize OrbitControls with camera and canvas
    - Configure damping, distance limits, and rotation limits
    - Set initial camera position to view entire boundary
    - Implement update() method to be called in animation loop
    - Implement setPosition, lookAt, and resetView methods
    - Remove all 2D camera code (pan, zoom, worldToScreen, screenToWorld)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 10.2 Write unit tests for camera controller
    - Update `tests/unit/camera.test.ts` for 3D
    - Test camera initialization
    - Test initial camera position shows boundary
    - Test orbit controls configuration
    - Test resetView functionality
    - _Requirements: 8.7_

- [x] 11. Update SimulationEngine and ParticleManager for 3D
  - [x] 11.1 Update ParticleManager for 3D
    - Modify `src/core/ParticleManager.ts`
    - Update bounds to use 3D Boundary class
    - Update spawnParticle to use boundary.getRandomSpawnPosition()
    - Update spawnParticle to use boundary.getSpawnVelocity()
    - Update wrap-around logic to use boundary.wrapPosition()
    - Update all Vector2D references to Vector3D
    - _Requirements: 6.1, 6.8, 5.8_
  
  - [x] 11.2 Extend SimulationEngine to coordinate 3D simulation
    - Modify `src/core/SimulationEngine.ts`
    - Update constructor to accept 3D boundary
    - Update constructor to initialize 3D renderer and camera controller
    - Update main loop to call cameraController.update()
    - Update collision detection to use 3D spatial hash
    - Ensure all entity updates use 3D vectors
    - Update all Vector2D references to Vector3D
    - _Requirements: 6.1, 6.8_
  
  - [x] 11.3 Write integration tests for simulation cycle
    - Update `tests/integration/simulation-cycle.test.ts` for 3D
    - Test full simulation cycle (spawn → physics → collision → render)
    - Test multiple particles forming conglomerates in 3D
    - Test particles wrapping around boundaries in 3D
    - Test spatial hash performance with many particles
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 3.2, 3.3, 3.4, 4.1, 5.8, 6.8_

- [x] 12. Update GUIController for 3D parameters
  - [x] 12.1 Extend GUIController with 3D-specific controls
    - Modify `src/core/GUIController.ts`
    - Keep existing controls (gravity, spawn rate, elasticity, sticking threshold)
    - Ensure pause/resume button works with 3D simulation
    - Ensure reset button works with 3D simulation
    - Update statistics display (particle count, conglomerate count, FPS)
    - Wire all controls to SimulationEngine methods
    - Ensure real-time parameter updates work
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 12.2 Write integration tests for GUI interaction
    - Update `tests/integration/gui-interaction.test.ts` for 3D
    - Test parameter changes update simulation
    - Test pause/resume functionality
    - Test reset functionality
    - Test statistics display updates
    - _Requirements: 9.7_

- [x] 13. Update HTML and entry point for 3D
  - [x] 13.1 Modify index.html and main entry point
    - Update `index.html` canvas element for WebGL rendering
    - Ensure canvas has proper attributes for Three.js
    - Update `src/main.ts` to import Three.js components
    - Update initialization to create 3D boundary (cubic space)
    - Update initialization to create 3D simulation with Vector3D
    - Update initialization to use 3D renderer and camera controller
    - Ensure proper canvas sizing and aspect ratio
    - Add window resize handler for camera aspect ratio
    - Remove any 2D-specific initialization code
    - _Requirements: 7.1, 8.1_

- [ ] 14. Final checkpoint - End-to-end testing
  - [ ] 14.1 Verify complete 3D simulation
    - Run all property tests (should be 27 properties passing)
    - Run all unit tests
    - Run all integration tests
    - Manually test camera controls (orbit, zoom, pan)
    - Manually verify visual quality (lighting, colors, boundary)
    - Verify performance (60 FPS with 100+ particles)
    - Test on different screen sizes and aspect ratios
    - _Requirements: All_
  
  - [ ] 14.2 Performance optimization if needed
    - Profile spatial hash performance
    - Optimize mesh updates (reuse geometries)
    - Optimize collision detection (early exit conditions)
    - Consider instanced rendering for many particles if needed
    - _Requirements: 3.5_

- [ ] 15. Documentation and cleanup
  - [ ] 15.1 Update documentation
    - Update README.md with 3D features and controls
    - Document camera controls (mouse drag, scroll, right-click)
    - Document Three.js dependency and setup
    - Add screenshots or GIFs of 3D simulation
    - Document performance characteristics
  
  - [ ] 15.2 Code cleanup
    - Remove unused 2D code (Vector2D if not needed)
    - Ensure consistent naming conventions
    - Add JSDoc comments to new classes (Vector3D, Quaternion, Boundary)
    - Format code consistently
    - Remove debug logging

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- The implementation builds incrementally: math → physics → rendering → integration
- All 27 correctness properties from the design document are covered by property tests
- Three.js must be installed before implementing the renderer
- The 2D code serves as a reference but will be replaced with 3D equivalents
