# 🧪 Oracle Database Connectivity Testing Guide

## **Overview**
This guide explains how to test the real Oracle database connectivity implementation we've added to your Sybase to Oracle migration tool.

## **📋 Prerequisites**

### **1. Oracle Database Setup**
- Oracle Database installed and running (11g, 12c, 19c, or 21c)
- A test user with appropriate permissions
- Network connectivity to the Oracle instance

### **2. Development Environment**
- Node.js installed
- Netlify CLI installed (`npm install -g netlify-cli`)
- Oracle Instant Client (for local testing)

## **🚀 Testing Methods**

### **Method 1: Browser-Based Testing (Easiest)**

1. **Start the Netlify development server:**
   ```bash
   npx netlify dev
   ```

2. **Open the test page:**
   - Navigate to `http://localhost:8888/test-oracle-simple.html`
   - Or open `test-oracle-simple.html` directly in your browser

3. **Enter your Oracle connection details:**
   - **Host:** Your Oracle server (e.g., `localhost`)
   - **Port:** Oracle listener port (usually `1521`)
   - **Username:** Your Oracle username
   - **Password:** Your Oracle password
   - **Database:** SID or service name (e.g., `ORCL`)

4. **Test the connection:**
   - Click "🔗 Test Oracle Connection"
   - If successful, you'll see Oracle version information
   - If failed, you'll get detailed error messages and suggestions

5. **Test deployment:**
   - Click "🚀 Test Oracle Deployment"
   - This will create a test table and insert a sample record

### **Method 2: Command Line Testing**

1. **Start the Netlify development server:**
   ```bash
   npx netlify dev
   ```

2. **Run the Node.js test script:**
   ```bash
   node test-oracle-connectivity.js
   ```

3. **Update the test parameters:**
   - Edit `test-oracle-connectivity.js`
   - Replace the connection parameters with your actual Oracle details

### **Method 3: Using the Main Application**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the application:**
   - Go to `http://localhost:5173`
   - Navigate to the Dashboard or Connection Form

3. **Test connection:**
   - Enter your Oracle database credentials
   - Click "Test Connection"
   - The application will use the real Oracle connectivity

4. **Test deployment:**
   - Upload a Sybase SQL file
   - Convert it to Oracle format
   - Use the "Deploy to Oracle" feature

### **Method 4: Direct API Testing with curl**

1. **Start the Netlify development server:**
   ```bash
   npx netlify dev
   ```

2. **Test connection:**
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/oracle-test-connection \
     -H "Content-Type: application/json" \
     -d '{
       "connection": {
         "type": "oracle",
         "host": "localhost",
         "port": 1521,
         "username": "your_username",
         "password": "your_password",
         "database": "ORCL"
       }
     }'
   ```

3. **Test deployment:**
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/oracle-deploy \
     -H "Content-Type: application/json" \
     -d '{
       "connection": {
         "type": "oracle",
         "host": "localhost",
         "port": 1521,
         "username": "your_username",
         "password": "your_password",
         "database": "ORCL"
       },
       "code": "CREATE TABLE test_table (id NUMBER PRIMARY KEY, name VARCHAR2(100));",
       "fileName": "test.sql"
     }'
   ```

## **🔧 Troubleshooting**

### **Common Connection Issues**

1. **"ORA-12541: TNS:no listener"**
   - Oracle listener is not running
   - Wrong port number
   - Firewall blocking the connection

2. **"ORA-01017: invalid username/password"**
   - Incorrect username or password
   - User account is locked
   - User doesn't exist

3. **"ORA-12514: TNS:listener does not currently know of service"**
   - Wrong service name or SID
   - Database is not running
   - Listener configuration issue

4. **"ORA-12154: TNS:could not resolve the connect identifier"**
   - Network connectivity issues
   - DNS resolution problems
   - Wrong hostname

### **Development Environment Issues**

1. **"Cannot find module 'oracledb'"**
   - Run `npm install` to install dependencies
   - Ensure Oracle Instant Client is installed

2. **"Netlify dev server not starting"**
   - Check if port 8888 is available
   - Ensure Netlify CLI is installed
   - Check for syntax errors in functions

3. **"CORS errors"**
   - Ensure the Netlify dev server is running
   - Check that the API endpoints are correct
   - Verify the base URL in test files

## **✅ Expected Results**

### **Successful Connection Test**
```json
{
  "success": true,
  "message": "Connection successful!",
  "details": {
    "version": "Oracle Database 19c Enterprise Edition Release 19.0.0.0.0",
    "connectionTime": "150ms"
  }
}
```

### **Successful Deployment Test**
```json
{
  "success": true,
  "message": "Successfully deployed 2 statements",
  "details": {
    "statements": {
      "CREATE TABLE test_migration": {
        "success": true,
        "rowsAffected": 0
      },
      "INSERT INTO test_migration": {
        "success": true,
        "rowsAffected": 1
      }
    }
  }
}
```

## **🔒 Security Notes**

- **Never commit real database credentials** to version control
- **Use environment variables** for production deployments
- **Test with a dedicated test database** to avoid affecting production data
- **Use read-only users** for testing when possible

## **📞 Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Oracle database is accessible
3. Ensure all prerequisites are met
4. Check the browser console for detailed error messages 