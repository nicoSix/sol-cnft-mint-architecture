import amqp from "amqplib";

import QueueReceiver from "./infrastructure/queueReceiver";
import { formatLog } from "./utils";

const queueReceiver = new QueueReceiver();

const main = async () => {
    try {
        await queueReceiver.openChannel();
        await queueReceiver.consumeMessages(async (msg: amqp.ConsumeMessage | null) => console.log(msg));
    } catch (e) {
        console.error(formatLog(`Error while listening for messages: ${e}`));
    } finally {
        await queueReceiver.closeChannel();
    }
}

main();