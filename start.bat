@chcp 65001 >nul 2>&1
@echo off
title Smart Note Launcher

rem ============================================================
rem Config (from spec.md and project config)
rem ============================================================
set "CHROMA_CLI=你的chroma.exe程序路径(如C:\pythonenv\Scripts\chroma.exe)"
set "CHROMA_DATA_DIR=%~dp0chroma_data"
set "CHROMA_URL=http://localhost:8000/api/v1"
set "MAX_RETRIES=15"
set "RETRY_INTERVAL=2"

echo.
echo ============================================================
echo   Smart Note Launcher
echo ============================================================
echo.

rem ============================================================
rem Step 1: Start ChromaDB service
rem ============================================================
echo [1/2] Checking ChromaDB service...

rem Check if ChromaDB is already running (try IPv4 and IPv6)
curl.exe -s --max-time 3 "%CHROMA_URL%" >nul 2>&1
if %errorlevel% equ 0 goto :chroma_ready

rem Also try explicit IPv6 loopback
curl.exe -s --max-time 3 "http://[::1]:8000/api/v1" >nul 2>&1
if %errorlevel% equ 0 goto :chroma_ready

goto :chroma_not_ready

:chroma_ready
    echo   ChromaDB is already running, skipping startup
    goto :launch_app

:chroma_not_ready
echo   ChromaDB not running, starting service...

rem Start ChromaDB via PowerShell to capture its PID
set "PID_FILE=%TEMP%\smart_note_chroma_pid.txt"
powershell -NoProfile -Command "$p = Start-Process -FilePath '%CHROMA_CLI%' -ArgumentList 'run','--path','%CHROMA_DATA_DIR%' -WindowStyle Minimized -PassThru; $p.Id | Out-File -FilePath '%PID_FILE%' -NoNewline"

rem Give ChromaDB extra time to initialize before first check
echo   Waiting for server to initialize...
timeout /t 4 /nobreak >nul

rem Loop waiting for ChromaDB to be ready
set "count=0"
:wait_loop
    set /a count=%count%+1

    curl.exe -s --max-time 3 "%CHROMA_URL%" >nul 2>&1
    if %errorlevel% equ 0 goto :chroma_ready_found

    curl.exe -s --max-time 3 "http://[::1]:8000/api/v1" >nul 2>&1
    if %errorlevel% equ 0 goto :chroma_ready_found

    if %count% geq %MAX_RETRIES% (
        echo.
        echo [ERROR] ChromaDB startup timed out. Please check:
        echo   1. chroma CLI exists: %CHROMA_CLI%
        echo   2. chromadb is installed: pip install chromadb
        echo   3. ChromaDB window for error details
        echo.
        pause
        exit /b 1
    )

    echo   Waiting for ChromaDB... ^(%count%/%MAX_RETRIES%^)
    timeout /t %RETRY_INTERVAL% /nobreak >nul
    goto :wait_loop

:chroma_ready_found
    echo   ChromaDB is ready

:launch_app
echo.
rem ============================================================
rem Step 2: Start Smart Note app
rem ============================================================
echo [2/2] Starting Smart Note app...
echo   ^(Close the app window to stop both app and ChromaDB^)
echo.
cd /d "%~dp0"
call npm run dev

echo.
rem Only kill ChromaDB if we started it ourselves (PID file exists)
if exist "%PID_FILE%" (
    echo ============================================================
    echo   Smart Note app closed, stopping ChromaDB...
    echo ============================================================
    powershell -NoProfile -Command "try { $pidVal = Get-Content '%PID_FILE%' -Raw; Stop-Process -Id ([int]$pidVal) -Force; exit 0 } catch { exit 1 }" >nul 2>&1
    del "%PID_FILE%" >nul 2>&1
    echo   ChromaDB stopped.
)
echo.
pause
