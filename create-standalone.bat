@echo off
echo ========================================
echo  Erstelle Standalone HTML
echo ========================================
echo.

echo [1/2] Baue Anwendung...
call npm run build
if errorlevel 1 (
    echo FEHLER: Build fehlgeschlagen!
    pause
    exit /b 1
)

echo [2/2] Erstelle standalone.html...
node create-standalone.js

echo.
echo ========================================
echo  Standalone HTML erstellt!
echo ========================================
echo.
echo Die Datei "standalone.html" kann jetzt verteilt werden.
echo.
echo Nutzer können sie einfach:
echo   - Im Browser öffnen (Datei -^> Öffnen)
echo   - ODER auf einen lokalen Webserver hochladen
echo.
echo HINWEIS: Wegen Browser-Sicherheit funktioniert es am besten
echo mit einem lokalen Server (z.B. Python: python -m http.server)
echo.
pause
