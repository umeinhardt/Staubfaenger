# Anleitung: .exe erstellen

## Schnellstart

### 1. Electron-Abhängigkeiten installieren

```bash
npm install --save-dev electron electron-builder
```

### 2. Build erstellen

```bash
npm run build
npm run electron:build
```

Die fertige .exe findest du dann im Ordner `release/`.

---

## Detaillierte Schritte

### Schritt 1: Abhängigkeiten installieren

Öffne ein Terminal im Projektordner und führe aus:

```bash
npm install --save-dev electron electron-builder
```

Dies installiert:
- **electron**: Die Desktop-App-Plattform
- **electron-builder**: Tool zum Erstellen der .exe

### Schritt 2: Anwendung bauen

```bash
npm run build
```

Dies kompiliert TypeScript und erstellt die optimierten Dateien im `dist/` Ordner.

### Schritt 3: .exe erstellen

```bash
npm run electron:build
```

Dies verpackt die Anwendung in eine Windows .exe. Der Prozess dauert einige Minuten.

### Schritt 4: .exe finden

Die fertige Anwendung findest du in:
```
release/Dust Particle Aggregation Setup 1.0.0.exe
```

---

## Testen vor dem Build

Du kannst die Electron-Version testen, bevor du die .exe erstellst:

```bash
npm run dev
```

In einem zweiten Terminal:

```bash
npm run electron:dev
```

---

## Anpassungen

### App-Name ändern

In `package.json` unter `"build"` → `"productName"`:

```json
"productName": "Dein App Name"
```

### Icon hinzufügen

1. Erstelle ein Icon im .ico Format (256x256 px)
2. Speichere es als `icon.ico` im Projektordner
3. Das Icon wird automatisch verwendet

### Version ändern

In `package.json`:

```json
"version": "1.0.0"
```

---

## Troubleshooting

### "electron not found"

Stelle sicher, dass die Installation erfolgreich war:

```bash
npm install --save-dev electron electron-builder
```

### Build schlägt fehl

Lösche `node_modules` und installiere neu:

```bash
rmdir /s /q node_modules
npm install
```

### .exe startet nicht

Prüfe, ob der normale Build funktioniert:

```bash
npm run build
npm run dev
```

Öffne dann http://localhost:5173 im Browser.

---

## Größe reduzieren

Die .exe ist ~150-200 MB groß, da Chromium enthalten ist. Um die Größe zu reduzieren:

1. **Portable Version**: Erstelle eine portable .exe ohne Installer
2. **Tauri verwenden**: Alternative zu Electron (siehe DISTRIBUTION.md)
3. **Web-Version**: Verteile nur die HTML-Dateien aus `dist/`

---

## Distribution

### Installer verteilen

Die erstellte .exe ist ein Installer. Nutzer können:
1. Die .exe herunterladen
2. Doppelklick zum Installieren
3. Die App aus dem Startmenü starten

### Portable Version

Für eine portable Version ohne Installation, ändere in `package.json`:

```json
"win": {
  "target": "portable"
}
```

Dann neu bauen mit `npm run electron:build`.
