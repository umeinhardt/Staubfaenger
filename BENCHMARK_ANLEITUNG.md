# Benchmark Anleitung

## Übersicht

Das Projekt enthält jetzt ein Benchmark-Tool, um die WebGPU-Performance-Optimierungen zu testen. Der Benchmark vergleicht:

- **Physics Modes**: CPU vs Web Workers vs GPU (WebGPU)
- **Rendering Modes**: Individual Meshes vs Instanced Rendering
- **Particle Counts**: Verschiedene Partikelanzahlen (500, 1000, 2000, etc.)

## Benchmark ausführen

### Schritt 1: Projekt starten

```bash
npm run dev
```

Oder öffne die bereits gebaute Version:
```bash
npm run build
# Dann öffne dist/index.html im Browser
```

### Schritt 2: Browser-Konsole öffnen

- Drücke `F12` (Windows/Linux) oder `Cmd+Option+I` (Mac)
- Wechsle zum "Console" Tab

### Schritt 3: Benchmark starten

Es gibt zwei Benchmark-Optionen:

#### Quick Benchmark (~2 Minuten)
Testet kleinere Partikelanzahlen (500, 1000, 2000) mit CPU und GPU:

```javascript
runQuickBenchmark()
```

#### Full Benchmark (~10 Minuten)
Testet alle Kombinationen mit größeren Partikelanzahlen (1000, 2500, 5000, 10000):

```javascript
runFullBenchmark()
```

### Schritt 4: Ergebnisse ansehen

Die Ergebnisse werden automatisch in der Konsole angezeigt:

```
=== Benchmark Results ===

Best Configuration:
  Particle Count: 2000
  Physics Mode: gpu
  Rendering Mode: instanced
  FPS: 58.3

Performance Improvements:
  GPU vs CPU: 5.23x
  GPU vs Workers: 2.14x
  Instanced vs Individual: 2.87x

FPS Thresholds:
  60 FPS: 2000 particles
  30 FPS: 5000 particles
```

### Schritt 5: Ergebnisse exportieren

Die Ergebnisse sind automatisch im `window` Objekt gespeichert:

```javascript
// Ergebnisse als JSON herunterladen
downloadBenchmarkJSON()

// Ergebnisse als CSV herunterladen (für Excel)
downloadBenchmarkCSV()

// Oder direkt im Browser ansehen:
console.log(window.benchmarkReport)
console.table(window.benchmarkResults)
```

## Was wird gemessen?

Für jede Konfiguration misst der Benchmark:

- **Average FPS**: Durchschnittliche Frames pro Sekunde
- **Min/Max FPS**: Niedrigste und höchste FPS
- **Physics Time**: Zeit für Physik-Berechnungen (in Millisekunden)
- **Render Time**: Zeit für Rendering (in Millisekunden)
- **Total Frame Time**: Gesamtzeit pro Frame

## Erwartete Ergebnisse

Basierend auf den Requirements sollten wir sehen:

1. **GPU vs CPU**: 5-10x schnellere Physik-Berechnungen
2. **Instanced Rendering**: 2-3x schnelleres Rendering
3. **60 FPS**: Mit 5000+ Partikeln auf WebGPU-fähiger Hardware

## Troubleshooting

### "Simulation not initialized yet"
Warte ein paar Sekunden nach dem Laden der Seite, bis die Simulation vollständig initialisiert ist.

### WebGPU nicht verfügbar
Wenn dein Browser WebGPU nicht unterstützt, wird automatisch auf CPU/Workers zurückgefallen. Der Benchmark funktioniert trotzdem, aber die GPU-Tests werden übersprungen.

Unterstützte Browser:
- Chrome/Edge 113+
- Firefox 121+ (mit `dom.webgpu.enabled` in about:config)
- Safari 18+ (macOS)

### Benchmark läuft sehr langsam
Das ist normal! Der Benchmark testet absichtlich viele Partikel, um die Performance-Grenzen zu finden. Der Quick Benchmark ist schneller.

## Nächste Schritte

Nach dem Benchmark kannst du:

1. Die Ergebnisse mit den Requirements vergleichen
2. Probleme identifizieren (z.B. wenn GPU nicht schneller ist als CPU)
3. Die Implementierung debuggen und verbessern
4. Weitere Tests mit verschiedenen Konfigurationen durchführen

## Beispiel-Ausgabe

```
┌─────────┬───────────┬──────────┬──────────┬─────────┬─────────┬──────────────┬───────────────┐
│ (index) │ Particles │ Physics  │ Rendering│ Avg FPS │ Min FPS │ Physics (ms) │ Render (ms)   │
├─────────┼───────────┼──────────┼──────────┼─────────┼─────────┼──────────────┼───────────────┤
│    0    │    500    │  'cpu'   │'individual'│  45.2  │  38.1   │    12.34     │     9.87      │
│    1    │    500    │  'cpu'   │'instanced' │  58.7  │  52.3   │    12.28     │     4.12      │
│    2    │    500    │  'gpu'   │'individual'│  52.1  │  45.6   │     2.45     │     9.91      │
│    3    │    500    │  'gpu'   │'instanced' │  62.3  │  58.9   │     2.41     │     4.08      │
│   ...   │    ...    │   ...    │    ...     │   ...  │   ...   │     ...      │      ...      │
└─────────┴───────────┴──────────┴──────────┴─────────┴─────────┴──────────────┴───────────────┘
```
