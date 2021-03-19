import { RedisService } from 'dima-backend';
import { sendWerePaired } from './websocket.service';

const redis = new RedisService();

export const uqMakePair = async (user1: number, user2: number) => {
  await redis.redisMakeGamePair(user1, user2);
  await sendWerePaired(user1, user2);
};
