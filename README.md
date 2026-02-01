# Staubkorn-Aggregationssimulation

Eine 3D-Physiksimulation zur Darstellung der Aggregation von Staubkörnern unter Gravitationseinfluss mit **Multi-Threading** und **Code-Optimierung**.

## ✨ Features

- 🎮 **Interaktive 3D-Visualisierung** mit Three.js
- ⚡ **Multi-Threading** mit Web Workers (bis zu 12x schneller)
- 🚀 **Code-Optimierung** für minimale Objekt-Erstellung
- 🌌 **Realistische Physik** mit Gravitation, Kollisionen und Rotation
- 🎨 **Flexible Visualisierung** (Masse, Geschwindigkeit, Energie, Alter)
- 🔧 **Umfangreiche Steuerung** über UI-Parameter
- 📱 **Responsive Design** mit Auto-Hide UI
- 💪 **Skaliert mit CPU-Kernen** (automatische Erkennung)

## Setup

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn

### Installation

```bash
npm install
```

## Entwicklung

### Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5173` verfügbar.

### Tests ausführen

```bash
# Alle Tests einmalig ausführen
npm test

# Tests im Watch-Modus
npm run test:watch
```

### Build

```bash
npm run build
```

## Projektstruktur

```
.
├── src/
│   ├── core/           # Kernkomponenten (Vector2D, etc.)
│   └── main.ts         # Haupteinstiegspunkt
├── tests/
│   ├── unit/           # Unit-Tests
│   ├── properties/     # Property-Based Tests
│   └── integration/    # Integrationstests
├── index.html          # HTML-Einstiegspunkt
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Technologie-Stack

- **TypeScript**: Typsichere Entwicklung
- **Vite**: Build-Tool und Entwicklungsserver
- **Vitest**: Test-Framework
- **fast-check**: Property-Based Testing
- **HTML5 Canvas**: Rendering
