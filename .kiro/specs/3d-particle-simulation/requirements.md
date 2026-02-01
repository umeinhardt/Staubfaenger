# Requirements Document: 3D Particle Aggregation Simulation

## Introduction

This document specifies the requirements for converting the existing 2D dust particle aggregation simulation to a full 3D simulation. The system will maintain all existing physics properties (gravity, momentum, angular momentum, energy conservation) while extending the simulation to three-dimensional space with 3D rendering, camera controls, and spatial collision detection.

## Glossary

- **Simulation_Engine**: The core system that manages the simulation loop, time stepping, and coordinates all subsystems
- **Physics_Engine**: The subsystem responsible for applying forces, updating velocities, positions, and handling collisions
- **Particle**: A single spherical object with mass, position, velocity, and angular velocity in 3D space
- **Conglomerate**: A rigid body formed by multiple particles that have collided and stuck together
- **Spatial_Hash**: A 3D grid-based data structure for efficient collision detection in 3D space
- **Renderer**: The subsystem responsible for 3D visualization using WebGL/Three.js
- **Camera_Controller**: The subsystem managing 3D camera position, orientation, and user controls
- **Boundary**: The 3D cubic volume containing the simulation with wrap-around on all six faces
- **GUI_Controller**: The user interface for controlling simulation parameters
- **Vector3D**: A three-dimensional vector class for position, velocity, and force calculations

## Requirements

### Requirement 1: 3D Vector Mathematics

**User Story:** As a developer, I want a complete 3D vector mathematics system, so that all physics calculations can be performed in three-dimensional space.

#### Acceptance Criteria

1. THE Vector3D SHALL store x, y, and z components as floating-point numbers
2. WHEN two Vector3D instances are added, THE Vector3D SHALL return a new vector with component-wise addition
3. WHEN two Vector3D instances are subtracted, THE Vector3D SHALL return a new vector with component-wise subtraction
4. WHEN a Vector3D is multiplied by a scalar, THE Vector3D SHALL return a new vector with all components scaled
5. WHEN the magnitude of a Vector3D is calculated, THE Vector3D SHALL return the Euclidean length in 3D space
6. WHEN a Vector3D is normalized, THE Vector3D SHALL return a unit vector in the same direction
7. WHEN the dot product of two Vector3D instances is calculated, THE Vector3D SHALL return the scalar dot product
8. WHEN the cross product of two Vector3D instances is calculated, THE Vector3D SHALL return a new vector perpendicular to both inputs
9. WHEN the distance between two Vector3D instances is calculated, THE Vector3D SHALL return the Euclidean distance in 3D space

### Requirement 2: 3D Physics Simulation

**User Story:** As a user, I want the simulation to accurately model 3D physics, so that particles behave realistically in three-dimensional space.

#### Acceptance Criteria

1. WHEN gravity is applied, THE Physics_Engine SHALL apply a constant downward force in the negative z-direction to all particles
2. WHEN particles move, THE Physics_Engine SHALL update positions using velocity and time step in 3D space
3. WHEN particles have velocity, THE Physics_Engine SHALL update velocities using acceleration and time step in 3D space
4. WHEN two particles collide, THE Physics_Engine SHALL compute collision response using 3D collision normal vectors
5. WHEN particles collide elastically, THE Physics_Engine SHALL conserve total momentum in all three dimensions
6. WHEN particles collide elastically, THE Physics_Engine SHALL conserve total kinetic energy
7. WHEN particles collide inelastically, THE Physics_Engine SHALL conserve momentum but reduce kinetic energy
8. WHEN particles rotate, THE Physics_Engine SHALL update angular velocity and orientation in 3D space
9. WHEN torque is applied to a particle, THE Physics_Engine SHALL update angular momentum using the 3D cross product

### Requirement 3: 3D Collision Detection

**User Story:** As a developer, I want efficient 3D collision detection, so that the simulation can handle many particles without performance degradation.

#### Acceptance Criteria

1. THE Spatial_Hash SHALL partition 3D space into a uniform grid of cubic cells
2. WHEN a particle is inserted, THE Spatial_Hash SHALL place it in the appropriate 3D grid cell based on its position
3. WHEN querying for nearby particles, THE Spatial_Hash SHALL return only particles in the same and adjacent 3D cells
4. WHEN two spherical particles overlap in 3D space, THE Physics_Engine SHALL detect the collision
5. WHEN checking for collisions, THE Physics_Engine SHALL use the Spatial_Hash to avoid checking all particle pairs
6. WHEN particles move, THE Spatial_Hash SHALL update particle positions in the grid structure

### Requirement 4: 3D Conglomerate Formation

**User Story:** As a user, I want particles to stick together when they collide, so that I can observe aggregate structures forming in 3D space.

#### Acceptance Criteria

1. WHEN two particles collide with relative velocity below a threshold, THE Physics_Engine SHALL merge them into a conglomerate
2. WHEN particles merge, THE Conglomerate SHALL compute the combined center of mass in 3D space
3. WHEN particles merge, THE Conglomerate SHALL conserve total linear momentum in all three dimensions
4. WHEN particles merge, THE Conglomerate SHALL conserve total angular momentum in 3D space
5. WHEN a conglomerate forms, THE Conglomerate SHALL compute the moment of inertia tensor for 3D rotation
6. WHEN a conglomerate rotates, THE Conglomerate SHALL use quaternions or rotation matrices to represent orientation
7. WHEN rendering a conglomerate, THE Renderer SHALL position each constituent particle at its correct 3D location relative to the center of mass
8. WHEN a particle collides with a conglomerate, THE Physics_Engine SHALL treat the conglomerate as a rigid body in 3D space

### Requirement 5: 3D Boundary and Wrap-Around

