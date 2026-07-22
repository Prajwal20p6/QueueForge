export const QUEUE_NAMES = {
  MAIN_QUEUE: 'main-queue',
  DELAYED_QUEUE: 'delayed-queue',
  DLQ: 'dead-letter-queue',
};

export const QUEUE_TIMEOUTS = {
  JOB_TIMEOUT_MS: 30000,
  STALE_JOB_TIMEOUT_MS: 60000,
};

export const KEY_FORMATS = {
  JOB_PREFIX: 'job:',
  SEPARATOR: ':',
};
export { QUEUE_NAMES as names };
export { QUEUE_TIMEOUTS as timeouts };
export { KEY_FORMATS as keys };
