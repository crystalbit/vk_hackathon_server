import { redisMakeGamePair } from './redis.service';
import { sendWerePaired } from './websocket.service';


export const uqMakePair = async (user1: number, user2: number) => {
  await redisMakeGamePair(user1, user2);
  await sendWerePaired(user1, user2);
};
