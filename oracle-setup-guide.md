# 🔧 Oracle Database Setup Guide

## **Finding Your Oracle Credentials**

### **1. If Oracle is Already Installed**

#### **Check Default Credentials:**
```bash
# Common default credentials
Username: system
Password: (password you set during installation)
Database: ORCL, XE, or your custom SID
```

#### **Find Your Oracle Installation:**
```bash
# Windows - Check Services
services.msc
# Look for "OracleService[SID]" or "OracleServiceXE"

# Check Oracle Home
echo %ORACLE_HOME%
# Usually: C:\app\[username]\product\[version]\dbhomeXE
```

#### **Connect via SQL*Plus to verify:**
```bash
# Open Command Prompt as Administrator
sqlplus system/[your_password]@localhost:1521/[SID]

# Or for Express Edition
sqlplus system/[your_password]@localhost:1521/XE
```

### **2. If You Need to Install Oracle**

#### **Option A: Oracle Database Express Edition (XE) - FREE**
1. **Download:** https://www.oracle.com/database/technologies/xe-downloads.html
2. **Install:** Follow the installation wizard
3. **Set password:** You'll be prompted to set a system password
4. **Default SID:** `XE`

#### **Option B: Oracle Database Standard/Enterprise**
1. **Download:** https://www.oracle.com/database/technologies/
2. **Install:** Use Database Configuration Assistant (DBCA)
3. **Create database:** Set SID and system password

### **3. Creating a Test User (Recommended)**

**Connect as SYSTEM and create a test user:**
```sql
-- Connect as system
sqlplus system/[password]@localhost:1521/[SID]

-- Create test user
CREATE USER test_user IDENTIFIED BY test_password;

-- Grant necessary privileges
GRANT CONNECT, RESOURCE, CREATE TABLE, CREATE VIEW TO test_user;
GRANT UNLIMITED TABLESPACE TO test_user;

-- Exit
EXIT;
```

**Now use these credentials:**
- **Username:** `test_user`
- **Password:** `test_password`
- **Database:** Your SID (e.g., `ORCL`, `XE`)

### **4. Using Oracle Cloud (Free Tier)**

#### **Oracle Cloud Free Tier:**
1. **Sign up:** https://www.oracle.com/cloud/free/
2. **Create Autonomous Database:**
   - Choose "Always Free"
   - Set admin password
   - Download wallet file
3. **Get connection details:**
   - Host: From wallet file
   - Port: 1522 (for cloud)
   - Username: `ADMIN`
   - Password: Your admin password
   - Service: From wallet file

### **5. Using Docker (Easiest for Testing)**

#### **Run Oracle in Docker:**
```bash
# Pull Oracle Express Edition
docker pull container-registry.oracle.com/database/express:latest

# Run Oracle container
docker run -d --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PWD=your_password \
  container-registry.oracle.com/database/express:latest

# Wait for startup (5-10 minutes)
docker logs -f oracle-xe
```

**Docker credentials:**
- **Username:** `system`
- **Password:** `your_password`
- **Database:** `XE`
- **Host:** `localhost`
- **Port:** `1521`

### **6. Common Oracle Connection Strings**

#### **Local Oracle:**
```
Host: localhost
Port: 1521
Username: system
Password: [your_password]
Database: ORCL (or XE for Express)
```

#### **Oracle Cloud:**
```
Host: [from wallet file]
Port: 1522
Username: ADMIN
Password: [your_admin_password]
Service: [from wallet file]
```

#### **Docker Oracle:**
```
Host: localhost
Port: 1521
Username: system
Password: [your_password]
Database: XE
```

### **7. Testing Your Connection**

#### **Using SQL*Plus:**
```bash
# Test connection
sqlplus system/[password]@localhost:1521/[SID]

# If successful, you'll see:
# SQL>
```

#### **Using our test page:**
1. Start Netlify dev server: `npx netlify dev`
2. Open: `http://localhost:8888/test-oracle-simple.html`
3. Enter your credentials
4. Click "Test Connection"

### **8. Troubleshooting Common Issues**

#### **"ORA-12541: TNS:no listener"**
- Oracle service not running
- Check: `services.msc` → "OracleService[SID]"

#### **"ORA-01017: invalid username/password"**
- Wrong password
- User account locked: `ALTER USER system ACCOUNT UNLOCK;`

#### **"ORA-12514: TNS:listener does not currently know of service"**
- Wrong SID/service name
- Database not started

### **9. Quick Setup Commands**

#### **Windows - Start Oracle Services:**
```cmd
# Start Oracle service
net start OracleServiceXE

# Start listener
net start OracleOraDB21Home1TNSListener
```

#### **Linux/Mac - Start Oracle:**
```bash
# Start database
sqlplus / as sysdba
STARTUP
EXIT

# Start listener
lsnrctl start
```

## **🎯 Recommended Approach for Testing**

1. **Use Docker Oracle** (easiest setup)
2. **Create a test user** (safer than using system)
3. **Use our test page** to verify connectivity
4. **Then integrate with the main application**

## **🔒 Security Notes**

- **Never use system user** in production
- **Create dedicated test users** with minimal privileges
- **Use strong passwords**
- **Test on isolated databases** when possible 