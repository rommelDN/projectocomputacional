require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const rsaRoutes  = require('./routes/rsa');
const setupSockets = require('../decrypt/sockets/chat');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', rsaRoutes);

// ─── WebSockets ───────────────────────────────────────────────────────────────
setupSockets(io);

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────┐
  │   RSA Backend corriendo             │
  │   HTTP  →  http://localhost:${PORT}    │
  │   WS    →  ws://localhost:${PORT}      │
  │   CORS  →  ${CLIENT_URL}  │
  └─────────────────────────────────────┘
  `);
});