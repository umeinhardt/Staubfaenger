# Randverhalten (Boundary Modes)

## Übersicht

Die Simulation unterstützt zwei verschiedene Verhaltensweisen für Teilchen, die den Rand des Simulationsbereichs erreichen:

1. **Abprallen (Bounce)** - Teilchen prallen elastisch von den Wänden ab
2. **Durchgang (Wrap-around)** - Teilchen treten nahtlos auf der gegenüberliegenden Seite wieder ein

## Modi

### 1. Abprallen (Bounce) - Standard

**Verhalten:**
- Teilchen prallen von den Wänden ab
- Elastizität: 0.8 (leicht gedämpft)
- Reibung: 0.95 (minimaler Energieverlust)
- Verhindert Jittering durch zusätzliche Dämpfung bei tiefer Penetration

**Physik:**
```
Wenn Teilchen Wand berührt:
1. Position wird an Wand korrigiert
2. Geschwindigkeit wird umgekehrt
3. Elastizität wird angewendet: v_neu = -v_alt * 0.8
4. Reibung wird angewendet: v_neu *= 0.95
```

**Vorteile:**
- ✅ Realistisches physikalisches Verhalten
- ✅ Energie bleibt im System (mit leichter Dämpfung)
- ✅ Teilchen bleiben im sichtbaren Bereich
- ✅ Gut für geschlossene Systeme

**Nachteile:**
- ⚠️ Teilchen können an Wänden "kleben" bleiben
- ⚠️ Energie geht durch Dämpfung verloren

### 2. Durchgang (Wrap-around)

**Verhalten:**
- Teilchen, die eine Seite verlassen, treten auf der gegenüberliegenden Seite wieder ein
- Geschwindigkeit bleibt unverändert
- Keine Energieverluste
- Periodische Randbedingungen

**Physik:**
```
Wenn Teilchen Rand überschreitet:
1. Position wird auf gegenüberliegende Seite verschoben
2. Geschwindigkeit bleibt gleich
3. Keine Energieverluste
```

**Vorteile:**
- ✅ Keine Energieverluste
- ✅ Simuliert unendlichen Raum
- ✅ Keine Wandkollisionen
- ✅ Gut für periodische Systeme

**Nachteile:**
- ⚠️ Weniger intuitiv
- ⚠️ Kann zu visuellen "Sprüngen" führen

## Implementierung

### ParticleManager

Die `ParticleManager`-Klasse verwaltet das Randverhalten:

```typescript
class ParticleManager {
  private boundaryMode: 'bounce' | 'wrap';
  
  // Setze Modus
  setBoundaryMode(mode: 'bounce' | 'wrap'): void;
  
  // Hole aktuellen Modus
  getBoundaryMode(): 'bounce' | 'wrap';
}
```

### Update-Methode

```typescript
update(deltaTime: number): void {
  for (const particle of this.particles) {
    particle.update(deltaTime);
    
    if (this.boundaryMode === 'bounce') {
      this.bounceParticle(particle, 0.8);
    } else {
      this.wrapParticle(particle);
    }
  }
  
  // Gleiches für Konglomerate
}
```

### Bounce-Implementierung

```typescript
bounceParticle(particle: Particle, elasticity: number): void {
  // Prüfe jede Achse (X, Y, Z)
  if (x - r < min.x) {
    x = min.x + r;
    vx = Math.abs(vx) * elasticity;
    // Extra Dämpfung bei tiefer Penetration
    if (penetration > r * 0.1) {
      vx *= 0.5;
    }
  }
  
  // Reibung anwenden
  if (hitWall) {
    vx *= 0.95;
    vy *= 0.95;
    vz *= 0.95;
  }
}
```

### Wrap-Implementierung

```typescript
wrapParticle(particle: Particle): void {
  const wrappedPosition = this.bounds.wrapPosition(particle.position);
  
  if (!wrappedPosition.equals(particle.position)) {
    particle.position = wrappedPosition;
  }
}
```

## UI-Steuerung

### HTML

```html
<div class="control-group">
  <label for="boundaryMode">Randverhalten</label>
  <select id="boundaryMode">
    <option value="bounce">Abprallen</option>
    <option value="wrap">Durchgang (Wrap-around)</option>
  </select>
</div>
```

### GUIController

```typescript
private boundaryModeSelect: HTMLSelectElement;

// Event Listener
this.boundaryModeSelect.addEventListener('change', () => 
  this.onBoundaryModeChange(this.boundaryModeSelect.value as 'bounce' | 'wrap')
);

// Handler
private onBoundaryModeChange(mode: 'bounce' | 'wrap'): void {
  this.particleManager.setBoundaryMode(mode);
  console.log('Boundary mode:', mode);
}
```

## Verwendung

### Standard-Modus

Der Standard-Modus ist **Abprallen (Bounce)**:

```typescript
const particleManager = new ParticleManager(boundary, config);
// boundaryMode ist standardmäßig 'bounce'
```

### Modus wechseln

```typescript
// Zu Wrap-around wechseln
particleManager.setBoundaryMode('wrap');

// Zu Bounce wechseln
particleManager.setBoundaryMode('bounce');

// Aktuellen Modus abfragen
const currentMode = particleManager.getBoundaryMode();
```

### Über UI

Benutzer können den Modus über das Dropdown-Menü "Randverhalten" wechseln:
1. **Abprallen** - Teilchen prallen von Wänden ab
2. **Durchgang (Wrap-around)** - Teilchen gehen durch Wände

## Vergleich

| Aspekt | Abprallen | Durchgang |
|--------|-----------|-----------|
| Energieerhaltung | ⚠️ Leichte Verluste | ✅ Perfekt |
| Realismus | ✅ Physikalisch | ⚠️ Abstrakt |
| Visualisierung | ✅ Intuitiv | ⚠️ Sprünge |
| Wandkollisionen | ⚠️ Ja | ✅ Nein |
| Unendlicher Raum | ❌ Nein | ✅ Ja |
| Komplexität | Mittel | Einfach |

## Empfehlungen

**Verwende Abprallen (Bounce) für:**
- Realistische Simulationen
- Geschlossene Systeme
- Visualisierungen für Präsentationen
- Wenn Wandkollisionen wichtig sind

**Verwende Durchgang (Wrap-around) für:**
- Periodische Systeme
- Unendliche Räume
- Energieerhaltung
- Wissenschaftliche Simulationen

## Technische Details

### Elastizität

Die Elastizität bestimmt, wie viel Energie bei einem Bounce erhalten bleibt:

```
e = 0.0: Vollständig inelastisch (kein Bounce)
e = 0.5: Stark gedämpft
e = 0.8: Leicht gedämpft (Standard)
e = 1.0: Perfekt elastisch (keine Dämpfung)
```

### Reibung

Die Reibung wird nur bei Wandkollisionen angewendet:

```
friction = 0.95 (5% Energieverlust)
```

### Penetrations-Dämpfung

Bei tiefer Penetration (>10% des Radius) wird zusätzliche Dämpfung angewendet:

```
if (penetration > radius * 0.1) {
  velocity *= 0.5;
}
```

Dies verhindert Jittering und instabiles Verhalten.

## Zusammenfassung

Die Simulation bietet zwei Modi für das Randverhalten:

1. **Abprallen (Bounce)** - Standard, realistisch, leichte Dämpfung
2. **Durchgang (Wrap-around)** - Periodisch, energieerhaltend, unendlicher Raum

Beide Modi sind über die UI global auswählbar und funktionieren für Partikel und Konglomerate. Der Modus kann jederzeit während der Simulation gewechselt werden.
