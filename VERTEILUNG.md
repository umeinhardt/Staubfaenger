# Verteilungs-Optionen für Staubkorn-Aggregationssimulation

## 🎯 Empfohlene Methoden (nach Einfachheit sortiert)

### 1. 🌐 GitHub Pages (Am Einfachsten - Online)

**Vorteile:**
- ✅ Kostenlos
- ✅ Keine Installation für Nutzer nötig
- ✅ Weltweit verfügbar über URL
- ✅ Automatische Updates

**Schritte:**
```bash
# Einmalig: gh-pages installieren
npm install --save-dev gh-pages

# Bei jedem Update:
npm run build
npx gh-pages -d dist
```

**Oder einfach:**
```bash
deploy-github-pages.bat
```

**Dann:** Aktiviere GitHub Pages in Repository-Einstellungen → Pages → Source: gh-pages branch

**Ergebnis:** `https://[dein-username].github.io/[repo-name]/`

---

### 2. 📦 Portable ZIP-Paket (Einfach - Offline)

**Vorteile:**
- ✅ Funktioniert offline
- ✅ Keine Installation außer Node.js
- ✅ Einfach zu verteilen

**Erstellen:**
```bash
create-distribution.bat
```

**Ergebnis:** 
- Ordner `distribution/` mit allem Nötigen
- Komprimiere zu ZIP
- Nutzer: Entpacken → START.bat doppelklicken

**Größe:** ~2-3 MB

---

### 3. 📄 Standalone HTML (Sehr Einfach - Einzeldatei)

**Vorteile:**
- ✅ Nur eine Datei
- ✅ Kann per E-Mail verschickt werden
- ✅ Funktioniert auf jedem Webserver

**Erstellen:**
```bash
create-standalone.bat
```

**Ergebnis:** `standalone.html` (~560 KB)

**Nutzung:**
- Auf Webserver hochladen, ODER
- Mit lokalem Server öffnen: `python -m http.server`

**Hinweis:** Funktioniert nicht direkt per Doppelklick (Browser-Sicherheit)

---

### 4. 🖥️ Electron Desktop App (Komplex - Native App)

**Vorteile:**
- ✅ Echte Desktop-Anwendung (.exe)
- ✅ Keine Browser nötig
- ✅ Professionelles Aussehen

**Nachteile:**
- ❌ Große Dateigröße (~150 MB)
- ❌ Komplexe Konfiguration
- ❌ Hatte Probleme (siehe DISTRIBUTION.md)

**Status:** Nicht empfohlen (siehe frühere Versuche)

---

## 🚀 Schnellstart-Empfehlung

### Für persönliche Nutzung:
```bash
START.bat
```
Öffne: `http://localhost:8080`

### Für Freunde/Kollegen (lokal):
```bash
create-distribution.bat
```
Sende ihnen die ZIP-Datei

### Für öffentliche Verfügbarkeit:
```bash
deploy-github-pages.bat
```
Teile die URL

---

## 📋 Vergleichstabelle

| Methode | Größe | Installation | Offline | Einfachheit |
|---------|-------|--------------|---------|-------------|
| GitHub Pages | - | Keine | ❌ | ⭐⭐⭐⭐⭐ |
| ZIP-Paket | 2-3 MB | Node.js | ✅ | ⭐⭐⭐⭐ |
| Standalone HTML | 560 KB | Webserver | ✅ | ⭐⭐⭐ |
| Electron | 150 MB | Keine | ✅ | ⭐ |

---

## 🔧 Technische Details

### Was ist in der Distribution enthalten?

**Minimal (ZIP-Paket):**
- `dist/` - Gebaute Anwendung
- `serve-dist.cjs` - Einfacher Webserver
- `START.bat` - Startskript
- `package.json` - Node.js Konfiguration

**Standalone:**
- `standalone.html` - Alles in einer Datei

### Systemanforderungen für Nutzer

**GitHub Pages / Standalone:**
- Moderner Browser (Chrome, Firefox, Edge, Safari)
- Internetverbindung (nur für GitHub Pages)

**ZIP-Paket:**
- Node.js (Version 14+)
- Moderner Browser

**Electron:**
- Windows 10+ / macOS 10.13+ / Linux
- Keine zusätzliche Software

---

## 💡 Tipps

### Für maximale Kompatibilität:
Nutze **GitHub Pages** - funktioniert überall, keine Installation

### Für Offline-Nutzung:
Nutze **ZIP-Paket** - einfach und zuverlässig

### Für E-Mail-Versand:
Nutze **Standalone HTML** - kleine Dateigröße

### Für professionelle Distribution:
Electron wäre ideal, aber die Konfiguration ist komplex

---

## 🆘 Hilfe

### "Ich will es einfach nur teilen"
→ `deploy-github-pages.bat` und URL teilen

### "Ich will eine Datei verschicken"
→ `create-standalone.bat` und `standalone.html` verschicken

### "Ich will ein ZIP-Paket"
→ `create-distribution.bat` und `distribution.zip` erstellen

### "Ich will eine .exe"
→ Siehe DISTRIBUTION.md (komplex, nicht empfohlen)
