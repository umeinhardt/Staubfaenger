# Distribution als .exe

## Option 1: Electron (Empfohlen)

Electron verpackt die Webanwendung mit Chromium in eine native Desktop-Anwendung.

### Installation

```bash
npm install --save-dev electron electron-builder
```

### Verwendung

1. Build erstellen:
```bash
npm run build
npm run electron:build
```

2. Die .exe findet sich dann in `dist/` oder `release/`

### Vorteile
- Native Desktop-Anwendung
- Funktioniert offline
- Professionelles Aussehen
- Einfache Installation für Endnutzer

### Nachteile
- Größere Dateigröße (~150-200 MB)
- Benötigt mehr Ressourcen

---

## Option 2: Statische HTML-Dateien

Die einfachste Methode - einfach die gebauten Dateien verteilen.

### Build erstellen

```bash
npm run build
```

Die Dateien im `dist/` Ordner können direkt im Browser geöffnet werden.

### Vorteile
- Sehr klein
- Keine Installation nötig
- Funktioniert in jedem Browser

### Nachteile
- Kein natives App-Gefühl
- Nutzer muss Browser öffnen

---

## Option 3: Tauri (Leichtgewichtig)

Moderne Alternative zu Electron, nutzt System-Browser statt Chromium.

### Installation

```bash
npm install --save-dev @tauri-apps/cli
```

Zusätzlich muss Rust installiert sein: https://www.rust-lang.org/tools/install

### Vorteile
- Viel kleinere Dateigröße (~5-10 MB)
- Schneller und ressourcenschonender

### Nachteile
- Komplexere Einrichtung
- Benötigt Rust-Installation

---

## Empfehlung

Für diese Anwendung empfehle ich **Electron**, da es:
- Einfach einzurichten ist
- Gut mit Vite funktioniert
- Eine professionelle Desktop-Erfahrung bietet
- Keine zusätzlichen Abhängigkeiten beim Nutzer erfordert
