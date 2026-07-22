export const DELIVERY_STATUSES = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

export const RETRY_SETTINGS = {
  MAX_RETRIES: 5,
  BASE_DELAY: 1000,
  MAX_DELAY: 3600000, // 1 hour cap
};
export { DELIVERY_STATUSES as statuses };
export { RETRY_SETTINGS as retry };
