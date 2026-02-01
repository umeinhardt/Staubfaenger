# Schnellstart: Ersten Release erstellen

## So erstellst du deinen ersten Release mit automatischen Builds:

### Schritt 1: Einen Tag erstellen

```bash
git tag v1.0.0
```

### Schritt 2: Tag zu GitHub pushen

```bash
git push origin v1.0.0
```

### Schritt 3: Warten und beobachten

1. Gehe zu https://github.com/umeinhardt/Staubfaenger/actions
2. Du siehst dort den laufenden Build-Prozess
3. Nach ca. 5-10 Minuten ist der Build fertig

### Schritt 4: Release herunterladen

1. Gehe zu https://github.com/umeinhardt/Staubfaenger/releases
2. Du findest dort deinen neuen Release v1.0.0
3. Mit zwei Download-Optionen:
   - **DustParticleAggregation-Windows-Setup.exe** (Installer)
   - **DustParticleAggregation-Windows-Portable.zip** (Portable)

## Das war's! 🎉

Jedes Mal, wenn du einen neuen Tag pushst (z.B. v1.0.1, v1.1.0, v2.0.0), wird automatisch ein neuer Release mit frischen Builds erstellt.

## Nächste Releases

Für zukünftige Releases:

1. Ändere die Version in `package.json` und `electron-package.json`
2. Committe die Änderung: `git commit -am "chore: bump version to 1.0.1"`
3. Erstelle einen Tag: `git tag v1.0.1`
4. Pushe alles: `git push origin main && git push origin v1.0.1`

## Hinweis

Der erste Build kann etwas länger dauern, da GitHub Actions alle Dependencies herunterladen muss. Spätere Builds sind schneller durch Caching.

## Weitere Infos

Siehe `.github/RELEASE.md` für detaillierte Informationen und Troubleshooting.
