@echo off
echo ========================================
echo Oracle XE Installation Verification
echo ========================================
echo.

echo Checking Oracle Services...
echo.

REM Check if Oracle services are running
sc query OracleServiceXE | findstr "RUNNING"
if %errorlevel% equ 0 (
    echo ✅ OracleServiceXE is running
) else (
    echo ❌ OracleServiceXE is not running
    echo    Try: net start OracleServiceXE
)

sc query OracleOraDB21Home1TNSListener | findstr "RUNNING"
if %errorlevel% equ 0 (
    echo ✅ Oracle Listener is running
) else (
    echo ❌ Oracle Listener is not running
    echo    Try: net start OracleOraDB21Home1TNSListener
)

echo.
echo ========================================
echo Testing Oracle Connection
echo ========================================
echo.

echo To test Oracle connection, run:
echo sqlplus system/[your_password]@localhost:1521/XE
echo.
echo If successful, you'll see "SQL>" prompt
echo Type "EXIT" to quit
echo.

echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Install Oracle XE if not already done
echo 2. Start Oracle services if needed
echo 3. Test connection with sqlplus
echo 4. Run: npx netlify dev
echo 5. Open: http://localhost:8888/test-oracle-simple.html
echo 6. Enter your Oracle credentials and test
echo.

pause 