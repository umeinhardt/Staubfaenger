# Einfache Distribution - Statische HTML-Dateien

Da Electron Probleme mit der ES-Module-Konfiguration hat, hier die einfachste Lösung:

## Schnellstart

### Für Entwicklung:
```bash
npm run dev
```
Öffne dann http://localhost:5173

### Für Distribution:

**Option 1: Mit lokalem Server (empfohlen)**

```bash
npm run start
```

Dies baut die Anwendung und startet einen lokalen Server auf http://localhost:8080

**Option 2: Nur Server starten (wenn bereits gebaut)**

```bash
npm run serve
```

**Option 3: Windows Batch-Datei**

Doppelklick auf `START.bat` - startet automatisch den Server

## ⚠️ Browser-Cache Problem

**Wichtig:** Wenn du Änderungen am Code machst und diese nicht im Browser sichtbar sind, liegt das am Browser-Cache!

### Lösung 1: Hard Refresh (Schnellste Methode)
Drücke im Browser: **`Strg + Shift + R`** (Windows) oder **`Cmd + Shift + R`** (Mac)

### Lösung 2: Cache komplett leeren
1. Öffne Developer Tools mit `F12`
2. Rechtsklick auf den Reload-Button (neben der Adressleiste)
3. Wähle "Cache leeren und hart neu laden" / "Empty Cache and Hard Reload"

### Was wurde gemacht:
- Der Server (`serve-dist.cjs`) sendet jetzt Cache-Control-Header
- Diese sagen dem Browser, dass er keine Dateien cachen soll
- Trotzdem können bereits gecachte Dateien noch im Browser sein
- Deshalb ist ein Hard Refresh nach jedem Build notwendig

## Distribution an andere Nutzer

### Methode 1: Mit Server-Script (Empfohlen)

1. Erstelle einen Ordner mit:
   - `dist/` (kompletter Ordner nach `npm run build`)
   - `serve-dist.js`
   - `START.bat` (für Windows)
   - `package.json` (nur für node_modules)

2. Nutzer müssen nur:
   - Node.js installiert haben
   - `START.bat` doppelklicken (Windows)
   - ODER `node serve-dist.js` ausführen

### Methode 2: Python Server

Wenn Python installiert ist:

```bash
cd dist
python -m http.server 8000
```

Dann öffne: http://localhost:8000

### Methode 3: Live Server Extension

In VS Code:
1. Installiere "Live Server" Extension
2. Rechtsklick auf `dist/index.html`
3. "Open with Live Server"

## Warum braucht man einen Server?

Browser blockieren ES-Module aus Sicherheitsgründen, wenn sie direkt von `file://` URLs geladen werden. Ein lokaler Webserver umgeht diese Einschränkung.

## Vorteile dieser Lösung

- ✅ Keine Installation nötig (außer Node.js)
- ✅ Funktioniert auf allen Plattformen
- ✅ Sehr kleine Dateigröße (~2-3 MB)
- ✅ Einfach zu verteilen
- ✅ Keine Berechtigungsprobleme

## Screensaver-Version

Die `screensaver.html` funktioniert genauso - einfach über den Server öffnen:

http://localhost:8080/screensaver.html

Drücke F11 für Vollbild.
