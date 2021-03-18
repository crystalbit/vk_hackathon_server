import * as express from 'express';
import {IndexRouter} from "./routers/index.router";
import * as bodyParser from 'body-parser';
import {redisPopUser} from "./services/redis.service";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(IndexRouter);

app.listen(3000, () => {
  console.log('Server started')
});
