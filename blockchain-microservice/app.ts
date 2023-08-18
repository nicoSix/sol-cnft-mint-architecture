import getQueueReceiver, { QueueMessage } from "./infrastructure/QueueReceiver";
import { formatLog } from "./utils";
import registerHandlers from "./handlers";
import * as CreateCollection from "./usecases/CreateCollection";
import * as MintToCollection from "./usecases/MintToCollection";
import { CreateCollectionRequest } from "./domain/Collection";
import { MintRequest } from "./domain/Mint";

const processMessage = async (msg: QueueMessage) => {
  switch (msg.type) {
    case "create-collection":
      await CreateCollection.execute(msg.payload as CreateCollectionRequest);
      break;

    case "mint":
      await MintToCollection.execute(msg.payload as MintRequest);
      break;

    default:
      throw `Message of type ${msg.type} cannot be processed by this service`;
  }
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
