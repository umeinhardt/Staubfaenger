# GitHub Repository Setup & Release-Anleitung

## Übersicht

Dieses Repository nutzt GitHub für:
- **Quellcode-Verwaltung** (main Branch)
- **Live-Demo** (GitHub Pages)
- **Automatische Installer-Erstellung** (GitHub Actions)
- **Release-Downloads** (Windows, Mac, Linux)

## Standard-Branch auf `main` setzen

Falls dein GitHub-Repository standardmäßig den `gh-pages` Branch zeigt:

### Schritt 1: GitHub Repository-Einstellungen öffnen

1. Gehe zu: https://github.com/umeinhardt/Staubfaenger
2. Klicke auf **Settings** (oben rechts)
3. Im linken Menü: **Branches** (unter "Code and automation")

### Schritt 2: Default Branch ändern

1. Bei "Default branch" siehst du aktuell `gh-pages`
2. Klicke auf den **Pfeil-Button** (⇄) neben dem Branch-Namen
3. Wähle **`main`** aus der Liste
4. Klicke **Update**
5. Bestätige mit **"I understand, update the default branch"**

### Schritt 3: Fertig!

Jetzt zeigt GitHub standardmäßig den `main` Branch mit dem kompletten Quellcode.

## Branch-Übersicht

Dein Repository hat zwei Branches:

### `main` Branch (Quellcode)
- Kompletter TypeScript/JavaScript Quellcode
- Tests und Dokumentation
- Build-Scripts
- GitHub Actions Workflows
- **Das ist der Branch für Entwicklung!**

### `gh-pages` Branch (Live-Demo)
- Nur die gebaute Website (index.html + assets)
- Wird automatisch von `npm run deploy` erstellt
- Für GitHub Pages (Live-Demo im Browser)
- **Nicht manuell bearbeiten!**

## GitHub Pages (Live-Demo)

Falls du die Live-Demo aktivieren möchtest:

1. Gehe zu **Settings** → **Pages**
2. Bei "Source": Wähle **Deploy from a branch**
3. Bei "Branch": Wähle **`gh-pages`** und **`/ (root)`**
4. Klicke **Save**

Deine Simulation ist dann live unter:
**https://umeinhardt.github.io/Staubfaenger/**

Um die Live-Demo zu aktualisieren:
```bash
npm run deploy
```

## Zusammenfassung

- **Quellcode ansehen**: Branch `main` auf GitHub
- **Live-Demo ansehen**: https://umeinhardt.github.io/Staubfaenger/ (nach Aktivierung)
- **Entwickeln**: Immer im `main` Branch arbeiten
- **Deployen**: `npm run deploy` pusht automatisch zu `gh-pages`

---

## Release erstellen (Installer für Windows, Mac, Linux)

GitHub Actions erstellt automatisch Installer für alle Plattformen, wenn du einen Release-Tag erstellst.

### Schritt 1: Version in package.json aktualisieren

Öffne `package.json` und ändere die Version:
```json
{
  "version": "1.0.1"
}
```

### Schritt 2: Änderungen committen

```bash
git add package.json
git commit -m "Bump version to 1.0.1"
git push
```

### Schritt 3: Release-Tag erstellen

```bash
git tag v1.0.1
git push --tags
```

### Schritt 4: GitHub Actions arbeitet automatisch

Nach dem Push des Tags:
1. GitHub Actions startet automatisch (dauert ca. 10-15 Minuten)
2. Baut die App auf Windows, Mac und Linux
3. Erstellt einen Release mit allen Installern

### Schritt 5: Release auf GitHub ansehen

Gehe zu: https://github.com/umeinhardt/Staubfaenger/releases

Dort findest du:
- **Windows**: `Dust Particle Aggregation Setup 1.0.1.exe`
- **macOS**: `Dust Particle Aggregation-1.0.1.dmg` und `.zip`
- **Linux**: `Dust Particle Aggregation-1.0.1.AppImage` und `.deb`

### Fortschritt überwachen

Den Build-Status siehst du unter:
https://github.com/umeinhardt/Staubfaenger/actions

### Lokale Installer erstellen (optional)

Falls du lokal testen möchtest:

```bash
# Nur Windows (auf Windows)
npm run electron:build:win

# Nur Mac (auf Mac)
npm run electron:build:mac

# Nur Linux (auf Linux)
npm run electron:build:linux
```

Die Installer landen im `release/` Ordner.

### Troubleshooting

**Problem**: GitHub Actions schlägt fehl
- Prüfe die Logs unter "Actions" Tab
- Stelle sicher, dass `package.json` und `package-lock.json` committed sind

**Problem**: Release wird nicht erstellt
- Prüfe, ob der Tag mit `v` beginnt (z.B. `v1.0.0`)
- Stelle sicher, dass GitHub Actions aktiviert ist (Settings → Actions → Allow all actions)

**Problem**: Mac-Build schlägt fehl wegen Code-Signing
- Das ist normal ohne Apple Developer Account
- Der Build funktioniert trotzdem, nur ohne Signatur
- Nutzer müssen beim ersten Start "Öffnen" im Kontextmenü wählen
