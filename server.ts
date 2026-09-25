import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'clinic_store.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

app.use(express.json({ limit: '20mb' }));

// Helper to read and write database
function getStoredState() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading DB_FILE:', e);
    }
  }
  return null;
}

function saveStoredState(state: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing DB_FILE:', e);
    return false;
  }
}

// Track active connected devices for presence awareness
interface ConnectedClient {
  id: string;
  deviceName: string;
  role: string;
  connectedAt: string;
  ws: WebSocket;
}

const connectedClients = new Map<WebSocket, ConnectedClient>();

function broadcast(message: object, excludeSender?: WebSocket) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== excludeSender && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function broadcastPresence() {
  const devices = Array.from(connectedClients.values()).map(c => ({
    id: c.id,
    deviceName: c.deviceName,
    role: c.role,
    connectedAt: c.connectedAt,
  }));
  broadcast({
    type: 'PRESENCE_UPDATE',
    devices,
    totalOnline: devices.length,
  });
}

wss.on('connection', (ws: WebSocket, req) => {
  const clientId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  let deviceName = 'Browser Client';
  if (userAgent.includes('Mobile')) deviceName = 'Mobile POS';
  else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) deviceName = 'Dispensary Tablet';
  else if (userAgent.includes('Macintosh')) deviceName = 'Doctor Mac Station';
  else if (userAgent.includes('Windows')) deviceName = 'Counter Terminal (PC)';
  else deviceName = 'Workstation ' + clientId.slice(-4);

  const clientInfo: ConnectedClient = {
    id: clientId,
    deviceName,
    role: 'Staff',
    connectedAt: new Date().toISOString(),
    ws,
  };

  connectedClients.set(ws, clientInfo);

  // Send initial acknowledge & current presence
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    clientId,
    deviceName,
    totalOnline: connectedClients.size,
  }));

  broadcastPresence();

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      if (data.type === 'IDENTIFY') {
        clientInfo.deviceName = data.deviceName || clientInfo.deviceName;
        clientInfo.role = data.role || clientInfo.role;
        broadcastPresence();
      } else if (data.type === 'STATE_CHANGE') {
        // Authoritative mutation broadcast
        saveStoredState(data.state);
        broadcast({
          type: 'SYNC_STATE',
          state: data.state,
          sourceClientId: clientInfo.id,
          sourceDeviceName: clientInfo.deviceName,
          action: data.action || 'Data updated',
          timestamp: new Date().toISOString(),
        }, ws);
      } else if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcastPresence();
  });

  ws.on('error', () => {
    connectedClients.delete(ws);
    broadcastPresence();
  });
});

// REST API Endpoints

// 1. Get initial synchronized state
app.get('/api/state', (req, res) => {
  const state = getStoredState();
  res.json({
    success: true,
    data: state,
    serverTime: new Date().toISOString(),
  });
});

// 2. Save / Update state (Sync push)
app.post('/api/state', (req, res) => {
  const { state, action, clientId } = req.body;
  if (!state) {
    return res.status(400).json({ success: false, error: 'Missing state payload' });
  }

  saveStoredState(state);

  // Broadcast to all WS clients
  broadcast({
    type: 'SYNC_STATE',
    state,
    sourceClientId: clientId || 'SERVER',
    action: action || 'State updated',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, timestamp: new Date().toISOString() });
});

// 3. Cloud Backup Export / Snapshot
app.get('/api/backup/export', (req, res) => {
  const state = getStoredState();
  const backupData = {
    appName: 'Similia POS',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    clinicName: state?.company?.name || 'Clinic',
    state,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=similia_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(backupData, null, 2));
});

// 4. Cloud Backup Snapshot Creation (Saved to server disk)
app.post('/api/backup/snapshot', (req, res) => {
  const state = getStoredState();
  if (!state) {
    return res.status(400).json({ success: false, error: 'No data to snapshot' });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `snapshot_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    // Keep only last 10 snapshots to prevent unbounded growth
    const files = fs.readdirSync(BACKUP_DIR).sort().reverse();
    if (files.length > 10) {
      files.slice(10).forEach(file => {
        try { fs.unlinkSync(path.join(BACKUP_DIR, file)); } catch (e) {}
      });
    }
    res.json({
      success: true,
      snapshotName: filename,
      createdAt: new Date().toISOString(),
      message: 'Cloud snapshot stored securely on server.',
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 5. Restore from backup
app.post('/api/backup/restore', (req, res) => {
  const { state } = req.body;
  if (!state || !state.company) {
    return res.status(400).json({ success: false, error: 'Invalid backup format' });
  }
  saveStoredState(state);
  broadcast({
    type: 'SYNC_STATE',
    state,
    action: 'Cloud Backup Restored',
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, message: 'Database restored successfully' });
});

// 6. Connected devices / Health status
app.get('/api/sync-status', (req, res) => {
  const devices = Array.from(connectedClients.values()).map(c => ({
    id: c.id,
    deviceName: c.deviceName,
    role: c.role,
    connectedAt: c.connectedAt,
  }));
  res.json({
    onlineDevices: devices.length,
    devices,
    serverUptime: process.uptime(),
    dbExists: fs.existsSync(DB_FILE),
  });
});

// Mount Vite or serve static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (isProd: ${isProd})`);
  });
}

startServer();
