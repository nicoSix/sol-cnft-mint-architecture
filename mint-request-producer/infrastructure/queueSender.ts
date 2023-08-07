#!/usr/bin/env node

import amqp from "amqplib";

import { MintRequest } from '../domain/MintRequest';
import { formatLog } from '../utils';
import { CreateCollectionRequest } from "../domain/CreateCollectionRequest";

const MINT_QUEUE_NAME = process.env.MINT_QUEUE_NAME || "mint-request-queue";
const COLLECTION_QUEUE_NAME = process.env.COLLECTION_QUEUE_NAME || "collection-request-queue";
const QUEUE_URL = process.env.QUEUE_URL || "amqp://localhost";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default class QueueSender {
  queue_url: string;
  channel: amqp.Channel | null = null;
  connection: amqp.Connection | null = null;

  constructor(queue_url: string = QUEUE_URL) {
    this.queue_url = queue_url;
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
  
  _sendMessage(payload: Buffer, queue_name: string) {
    try {
      if (this.channel) {
        this.channel.assertQueue(queue_name, {
          durable: false
        });
    
        this.channel.sendToQueue(queue_name, payload);
    
        console.log(formatLog(`Request message sent to queue ${queue_name}.`));
      }
    } catch (e: any) {
      console.warn(formatLog(e));
    }
  }

  sendMintRequestMessage(request: MintRequest) {
    this._sendMessage(Buffer.from(JSON.stringify(request)), MINT_QUEUE_NAME)
  }

  sendCollectionRequestMessage(request: CreateCollectionRequest) {
    this._sendMessage(Buffer.from(JSON.stringify(request)), COLLECTION_QUEUE_NAME)
  }
}