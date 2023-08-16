import getQueueReceiver, { QueueMessage } from "./infrastructure/QueueReceiver";
import { formatLog } from "./utils";
import registerHandlers from "./handlers";
import * as CreateCollection from "./usecases/CreateCollection";
import { CreateCollectionRequest } from "./domain/Collection";

const processMessage = async (msg: QueueMessage) => {
  switch (msg.type) {
    case "create-collection":
      await CreateCollection.execute(msg.payload as CreateCollectionRequest);
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
