# macOS Anleitung

## 3 Wege, die Simulation auf macOS zu nutzen

### ✅ Option 1: Im Browser (Empfohlen - Am Einfachsten!)

**Keine Installation nötig!**

1. Öffne Safari, Chrome oder Firefox
2. Gehe zu: https://umeinhardt.github.io/Staubfaenger/
3. Fertig! Die Simulation läuft direkt im Browser

**Vorteile:**
- Funktioniert sofort
- Keine Installation
- Immer die neueste Version
- Funktioniert auch auf iPad/iPhone

---

### ✅ Option 2: Als macOS App (Electron)

**Native macOS App mit Icon im Dock**

#### Download (nach dem ersten Release):

1. Gehe zu: https://github.com/umeinhardt/Staubfaenger/releases
2. Lade eine dieser Dateien herunter:
   - **DustParticleAggregation-macOS.dmg** (Empfohlen)
   - **DustParticleAggregation-macOS.zip** (Portable)

#### Installation (DMG):

1. Öffne die heruntergeladene `.dmg` Datei
2. Ziehe die App in den "Applications" Ordner
3. Öffne die App aus dem Applications Ordner
4. Bei der ersten Öffnung: Rechtsklick → "Öffnen" (wegen Gatekeeper)

#### Installation (ZIP):

1. Entpacke die `.zip` Datei
2. Ziehe die App in den Applications Ordner
3. Rechtsklick → "Öffnen"

**Hinweis:** macOS zeigt eine Warnung, weil die App nicht signiert ist. Das ist normal. Klicke auf "Öffnen" um fortzufahren.

---

### ✅ Option 3: Lokal entwickeln

**Für Entwickler, die am Code arbeiten möchten**

#### Voraussetzungen:

```bash
# Node.js installieren (falls noch nicht vorhanden)
# Download von: https://nodejs.org/

# Oder mit Homebrew:
brew install node
```

#### Projekt klonen und starten:

```bash
# Repository klonen
git clone https://github.com/umeinhardt/Staubfaenger.git
cd Staubfaenger

# Dependencies installieren
npm install

# Im Browser starten (Development Mode)
npm run dev

# Oder als Electron App starten
npm run electron:dev
```

#### Eigene macOS App bauen:

```bash
# Projekt bauen
npm run build

# macOS App erstellen
npm run electron:build
```

Die fertige App findest du dann in `release/mac/`.

---

## Systemanforderungen

- **macOS:** 10.13 (High Sierra) oder neuer
- **Browser:** Safari 14+, Chrome 90+, Firefox 88+
- **RAM:** Mindestens 4 GB (8 GB empfohlen)
- **GPU:** Jede moderne GPU (für 3D-Rendering)

---

## Tastenkombinationen

- **Mausrad:** Zoom
- **Linke Maustaste + Ziehen:** Kamera drehen
- **Rechte Maustaste + Ziehen:** Kamera verschieben
- **Leertaste:** Pause/Play
- **R:** Reset

---

## Probleme?

### "Die App kann nicht geöffnet werden"

**Lösung:**
1. Rechtsklick auf die App
2. Wähle "Öffnen"
3. Klicke im Dialog auf "Öffnen"

Oder in den Systemeinstellungen:
1. Systemeinstellungen → Sicherheit
2. Klicke auf "Trotzdem öffnen"

### "Die App ist beschädigt"

**Lösung:**
```bash
# Terminal öffnen und eingeben:
xattr -cr /Applications/Dust\ Particle\ Aggregation.app
```

### Performance-Probleme

- Schließe andere Programme
- Reduziere die Teilchenanzahl in den Einstellungen
- Nutze Chrome statt Safari (bessere WebGL-Performance)

---

## Weitere Infos

- **GitHub:** https://github.com/umeinhardt/Staubfaenger
- **Live-Demo:** https://umeinhardt.github.io/Staubfaenger/
- **Dokumentation:** Siehe README.md im Repository

---

## Für Entwickler

### macOS-spezifische Build-Optionen

In `package.json` kannst du die macOS-Build-Konfiguration anpassen:

```json
"mac": {
  "target": ["dmg", "zip"],
  "category": "public.app-category.education",
  "icon": "icon.icns"
}
```

### Icon erstellen

Für ein macOS Icon brauchst du eine `.icns` Datei:

```bash
# PNG zu ICNS konvertieren (benötigt iconutil)
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

---

## Viel Spaß mit der Simulation! 🎉
