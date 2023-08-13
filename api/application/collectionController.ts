import { Router } from "express";
import { MintRequest } from "../domain/MintRequest";
import QueueSender, { RequestType } from "../infrastructure/queueSender";
import { formatLog } from "../utils";
import { CreateCollectionRequest } from "../domain/CreateCollectionRequest";

const router = Router();

router.post("/collection/:collection/mint", async function (req, res) {
  const mintRequest: MintRequest = req.body;
  console.log(formatLog(`Received request to mint NFT: ${JSON.stringify(req.body)}`));

  const queueSender = new QueueSender();

  await queueSender.openChannel();
  queueSender.sendRequestMessage(RequestType.MINT, mintRequest);
  await queueSender.closeChannel();

  res.status(200).send();
});

router.post("/collection", async function (req, res) {
  const collectionRequest: CreateCollectionRequest = req.body;
  console.log(formatLog(`Received request to create NFT collection: ${JSON.stringify(req.body)}`));

  const queueSender = new QueueSender();

  await queueSender.openChannel();
  queueSender.sendRequestMessage(RequestType.CREATE_COLLECTION, collectionRequest);
  await queueSender.closeChannel();

  res.status(200).send();
});

export default router;
