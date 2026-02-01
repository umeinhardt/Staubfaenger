# Implementierungsplan: Staubkorn-Aggregationssimulation

## Übersicht

Die Implementierung erfolgt in inkrementellen Schritten, beginnend mit den Grundlagen (Vektoren, Teilchen) und aufbauend zu komplexeren Systemen (Physik, Kollisionen, Rendering). Jeder Schritt validiert die Kernfunktionalität durch Tests, bevor zum nächsten Schritt übergegangen wird.

## Aufgaben

- [x] 1. Projekt-Setup und Grundstrukturen
  - Erstelle die Projektstruktur mit TypeScript, HTML5 Canvas und Testsystem
  - Richte fast-check für Property-Based Testing ein
  - Erstelle die Vektor-Klasse mit allen mathematischen Operationen
  - _Anforderungen: 8.2_

- [x] 1.1 Schreibe Unit-Tests für Vektor-Operationen
  - Teste Addition, Subtraktion, Multiplikation, Division
  - Teste Magnitude, Normalisierung, Dot-Product, Distanz
  - _Anforderungen: 8.2_

- [x] 2. Teilchen-Implementierung
  - [x] 2.1 Implementiere die Particle-Klasse
    - Erstelle Particle mit Position, Geschwindigkeit, Masse
    - Implementiere applyForce() und update() Methoden
    - Berechne Radius proportional zur Masse
    - _Anforderungen: 5.1, 6.2_

  - [x] 2.2 Schreibe Property-Test für Massenproportionalität
    - **Property 3: Massenproportionalität und -erhaltung**
    - **Validiert: Anforderungen 5.1**

  - [x] 2.3 Schreibe Property-Test für Newton'sches Bewegungsgesetz
    - **Property 5: Newton'sches Bewegungsgesetz**
    - **Validiert: Anforderung 6.2**

- [x] 3. Konglomerat-Implementierung
  - [x] 3.1 Implementiere die Conglomerate-Klasse
    - Erstelle Conglomerate aus mehreren Particles
    - Berechne Massenschwerpunkt und Gesamtmasse
    - Implementiere Drehimpuls-Berechnung
    - Implementiere merge() Methode
    - _Anforderungen: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 3.2 Schreibe Property-Test für Massenerhaltung
    - **Property 3: Massenproportionalität und -erhaltung**
    - **Validiert: Anforderungen 5.2, 7.3**

  - [x] 3.3 Schreibe Property-Test für Teilchen-Beibehaltung
    - **Property 9: Teilchen-Beibehaltung in Konglomeraten**
    - **Validiert: Anforderung 7.2**

- [x] 4. Checkpoint - Grundlegende Datenstrukturen validieren
  - Stelle sicher, dass alle Tests bestehen
  - Frage den Benutzer, falls Fragen auftreten

- [x] 5. Physik-Engine: Gravitation
  - [x] 5.1 Implementiere GravityFormula Interface und NewtonianGravity
    - Erstelle das GravityFormula Interface
    - Implementiere Newton'sche Gravitationsformel (F = G × m1 × m2 / r²)
    - Füge Epsilon für numerische Stabilität hinzu
    - _Anforderungen: 6.1, 6.5, 6.6_

  - [x] 5.2 Schreibe Property-Test für Gravitationsberechnung
    - **Property 4: Newton'sche Gravitationsformel**
    - **Validiert: Anforderung 6.1**

  - [x] 5.3 Implementiere GravityRegistry für erweiterbare Formeln
    - Erstelle Registry für verschiedene Gravitationsformeln
    - Implementiere register(), get(), list() Methoden
    - _Anforderungen: 6.6_

- [x] 6. Physik-Engine: Kollisionen
  - [x] 6.1 Implementiere PhysicsEngine mit Kollisionsauflösung
    - Implementiere calculateGravitationalForce()
    - Implementiere resolveCollision() mit Impulserhaltung
    - Implementiere Elastizitäts-Berücksichtigung
    - _Anforderungen: 6.1, 6.3, 6.4, 7.6_

  - [x] 6.2 Schreibe Property-Test für Impulserhaltung
    - **Property 6: Impulserhaltung bei Kollisionen**
    - **Validiert: Anforderungen 6.3, 7.4**

  - [x] 6.3 Schreibe Property-Test für Energieerhaltung mit Elastizität
    - **Property 7: Energieerhaltung mit Elastizität**
    - **Validiert: Anforderung 6.4**

  - [x] 6.4 Schreibe Property-Test für Drehimpulserhaltung
    - **Property 10: Drehimpulserhaltung**
    - **Validiert: Anforderungen 7.5, 9.2**

- [x] 7. Kollisionserkennung mit Spatial Hashing
  - [x] 7.1 Implementiere SpatialHash-Klasse
    - Erstelle Grid-basierte Datenstruktur
    - Implementiere insert() und getNearby()
    - Optimiere Zellgröße für Performance
    - _Anforderungen: 2.3_

  - [x] 7.2 Implementiere CollisionDetector
    - Implementiere detectCollisions() mit Spatial Hashing
    - Implementiere checkCollision() für Teilchen und Konglomerate
    - _Anforderungen: 2.3, 7.1_

  - [x] 7.3 Schreibe Property-Test für Konglomerat-Bildung
    - **Property 8: Konglomerat-Bildung bei Kontakt**
    - **Validiert: Anforderung 7.1**

  - [x] 7.4 Schreibe Unit-Tests für Edge Cases
    - Teste Kollision bei sehr hohen Geschwindigkeiten
    - Teste Mehrfachkollisionen
    - Teste überlappende Teilchen
    - _Anforderungen: 7.1_

