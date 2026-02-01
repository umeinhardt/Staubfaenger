# Staubkorn-Aggregation als Bildschirmschoner

Diese Simulation kann als Bildschirmschoner verwendet werden!

## Features

- **Vollbild-Darstellung**: Nutzt den gesamten Bildschirm
- **Keine Kontrollleiste**: Sauberes, minimalistisches Design
- **Automatische Kamera-Rotation**: Die Kamera dreht sich langsam um die Simulation
- **Beenden bei Interaktion**: Mausbewegung, Tastendruck oder Klick beendet den Bildschirmschoner
- **Performance-optimiert**: Begrenzte Teilchenanzahl für flüssige Darstellung

## Verwendung

### Als Web-Bildschirmschoner (Browser)

1. **Starten Sie den Development Server:**
   ```bash
   npm run dev
   ```

2. **Öffnen Sie die Bildschirmschoner-Version:**
   - Navigieren Sie zu: `http://localhost:5173/screensaver.html`
   - Drücken Sie `F11` für Vollbild-Modus

3. **Beenden:**
   - Bewegen Sie die Maus
   - Drücken Sie eine beliebige Taste
   - Klicken Sie mit der Maus
   - Drücken Sie `ESC` (um Vollbild zu verlassen)

### Als Desktop-Bildschirmschoner (Windows)

1. **Build erstellen:**
   ```bash
   npm run build
   ```

2. **Electron-Wrapper erstellen** (optional):
   - Installieren Sie Electron: `npm install --save-dev electron`
   - Erstellen Sie eine `screensaver.js` Datei für Electron
   - Packen Sie die Anwendung als `.scr` Datei

3. **Alternative: Browser im Kiosk-Modus:**
   - Chrome: `chrome.exe --kiosk --app=file:///path/to/dist/screensaver.html`
   - Edge: `msedge.exe --kiosk --app=file:///path/to/dist/screensaver.html`

### Als Desktop-Bildschirmschoner (macOS)

1. **Build erstellen:**
   ```bash
   npm run build
   ```

2. **WebView-Bildschirmschoner erstellen:**
   - Verwenden Sie ein Tool wie "WebViewScreenSaver"
   - Oder erstellen Sie einen nativen Bildschirmschoner mit Swift/Objective-C

### Als Desktop-Bildschirmschoner (Linux)

1. **Build erstellen:**
   ```bash
   npm run build
   ```

2. **XScreenSaver konfigurieren:**
   - Erstellen Sie ein Wrapper-Script, das einen Browser im Vollbild-Modus startet
   - Fügen Sie es zur XScreenSaver-Konfiguration hinzu

## Anpassungen

Sie können die Bildschirmschoner-Einstellungen in `screensaver.html` anpassen:

```javascript
// Teilchen-Konfiguration
const particleSpawnConfig = {
  spawnRate: 3.0,           // Teilchen pro Sekunde
  massRange: [1, 10],       // Massenbereich
  energyRange: [10, 100],   // Energiebereich
  maxParticles: 100         // Maximale Teilchenanzahl
};

// Kamera-Rotation
const cameraRotationSpeed = 0.05; // Geschwindigkeit der Kamera-Rotation

// Farbmodus
const renderConfig = {
  colorMode: 'velocity',    // 'mass', 'velocity', 'energy', oder 'age'
  showVelocityVectors: false
};
```

## Tipps

- **Performance**: Reduzieren Sie `maxParticles` für bessere Performance auf älteren Systemen
- **Visuelle Effekte**: Ändern Sie `colorMode` für verschiedene visuelle Stile
- **Kamera**: Passen Sie `cameraRotationSpeed` an für schnellere/langsamere Rotation
- **Teilchen**: Erhöhen Sie `spawnRate` für mehr Action

## Bekannte Einschränkungen

- Die Web-Version kann nicht als echter System-Bildschirmschoner installiert werden
- Für einen echten Bildschirmschoner benötigen Sie einen nativen Wrapper (Electron, WebView, etc.)
- Die Simulation läuft kontinuierlich und verbraucht CPU/GPU-Ressourcen

## Lizenz

Siehe Haupt-README für Lizenzinformationen.
