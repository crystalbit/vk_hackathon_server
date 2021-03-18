import * as express from 'express';
import {
  redisIsUserWaiting,
  redisPopUser,
  redisSetInQueue
} from '../services/redis.service';
import { uqMakePair } from "../services/user-queue.service";
import { sendMessageFrom } from "../services/websocket.service";

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
    console.log({ enemy });
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
