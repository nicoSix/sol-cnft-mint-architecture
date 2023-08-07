#!/usr/bin/env node

import amqp from "amqplib";

import { MintRequest } from '../domain/MintRequest';
import { formatLog } from '../utils';

const QUEUE_NAME = process.env.QUEUE_NAME || "mint-request-queue";
const QUEUE_URL = process.env.QUEUE_URL || "amqp://localhost";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMintRequestMessage = async (request: MintRequest) => {
  try {
    // TODO: Better handle connection and channel
    const connection = await amqp.connect(QUEUE_URL);
    const channel = await connection.createChannel();

    channel.assertQueue(QUEUE_NAME, {
      durable: false
    });

    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(request)));

    await delay(500);

    await channel.close();
    await connection.close();

    console.log(formatLog(`Mint request message sent to queue ${QUEUE_NAME}.`));
  } catch (e: any) {
    console.warn(formatLog(e));
  }
}