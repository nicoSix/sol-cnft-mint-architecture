#!/usr/bin/env node

import amqp, { Message } from "amqplib";

import { formatLog } from "../utils";

const MINT_QUEUE_NAME = process.env.MINT_QUEUE_NAME || "mint-request-queue";
const QUEUE_URL = process.env.QUEUE_URL || "amqp://localhost";
const PREFETCH_NB = parseInt(process.env.PREFETCH_NB!) || 3;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class QueueReceiver {
  queue_url: string;
  channel?: amqp.Channel;
  connection?: amqp.Connection;

  constructor(queue_url: string = QUEUE_URL) {
    this.queue_url = queue_url;
  }

  async openChannel() {
    if (!this.channel && !this.connection) {
      this.connection = await amqp.connect(this.queue_url);
      this.channel = await this.connection.createChannel();
    } else {
      throw "Cannot open already open channel or connection.";
    }
  }

  async closeChannel() {
    if (this.channel && this.connection) {
      await delay(500);

      await this.channel.close();
      await this.connection.close();

      this.channel = undefined;
      this.connection = undefined;
    } else {
      throw "Cannot close already closed channel or connection.";
    }
  }

  consumeMessages(callbackOnMessage: (msg: amqp.ConsumeMessage | null) => Promise<void>) {
    try {
      if (this.channel) {
        this.channel.assertQueue(MINT_QUEUE_NAME, {
          durable: true,
        });

        this.channel.prefetch(PREFETCH_NB);
        console.log(
          formatLog(
            `Process started to listen for queue ${MINT_QUEUE_NAME}, prefetch set to ${PREFETCH_NB}`,
          ),
        );

        this.channel.consume(
          MINT_QUEUE_NAME,
          async (msg: amqp.ConsumeMessage | null) => {
            console.log(formatLog(`Message received on queue ${MINT_QUEUE_NAME}`));
            await callbackOnMessage(msg);
            console.log(formatLog(`Message processed on queue ${MINT_QUEUE_NAME}`));
            this.channel!.ack(msg as Message);
          },
          {
            noAck: false,
          },
        );

        process.on("unhandledRejection", (e) => {
          console.error(formatLog(`Unhandled rejection: ${e}`));
          this.closeChannel();
          process.exit(1);
        });

        process.on("uncaughtException", (e) => {
          console.error(formatLog(`Uncaught exception: ${e}`));
          this.closeChannel();
          process.exit(1);
        });

        process.on("SIGINT", () => {
          console.warn(
            formatLog(`Received SIGINT signal, turning off RabbitMQ connection and closing ...`),
          );
          this.closeChannel();
          process.exit(0);
        });

        process.on("SIGTERM", () => {
          console.warn(
            formatLog(`Received SIGTERM signal, turning off RabbitMQ connection and closing ...`),
          );
          this.closeChannel();
          process.exit(0);
        });
      } else {
        throw "Channel is closed.";
      }
    } catch (e) {
      console.error(formatLog(`Failed to launch message listening: ${e}`));
    }
  }
}
