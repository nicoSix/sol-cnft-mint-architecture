#!/usr/bin/env node

import amqp from "amqplib";

import { MintRequest } from "../domain/MintRequest";
import { formatLog } from "../utils";
import { CreateCollectionRequest } from "../domain/CreateCollectionRequest";

const QUEUE_NAME = process.env.QUEUE_NAME || "blockchain-request-queue";
const QUEUE_URL = process.env.QUEUE_URL || "amqp://localhost";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let queueSender: QueueSender;

export enum RequestType {
  MINT = "mint",
  CREATE_COLLECTION = "create-collection",
}

class QueueSender {
  queue_url: string;
  channel: amqp.Channel | null = null;
  connection: amqp.Connection | null = null;

  constructor() {
    this.queue_url = QUEUE_URL;
  }

  async openChannel() {
    if (!this.channel && !this.connection) {
      this.connection = await amqp.connect(this.queue_url);
      this.channel = await this.connection.createChannel();
    } else {
      throw "Cannot open already open channel or connection";
    }
  }

  async closeChannel() {
    if (this.channel && this.connection) {
      await delay(500);

      await this.channel.close();
      await this.connection.close();

      this.channel = null;
      this.connection = null;
    } else {
      throw "Cannot close already closed channel or connection.";
    }
  }

  sendRequestMessage(type: RequestType, payload: MintRequest | CreateCollectionRequest) {
    try {
      if (this.channel) {
        this.channel.assertQueue(QUEUE_NAME, {
          durable: true,
        });

        this.channel.sendToQueue(
          QUEUE_NAME,
          Buffer.from(
            JSON.stringify({
              type,
              payload,
            }),
          ),
          { persistent: true },
        );

        console.log(formatLog(`Request message sent to queue ${QUEUE_NAME}`));
      }
    } catch (e) {
      console.warn(formatLog(e as string));
    }
  }
}

const getQueueSender = async (): Promise<QueueSender> => {
  if (!queueSender) {
    queueSender = new QueueSender();
    await queueSender.openChannel();
  }

  return queueSender;
};

export default getQueueSender;
