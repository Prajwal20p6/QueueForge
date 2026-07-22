import { Job as BullMQJob } from 'bullmq';
import { DeliveryStatus } from '@prisma/client';
import { ErrorCategory } from './error-classifier';
import { ConnectorResult } from './connectors/base-connector';
import { JobProcessor } from './job-processor';

export type Job = BullMQJob;
export const Worker = JobProcessor;
export type Worker = JobProcessor;
export { ErrorCategory, ConnectorResult };

/**
 * Metadata context extracted from raw delivery job payload.
 */
export interface JobContext {
  deliveryId: string;
  destinationId: string;
  taskResultId: string;
  retryCount: number;
  timestamp: Date;
}

/**
 * Detailed output from raw destination transmission attempts.
 */
export interface ExecutionResult {
  statusCode?: number;
  latencyMs: number;
  success: boolean;
  error?: Error;
  errorCategory?: ErrorCategory;
}

/**
 * Static schema describing capabilities of typed connectors.
 */
export interface ConnectorMetadata {
  type: string;
  version: string;
  supportsAsync: boolean;
}

/**
 * Process outputs describing next state actions.
 */
export interface ProcessResult {
  deliveryId: string;
  status: DeliveryStatus;
  error?: Error;
  nextRetryAt?: Date;
}
