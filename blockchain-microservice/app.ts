import getQueueReceiver from "./infrastructure/QueueReceiver";
import { formatLog } from "./utils";
import { CreateCollectionRequest } from "./domain/CreateCollectionRequest";
import { MintRequest } from "./domain/MintRequest";
import registerHandlers from "./handlers";

const processMessage = async (msg: CreateCollectionRequest | MintRequest) => {
  console.log(msg);
};

const main = async () => {
  registerHandlers();

  try {
    const queueReceiver = await getQueueReceiver();
    queueReceiver.consumeMessages(processMessage);
  } catch (e) {
    console.error(formatLog(`Error while listening for messages: ${e}`));
  }
};

main();