**User Story:** As a user, I want particles to wrap around the simulation boundaries, so that the simulation represents a periodic 3D space.

#### Acceptance Criteria

1. THE Boundary SHALL define a cubic volume with minimum and maximum coordinates in x, y, and z dimensions
2. WHEN a particle exits through the positive x face, THE Boundary SHALL wrap it to the negative x face
3. WHEN a particle exits through the negative x face, THE Boundary SHALL wrap it to the positive x face
4. WHEN a particle exits through the positive y face, THE Boundary SHALL wrap it to the negative y face
5. WHEN a particle exits through the negative y face, THE Boundary SHALL wrap it to the positive y face
6. WHEN a particle exits through the positive z face, THE Boundary SHALL wrap it to the negative z face
7. WHEN a particle exits through the negative z face, THE Boundary SHALL wrap it to the positive z face
8. WHEN a particle wraps around, THE Boundary SHALL preserve the particle's velocity and angular velocity

### Requirement 6: 3D Particle Spawning

**User Story:** As a user, I want new particles to spawn at the boundaries of the 3D space, so that the simulation continuously adds new material.

#### Acceptance Criteria

1. WHEN spawning a particle, THE Simulation_Engine SHALL randomly select one of the six boundary faces
2. WHEN spawning on the positive x face, THE Simulation_Engine SHALL place the particle at the maximum x coordinate with random y and z coordinates
3. WHEN spawning on the negative x face, THE Simulation_Engine SHALL place the particle at the minimum x coordinate with random y and z coordinates
4. WHEN spawning on the positive y face, THE Simulation_Engine SHALL place the particle at the maximum y coordinate with random x and z coordinates
5. WHEN spawning on the negative y face, THE Simulation_Engine SHALL place the particle at the minimum y coordinate with random x and z coordinates
6. WHEN spawning on the positive z face, THE Simulation_Engine SHALL place the particle at the maximum z coordinate with random x and y coordinates
7. WHEN spawning on the negative z face, THE Simulation_Engine SHALL place the particle at the minimum z coordinate with random x and y coordinates
8. WHEN a particle is spawned, THE Simulation_Engine SHALL assign it an initial velocity directed toward the interior of the boundary

### Requirement 7: 3D Rendering with WebGL

**User Story:** As a user, I want to see the simulation rendered in 3D, so that I can visualize particle aggregation in three-dimensional space.

#### Acceptance Criteria

1. THE Renderer SHALL use WebGL through Three.js for hardware-accelerated 3D rendering
2. WHEN rendering particles, THE Renderer SHALL display each particle as a 3D sphere with appropriate radius
3. WHEN rendering conglomerates, THE Renderer SHALL display all constituent particles at their correct 3D positions
4. WHEN the simulation updates, THE Renderer SHALL update the 3D scene to reflect current particle positions and orientations
5. THE Renderer SHALL provide lighting to give depth perception to the 3D scene
6. THE Renderer SHALL render the boundary as a visible wireframe cube
7. WHEN rendering, THE Renderer SHALL use different colors or materials to distinguish individual particles from conglomerates

### Requirement 8: 3D Camera Controls

**User Story:** As a user, I want to control the camera view, so that I can observe the simulation from different angles and distances.

#### Acceptance Criteria

1. THE Camera_Controller SHALL provide orbit controls allowing rotation around the simulation center
2. WHEN the user drags with the mouse, THE Camera_Controller SHALL rotate the camera around the scene
3. WHEN the user scrolls the mouse wheel, THE Camera_Controller SHALL zoom the camera in or out
4. WHEN the user drags with the right mouse button, THE Camera_Controller SHALL pan the camera parallel to the view plane
5. THE Camera_Controller SHALL constrain camera movement to keep the simulation visible
6. THE Camera_Controller SHALL provide smooth camera transitions without jarring movements
7. WHEN the simulation starts, THE Camera_Controller SHALL position the camera to show the entire boundary volume

### Requirement 9: Configuration and GUI Controls

**User Story:** As a user, I want to control simulation parameters through a GUI, so that I can experiment with different configurations.

#### Acceptance Criteria

1. THE GUI_Controller SHALL provide controls for adjusting gravity strength
2. THE GUI_Controller SHALL provide controls for adjusting particle spawn rate
3. THE GUI_Controller SHALL provide controls for adjusting collision elasticity
4. THE GUI_Controller SHALL provide controls for adjusting the sticking threshold for conglomerate formation
5. THE GUI_Controller SHALL provide controls for pausing and resuming the simulation
6. THE GUI_Controller SHALL provide controls for resetting the simulation to initial state
7. WHEN a parameter is changed, THE GUI_Controller SHALL update the simulation in real-time
8. THE GUI_Controller SHALL display current simulation statistics (particle count, conglomerate count, frame rate)

### Requirement 10: Property-Based Testing Framework

**User Story:** As a developer, I want comprehensive property-based tests, so that I can verify the correctness of 3D physics properties.

#### Acceptance Criteria

1. THE Testing_Framework SHALL use Vitest with fast-check for property-based testing
2. THE Testing_Framework SHALL generate random 3D vectors for testing vector operations
3. THE Testing_Framework SHALL generate random particle configurations for testing physics properties
4. THE Testing_Framework SHALL verify momentum conservation in all three dimensions
5. THE Testing_Framework SHALL verify energy conservation for elastic collisions in 3D
6. THE Testing_Framework SHALL verify angular momentum conservation in 3D space
7. THE Testing_Framework SHALL verify that wrap-around preserves particle properties
8. THE Testing_Framework SHALL verify that spatial hashing correctly identifies nearby particles in 3D
9. THE Testing_Framework SHALL verify that conglomerate center of mass calculations are correct in 3D
10. THE Testing_Framework SHALL run each property test with at least 100 random test cases
