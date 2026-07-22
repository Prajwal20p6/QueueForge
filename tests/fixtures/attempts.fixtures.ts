import { generateUUID } from '../../src/shared/utils/crypto';

export class AttemptFixtures {
  public static successfulAttempt() {
    return {
      id: generateUUID(),
      deliveryId: generateUUID(),
      attemptNumber: 1,
      statusCode: 200,
      latencyMs: 120,
      createdAt: new Date(),
    };
  }

  public static failedAttempt(statusCode = 500) {
    return {
      id: generateUUID(),
      deliveryId: generateUUID(),
      attemptNumber: 1,
      statusCode,
      latencyMs: 250,
      error: 'Internal Server Error',
      createdAt: new Date(),
    };
  }
}
