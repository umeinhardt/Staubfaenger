# GitHub Repository Setup

## Standard-Branch auf `main` setzen

Aktuell zeigt dein GitHub-Repository standardmäßig den `gh-pages` Branch (nur die gebaute Website). Um den Quellcode als Standard anzuzeigen:

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
