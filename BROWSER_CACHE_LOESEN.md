# Browser-Cache Problem lösen

## Problem
Nach dem Build (`npm run build`) sind die Änderungen im Browser nicht sichtbar.

## Ursache
Der Browser hat die alten Dateien im Cache gespeichert und lädt diese statt der neuen Dateien.

## Lösung

### Methode 1: Hard Refresh (Empfohlen - Am Schnellsten)

**Windows/Linux:**
```
Strg + Shift + R
```

**Mac:**
```
Cmd + Shift + R
```

### Methode 2: Cache komplett leeren

1. Öffne Developer Tools: `F12`
2. Rechtsklick auf den Reload-Button (🔄 neben der Adressleiste)
3. Wähle: **"Cache leeren und hart neu laden"** / **"Empty Cache and Hard Reload"**

### Methode 3: Browser-Einstellungen

**Chrome/Edge:**
1. Öffne Einstellungen (⋮ Menü)
2. Datenschutz und Sicherheit
3. Browserdaten löschen
4. Wähle "Bilder und Dateien im Cache"
5. Klicke "Daten löschen"

**Firefox:**
1. Öffne Einstellungen (☰ Menü)
2. Datenschutz & Sicherheit
3. Cookies und Website-Daten
4. Klicke "Daten entfernen..."
5. Wähle "Zwischengespeicherte Webinhalte/Cache"

## Was wurde bereits gemacht

Der Server (`serve-dist.cjs`) wurde angepasst und sendet jetzt folgende HTTP-Header:

```javascript
'Cache-Control': 'no-cache, no-store, must-revalidate',
'Pragma': 'no-cache',
'Expires': '0'
```

Diese Header sagen dem Browser, dass er **keine** Dateien cachen soll. Allerdings können bereits gecachte Dateien noch im Browser sein, deshalb ist ein Hard Refresh notwendig.

## Workflow für Entwicklung

1. Ändere Code
2. Führe `npm run build` aus (oder `START.bat`)
3. **Drücke `Strg + Shift + R` im Browser**
4. Änderungen sind jetzt sichtbar

## Tipp

Wenn du häufig entwickelst, nutze stattdessen:

```bash
npm run dev
```

Dies startet einen Entwicklungsserver mit Hot-Reload - Änderungen werden automatisch ohne Cache-Probleme geladen.
