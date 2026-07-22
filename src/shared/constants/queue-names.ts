/**
 * Main queue identities and Redis storage key prefixes for QueueForge
 */
export const QUEUE_MAIN = 'delivery-queue';
export const QUEUE_DELAYED = 'delivery-queue:delayed';
export const QUEUE_DLQ = 'delivery-queue:dlq';

export const REDIS_KEY_PREFIX = 'queueforge:';
