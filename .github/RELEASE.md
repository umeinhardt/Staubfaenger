# Release-Anleitung

## Automatische Releases mit GitHub Actions

Dieses Projekt nutzt GitHub Actions, um automatisch Electron-Builds zu erstellen und als GitHub Releases zu veröffentlichen.

## Einen neuen Release erstellen

### 1. Version in package.json aktualisieren

Bearbeite `package.json` und `electron-package.json` und erhöhe die Versionsnummer:

```json
{
  "version": "1.0.1"
}
```

### 2. Änderungen committen

```bash
git add package.json electron-package.json
git commit -m "chore: bump version to 1.0.1"
```

### 3. Git-Tag erstellen

```bash
git tag v1.0.1
```

### 4. Tag zu GitHub pushen

```bash
git push origin main
git push origin v1.0.1
```

### 5. Automatischer Build

GitHub Actions wird automatisch:
- Den Code bauen
- Electron-Executables erstellen
- Einen neuen Release mit den Downloads erstellen

Der Build dauert ca. 5-10 Minuten. Du kannst den Fortschritt unter "Actions" in deinem GitHub-Repository verfolgen.

## Release-Assets

Nach erfolgreichem Build werden folgende Dateien verfügbar sein:

- **DustParticleAggregation-Windows-Setup.exe** - Installer für Windows
- **DustParticleAggregation-Windows-Portable.zip** - Portable Version (ohne Installation)

## Lokaler Build (ohne GitHub Actions)

Falls du lokal bauen möchtest:

```bash
npm run build
npm run build:electron
```

Die Builds findest du dann im `release/` Ordner.

## Versionsschema

Wir verwenden [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x): Breaking Changes
- **MINOR** (x.1.x): Neue Features (rückwärtskompatibel)
- **PATCH** (x.x.1): Bugfixes

Beispiele:
- `v1.0.0` - Erste stabile Version
- `v1.1.0` - Neue Features hinzugefügt
- `v1.1.1` - Bugfixes
- `v2.0.0` - Breaking Changes

## Troubleshooting

### Build schlägt fehl

1. Prüfe die Logs unter "Actions" in GitHub
2. Stelle sicher, dass `package.json` und `electron-package.json` die gleiche Version haben
3. Teste den Build lokal mit `npm run build:electron`

### Tag existiert bereits

Falls du einen Tag löschen musst:

```bash
# Lokal löschen
git tag -d v1.0.1

# Remote löschen
git push origin :refs/tags/v1.0.1
```

Dann kannst du den Tag neu erstellen.
