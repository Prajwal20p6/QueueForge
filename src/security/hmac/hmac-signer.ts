/**
 * Immutable Value Object representing a cryptographic HMAC webhook signature.
 */
export class HMACSignature {
  public readonly signature: string;
  public readonly algorithm: string;
  public readonly timestamp: number;

  constructor(signature: string, algorithm: string = 'sha256', timestamp: number = Date.now()) {
    this.signature = signature;
    this.algorithm = algorithm.toLowerCase();
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  public getSignature(): string {
    return this.signature;
  }

  public getAlgorithm(): string {
    return this.algorithm;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public toString(): string {
    return `${this.algorithm}=${this.signature}`;
  }

  public static create(signature: string, algorithm = 'sha256', timestamp = Date.now()): HMACSignature {
    return new HMACSignature(signature, algorithm, timestamp);
  }
}
