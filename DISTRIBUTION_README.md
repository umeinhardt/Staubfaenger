# Staubkorn-Aggregationssimulation

Eine interaktive 3D-Simulation der Aggregation von Staubpartikeln mit Physik-Engine.

## 🚀 Schnellstart

### Starten der Anwendung:

**Windows:**
```
Doppelklick auf START.bat
```

**Oder manuell:**
```bash
node serve-dist.cjs
```

Dann öffne im Browser: `http://localhost:8080`

## 📋 Systemanforderungen

- **Node.js** (Version 14 oder höher) - [Download](https://nodejs.org/)
- **Moderner Browser** (Chrome, Firefox, Edge, Safari)

## 🎮 Bedienung

### Maus-Steuerung:
- **Linke Maustaste + Ziehen:** Kamera rotieren
- **Rechte Maustaste + Ziehen:** Kamera verschieben
- **Mausrad:** Zoom

### UI-Steuerung:
- **Maus an untere Bildschirmkante:** UI einblenden
- **Maus wegbewegen:** UI verschwindet nach 3 Sekunden

### Steuerelemente:
- **Play/Pause:** Simulation starten/stoppen
- **Reset:** Simulation zurücksetzen
- **Injektion stoppen:** Keine neuen Partikel mehr
- **Eintrittsrate:** Geschwindigkeit der Partikel-Erzeugung
- **Masse/Energie:** Bereich für neue Partikel
- **Elastizität:** Wie stark Partikel abprallen (0 = kleben zusammen)
- **Farbkodierung:** Visualisierung nach Masse, Geschwindigkeit, Energie oder Alter
- **Keine Aggregation:** Partikel prallen nur ab, kleben nicht zusammen

## 🔧 Fehlerbehebung

### "Port 8080 bereits belegt"
Ein anderer Prozess nutzt Port 8080. Beende ihn oder ändere den Port in `serve-dist.cjs`.

### "Node.js nicht gefunden"
Installiere Node.js von [nodejs.org](https://nodejs.org/)

### "Änderungen nicht sichtbar"
Drücke im Browser: `Strg + Shift + R` (Hard Refresh)

### "Simulation läuft nicht"
- Öffne Browser-Console (F12)
- Prüfe auf Fehlermeldungen
- Stelle sicher, dass WebGL unterstützt wird

## 📦 Inhalt

```
distribution/
├── dist/              # Gebaute Anwendung
│   ├── index.html     # Haupt-HTML-Datei
│   └── assets/        # JavaScript und andere Assets
├── serve-dist.cjs     # Einfacher Webserver
├── START.bat          # Windows-Startskript
├── package.json       # Node.js Konfiguration
└── README.md          # Diese Datei
```

## 🌐 Alternative: Online-Version

Falls du die Anwendung online hosten möchtest, kannst du den `dist/` Ordner auf jeden Webserver hochladen:

- GitHub Pages
- Netlify
- Vercel
- Eigener Webserver

## 📝 Lizenz

[Deine Lizenz hier einfügen]

## 🆘 Support

Bei Problemen oder Fragen:
- Öffne ein Issue auf GitHub
- Kontaktiere [deine E-Mail]

---

**Viel Spaß mit der Simulation!** 🌟
