import amqp from "amqplib";

import QueueReceiver from "./infrastructure/queueReceiver";
import { formatLog } from "./utils";

const queueReceiver = new QueueReceiver();

const processMessage = async (msg: amqp.ConsumeMessage | null) => {
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
