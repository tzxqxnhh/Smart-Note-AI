@chcp 65001 >nul 2>&1
@echo off
title Smart Note Launcher

rem ============================================================
rem Config (from spec.md and project config)
rem ============================================================
set "CHROMA_URL=http://localhost:9510/api/v2/heartbeat"
set "MAX_RETRIES=15"
set "RETRY_INTERVAL=2"

echo.
echo ============================================================
echo   Smart Note Launcher
echo ============================================================
echo.

rem ============================================================
rem Step 0: Check Docker
rem ============================================================
echo [0/3] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker is not installed or not running.
    echo Please install Docker Desktop:
    echo   https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo   Docker is available

rem ============================================================
rem Step 1: Start ChromaDB via Docker
rem ============================================================
echo.
echo [1/3] Checking ChromaDB service...

rem Check if ChromaDB is already running (try IPv4 and IPv6)
curl.exe -s --max-time 3 "%CHROMA_URL%" >nul 2>&1
if %errorlevel% equ 0 goto :chroma_ready

rem Also try explicit IPv6 loopback
curl.exe -s --max-time 3 "http://[::1]:9510/api/v1" >nul 2>&1
if %errorlevel% equ 0 goto :chroma_ready

goto :chroma_not_ready

:chroma_ready
    echo   ChromaDB is already running, skipping startup
    goto :launch_app

:chroma_not_ready
echo   ChromaDB not running, starting via Docker...
cd /d "%~dp0"

rem Start ChromaDB container in detached mode
docker compose up -d chroma
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start ChromaDB container.
    echo Check Docker Desktop status and try again.
    echo.
    pause
    exit /b 1
)

rem Give ChromaDB extra time to initialize before first check
echo   Waiting for server to initialize...
timeout /t 6 /nobreak >nul

rem Loop waiting for ChromaDB to be ready
set "count=0"
:wait_loop
    set /a count=%count%+1

    curl.exe -s --max-time 3 "%CHROMA_URL%" >nul 2>&1
    if %errorlevel% equ 0 goto :chroma_ready_found

    curl.exe -s --max-time 3 "http://[::1]:9510/api/v1" >nul 2>&1
    if %errorlevel% equ 0 goto :chroma_ready_found

    if %count% geq %MAX_RETRIES% (
        echo.
        echo [ERROR] ChromaDB startup timed out.
        echo Check container logs with: docker compose logs chroma
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
echo [2/3] Starting Smart Note app...
echo   ^(Close the app window to stop both app and ChromaDB^)
echo.
cd /d "%~dp0"
call npm run dev

echo.
rem ============================================================
rem Step 3: Cleanup - stop ChromaDB container
rem ============================================================
echo.
echo ============================================================
echo   Smart Note app closed, stopping ChromaDB container...
echo ============================================================
cd /d "%~dp0"
docker compose down
echo   ChromaDB container stopped.
echo.
pause
