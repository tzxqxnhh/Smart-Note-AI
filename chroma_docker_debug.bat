@chcp 65001 >nul 2>&1
@echo off
title ChromaDB Docker Debug
echo ============================================================
echo   ChromaDB Docker Debug
echo ============================================================
echo.

echo [1] Docker status check
echo ----------------------------------------
docker --version 2>&1
echo.

echo [2] Container status
echo ----------------------------------------
docker compose ps 2>&1
echo.

echo [3] Container logs (last 30 lines)
echo ----------------------------------------
docker compose logs --tail 30 2>&1
echo.

echo [4] Port 9510 listener check (netstat)
echo ----------------------------------------
netstat -ano | findstr :9510
echo.

echo [5] curl test - IPv4 localhost
echo ----------------------------------------
curl.exe -v --max-time 5 "http://localhost:9510/api/v1" 2>&1
echo.

echo [6] curl test - IPv4 127.0.0.1
echo ----------------------------------------
curl.exe -v --max-time 5 "http://127.0.0.1:9510/api/v1" 2>&1
echo.

echo [7] curl test - IPv6
echo ----------------------------------------
curl.exe -v --max-time 5 "http://[::1]:9510/api/v1" 2>&1
echo.

echo [8] Docker exec test (inside container)
echo ----------------------------------------
docker compose exec chroma curl -s --max-time 3 "http://localhost:8000/api/v1" 2>&1
echo.

echo ============================================================
echo   Debug complete
echo ============================================================
pause
