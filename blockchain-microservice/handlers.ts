import getQueueReceiver from "./infrastructure/QueueReceiver";
import getPrismaClient from "./infrastructure/prisma/PrismaClient";

import { formatLog } from "./utils";

const closeClients = async () => {
  const queueReceiver = await getQueueReceiver();
  const prismaClient = getPrismaClient();

  queueReceiver.closeChannel();
  prismaClient.closeClient();
};

const registerHandlers = () => {
  process.on("unhandledRejection", async (e) => {
    console.error(formatLog(`Unhandled rejection: ${e}`));
    await closeClients();
    process.exit(1);
  });

  process.on("uncaughtException", async (e) => {
    console.error(formatLog(`Uncaught exception: ${e}`));
    await closeClients();
    process.exit(1);
  });

  process.on("SIGINT", async () => {
    console.warn(formatLog(`Received SIGINT signal, turning off clients and closing ...`));
    await closeClients();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.warn(formatLog(`Received SIGTERM signal, turning off clients and closing ...`));
    await closeClients();
    process.exit(0);
  });
};

export default registerHandlers;
