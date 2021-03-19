import { createServer, Server as HTTPServer } from 'http';
import * as express from 'express';
import { Server } from 'socket.io';
import {clearSocket, getSocket, setSocket} from "../stores/users.store";
import {redisEndGame, redisGetPair, redisGetQueueSize} from "./redis.service";
import {Combination} from "../stores/combinations.store";

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
  const { userId } = socket.handshake.query;

  setSocket(+userId, socket);

  socket.on('message', (m) => {
    console.log('[server](message): %s', JSON.stringify(m));
    io.emit('message', m);
  });

  socket.on('disconnect', async () => {
    const pair = await redisGetPair(+userId);
    clearSocket(+userId);
    await redisEndGame(+userId);
    await sendEnemyLeft(+pair);
    console.log('Client disconnected');
  });
});

export const sendMessageFrom = async (fromUser: number, text: string): Promise<boolean> => {
  const pair = await redisGetPair(fromUser);
  if (!pair) {
    // TODO error message
    return false;
  }
  const socket = getSocket(+pair);
  if (!socket || text === '') {
    return false;
  }
  socket.emit('text', text);
  return true;
};

export const sendWerePaired = async (user1: number, user2: number) => {
  const socket1 = getSocket(user1);
  const socket2 = getSocket(user2);
  socket1?.emit('paired', user2);
  socket2?.emit('paired', user1); // TODO assert
};

export const sendEnemyLeft = async (userId: number) => {
  const socket = getSocket(userId);
  socket?.emit('enemy_left');
};

export const sendEnemyFinished = async (userId: number) => {
  console.log('enemy finished', userId);
  const pair = await redisGetPair(userId);
  if (!pair) {
    // TODO error message
    return false;
  }
  const socket = getSocket(+pair);
  if (!socket) {
    return false;
  }
  socket.emit('enemy_finished');
  return true;
};

export const sendWin = async (userId: number, combination: Combination) => {
  console.log('WIN')
  const socket = getSocket(+userId);
  if (!socket) {
    return false;
  }
  socket.emit('win', combination);
};

export const sendLose = async (userId: number, combination: Combination) => {
  console.log('LOSE')
  const socket = getSocket(+userId);
  if (!socket) {
    return false;
  }
  socket.emit('lose', combination);
};

export const sendNeutral = async (userId: number, combination: Combination) => {
  console.log('NEUTRAL')
  const socket = getSocket(+userId);
  if (!socket) {
    return false;
  }
  socket.emit('neutral', combination);
};
