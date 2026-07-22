/**
 * Job priority categories for queue prioritization
 */
export enum QueuePriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1,
  CRITICAL = 0,
}

/**
 * Standard processing states for queue jobs
 */
export enum QueueJobStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DELAYED = 'DELAYED',
}

/**
 * Interface detailing job success payload properties
 */
export interface JobResult {
  success: boolean;
  data?: any;
}

/**
 * Interface detailing job failure details properties
 */
export interface JobError {
  message: string;
  code?: string;
  retryable: boolean;
}
