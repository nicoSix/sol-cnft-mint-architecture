import { Router } from "express";
import { formatLog } from "../utils";
import { DemoRequest } from "../domain/DemoRequest";

const router = Router();

router.post("/demo", async function (req, res) {
  const demoRequest: DemoRequest = req.body;
  console.log(formatLog(`Received request to start mint demo: ${JSON.stringify(demoRequest)}`));

  // TODO: launch demo

  res.status(200).send();
});

export default router;
