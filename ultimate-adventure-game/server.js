const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);
const players = new Map();
let nextPlayerId = 1;
const colors = [0x67e8f9, 0xfbbf24, 0xf97316, 0xa78bfa, 0x86efac, 0xf9a8d4];

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function snapshot() {
  return [...players.values()].map((player) => ({
    id: player.id,
    x: player.x,
    y: player.y,
    flipX: player.flipX,
    color: player.color
  }));
}

function broadcastState() {
  const message = { type: 'state', players: snapshot() };
  wss.clients.forEach((client) => send(client, message));
}

function validNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

const server = http.createServer((request, response) => {
  let requestPath;
  try {
    requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
  } catch (error) {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }
  if (requestPath === '/') requestPath = '/index.html';
  const filePath = path.resolve(ROOT, `.${requestPath}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(data);
  });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  const id = String(nextPlayerId++);
  const player = { id, x: 100, y: 100, flipX: false, color: colors[(Number(id) - 1) % colors.length] };
  players.set(id, player);
  send(socket, { type: 'welcome', id });
  broadcastState();

  socket.on('message', (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch (error) { return; }
    if (message.type === 'join' || message.type === 'state') {
      player.x = Math.max(-5000000, Math.min(5000000, validNumber(Number(message.x), player.x)));
      player.y = Math.max(0, Math.min(2400, validNumber(Number(message.y), player.y)));
      player.flipX = !!message.flipX;
      broadcastState();
    }
  });
  socket.on('close', () => {
    players.delete(id);
    broadcastState();
  });
});

setInterval(broadcastState, 100);

server.listen(PORT, () => {
  console.log(`Ultimate Adventure multiplayer server: http://localhost:${PORT}`);
});
