const { encrypt, decrypt } = require('../../real_time/utils/rsa');
// In-memory rooms: { roomId: { keys, users: [{ id, name, socketId }], messages: [] } }
const rooms = new Map();

function getRoomInfo(roomId) {
  if (!rooms.has(roomId)) return null;
  const room = rooms.get(roomId);
  return {
    roomId,
    users:    room.users.map(u => ({ id: u.id, name: u.name })),
    hasKeys:  !!room.keys,
    keys:     room.keys ? { e: room.keys.e, n: room.keys.n } : null, // only public
    messages: room.messages,
  };
}

module.exports = function setupSockets(io) {

  io.on('connection', (socket) => {
    console.log(`[WS] connected: ${socket.id}`);

    // ── Join room ────────────────────────────────────────────────────────────
    // client emits: { roomId, userName }
    socket.on('join_room', ({ roomId, userName }) => {
      if (!roomId || !userName) return;

      // Create room if needed
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { keys: null, users: [], messages: [] });
      }

      const room = rooms.get(roomId);

      // Avoid duplicate users
      const alreadyIn = room.users.find(u => u.socketId === socket.id);
      if (!alreadyIn) {
        room.users.push({ id: socket.id, name: userName, socketId: socket.id });
      }

      socket.join(roomId);
      socket.data.roomId   = roomId;
      socket.data.userName = userName;

      console.log(`[WS] ${userName} joined room ${roomId}`);

      // Notify all in room
      io.to(roomId).emit('room_update', getRoomInfo(roomId));

      // Send history to the new user
      socket.emit('message_history', room.messages);
    });

    // ── Set RSA keys for the room ────────────────────────────────────────────
    // client emits: { roomId, keys: { e, n, d } }
    socket.on('set_keys', ({ roomId, keys }) => {
      if (!rooms.has(roomId)) return;
      const room   = rooms.get(roomId);
      room.keys    = keys;
      console.log(`[WS] keys set for room ${roomId}: n=${keys.n}, e=${keys.e}`);
      io.to(roomId).emit('keys_updated', { e: keys.e, n: keys.n });
      io.to(roomId).emit('room_update', getRoomInfo(roomId));
    });

    // ── Send message ─────────────────────────────────────────────────────────
    // client emits: { roomId, text }
    // server encrypts and broadcasts
    socket.on('send_message', ({ roomId, text }) => {
      if (!rooms.has(roomId)) return;
      const room = rooms.get(roomId);

      if (!room.keys) {
        socket.emit('error_msg', { error: 'No hay claves RSA configuradas en esta sala' });
        return;
      }

      const { e, n, d } = room.keys;

      // Encrypt
      const encResult = encrypt(text, e, n);

      // Decrypt
      const decResult = decrypt(encResult.ciphers, d, n);

      const message = {
        id:        Date.now(),
        sender:    socket.data.userName || 'Anon',
        senderId:  socket.id,
        text,
        ciphers:   encResult.ciphers,
        encSteps:  encResult.steps,
        decSteps:  decResult.steps,
        encFormula: encResult.formula,
        decFormula: decResult.formula,
        decrypted: decResult.text,
        timestamp: new Date().toISOString(),
      };

      room.messages.push(message);

      // Keep only last 100 messages in memory
      if (room.messages.length > 100) room.messages.shift();

      // Broadcast to everyone in room
      io.to(roomId).emit('new_message', message);

      console.log(`[WS] message in room ${roomId} from ${message.sender}: "${text.slice(0, 30)}"`);
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { roomId, userName } = socket.data;
      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.users = room.users.filter(u => u.socketId !== socket.id);
        io.to(roomId).emit('room_update', getRoomInfo(roomId));
        console.log(`[WS] ${userName} left room ${roomId}`);

        // Clean up empty rooms
        if (room.users.length === 0) {
          rooms.delete(roomId);
          console.log(`[WS] room ${roomId} deleted (empty)`);
        }
      }
      console.log(`[WS] disconnected: ${socket.id}`);
    });

  });
};