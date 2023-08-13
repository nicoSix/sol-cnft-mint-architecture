import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import collectionController from "./application/collectionController";

import { formatLog } from "./utils";

dotenv.config();

const app: Express = express();
const port = process.env.PRODUCER_PORT;

app.get("/", (_: Request, res: Response) => {
  res.send("Server is up and running!");
});

app.use(express.json());
app.use(collectionController);

app.listen(port, () => {
  console.log(formatLog(`Server is running at http://localhost:${port}`));
});
