require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const { load, save } = require('./persist');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.get('/health', (_req, res) => res.send('ok'));

const { accounts, rooms } = load(); // persisted maps
const sessions = new Map(); // socket.id -> { email, name, room }

function broadcastUsers(room) {
  const list = [];
  for (const [id, info] of sessions.entries()) {
    if (info.room === room) list.push({ id, name: info.name });
  }
  io.to(room).emit('users', list);
}

io.on('connection', (socket) => {
  socket.on('signup', async ({ email, password, name }, cb) => {
    if (accounts.has(email)) {
      return cb({ ok: false, error: 'Email già registrata' });
    }
    const passHash = await bcrypt.hash(password, 10);
    accounts.set(email, { name, passHash });
    save(accounts, rooms);
    cb({ ok: true });
  });

  socket.on('login', async ({ email, password, room }, cb) => {
    const account = accounts.get(email);
    if (!account) return cb({ ok: false, error: 'Utente non trovato' });
    const ok = await bcrypt.compare(password, account.passHash);
    if (!ok) return cb({ ok: false, error: 'Credenziali errate' });
    sessions.set(socket.id, { email, name: account.name, room });
    socket.join(room);
    const history = rooms.get(room) || [];
    cb({ ok: true, name: account.name, history });
    io.to(room).emit('system', `${account.name} si è unito alla chat`);
    broadcastUsers(room);
  });

  socket.on('chat', (msg) => {
    const user = sessions.get(socket.id);
    if (user) {
      const list = rooms.get(user.room) || [];
      const entry = { name: user.name, msg };
      list.push(entry);
      rooms.set(user.room, list.slice(-50));
      save(accounts, rooms);
      io.to(user.room).emit('chat', entry);
    }
  });

  socket.on('dm', ({ to, msg }) => {
    const user = sessions.get(socket.id);
    if (user && sessions.has(to)) {
      io.to(to).emit('dm', { from: { id: socket.id, name: user.name }, msg });
    }
  });

  socket.on('offer', (data) => {
    const user = sessions.get(socket.id);
    if (user) {
      socket.to(user.room).emit('offer', { id: socket.id, sdp: data });
    }
  });

  socket.on('answer', (data) => {
    const user = sessions.get(socket.id);
    if (user) {
      socket.to(data.to).emit('answer', { id: socket.id, sdp: data.sdp });
    }
  });

  socket.on('ice', (data) => {
    const user = sessions.get(socket.id);
    if (user) {
      socket.to(user.room).emit('ice', { id: socket.id, candidate: data });
    }
  });

  socket.on('disconnect', () => {
    const user = sessions.get(socket.id);
    if (user) {
      io.to(user.room).emit('system', `${user.name} ha lasciato la chat`);
      sessions.delete(socket.id);
      broadcastUsers(user.room);
    }
  });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
