import * as express from 'express';
import { RedisService } from 'dima-backend';
import { uqMakePair } from "../services/user-queue.service";
import {sendEnemyFinished, sendLose, sendMessageFrom, sendNeutral, sendWin} from "../services/websocket.service";
import {clearCombination, Combination, getCombination, setCombination} from "../stores/combinations.store";
import {compareCombinations} from "../services/logic.service";

const redis = new RedisService();

export const IndexRouter = express.Router();

IndexRouter.get('/my-state', (req: express.Request, res: express.Response) => {
  const userId = req.query.userId;
  (async () => {
    const isWaiting = await redis.redisIsUserWaiting(+userId);
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
    const enemy = await redis.redisPopUser();
    // если пока нет противника - помещаем в очередь
    // иначе даём противника
    if (enemy === null) {
      await redis.redisSetInQueue(userId);
      const isWaiting = await redis.redisIsUserWaiting(+userId);
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
  (async () => {
    if (action === 'combination') {
      const payloadData = JSON.parse(payload) as {
        stickers: Combination;
      };
      setCombination(+fromUserId, payloadData.stickers);
      await sendEnemyFinished(fromUserId);
      res.json({ success: true });
      // проверим, оба ли юзера отправили комбинацию, и завершим игру в таком случае
      const pair = await redis.redisGetPair(+fromUserId);
      const enemyCombination = getCombination(+pair);
      if (enemyCombination) {
        const score = compareCombinations(payloadData.stickers, enemyCombination);
        await new Promise(rs => setTimeout(rs, 1000)); // драматическая пауза
        if (score > 0) {
          await sendWin(+fromUserId, enemyCombination);
          await sendLose(+pair, payloadData.stickers);
        } else if (score < 0) {
          await sendLose(+fromUserId, enemyCombination);
          await sendWin(+pair, payloadData.stickers);
        } else {
          await sendNeutral(+fromUserId, enemyCombination);
          await sendNeutral(+pair, payloadData.stickers);
        }
        clearCombination(+fromUserId);
        clearCombination(+pair);
      }
    } else {
      res.json({ success: false });
    }
  })();
});
