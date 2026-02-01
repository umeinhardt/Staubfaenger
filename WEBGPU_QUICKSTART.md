# WebGPU Quick Start Guide

## Schnellstart

### 1. Build erstellen
```bash
npm run build
```

### 2. Simulation starten
```bash
npm run start
```
oder
```bash
START.bat
```

### 3. Browser öffnen
- **Chrome oder Edge** (Version 113+)
- http://localhost:8080

### 4. GPU-Status prüfen
- Öffne Console (F12)
- Suche nach: `WebGPU Physics: Enabled`

## GPU-Beschleunigung nutzen

### Automatisch (Empfohlen)
Die GPU wird automatisch genutzt wenn:
- ✅ Browser unterstützt WebGPU (Chrome/Edge 113+)
- ✅ Mehr als 200 Partikel vorhanden
- ✅ Checkbox "GPU-Beschleunigung" aktiviert

### Manuell testen

1. **Starte mit wenigen Partikeln:**
   - Max Teilchen: 100
   - Eintrittsrate: 5/s
   - Beobachte FPS

2. **Erhöhe Partikelzahl:**
   - Max Teilchen: 1000
   - Eintrittsrate: 10/s
   - GPU sollte jetzt aktiv sein

3. **Vergleiche Performance:**
   - GPU an: Checkbox aktiviert
   - GPU aus: Checkbox deaktiviert
   - Beobachte FPS-Unterschied

## Console-Befehle

```javascript
// GPU-Status prüfen
console.log('GPU:', physicsEngine.isUsingGPU());
console.log('Workers:', physicsEngine.isUsingWorkers());

// GPU ein/ausschalten
physicsEngine.setUseGPU(true);   // Aktivieren
physicsEngine.setUseGPU(false);  // Deaktivieren

// GPU-Schwellwert ändern
physicsEngine.setGPUThreshold(300);  // GPU nur bei >300 Partikeln
```

## Erwartete Performance

| Partikel | Ohne GPU | Mit GPU | Speedup |
|----------|----------|---------|---------|
| 100      | 55 FPS   | 60 FPS  | 1.1x    |
| 500      | 40 FPS   | 60 FPS  | 1.5x    |
| 1000     | 25 FPS   | 60 FPS  | 2.4x    |
| 2000     | 12 FPS   | 55 FPS  | 4.6x    |
| 5000     | 5 FPS    | 40 FPS  | 8x      |

## Troubleshooting

### GPU wird nicht erkannt

**Symptom:** Console zeigt "WebGPU not supported"

**Lösungen:**
1. Browser-Version prüfen (Chrome/Edge 113+)
2. Browser aktualisieren
3. Fallback auf Web Workers ist automatisch

### Performance schlechter als erwartet

**Symptom:** FPS niedriger als in Tabelle

**Lösungen:**
1. GPU deaktivieren (Checkbox aus)
2. Weniger Partikel spawnen
3. Genauigkeit auf 1 setzen
4. Zeitskala reduzieren (0.5x)

### Fehler in Console

**Symptom:** Rote Fehlermeldungen

**Lösungen:**
1. GPU wird automatisch deaktiviert
2. Web Workers übernehmen
3. Simulation läuft weiter

## Empfohlene Einstellungen

### Für GPU-Test (Chrome/Edge):
```
Max Teilchen: 2000
Eintrittsrate: 10/s
GPU-Beschleunigung: ✓
Genauigkeit: 1
Zeitskala: 1.0x
```

### Für Stabilität (alle Browser):
```
Max Teilchen: 500
Eintrittsrate: 5/s
GPU-Beschleunigung: ✓
Genauigkeit: 1
Zeitskala: 1.0x
```

## Weitere Informationen

- **Technische Details:** `WEBGPU_IMPLEMENTATION.md`
- **Integration:** `WEBGPU_INTEGRATION.md`
- **Performance:** `PERFORMANCE_OPTIMIZATION.md`

## Viel Spaß! 🚀

Die Simulation sollte jetzt auch mit tausenden von Partikeln flüssig laufen!
