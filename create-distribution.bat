@echo off
echo ========================================
echo  Erstelle Distribution-Paket
echo ========================================
echo.

REM Build the application
echo [1/4] Baue Anwendung...
call npm run build
if errorlevel 1 (
    echo FEHLER: Build fehlgeschlagen!
    pause
    exit /b 1
)

REM Create distribution folder
echo [2/4] Erstelle Distribution-Ordner...
if exist "distribution" rmdir /s /q distribution
mkdir distribution

REM Copy necessary files
echo [3/4] Kopiere Dateien...
xcopy /E /I /Y dist distribution\dist
copy serve-dist.cjs distribution\
copy START_DISTRIBUTION.bat distribution\START.bat
copy DISTRIBUTION_README.md distribution\README.md

REM Create a simple package.json for the distribution
echo [4/4] Erstelle package.json...
(
echo {
echo   "name": "dust-particle-aggregation-portable",
echo   "version": "1.0.0",
echo   "description": "Portable version - no installation needed",
echo   "scripts": {
echo     "serve": "node serve-dist.cjs",
echo     "start": "node serve-dist.cjs"
echo   }
echo }
) > distribution\package.json

echo.
echo ========================================
echo  Distribution erstellt!
echo ========================================
echo.
echo Der Ordner "distribution" enthält jetzt alles Nötige.
echo.
echo Zum Verteilen:
echo   1. Komprimiere den "distribution" Ordner zu einer ZIP-Datei
echo   2. Nutzer müssen nur:
echo      - Node.js installiert haben
echo      - ZIP entpacken
echo      - START.bat doppelklicken
echo.
pause
