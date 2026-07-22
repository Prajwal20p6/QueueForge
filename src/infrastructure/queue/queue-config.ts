import { QueueConfig } from '../../config/queue.config';

export interface QueueConfigOptions {
  concurrency: number;
  attempts: number;
  timeout: number;
  removeOnComplete: boolean | number;
  removeOnFail: boolean | number;
}

/**
 * Builds BullMQ QueueOptions tailored for the specific queue type.
 */
export function buildQueueOptions(
  config: QueueConfig,
  queueType: 'main' | 'delayed' | 'dlq'
): any {
  if (queueType === 'main') {
    return {
      defaultJobOptions: {
        attempts: (config.defaultJobOptions as any)?.attempts || 3,
        removeOnComplete: config.removeOnComplete ?? true,
        removeOnFail: config.removeOnFail ?? false,
        timeout: config.defaultJobTimeout || 30000,
      } as any,
    };
  } else if (queueType === 'delayed') {
    return {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
      } as any,
    };
  } else {
    return {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      } as any,
    };
  }
}

/**
 * Computes retry exponential delay with randomized jitter bounds.
 * 
 * @param retryCount - Current attempt number index.
 * @param baseMs - Standard baseline multiplier in milliseconds.
 */
export function calculateBackoffWithJitter(retryCount: number, baseMs: number): number {
  const power = Math.pow(2, retryCount);
  const jitterFactor = Math.random() * power;
  return Math.floor((power + jitterFactor) * baseMs);
}
