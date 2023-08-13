import process from "process";

export const formatLog = (msg: string) => {
  return `[Microservice #${process.pid}] [${new Date().toTimeString()}]: ${msg}`;
};
