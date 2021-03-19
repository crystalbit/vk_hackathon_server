import { redis, sockets } from 'dima-backend';

export const uqMakePair = async (user1: number, user2: number) => {
  await redis.redisMakeGamePair(user1, user2);
  await sockets.sendWerePaired(user1, user2);
};
