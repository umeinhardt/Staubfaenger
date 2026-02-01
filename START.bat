@echo off
echo.
echo ========================================
echo   Dust Particle Aggregation
echo ========================================
echo.

echo Erstelle neuen Build...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo FEHLER: Build fehlgeschlagen!
    echo.
    pause
    exit /b 1
)

echo.
echo Starte Server...
echo.
echo Oeffne http://localhost:8080 in deinem Browser
echo.
echo WICHTIG: Falls Aenderungen nicht sichtbar sind:
echo   - Druecke Strg+Shift+R im Browser (Hard Refresh)
echo   - Oder: F12 -^> Rechtsklick auf Reload -^> "Cache leeren und hart neu laden"
echo.

call npm run serve

pause
