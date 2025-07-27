@echo off
echo ========================================
echo Docker Oracle Setup Script
echo ========================================
echo.

echo Checking if Oracle container exists...
docker ps -a | findstr oracle-xe
if %errorlevel% equ 0 (
    echo Found existing Oracle container
    echo Stopping and removing old container...
    docker stop oracle-xe
    docker rm oracle-xe
)

echo.
echo Starting Oracle Express Edition container...
echo This will take 5-10 minutes to fully start up
echo.

docker run -d --name oracle-xe ^
  -p 1521:1521 ^
  -e ORACLE_PWD=OracleTest123! ^
  container-registry.oracle.com/database/express:latest

if %errorlevel% equ 0 (
    echo.
    echo ✅ Oracle container started successfully!
    echo.
    echo ========================================
    echo Oracle Credentials
    echo ========================================
    echo Host: localhost
    echo Port: 1521
    echo Username: system
    echo Password: OracleTest123!
    echo Database: XE
    echo.
    echo ========================================
    echo Next Steps
    echo ========================================
    echo.
    echo 1. Wait for Oracle to fully start (5-10 minutes)
    echo 2. Check status: docker logs oracle-xe
    echo 3. Start dev server: npx netlify dev
    echo 4. Test connection: http://localhost:8888/test-oracle-simple.html
    echo.
    echo ========================================
    echo Useful Commands
    echo ========================================
    echo Check container: docker ps
    echo View logs: docker logs oracle-xe
    echo Stop container: docker stop oracle-xe
    echo Start container: docker start oracle-xe
    echo Remove container: docker rm oracle-xe
    echo.
) else (
    echo.
    echo ❌ Failed to start Oracle container
    echo Check Docker is running and try again
)

pause 