- [x] 8. Checkpoint - Physik-Engine validieren
  - Stelle sicher, dass alle Tests bestehen
  - Frage den Benutzer, falls Fragen auftreten

- [x] 9. Particle Manager
  - [x] 9.1 Implementiere ParticleManager
    - Implementiere spawnParticle() mit zufälligen Parametern
    - Implementiere wrapParticle() für Wrap-around
    - Implementiere createConglomerate() und mergeConglomerates()
    - Implementiere update() für alle Entitäten
    - _Anforderungen: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 9.2 Schreibe Property-Test für Teilcheneintritt-Validierung
    - **Property 1: Teilcheneintritt-Validierung**
    - **Validiert: Anforderungen 3.2, 3.3, 3.4, 3.5**

  - [x] 9.3 Schreibe Property-Test für Wrap-around Konsistenz
    - **Property 2: Wrap-around Konsistenz**
    - **Validiert: Anforderung 3.6**

- [x] 10. Rendering-System
  - [x] 10.1 Implementiere Camera-Klasse
    - Implementiere pan(), zoomIn(), zoomOut()
    - Implementiere worldToScreen() und screenToWorld() Transformationen
    - _Anforderungen: 10.4, 10.5_

  - [x] 10.2 Implementiere Renderer-Klasse
    - Implementiere render() für Particles und Conglomerates
    - Implementiere Farbkodierung (Masse, Geschwindigkeit, Energie)
    - Implementiere Rotationsdarstellung für Konglomerate
    - Implementiere Geschwindigkeitsvektoren
    - _Anforderungen: 1.2, 4.4, 5.1, 5.2, 9.1_

  - [x] 10.3 Schreibe Unit-Tests für Rendering
    - Teste Farbberechnung für verschiedene Modi
    - Teste Kamera-Transformationen
    - Teste Rotationsdarstellung
    - _Anforderungen: 4.4, 9.1_

- [x] 11. Simulation Engine
  - [x] 11.1 Implementiere SimulationEngine mit Game Loop
    - Implementiere gameLoop() mit requestAnimationFrame
    - Implementiere update() mit adaptiven Zeitschritten
    - Implementiere start(), pause(), reset()
    - Implementiere setTimeScale() und setAccuracySteps()
    - _Anforderungen: 1.3, 2.2, 2.5, 10.1, 10.2, 10.3, 10.7_

  - [x] 11.2 Schreibe Unit-Tests für Simulationssteuerung
    - Teste start(), pause(), reset()
    - Teste Zeitschritt-Berechnung
    - _Anforderungen: 10.1, 10.2, 10.3_

- [x] 12. GUI Controller
  - [x] 12.1 Erstelle HTML-Struktur mit Canvas und Controls
    - Erstelle Canvas-Element für Rendering
    - Erstelle Slider für alle Parameter (Eintrittsrate, Masse, Energie, Elastizität, Genauigkeit, Zeitskala)
    - Erstelle Buttons für Play, Pause, Reset
    - Erstelle Dropdown für Farbkodierung
    - _Anforderungen: 1.1, 4.1, 4.2, 4.3, 4.4, 4.5, 10.6_

  - [x] 12.2 Implementiere GUIController-Klasse
    - Implementiere Event-Listener für alle Controls
    - Implementiere Maus-Events für Zoom und Pan
    - Implementiere Parameter-Updates
    - _Anforderungen: 2.4, 4.6, 10.4, 10.5, 10.6, 10.7_

  - [x] 12.3 Schreibe Property-Test für Konfigurationsänderungen
    - **Property 11: Konfigurationsänderungen wirken sofort**
    - **Validiert: Anforderungen 2.5, 4.6, 10.7**

- [x] 13. Integration und Wiring
  - [x] 13.1 Verbinde alle Komponenten
    - Erstelle Haupteinstiegspunkt (main.ts)
    - Initialisiere alle Komponenten mit Standardkonfiguration
    - Verbinde SimulationEngine mit ParticleManager, CollisionDetector, PhysicsEngine, Renderer
    - Verbinde GUIController mit allen Komponenten
    - _Anforderungen: Alle_

  - [x] 13.2 Schreibe Integration-Tests
    - Teste vollständigen Simulationszyklus
    - Teste GUI-Interaktionen
    - Teste Performance mit vielen Teilchen
    - _Anforderungen: Alle_

- [x] 14. Finaler Checkpoint
  - Stelle sicher, dass alle Tests bestehen
  - Teste manuell in verschiedenen Browsern (Chrome, Firefox, Safari, Edge)
  - Überprüfe Performance (mindestens 30 FPS)
  - Frage den Benutzer, falls Fragen auftreten

## Hinweise

- Jede Aufgabe referenziert spezifische Anforderungen für Nachvollziehbarkeit
- Checkpoints stellen inkrementelle Validierung sicher
- Property-Tests validieren universelle Korrektheitseigenschaften
- Unit-Tests validieren spezifische Beispiele und Edge Cases
- Alle Property-Tests sollten mit mindestens 100 Iterationen konfiguriert werden

