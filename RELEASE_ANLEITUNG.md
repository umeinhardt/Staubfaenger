# Release-Anleitung

Schnellanleitung zum Erstellen eines neuen Releases mit Installern für Windows, Mac und Linux.

## Voraussetzungen

- Alle Änderungen sind committed und gepusht
- Du hast Schreibrechte auf das GitHub Repository
- GitHub Actions ist aktiviert

## Release erstellen (5 Schritte)

### 1. Version erhöhen

Öffne `package.json` und erhöhe die Version:

```json
{
  "version": "1.0.1"
}
```

Versionsnummern folgen [Semantic Versioning](https://semver.org/):
- **Major** (1.0.0 → 2.0.0): Breaking Changes
- **Minor** (1.0.0 → 1.1.0): Neue Features
- **Patch** (1.0.0 → 1.0.1): Bugfixes

### 2. Änderungen committen

```bash
git add package.json
git commit -m "Release v1.0.1"
git push
```

### 3. Tag erstellen und pushen

```bash
git tag v1.0.1
git push --tags
```

**Wichtig**: Der Tag muss mit `v` beginnen!

### 4. Warten (10-15 Minuten)

GitHub Actions baut jetzt automatisch:
- Windows Installer (.exe)
- macOS Installer (.dmg + .zip)
- Linux Installer (.AppImage + .deb)

Fortschritt ansehen: https://github.com/umeinhardt/Staubfaenger/actions

### 5. Release veröffentlichen

Nach erfolgreichem Build:
1. Gehe zu: https://github.com/umeinhardt/Staubfaenger/releases
2. Der neue Release ist automatisch erstellt
3. Alle Installer sind als Downloads verfügbar

## Was passiert automatisch?

GitHub Actions führt aus:
1. Code auschecken
2. Node.js installieren
3. Dependencies installieren (`npm ci`)
4. App bauen (`npm run build`)
5. Electron-Installer erstellen (parallel auf 3 Betriebssystemen)
6. Release mit allen Installern erstellen

## Lokaler Test vor Release

Teste lokal auf Windows:

```bash
npm run electron:build:win
```

Der Installer liegt dann in `release/Dust Particle Aggregation Setup 1.0.1.exe`

## Troubleshooting

### GitHub Actions schlägt fehl

**Fehler**: "npm ci" schlägt fehl
- Lösung: `package-lock.json` muss committed sein
- Führe lokal `npm install` aus und committe die Änderungen

**Fehler**: Build schlägt auf einer Plattform fehl
- Prüfe die Logs im Actions Tab
- Oft sind es fehlende Dependencies in `package.json`

**Fehler**: Release wird nicht erstellt
- Stelle sicher, dass der Tag mit `v` beginnt
- Prüfe, ob GitHub Actions aktiviert ist (Settings → Actions)

### Mac-Build ohne Code-Signing

Der Mac-Build funktioniert auch ohne Apple Developer Account, aber:
- Die App ist nicht signiert
- Nutzer sehen eine Warnung beim ersten Start
- Lösung für Nutzer: Rechtsklick → "Öffnen" statt Doppelklick

Um Code-Signing zu aktivieren (optional):
1. Apple Developer Account erstellen ($99/Jahr)
2. Zertifikat erstellen
3. GitHub Secrets hinzufügen: `CSC_LINK` und `CSC_KEY_PASSWORD`

## Nächste Schritte nach Release

1. **Release Notes bearbeiten** (optional)
   - Gehe zum Release auf GitHub
   - Klicke "Edit"
   - Füge Changelog hinzu

2. **Nutzer informieren**
   - Update im README.md
   - Social Media Post
   - E-Mail an Nutzer

3. **Live-Demo aktualisieren**
   ```bash
   npm run deploy
   ```

## Schnell-Referenz

```bash
# Version erhöhen in package.json, dann:
git add package.json
git commit -m "Release v1.0.1"
git push
git tag v1.0.1
git push --tags

# Fertig! GitHub Actions übernimmt den Rest.
```

## Weitere Informationen

- [GitHub Actions Workflow](.github/workflows/release.yml)
- [Electron Builder Dokumentation](https://www.electron.build/)
- [GitHub Setup Anleitung](GITHUB_SETUP.md)
