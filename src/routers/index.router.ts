import * as express from 'express';
import {
  redisGetPair,
  redisIsUserWaiting,
  redisPopUser,
  redisSetInQueue
} from '../services/redis.service';
import { uqMakePair } from "../services/user-queue.service";
import {sendEnemyFinished, sendLose, sendMessageFrom, sendWin} from "../services/websocket.service";
import {Combination, getCombination, setCombination} from "../stores/combinations.store";

export const IndexRouter = express.Router();

IndexRouter.get('/', (req: express.Request, res: express.Response) => {
  console.log('data fetched');
  res.send('222');
});

IndexRouter.get('/my-state', (req: express.Request, res: express.Response) => {
  const userId = req.query.userId;
  (async () => {
    const isWaiting = await redisIsUserWaiting(+userId);
    if (isWaiting) {
      res.json({
        state: 'waiting', // TODO ? isomorphic
        ...isWaiting, // ...{ start, now }
      });
    } else {
      res.json({
        state: 'new',
      });
    }
  })();
});

IndexRouter.post('/add-user', (req: express.Request, res: express.Response) => {
  const userId: number = req.body.userId;
  console.log('/add-user', userId);
  (async () => {
    // TODO try .. catch
    const enemy = await redisPopUser();
    // если пока нет противника - помещаем в очередь
    // иначе даём противника
    if (enemy === null) {
      await redisSetInQueue(userId);
      const isWaiting = await redisIsUserWaiting(+userId);
      res.json({ queued: true, ...isWaiting });
    } else {
      await uqMakePair(+userId, +enemy);
      res.json({ queued: false, enemy });
    }
  })();
});

IndexRouter.post('/message', (req: express.Request, res: express.Response) => {
  const fromUserId: number = req.body.fromUserId;
  const text: string = req.body.text;
  console.log('/message', { fromUserId, text });
  (async () => {
    const sent = await sendMessageFrom(fromUserId, text);

    res.json({ success: sent });
  })();
});

IndexRouter.post('/action', (req: express.Request, res: express.Response) => {
  const fromUserId: number = req.body.fromUserId;
  const action: string = req.body.action;
  const payload: string = req.body.payload;
  console.log('/action', { fromUserId, action, payload });
  (async () => {
    if (action === 'combination') {
      const payloadData = JSON.parse(payload) as {
        stickers: Combination;
      };
      setCombination(+fromUserId, payloadData.stickers);
      await sendEnemyFinished(fromUserId);
      res.json({ success: true });
      // проверим, оба ли юзера отправили комбинацию, и завершим игру в таком случае
      const pair = await redisGetPair(+fromUserId);
      const enemyCombination = getCombination(+pair);
      if (enemyCombination) {
        await new Promise(rs => setTimeout(rs, 1000)); // драматическая пауза
        await sendWin(+fromUserId, enemyCombination);
        await sendLose(+pair, payloadData.stickers);
      }
    } else {
      res.json({ success: false });
    }
  })();
});
