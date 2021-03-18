import { createServer, Server as HTTPServer } from 'http';
import * as express from 'express';
import { Server } from 'socket.io';

const app = express();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET'],
  },
});

server.listen(process.env.WS_PORT ?? 6000, () => {
  console.log('WS Started');
});

io.on('connect', (socket) => {
  console.log('Connected client', socket.handshake.query);
  setInterval(() => {
    socket.send('pivo', { a: 5});
  }, 2000);
  socket.on('message', (m) => {
    console.log('[server](message): %s', JSON.stringify(m));
    io.emit('message', m);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
