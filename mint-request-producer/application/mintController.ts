import { Router } from "express";
import { MintRequest } from "../domain/MintRequest";
import { sendMintRequestMessage } from "../infrastructure/sendMintRequestMessage";
import { formatLog } from "../utils";

const router = Router();

router.post('/mint', async function(req, res) {
    // TODO: Verify body through schema
    const mintRequest: MintRequest = req.body;
    console.log(formatLog(`Received request to mint NFT: ${JSON.stringify(req.body)}`))

    await sendMintRequestMessage(mintRequest);

    res.status(200).send();
});

export default router;