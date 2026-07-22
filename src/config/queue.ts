export { QueueConfig, QueueSettings, loadQueueConfig, getQueueConfig } from './queue.config';
export const STALE_JOB_TIMEOUT_MS = 60000;
export const QUEUE_MAIN = 'delivery-queue';
export const QUEUE_DELAYED = 'delivery-queue:delayed';
export const QUEUE_DLQ = 'delivery-queue:dlq';
