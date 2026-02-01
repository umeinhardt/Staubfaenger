# Projekt-Übersicht - Wo ist was?

## 📁 Dein Computer (Lokal)

```
D:\GitHub.local\Staubfaenger\
├── src/                    ← Dein Code (TypeScript)
├── tests/                  ← Tests
├── dist/                   ← Gebaute Website (nach npm run build)
├── release/                ← Electron-Apps (nach npm run electron:build)
├── node_modules/           ← Installierte Pakete
├── index.html              ← Haupt-HTML-Datei
├── package.json            ← Projekt-Konfiguration
└── README.md               ← Projekt-Beschreibung
```

**Das ist dein Arbeitsplatz!** Hier änderst du Dateien.

---

## ☁️ GitHub (Internet)

### Branch: `main` (Quellcode)
👉 https://github.com/umeinhardt/Staubfaenger/tree/main

```
Staubfaenger/
├── src/                    ← Dein Code
├── tests/                  ← Tests
├── .github/                ← Automatische Builds
├── README.md               ← Projekt-Beschreibung
└── alle anderen Dateien
```

**Das ist dein Backup!** Hier ist alles gesichert.

### Branch: `gh-pages` (Website)
👉 https://github.com/umeinhardt/Staubfaenger/tree/gh-pages

```
Staubfaenger/
├── index.html              ← Gebaute Website
└── assets/                 ← JavaScript & CSS
```

**Das ist nur für die Live-Demo!** Wird automatisch erstellt.

---

## 🌐 Live-Demo (GitHub Pages)

👉 https://umeinhardt.github.io/Staubfaenger/

**Das ist die laufende Simulation!** Jeder kann sie im Browser öffnen.

---

## 🔄 Wie hängt das zusammen?

```
┌─────────────────┐
│  Dein Computer  │
│                 │
│  Code ändern    │
└────────┬────────┘
         │
         │ git push origin main
         ↓
┌─────────────────┐
│  GitHub (main)  │
│                 │
│  Code sichern   │
└────────┬────────┘
         │
         │ npm run deploy
         ↓
┌─────────────────┐
│ GitHub (gh-pages)│
│                 │
│  Gebaute Website│
└────────┬────────┘
         │
         │ automatisch
         ↓
┌─────────────────┐
│  GitHub Pages   │
│                 │
│  Live-Demo      │
└─────────────────┘
```

---

## 📝 Typischer Workflow

### Szenario 1: Code ändern

```
1. Datei in VS Code ändern
2. git add .
3. git commit -m "Beschreibung"
4. git push origin main
   
✅ Jetzt ist es auf GitHub gesichert!
```

### Szenario 2: Website aktualisieren

```
1. npm run deploy

✅ Website ist jetzt live!
```

### Szenario 3: Release erstellen

```
1. git tag v1.0.0
2. git push origin v1.0.0

✅ GitHub Actions erstellt automatisch Downloads!
```

---

## 🎯 Wichtige Links (Lesezeichen setzen!)

| Was                  | Link                                                    |
|----------------------|---------------------------------------------------------|
| **Quellcode**        | https://github.com/umeinhardt/Staubfaenger/tree/main   |
| **Live-Demo**        | https://umeinhardt.github.io/Staubfaenger/             |
| **Releases**         | https://github.com/umeinhardt/Staubfaenger/releases    |
| **Actions (Builds)** | https://github.com/umeinhardt/Staubfaenger/actions     |

---

## ❓ Schnelle Antworten

### "Wo ist mein Code auf GitHub?"
→ https://github.com/umeinhardt/Staubfaenger/tree/main

### "Wo kann ich die Simulation ausprobieren?"
→ https://umeinhardt.github.io/Staubfaenger/

### "Wo kann ich die .exe herunterladen?"
→ https://github.com/umeinhardt/Staubfaenger/releases (nach dem ersten Release)

### "Wo sehe ich, ob der Build läuft?"
→ https://github.com/umeinhardt/Staubfaenger/actions

---

## 💡 Tipp

Setze diese 3 Links als Lesezeichen:
1. **Quellcode:** https://github.com/umeinhardt/Staubfaenger/tree/main
2. **Live-Demo:** https://umeinhardt.github.io/Staubfaenger/
3. **Releases:** https://github.com/umeinhardt/Staubfaenger/releases

Dann findest du immer alles sofort! 🎉
