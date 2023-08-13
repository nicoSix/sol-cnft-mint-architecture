import QueueReceiver from "./infrastructure/queueReceiver";
import { formatLog } from "./utils";
import { CreateCollectionRequest } from "./domain/CreateCollectionRequest";
import { MintRequest } from "./domain/MintRequest";

const queueReceiver = new QueueReceiver();

const processMessage = async (msg: CreateCollectionRequest | MintRequest) => {
  console.log(msg);
}

const main = async () => {
  try {
    await queueReceiver.openChannel();
    queueReceiver.consumeMessages(processMessage);
  } catch (e) {
    console.error(formatLog(`Error while listening for messages: ${e}`));
  }
};

main();
