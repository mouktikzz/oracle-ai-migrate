# 🖥️ Oracle Express Edition (XE) Local Setup Guide

## **Why Oracle XE?**
- **Completely FREE** - No licensing required
- **Full Oracle functionality** - All features for testing
- **Runs locally** - No internet dependency
- **Perfect for development** - Lightweight but powerful

## **🚀 Step-by-Step Installation**

### **Step 1: Download Oracle XE**
1. **Go to:** https://www.oracle.com/database/technologies/xe-downloads.html
2. **Download:** Oracle Database 21c Express Edition for Windows x64
3. **File size:** ~2.5 GB
4. **Save to:** A folder you can easily access

### **Step 2: Install Oracle XE**
1. **Run the installer** as Administrator
2. **Accept** the license agreement
3. **Choose installation directory** (default is fine)
4. **Set database password:**
   - **IMPORTANT:** Remember this password!
   - **Recommendation:** Use something like `OracleTest123!`
   - **Save it securely** - you'll need it for testing

### **Step 3: Complete Installation**
1. **Wait** for installation (10-15 minutes)
2. **Note the port:** Usually 1521
3. **Note the SID:** Usually `XE`
4. **Click Finish** when complete

## **🔧 Post-Installation Setup**

### **Step 4: Verify Installation**
1. **Open Command Prompt** as Administrator
2. **Test connection:**
   ```cmd
   sqlplus system/[your_password]@localhost:1521/XE
   ```
3. **If successful, you'll see:**
   ```
   SQL>
   ```
4. **Exit SQL*Plus:**
   ```sql
   EXIT
   ```

### **Step 5: Create Test User (Recommended)**
1. **Connect as system:**
   ```cmd
   sqlplus system/[your_password]@localhost:1521/XE
   ```

2. **Create test user:**
   ```sql
   CREATE USER test_user IDENTIFIED BY test123;
   GRANT CONNECT, RESOURCE, CREATE TABLE, CREATE VIEW TO test_user;
   GRANT UNLIMITED TABLESPACE TO test_user;
   EXIT;
   ```

## **🔗 Your Oracle Credentials**

### **For System User:**
```
Host: localhost
Port: 1521
Username: system
Password: [your_installation_password]
Database: XE
```

### **For Test User (Recommended):**
```
Host: localhost
Port: 1521
Username: test_user
Password: test123
Database: XE
```

## **🧪 Testing the Connection**

### **Step 6: Test with Our Application**
1. **Start Netlify dev server:**
   ```bash
   npx netlify dev
   ```

2. **Open test page:**
   - Navigate to: `http://localhost:8888/test-oracle-simple.html`

3. **Enter your Oracle credentials:**
   - **Host:** `localhost`
   - **Port:** `1521`
   - **Username:** `system` (or `test_user`)
   - **Password:** Your password
   - **Database:** `XE`
   - **Service Name:** Leave empty

4. **Test connection:**
   - Click "🔗 Test Oracle Connection"
   - You should see success with Oracle version info

## **🔧 Troubleshooting**

### **Common Issues:**

#### **"ORA-12541: TNS:no listener"**
- **Solution:** Start Oracle services
  ```cmd
  net start OracleServiceXE
  net start OracleOraDB21Home1TNSListener
  ```

#### **"ORA-01017: invalid username/password"**
- **Solution:** Check your password
- **Reset if needed:**
  ```sql
  ALTER USER system IDENTIFIED BY new_password;
  ```

#### **"ORA-12514: TNS:listener does not currently know of service"**
- **Solution:** Check SID is correct (should be `XE`)
- **Verify service:**
  ```cmd
  lsnrctl services
  ```

### **Check Oracle Services:**
1. **Open Services:** `services.msc`
2. **Look for:**
   - `OracleServiceXE`
   - `OracleOraDB21Home1TNSListener`
3. **Ensure both are running**

## **🎯 Quick Verification Commands**

### **Check Oracle Version:**
```cmd
sqlplus system/[password]@localhost:1521/XE
SELECT * FROM v$version WHERE ROWNUM = 1;
EXIT;
```

### **Test Basic Operations:**
```cmd
sqlplus test_user/test123@localhost:1521/XE
CREATE TABLE test_table (id NUMBER, name VARCHAR2(50));
INSERT INTO test_table VALUES (1, 'Test');
SELECT * FROM test_table;
DROP TABLE test_table;
EXIT;
```

## **✅ Expected Results**

**Successful connection should show:**
```json
{
  "success": true,
  "message": "Connection successful!",
  "details": {
    "version": "Oracle Database 21c Express Edition Release 21.0.0.0.0",
    "connectionTime": "150ms"
  }
}
```

## **🔒 Security Notes**

- **Use test_user** instead of system for testing
- **Don't use production passwords** for testing
- **Keep installation password** secure
- **Test database only** - don't use for production

## **📞 Need Help?**

1. **Installation issues:** Check Oracle documentation
2. **Connection problems:** Verify services are running
3. **Password issues:** Reset using SQL*Plus
4. **Port conflicts:** Check if port 1521 is available

## **🎯 Next Steps**

Once Oracle XE is installed and working:
1. Test connection with our application
2. Try deploying sample SQL
3. Test Sybase to Oracle conversion
4. Verify all migration features work 