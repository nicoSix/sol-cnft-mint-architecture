import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import mintController from './application/mintController';

import { formatLog } from './utils';

dotenv.config();

const app: Express = express();
const port = process.env.PRODUCER_PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('Server is up and running!');
});

app.use(express.json());
app.use(mintController);

app.listen(port, () => {
  console.log(formatLog(`Server is running at http://localhost:${port}`));
});