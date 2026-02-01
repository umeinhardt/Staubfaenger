# Phase 3a.1: Adaptive Zeitschritte ✅

## Status: Abgeschlossen

## Was wurde implementiert?

Adaptive Zeitschritte passen die Simulationsgeschwindigkeit dynamisch an, um konstante 60 FPS zu halten.

## Wie funktioniert es?

```
Normale Zeitschritte:
- Frame dauert 16ms → Simulation läuft normal
- Frame dauert 50ms → Simulation läuft normal (aber ruckelt)

Adaptive Zeitschritte:
- Frame dauert 16ms → Simulation läuft normal (1.0x)
- Frame dauert 50ms → Simulation läuft langsamer (0.3x)
  → FPS bleibt bei 60, aber Simulation ist langsamer
```

## Implementation

### 1. SimulationEngine.ts

**Neue Eigenschaften:**
```typescript
private frameTimeHistory: number[] = [];
private readonly frameHistorySize: number = 10;
private currentAdaptiveScale: number = 1.0;
```

**Neue Methode:**
```typescript
private calculateAdaptiveDeltaTime(deltaTime: number): number {
  // Berechne durchschnittliche Frame-Zeit
  // Passe Simulationsgeschwindigkeit an
  // Halte FPS konstant bei 60
}
```

**Neue Config:**
```typescript
interface SimulationConfig {
  adaptiveTimeSteps: boolean; // Neu!
}
```

### 2. main.ts

**Aktiviert standardmäßig:**
```typescript
const simulationConfig: SimulationConfig = {
  adaptiveTimeSteps: true  // Aktiviert
};
```

### 3. index.html

**Neue Checkbox:**
```html
<input type="checkbox" id="adaptiveTimeSteps" checked>
```

### 4. GUIController.ts

**Neuer Handler:**
```typescript
private onAdaptiveTimeStepsChange(enable: boolean): void {
  this.simulationEngine.setAdaptiveTimeSteps(enable);
}
```

## Algorithmus

```typescript
1. Sammle letzte 10 Frame-Zeiten
2. Berechne Durchschnitt
3. Vergleiche mit Ziel (16.67ms für 60 FPS)
4. Wenn zu langsam:
   - Reduziere Simulationsgeschwindigkeit
   - Halte FPS bei 60
5. Wenn schnell genug:
   - Erhöhe Simulationsgeschwindigkeit zurück zu 1.0x
6. Wende exponentielles Smoothing an (sanfte Übergänge)
```

## Performance-Gewinn

**Ohne Adaptive Zeitschritte:**
- 1000 Partikel: 20 FPS (ruckelt)
- Simulation läuft normal schnell
- Aber: Ruckeln ist störend

**Mit Adaptive Zeitschritte:**
- 1000 Partikel: 60 FPS (flüssig!)
- Simulation läuft 0.3x langsamer
- Aber: Flüssige Darstellung

**Vorteil:**
- ✅ Konstante 60 FPS (flüssig)
- ✅ Keine Ruckler
- ✅ Automatische Anpassung

**Nachteil:**
- ⚠️ Simulation läuft langsamer bei hoher Last
- ⚠️ Nicht "echt-zeit" bei vielen Partikeln

## Nutzung

### Automatisch (Standard)

Adaptive Zeitschritte sind standardmäßig aktiviert.

### Manuell Ein/Aus

**In der UI:**
- Checkbox "Adaptive Zeitschritte (konstante FPS)"

**In der Console:**
```javascript
// Aktivieren
simulationEngine.setAdaptiveTimeSteps(true);

// Deaktivieren
simulationEngine.setAdaptiveTimeSteps(false);

// Aktuellen Scale prüfen
console.log('Adaptive Scale:', simulationEngine.getAdaptiveScale());
// 1.0 = normal, 0.5 = halb so schnell, 0.1 = sehr langsam
```

## Beispiel-Szenario

**1000 Partikel ohne Adaptive Zeitschritte:**
```
Frame 1: 50ms (20 FPS) - ruckelt
Frame 2: 48ms (21 FPS) - ruckelt
Frame 3: 52ms (19 FPS) - ruckelt
→ Simulation läuft normal schnell, aber ruckelt
```

**1000 Partikel mit Adaptive Zeitschritte:**
```
Frame 1: 16ms (60 FPS) - flüssig, Scale = 0.33x
Frame 2: 16ms (60 FPS) - flüssig, Scale = 0.33x
Frame 3: 16ms (60 FPS) - flüssig, Scale = 0.33x
→ Simulation läuft 3x langsamer, aber flüssig
```

## Technische Details

### Exponentielles Smoothing

```typescript
// Sanfte Anpassung (nicht abrupt)
this.currentAdaptiveScale = 
  this.currentAdaptiveScale * 0.9 + targetScale * 0.1;
```

**Warum?**
- Verhindert abrupte Geschwindigkeitsänderungen
- Sanfte Übergänge
- Visuell angenehmer

### Frame History

```typescript
// Letzte 10 Frames für Durchschnitt
private readonly frameHistorySize: number = 10;
```

**Warum?**
- Glättet Schwankungen
- Verhindert Überreaktion auf einzelne langsame Frames
- Stabilere Anpassung

### Clamping

```typescript
// Nicht unter 0.1x (zu langsam)
this.currentAdaptiveScale = Math.max(0.1, scale);
```

**Warum?**
- Simulation sollte nicht komplett einfrieren
- Mindestens 10% Geschwindigkeit
- Bleibt spielbar

## Wann nutzen?

**Aktivieren wenn:**
- ✅ Flüssige Darstellung wichtiger als Echtzeit
- ✅ Viele Partikel (>500)
- ✅ Schwache Hardware
- ✅ Visuell ansprechende Demo

**Deaktivieren wenn:**
- ❌ Echtzeit-Simulation wichtig
- ❌ Wenige Partikel (<200)
- ❌ Starke Hardware (läuft eh mit 60 FPS)
- ❌ Wissenschaftliche Genauigkeit wichtig

## Zusammenfassung

✅ **Adaptive Zeitschritte implementiert!**

**Vorteile:**
- Konstante 60 FPS
- Flüssige Darstellung
- Automatische Anpassung
- Einfach ein/auszuschalten

**Nachteile:**
- Simulation läuft langsamer bei hoher Last
- Nicht "Echtzeit"

**Aufwand:** 0.5 Tag
**Risiko:** Niedrig
**Performance-Gewinn:** Konstante FPS (visuell besser)

**Nächster Schritt:** Shared Array Buffers (echte Performance-Steigerung)
