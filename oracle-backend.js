const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Test Oracle connection
app.post('/oracle-test-connection', async (req, res) => {
  const { connection } = req.body;
  if (!connection) {
    return res.status(400).json({ success: false, message: 'Missing connection details' });
  }
  const { host, port, username, password, database, serviceName } = connection;
  if (!host || !port || !username || !password || (!database && !serviceName)) {
    return res.status(400).json({ success: false, message: 'Missing required connection parameters' });
  }
  const connectString = serviceName
    ? `${host}:${port}/${serviceName}`
    : `${host}:${port}:${database}`;
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: username,
      password: password,
      connectString
    });
    const versionResult = await conn.execute('SELECT version FROM v$instance', [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({
      success: true,
      message: 'Connection successful!',
      details: {
        version: versionResult.rows?.[0]?.VERSION || 'Unknown',
      }
    });
  } catch (err) {
    console.error('Error in /oracle-test-connection:', err); // Log error details
    res.status(500).json({ success: false, message: 'Connection failed', error: err.message });
  } finally {
    if (conn) try { await conn.close(); } catch (e) {}
  }
});

// Deploy SQL to Oracle
app.post('/oracle-deploy', async (req, res) => {
  const { connection, code, fileName } = req.body;
  if (!connection || !code) {
    return res.status(400).json({ success: false, message: 'Missing connection details or code' });
  }
  const { host, port, username, password, database, serviceName } = connection;
  const connectString = serviceName
    ? `${host}:${port}/${serviceName}`
    : `${host}:${port}:${database}`;
  let conn;
  let result = { success: false, message: '', details: {} };
  try {
    conn = await oracledb.getConnection({
      user: username,
      password: password,
      connectString
    });
    const sqlStatements = code.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      try {
        const execResult = await conn.execute(statement, [], { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        result.details[`statement_${i + 1}`] = {
          success: true,
          rowsAffected: execResult.rowsAffected || 0,
          statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
        };
      } catch (err) {
        console.error('Error executing statement:', statement, err); // Log error details
        result.details[`statement_${i + 1}`] = {
          success: false,
          error: err.message,
          statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
        };
      }
    }
    const failed = Object.values(result.details).filter(d => !d.success);
    if (failed.length === 0) {
      result.success = true;
      result.message = `Successfully deployed ${fileName || 'SQL'} to Oracle database`;
    } else {
      result.success = false;
      result.message = `Deployment completed with ${failed.length} errors`;
    }
    res.json(result);
  } catch (err) {
    console.error('Error in /oracle-deploy:', err); // Log error details
    res.status(500).json({ success: false, message: 'Deployment failed', error: err.message });
  } finally {
    if (conn) try { await conn.close(); } catch (e) {}
  }
});

app.listen(PORT, () => {
  console.log(`Oracle backend listening on http://localhost:${PORT}`);
}); 