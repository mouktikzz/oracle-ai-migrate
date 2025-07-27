# ☁️ Oracle Cloud Free Tier Setup Guide

## **Why Oracle Cloud Free Tier?**
- **Completely FREE** - No credit card required for basic tier
- **No installation** - Oracle manages everything
- **Always available** - No need to start/stop services
- **Perfect for testing** - Isolated environment

## **🚀 Step-by-Step Setup**

### **Step 1: Create Oracle Cloud Account**
1. **Go to:** https://www.oracle.com/cloud/free/
2. **Click:** "Start for free"
3. **Fill out:** Basic information (name, email, etc.)
4. **Verify:** Your email address

### **Step 2: Create Autonomous Database**
1. **Login** to Oracle Cloud Console
2. **Navigate to:** "Autonomous Database" → "Create Autonomous Database"
3. **Choose:** "Always Free" tier
4. **Fill in:**
   - **Display Name:** `test-migration-db`
   - **Database Name:** `TESTDB`
   - **Password:** Create a strong password (save this!)
   - **Confirm Password:** Re-enter the password

### **Step 3: Get Connection Details**
1. **Wait** for database creation (5-10 minutes)
2. **Click** on your database name
3. **Click:** "DB Connection" button
4. **Download** the wallet file
5. **Note** the connection details:
   - **Host:** From wallet file
   - **Port:** 1522
   - **Service:** From wallet file
   - **Username:** `ADMIN`
   - **Password:** The password you set

### **Step 4: Extract Wallet File**
1. **Download** the wallet file (ZIP)
2. **Extract** to a folder (e.g., `C:\oracle\wallet`)
3. **Find** the `tnsnames.ora` file
4. **Look for** the connection string

## **🔗 Connection Details Example**

From the wallet file, you'll get something like:
```
Host: adb.us-ashburn-1.oraclecloud.com
Port: 1522
Username: ADMIN
Password: [your_password]
Service: testdb_high
```

## **🧪 Testing the Connection**

### **Using Our Test Page:**
1. **Start Netlify dev server:**
   ```bash
   npx netlify dev
   ```

2. **Open test page:**
   - Navigate to: `http://localhost:8888/test-oracle-simple.html`

3. **Enter Oracle Cloud credentials:**
   - **Host:** Your Oracle Cloud host
   - **Port:** 1522
   - **Username:** ADMIN
   - **Password:** Your admin password
   - **Database:** Leave empty (not used for cloud)
   - **Service Name:** Your service name (e.g., `testdb_high`)

4. **Test connection:**
   - Click "🔗 Test Oracle Connection"
   - You should see success with Oracle version info

## **🔧 Alternative: Oracle Express Edition (XE)**

If you prefer local installation:

### **Download Oracle XE:**
1. **Go to:** https://www.oracle.com/database/technologies/xe-downloads.html
2. **Download:** Oracle Database 21c Express Edition
3. **Install:** Follow the wizard
4. **Set password:** Remember this password!

### **Local Oracle Credentials:**
```
Host: localhost
Port: 1521
Username: system
Password: [your_password]
Database: XE
```

## **🎯 Quick Test Commands**

### **Test with SQL*Plus (if you have Oracle client):**
```bash
# For Oracle Cloud
sqlplus ADMIN/[password]@[host]:1522/[service]

# For Local Oracle
sqlplus system/[password]@localhost:1521/XE
```

### **Test with our application:**
1. Start the dev server
2. Use the test page
3. Enter your credentials
4. Click test buttons

## **✅ Expected Results**

**Successful connection should show:**
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

## **🔒 Security Notes**

- **Save your passwords** securely
- **Use test database** only for testing
- **Don't commit credentials** to version control
- **Oracle Cloud is perfect** for isolated testing

## **📞 Need Help?**

1. **Oracle Cloud issues:** Check Oracle documentation
2. **Connection problems:** Verify credentials and network
3. **Application issues:** Check our troubleshooting guide 