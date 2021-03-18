import * as express from 'express';
import { IndexRouter } from "./routers/index.router";
import * as bodyParser from 'body-parser';
import './services/websocket.service';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(IndexRouter);

app.listen(process.env.PORT ?? 5000, () => {
  console.log('Server started');
});
