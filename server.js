const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(express.static('public'));

let config = {
  gateway: '',
  internalPort: '',
  externalPort: '',
  protocol: 'tcp',
  lifetime: '3600',
  timeout: 30
};

let lastStatus = {
  success: null,
  message: '',
  timestamp: null,
  nextRun: null
};

let isRunning = false;
let intervalId = null;
let countdownIntervalId = null;

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function runNatpmpc() {
  if (!config.gateway || !config.internalPort || !config.externalPort) {
    const error = 'Configuration incomplete. Please set gateway, internal port, and external port.';
    lastStatus = {
      success: false,
      message: error,
      timestamp: new Date().toISOString(),
      nextRun: Date.now() + (config.timeout * 1000)
    };
    broadcast({ type: 'status', data: lastStatus });
    return;
  }

  const protocol = config.protocol === 'tcp' ? 'tcp' : 'udp';
  const command = `natpmpc -g ${config.gateway} -a ${config.internalPort} ${config.externalPort} ${protocol} ${config.lifetime}`;
  
  console.log('Running:', command);

  exec(command, (error, stdout, stderr) => {
    const timestamp = new Date().toISOString();
    
    if (error) {
      lastStatus = {
        success: false,
        message: `Error: ${stderr || error.message}`,
        timestamp: timestamp,
        nextRun: Date.now() + (config.timeout * 1000),
        command: command
      };
    } else {
      lastStatus = {
        success: true,
        message: stdout || 'NAT-PMP mapping successful',
        timestamp: timestamp,
        nextRun: Date.now() + (config.timeout * 1000),
        command: command
      };
    }
    
    console.log('Status:', lastStatus);
    broadcast({ type: 'status', data: lastStatus });
  });
}

function startCountdown() {
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
  }
  
  countdownIntervalId = setInterval(() => {
    if (lastStatus.nextRun) {
      const remaining = Math.max(0, lastStatus.nextRun - Date.now());
      broadcast({ 
        type: 'countdown', 
        data: { 
          remaining: remaining,
          total: config.timeout * 1000
        } 
      });
    }
  }, 100);
}

function startMonitoring() {
  if (isRunning) return;
  
  isRunning = true;
  runNatpmpc();
  startCountdown();
  
  intervalId = setInterval(() => {
    runNatpmpc();
  }, config.timeout * 1000);
  
  broadcast({ type: 'monitoring', data: { running: true } });
}

function stopMonitoring() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
  
  isRunning = false;
  lastStatus.nextRun = null;
  
  broadcast({ type: 'monitoring', data: { running: false } });
}

app.get('/api/config', (req, res) => {
  res.json(config);
});

app.post('/api/config', (req, res) => {
  const wasRunning = isRunning;
  
  if (wasRunning) {
    stopMonitoring();
  }
  
  config = { ...config, ...req.body };
  res.json(config);
  
  if (wasRunning) {
    setTimeout(() => startMonitoring(), 500);
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: lastStatus,
    running: isRunning
  });
});

app.post('/api/start', (req, res) => {
  startMonitoring();
  res.json({ success: true, running: true });
});

app.post('/api/stop', (req, res) => {
  stopMonitoring();
  res.json({ success: true, running: false });
});

app.post('/api/run-once', (req, res) => {
  runNatpmpc();
  res.json({ success: true });
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.send(JSON.stringify({ 
    type: 'init', 
    data: {
      config: config,
      status: lastStatus,
      running: isRunning
    }
  }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
