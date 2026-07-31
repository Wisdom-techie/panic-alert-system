const { WebSocketServer } = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Dashboard client connected via WebSocket');

    ws.on('close', () => {
      console.log('Dashboard client disconnected');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });

    // Send a welcome/connection confirmation
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Panic Alert Server' }));
  });

  console.log('WebSocket server initialized');
}

function broadcast(data) {
  if (!wss) return;

  const payload = JSON.stringify(data);

  wss.clients.forEach((client) => {
    const { OPEN } = require('ws');
    if (client.readyState === OPEN) {
      client.send(payload);
    }
  });
}

module.exports = { initWebSocket, broadcast };
