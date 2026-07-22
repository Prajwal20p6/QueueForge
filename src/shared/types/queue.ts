/**
 * Data payload carried by BullMQ pipeline jobs
 */
export interface JobPayload {
  taskResultId: string;
  destinationId: string;
  attempt: number;
}

/**
 * Standard processing states for asynchronous queue jobs
 */
export type JobStatus =
  'waiting' | 'active' | 'delayed' | 'failed' | 'completed' | 'paused' | 'stuck';

/**
 * Enriched audit model for pipeline messages
 */
export interface QueueMessage {
  id: string;
  name: string;
  payload: JobPayload;
  status: JobStatus;
  timestamp: number;
}
