# Git & GitHub - Einfach erklärt

## Das Wichtigste in 3 Sätzen

1. **Git** = Programm auf deinem Computer, das Änderungen speichert (wie "Speichern" in Word, aber besser)
2. **GitHub** = Website im Internet, wo dein Code gesichert wird (wie Dropbox für Code)
3. **Branch** = Verschiedene Versionen deines Projekts (wie verschiedene Ordner)

---

## Die 3 Befehle, die du brauchst

### 1. Änderungen speichern und hochladen

```bash
git add .
git commit -m "Was ich geändert habe"
git push origin main
```

**Das war's!** Dein Code ist jetzt auf GitHub gesichert.

### 2. Neueste Version herunterladen

```bash
git pull origin main
```

Falls jemand anderes etwas geändert hat (oder du auf einem anderen Computer arbeitest).

### 3. Status prüfen

```bash
git status
```

Zeigt dir, was geändert wurde.

---

## Dein Projekt hat 2 "Ordner" (Branches)

### `main` Branch
- **Das ist dein Hauptprojekt**
- Hier ist der komplette Quellcode
- Hier arbeitest du

### `gh-pages` Branch
- **Das ist nur für die Website**
- Wird automatisch erstellt von `npm run deploy`
- **Nicht anfassen!**

---

## Auf GitHub den richtigen "Ordner" (Branch) ansehen

### Problem: Du siehst nur index.html

Das liegt daran, dass GitHub den falschen Branch zeigt.

### Lösung: Klick oben links auf den Branch-Namen

1. Gehe zu: https://github.com/umeinhardt/Staubfaenger
2. Oben links siehst du einen Button mit dem Branch-Namen (wahrscheinlich "gh-pages")
3. **Klick drauf**
4. Wähle **"main"** aus der Liste

**Jetzt siehst du den kompletten Code!**

### Oder direkt hier klicken:
👉 https://github.com/umeinhardt/Staubfaenger/tree/main

---

## Dein täglicher Workflow (ganz einfach)

### Wenn du am Projekt arbeitest:

1. **Code ändern** (in VS Code oder deinem Editor)

2. **Speichern und hochladen:**
   ```bash
   git add .
   git commit -m "Beschreibung der Änderung"
   git push origin main
   ```

3. **Fertig!** ✅

### Wenn du die Website aktualisieren willst:

```bash
npm run deploy
```

Das war's! Die Website ist jetzt live.

---

## Neue Version veröffentlichen (Release erstellen)

Wenn du eine neue Version deines Programms veröffentlichen willst (z.B. v1.0.1), machst du das so:

### Schritt 1: Version in package.json ändern

Öffne `package.json` und ändere die Versionsnummer:

```json
{
  "version": "1.0.1",
  ...
}
```

### Schritt 2: Änderungen hochladen

```bash
git add package.json
git commit -m "Version 1.0.1"
git push origin main
```

### Schritt 3: Release-Tag erstellen

```bash
git tag v1.0.1
git push origin v1.0.1
```

**Das war's!** GitHub baut jetzt automatisch:
- Windows Installer (.exe) und Portable (.zip)
- macOS Installer (.dmg) und Portable (.zip)
- Linux Installer (.AppImage und .deb)

Du findest die fertigen Downloads nach ein paar Minuten hier:
👉 https://github.com/umeinhardt/Staubfaenger/releases

### Den Build-Fortschritt ansehen

Während GitHub die Installer baut, kannst du hier zusehen:
👉 https://github.com/umeinhardt/Staubfaenger/actions

---

## Häufige Fragen

### "Ich sehe nur index.html auf GitHub"
→ Du schaust auf den `gh-pages` Branch. Wechsel zu `main` (siehe oben).

### "Ich habe etwas geändert, aber es ist nicht auf GitHub"
→ Du hast vergessen zu pushen. Mach: `git push origin main`

### "Git sagt 'nothing to commit'"
→ Alles ist schon gespeichert. Alles gut! ✅

### "Ich habe einen Fehler gemacht!"
→ Keine Panik! Git kann alles rückgängig machen. Frag mich einfach.

### "Wie lösche ich einen falschen Tag?"
→ Wenn du einen Tag versehentlich erstellt hast:
```bash
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1
```

---

## Cheat Sheet (zum Ausdrucken)

```bash
# Änderungen hochladen
git add .
git commit -m "Meine Änderung"
git push origin main

# Neueste Version holen
git pull origin main

# Status prüfen
git status

# Website deployen
npm run deploy

# Neue Version veröffentlichen (Release)
# 1. Version in package.json ändern (z.B. auf "1.0.1")
# 2. Dann:
git add package.json
git commit -m "Version 1.0.1"
git push origin main
git tag v1.0.1
git push origin v1.0.1
# GitHub baut jetzt automatisch alle Installer!
```

---

## Das war's!

Du brauchst wirklich nur diese paar Befehle. Der Rest ist optional und für Fortgeschrittene.

**Wichtig:** Arbeite immer im `main` Branch. Der `gh-pages` Branch ist automatisch.

Bei Fragen: Einfach fragen! 😊
