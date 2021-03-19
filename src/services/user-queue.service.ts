import { RedisService } from 'dima-backend';
import { sendWerePaired } from './websocket.service';


export const uqMakePair = async (user1: number, user2: number) => {
  await RedisService.redisMakeGamePair(user1, user2);
  await sendWerePaired(user1, user2);
};
