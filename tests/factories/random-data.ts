import { generateUUID } from '../../src/shared/utils/crypto';

/**
 * Generator producing deterministic random values for testing entity builders.
 */
export class RandomData {
  public static randomEmail(): string {
    return `user_${Math.floor(Math.random() * 10000)}@example.com`;
  }

  public static randomAgentId(): string {
    return `agent-${Math.floor(Math.random() * 1000)}`;
  }

  public static randomUUID(): string {
    return generateUUID();
  }

  public static randomConfidenceScore(): number {
    return Number((Math.random() * 0.99).toFixed(2));
  }

  public static randomStatusCode(): number {
    const codes = [200, 201, 400, 401, 403, 404, 500, 502, 503];
    return codes[Math.floor(Math.random() * codes.length)];
  }

  public static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
