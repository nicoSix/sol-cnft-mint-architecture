import { Router } from "express";
import { MintRequest } from "../domain/MintRequest";
import getQueueSender, { RequestType } from "../infrastructure/QueueSender";
import { formatLog } from "../utils";
import { CreateCollectionRequest } from "../domain/CreateCollectionRequest";

const router = Router();

router.post("/collection/:collection/mint", async function (req, res) {
  const mintRequest: MintRequest = req.body;
  const queueSender = await getQueueSender();

  console.log(formatLog(`Received request to mint NFT: ${JSON.stringify(req.body)}`));

  queueSender.sendRequestMessage(RequestType.MINT, mintRequest);

  res.status(200).send();
});

router.post("/collection", async function (req, res) {
  const collectionRequest: CreateCollectionRequest = req.body;
  const queueSender = await getQueueSender();

  console.log(formatLog(`Received request to create NFT collection: ${JSON.stringify(req.body)}`));

  queueSender.sendRequestMessage(RequestType.CREATE_COLLECTION, collectionRequest);

  res.status(200).send();
});

export default router;
