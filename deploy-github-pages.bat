@echo off
echo ========================================
echo  Deploy zu GitHub Pages
echo ========================================
echo.

echo [1/2] Baue Anwendung...
call npm run build
if errorlevel 1 (
    echo FEHLER: Build fehlgeschlagen!
    pause
    exit /b 1
)

echo [2/2] Pushe zu gh-pages Branch...
echo.
echo HINWEIS: Dies erfordert Git und ein GitHub Repository
echo.

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo FEHLER: Git ist nicht installiert!
    pause
    exit /b 1
)

REM Deploy using gh-pages (install if needed)
call npm install --save-dev gh-pages
call npx gh-pages -d dist

echo.
echo ========================================
echo  Deployment abgeschlossen!
echo ========================================
echo.
echo Deine App ist jetzt online verfügbar unter:
echo https://[dein-username].github.io/[repo-name]/
echo.
echo Aktiviere GitHub Pages in den Repository-Einstellungen:
echo   Settings -^> Pages -^> Source: gh-pages branch
echo.
pause
