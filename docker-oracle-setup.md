# 🐳 Oracle Database with Docker Setup Guide

## **Why Docker Oracle?**
- **Fastest setup** - No installation required
- **Isolated environment** - Won't affect your system
- **Easy cleanup** - Just stop and remove container
- **Consistent environment** - Same setup everywhere
- **No system resources** when not running

## **🚀 Quick Setup (5 minutes)**

### **Step 1: Pull Oracle Express Edition Image**
```bash
docker pull container-registry.oracle.com/database/express:latest
```

### **Step 2: Run Oracle Container**
```bash
docker run -d --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PWD=OracleTest123! \
  container-registry.oracle.com/database/express:latest
```

### **Step 3: Wait for Startup**
```bash
docker logs -f oracle-xe
```
**Wait until you see:** `DATABASE IS READY TO USE!`

## **🔗 Your Oracle Credentials**

```
Host: localhost
Port: 1521
Username: system
Password: OracleTest123!
Database: XE
```

## **🧪 Testing the Connection**

### **Step 4: Test with Our Application**
1. **Start Netlify dev server:**
   ```bash
   npx netlify dev
   ```

2. **Open test page:**
   - Navigate to: `http://localhost:8888/test-oracle-simple.html`

3. **Enter Docker Oracle credentials:**
   - **Host:** `localhost`
   - **Port:** `1521`
   - **Username:** `system`
   - **Password:** `OracleTest123!`
   - **Database:** `XE`
   - **Service Name:** Leave empty

4. **Test connection:**
   - Click "🔗 Test Oracle Connection"
   - You should see success with Oracle version info

## **🔧 Docker Commands**

### **Start Oracle Container:**
```bash
docker start oracle-xe
```

### **Stop Oracle Container:**
```bash
docker stop oracle-xe
```

### **Remove Oracle Container:**
```bash
docker stop oracle-xe
docker rm oracle-xe
```

### **View Container Logs:**
```bash
docker logs oracle-xe
```

### **Connect to Oracle via SQL*Plus:**
```bash
docker exec -it oracle-xe sqlplus system/OracleTest123!@localhost:1521/XE
```

## **🎯 Quick Test Commands**

### **Check Container Status:**
```bash
docker ps
```

### **Test Oracle Connection:**
```bash
docker exec -it oracle-xe sqlplus system/OracleTest123!@localhost:1521/XE
```

### **Create Test User:**
```sql
CREATE USER test_user IDENTIFIED BY test123;
GRANT CONNECT, RESOURCE, CREATE TABLE, CREATE VIEW TO test_user;
GRANT UNLIMITED TABLESPACE TO test_user;
EXIT;
```

### **Test with Test User:**
```bash
docker exec -it oracle-xe sqlplus test_user/test123@localhost:1521/XE
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

## **🔧 Troubleshooting**

### **Container Won't Start:**
```bash
# Check if port 1521 is available
netstat -an | findstr :1521

# If port is in use, use different port
docker run -d --name oracle-xe \
  -p 1522:1521 \
  -e ORACLE_PWD=OracleTest123! \
  container-registry.oracle.com/database/express:latest
```

### **Connection Timeout:**
- **Wait longer** - Oracle takes 5-10 minutes to start
- **Check logs:** `docker logs oracle-xe`
- **Verify container is running:** `docker ps`

### **Permission Issues:**
```bash
# Run as administrator if needed
# Or use different port mapping
```

## **🎯 Advantages of Docker Oracle**

1. **No Installation** - Just pull and run
2. **Isolated** - Won't conflict with other software
3. **Portable** - Same setup on any machine
4. **Clean** - Easy to remove when done
5. **Fast** - Starts in minutes
6. **Safe** - Won't affect your system

## **📊 Resource Usage**

- **Memory:** ~2GB when running
- **Disk:** ~10GB for container
- **CPU:** Minimal when idle
- **Network:** Only when connecting

## **🔒 Security Notes**

- **Default password** - Change for production
- **Local only** - Not accessible from network
- **Test environment** - Don't use for production data
- **Isolated** - Won't affect other databases

## **🎯 Next Steps**

Once Docker Oracle is running:
1. Test connection with our application
2. Try deploying sample SQL
3. Test Sybase to Oracle conversion
4. Verify all migration features work
5. Stop container when done: `docker stop oracle-xe` 