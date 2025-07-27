@echo off
echo ========================================
echo Quick Oracle Database Setup
echo ========================================
echo.

echo Choose your Oracle setup method:
echo.
echo 1. Docker Oracle (Recommended - Fastest)
echo 2. Oracle Express Edition (XE) - Local Install
echo 3. Oracle Cloud Free Tier
echo 4. Test with Simulated Connection
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto docker_setup
if "%choice%"=="2" goto local_setup
if "%choice%"=="3" goto cloud_setup
if "%choice%"=="4" goto simulated_setup

echo Invalid choice. Please run the script again.
pause
exit /b

:docker_setup
echo.
echo ========================================
echo Docker Oracle Setup
echo ========================================
echo.

echo Attempting to pull Oracle image...
docker pull gvenzl/oracle-xe:latest

if %errorlevel% equ 0 (
    echo.
    echo Starting Oracle container...
    docker run -d --name oracle-xe ^
      -p 1521:1521 ^
      -e ORACLE_PASSWORD=OracleTest123! ^
      gvenzl/oracle-xe:latest
    
    echo.
    echo ✅ Oracle container started!
    echo.
    echo Credentials:
    echo Host: localhost
    echo Port: 1521
    echo Username: system
    echo Password: OracleTest123!
    echo Database: XE
    echo.
    echo Wait 5-10 minutes for full startup
    echo Check status: docker logs oracle-xe
) else (
    echo.
    echo ❌ Failed to pull Oracle image
    echo Trying alternative approach...
    echo.
    echo Please try manual installation:
    echo 1. Go to: https://www.oracle.com/database/technologies/xe-downloads.html
    echo 2. Download Oracle XE
    echo 3. Install with password: OracleTest123!
)
goto end

:local_setup
echo.
echo ========================================
echo Local Oracle XE Installation
echo ========================================
echo.
echo 1. Download Oracle XE from:
echo    https://www.oracle.com/database/technologies/xe-downloads.html
echo.
echo 2. Install with password: OracleTest123!
echo.
echo 3. After installation, use these credentials:
echo    Host: localhost
echo    Port: 1521
echo    Username: system
echo    Password: OracleTest123!
echo    Database: XE
echo.
echo 4. Test connection: sqlplus system/OracleTest123!@localhost:1521/XE
goto end

:cloud_setup
echo.
echo ========================================
echo Oracle Cloud Free Tier
echo ========================================
echo.
echo 1. Go to: https://www.oracle.com/cloud/free/
echo 2. Create free account
echo 3. Create Autonomous Database
echo 4. Download wallet file
echo 5. Use connection details from wallet
echo.
echo See oracle-cloud-setup.md for detailed instructions
goto end

:simulated_setup
echo.
echo ========================================
echo Simulated Oracle Connection
echo ========================================
echo.
echo For testing without real Oracle:
echo.
echo 1. Start dev server: npx netlify dev
echo 2. Open: http://localhost:8888/test-oracle-simple.html
echo 3. Use any credentials (will be simulated)
echo.
echo This will test the application flow without real database
goto end

:end
echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Start dev server: npx netlify dev
echo 2. Open test page: http://localhost:8888/test-oracle-simple.html
echo 3. Enter your Oracle credentials
echo 4. Test connection and deployment
echo.
echo ========================================
echo Documentation
echo ========================================
echo.
echo - Docker setup: docker-oracle-setup.md
echo - Local setup: oracle-xe-setup.md
echo - Cloud setup: oracle-cloud-setup.md
echo - Testing guide: TESTING_GUIDE.md
echo.
pause 