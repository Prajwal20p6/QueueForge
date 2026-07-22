import {
  APP_NAME,
  VERSION,
  ENVIRONMENT,
  HTTP_STATUS,
  HTTP_HEADERS,
  CONTENT_TYPES,
  QUEUE_NAMES,
  QUEUE_TIMEOUTS,
  KEY_FORMATS,
  DELIVERY_STATUSES,
  RETRY_SETTINGS,
  LIMITS,
} from '../../../../src/shared/constants';

describe('Shared Foundation Layer Constants', () => {
  it('should verify all exported constants values', () => {
    expect(APP_NAME).toBe('QueueForge');
    expect(VERSION).toBe('1.0.0');
    expect(ENVIRONMENT).toBeDefined();

    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);

    expect(HTTP_HEADERS.AUTHORIZATION).toBe('Authorization');
    expect(CONTENT_TYPES.JSON).toBe('application/json');

    expect(QUEUE_NAMES.MAIN_QUEUE).toBe('main-queue');
    expect(QUEUE_TIMEOUTS.JOB_TIMEOUT_MS).toBe(30000);
    expect(KEY_FORMATS.SEPARATOR).toBe(':');

    expect(DELIVERY_STATUSES.PENDING).toBe('PENDING');
    expect(RETRY_SETTINGS.MAX_RETRIES).toBe(5);

    expect(LIMITS.MAX_PAYLOAD_SIZE).toBe(10485760);
  });
});
